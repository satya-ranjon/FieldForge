import { Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { and, eq, inArray, lt, isNotNull, asc, sql, getTableName } from '@fieldforge/database';
import type { DrizzleClient } from '../database/drizzle.module';
import { metricsRegistry, MetricsRegistry } from '../apm/metrics.registry';
import type { OutboxTable, OutboxRetentionConfig } from './outbox.types';

/**
 * Validates and parses the retention duration in days from environment configuration.
 * Rejects 0, negative values, NaN, and non-integer representations.
 */
export function parseRetentionDays(raw: string | undefined, defaultDays = 30): number {
  if (raw === undefined || raw.trim() === '') {
    return defaultDays;
  }
  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(
      `Invalid OUTBOX_PUBLISHED_RETENTION_DAYS: "${raw}". Must be a positive integer greater than 0.`
    );
  }
  return parsed;
}

/**
 * Validates and parses the deletion batch size from environment configuration.
 * Rejects 0, negative values, NaN, and non-integer representations.
 */
export function parseCleanupBatchSize(raw: string | undefined, defaultBatchSize = 1000): number {
  if (raw === undefined || raw.trim() === '') {
    return defaultBatchSize;
  }
  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(
      `Invalid OUTBOX_CLEANUP_BATCH_SIZE: "${raw}". Must be a positive integer greater than 0.`
    );
  }
  return parsed;
}

/**
 * Validates and parses the cleanup interval in milliseconds from environment configuration.
 * Rejects 0, negative values, NaN, and non-integer representations.
 */
export function parseCleanupIntervalMs(
  raw: string | undefined,
  defaultIntervalMs = 3_600_000
): number {
  if (raw === undefined || raw.trim() === '') {
    return defaultIntervalMs;
  }
  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(
      `Invalid OUTBOX_CLEANUP_INTERVAL_MS: "${raw}". Must be a positive integer greater than 0.`
    );
  }
  return parsed;
}

/**
 * Outbox Retention Worker.
 *
 * Implements bounded, scheduled retention for transactional outbox tables:
 * - Purges ONLY events with status = 'PUBLISHED' and published_at < cutoff.
 * - NEVER deletes or alters PENDING, PROCESSING, FAILED, or DEAD events.
 * - Enforces two-stage deletion with redundant safety predicates on DELETE.
 * - Caps batch size and maximum batches per run to prevent DB load spikes.
 * - Multi-replica safe: competing worker deletions resolve to affectedRows = 0 without error.
 * - Decoupled from relay correctness: retention failures never disrupt outbox publishing.
 */
export class OutboxRetentionWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  protected readonly serviceName: string;
  protected readonly outboxName: string;
  protected readonly retentionDays: number;
  protected readonly batchSize: number;
  protected readonly cleanupIntervalMs: number;
  protected readonly maxBatchesPerRun: number;
  protected readonly logger: Logger;
  protected readonly metricsRegistry: MetricsRegistry;

  private intervalTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    protected readonly db: DrizzleClient,
    protected readonly table: OutboxTable,
    config: OutboxRetentionConfig,
    logger?: Logger,
    metrics: MetricsRegistry = metricsRegistry
  ) {
    this.serviceName = config.serviceName;
    this.outboxName = config.outboxName ?? this.getTableName();
    this.retentionDays = config.retentionDays ?? 30;
    this.batchSize = config.batchSize ?? 1000;
    this.cleanupIntervalMs = config.cleanupIntervalMs ?? 3_600_000;
    this.maxBatchesPerRun = config.maxBatchesPerRun ?? 5;
    this.logger = logger ?? new Logger(`${OutboxRetentionWorker.name}:${this.serviceName}`);
    this.metricsRegistry = metrics;
  }

  onApplicationBootstrap(): void {
    this.intervalTimer = setInterval(() => {
      void this.runCleanup();
    }, this.cleanupIntervalMs);

    if (this.intervalTimer.unref) {
      this.intervalTimer.unref();
    }

    // Non-blocking initial startup sweep
    const immediate = setImmediate(() => {
      void this.runCleanup();
    });
    if (immediate && typeof immediate.unref === 'function') {
      immediate.unref();
    }
  }

  onApplicationShutdown(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
  }

  /**
   * Returns active interval timer handle for lifecycle inspection/testing.
   */
  getIntervalTimer(): NodeJS.Timeout | undefined {
    return this.intervalTimer;
  }

  /**
   * Computes the retention cutoff timestamp relative to the current time.
   */
  computeCutoffDate(now = Date.now()): Date {
    const cutoffMs = now - this.retentionDays * 24 * 60 * 60 * 1000;
    return new Date(cutoffMs);
  }

  /**
   * Dry-run inspection: Counts the total number of PUBLISHED events currently eligible for retention cleanup.
   */
  async countEligible(cutoff?: Date): Promise<number> {
    const targetCutoff = cutoff ?? this.computeCutoffDate();
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(
        and(
          eq(this.table.status, 'PUBLISHED'),
          isNotNull(this.table.publishedAt),
          lt(this.table.publishedAt, targetCutoff)
        )
      );
    return Number(rows[0]?.count ?? 0);
  }

  /**
   * Deletes a single bounded batch of eligible PUBLISHED events using a safe two-stage pattern.
   *
   * Stage 1: SELECT candidate IDs ordered by id ASC with LIMIT.
   * Stage 2: DELETE WHERE id IN (...) AND status = 'PUBLISHED' AND published_at < cutoff.
   */
  async purgeBatch(cutoff: Date): Promise<number> {
    const candidateRows = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(
        and(
          eq(this.table.status, 'PUBLISHED'),
          isNotNull(this.table.publishedAt),
          lt(this.table.publishedAt, cutoff)
        )
      )
      .orderBy(asc(this.table.id))
      .limit(this.batchSize);

    if (!candidateRows || candidateRows.length === 0) {
      return 0;
    }

    const ids = candidateRows.map((r) => r.id);
    const deleteClient = this.db as unknown as {
      delete: (table: unknown) => {
        where: (
          clause: unknown
        ) => Promise<Array<{ affectedRows?: number }> | { affectedRows?: number }>;
      };
    };

    const res = await deleteClient
      .delete(this.table)
      .where(
        and(
          inArray(this.table.id, ids),
          eq(this.table.status, 'PUBLISHED'),
          isNotNull(this.table.publishedAt),
          lt(this.table.publishedAt, cutoff)
        )
      );

    const affectedRows =
      res && Array.isArray(res) && res[0] && typeof res[0].affectedRows === 'number'
        ? res[0].affectedRows
        : res &&
            !Array.isArray(res) &&
            typeof (res as { affectedRows?: number }).affectedRows === 'number'
          ? (res as { affectedRows: number }).affectedRows
          : ids.length;

    return affectedRows;
  }

  /**
   * Executes a scheduled or triggered retention cleanup run across up to maxBatchesPerRun chunks.
   * Catches all errors internally, logs structured diagnostics, increments failure metrics,
   * and guarantees the process never crashes or blocks domain services.
   */
  async runCleanup(): Promise<number> {
    if (this.isRunning) {
      this.logger.debug?.(
        `[OutboxRetentionWorker:${this.serviceName}] Cleanup already in progress, skipping cycle`
      );
      return 0;
    }

    this.isRunning = true;
    let totalPurged = 0;
    try {
      const cutoff = this.computeCutoffDate();
      for (let batch = 0; batch < this.maxBatchesPerRun; batch++) {
        const deleted = await this.purgeBatch(cutoff);
        totalPurged += deleted;
        if (deleted < this.batchSize) {
          break; // Backlog drained or less than a full batch remained
        }
      }

      if (totalPurged > 0) {
        this.metricsRegistry.incrementOutboxCleanupDeleted(
          this.serviceName,
          this.outboxName,
          totalPurged
        );
        this.logger.log(
          `[OutboxRetentionWorker:${this.serviceName}] Purged ${totalPurged} published event(s) older than ${cutoff.toISOString()} from ${this.outboxName}`
        );
      }
      return totalPurged;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.metricsRegistry.incrementOutboxCleanupFailure(this.serviceName, this.outboxName);
      this.logger.error(
        `[OutboxRetentionWorker:${this.serviceName}] Failed to execute retention cleanup for ${this.outboxName}: ${msg}`
      );
      return 0;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Extracts the table name from Drizzle table metadata or fallback representation.
   */
  protected getTableName(): string {
    try {
      if (typeof getTableName === 'function') {
        const name = getTableName(this.table);
        if (name) return name;
      }
    } catch {
      // Fallback if table is mock or uninspectable
    }
    const candidate = this.table as { _?: { name?: string }; tableName?: string };
    return candidate?._?.name ?? candidate?.tableName ?? 'unknown_outbox';
  }
}
