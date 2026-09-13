import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { and, or, eq, inArray, lte, asc, sql } from '@fieldforge/database';
import type { DrizzleClient } from '../database/drizzle.module';
import type { EventEnvelope } from '@fieldforge/contracts';
import type { OutboxTable, EventPublisherPort, OutboxRelayConfig } from './outbox.types';

/**
 * Publishes an event envelope with a bounded confirmation timeout.
 * Guarantees that the timer handle is cleared immediately upon resolution in finally.
 */
export async function publishWithTimeout(
  publisher: EventPublisherPort,
  envelope: EventEnvelope<unknown>,
  timeoutMs = 10_000
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      publisher.publish(envelope),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`RabbitMQ broker confirm timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Base Transactional Outbox Relay engine.
 *
 * Implements:
 * - Small-batch claiming with MySQL 8.4 InnoDB SELECT ... FOR UPDATE SKIP LOCKED
 * - Per-aggregate FIFO ordering via NOT EXISTS causal blocker
 * - Crash recovery via lease expiration (leaseExpiresAt)
 * - Concurrency claim fencing via Compare-And-Set claim tokens (claimToken)
 * - Fully concurrent batch publication with strict timeout (publishWithTimeout)
 * - Exponential retry backoff capped at 15 minutes for transient failures
 * - Terminal DEAD status for poison events
 * - Single-flight coalesced event triggering post-commit
 */
export abstract class BaseOutboxRelay implements OnApplicationBootstrap, OnApplicationShutdown {
  protected abstract readonly table: OutboxTable;
  protected abstract readonly serviceName: string;
  protected abstract readonly db: DrizzleClient;
  protected abstract readonly eventPublisher: EventPublisherPort;
  protected abstract readonly logger: Logger;

  protected readonly podId: string = `${os.hostname()}-${process.pid}`;
  protected readonly batchSize: number;
  protected readonly leaseDurationMs: number;
  protected readonly publishTimeoutMs: number;
  protected readonly pollIntervalMs: number;

  private pollTimer?: NodeJS.Timeout;
  private isProcessing = false;
  private hasPendingTrigger = false;

  constructor(config?: Partial<OutboxRelayConfig>) {
    this.batchSize = config?.batchSize ?? 5;
    this.leaseDurationMs = config?.leaseDurationMs ?? 30_000;
    this.publishTimeoutMs = config?.publishTimeoutMs ?? 10_000;
    this.pollIntervalMs = config?.pollIntervalMs ?? 2_000;
  }

  onApplicationBootstrap(): void {
    this.pollTimer = setInterval(() => {
      this.trigger();
    }, this.pollIntervalMs);

    if (this.pollTimer.unref) {
      this.pollTimer.unref();
    }

    // Trigger initial queue sweep on startup
    this.trigger();
  }

  onApplicationShutdown(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  /**
   * Event-driven trigger called immediately after domain transaction commit.
   * Utilizes single-flight coalescing to avoid overlapping loops within the process.
   */
  trigger(): void {
    if (this.isProcessing) {
      this.hasPendingTrigger = true;
      return;
    }
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      this.hasPendingTrigger = true;
      return;
    }

    this.isProcessing = true;
    try {
      do {
        this.hasPendingTrigger = false;
        let claimedCount = 0;
        do {
          claimedCount = await this.claimAndPublishBatch();
        } while (claimedCount > 0);
      } while (this.hasPendingTrigger);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[OutboxRelay:${this.serviceName}] Process queue error: ${msg}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Claims a batch of up to batchSize rows in a short ACID transaction,
   * then concurrently publishes and resolves each row with CAS claim fencing.
   */
  async claimAndPublishBatch(): Promise<number> {
    const now = new Date();
    const claimToken = randomUUID();
    const leaseExpiresAt = new Date(now.getTime() + this.leaseDurationMs);

    // Phase 1: Claim Batch in Short Transaction
    const claimedRows = await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(this.table)
        .where(
          and(
            or(
              and(
                inArray(this.table.status, ['PENDING', 'FAILED']),
                lte(this.table.nextAttemptAt, now)
              ),
              and(eq(this.table.status, 'PROCESSING'), lte(this.table.leaseExpiresAt, now))
            ),
            sql`NOT EXISTS (
              SELECT 1 FROM ${this.table} AS prior
              WHERE prior.aggregate_type = ${this.table.aggregateType}
                AND prior.aggregate_id = ${this.table.aggregateId}
                AND prior.id < ${this.table.id}
                AND prior.status IN ('PENDING', 'PROCESSING', 'FAILED', 'DEAD')
            )`
          )
        )
        .orderBy(asc(this.table.id))
        .limit(this.batchSize)
        .for('update', { skipLocked: true });

      if (rows.length === 0) {
        return [];
      }

      const ids = rows.map((r) => r.id);
      await tx
        .update(this.table)
        .set({
          status: 'PROCESSING',
          claimedBy: this.podId,
          claimToken: claimToken,
          leaseExpiresAt: leaseExpiresAt,
          attemptCount: sql`${this.table.attemptCount} + 1`,
          updatedAt: now
        })
        .where(inArray(this.table.id, ids));

      return rows;
    });

    if (claimedRows.length === 0) {
      return 0;
    }

    // Phase 2 & 3: Concurrent Publish & CAS State Resolution
    await Promise.allSettled(
      claimedRows.map(async (row) => {
        const envelope = row.payload as EventEnvelope<unknown>;
        try {
          // 1. Poison check
          if (!envelope || !envelope.eventId || !envelope.eventType) {
            throw new SyntaxError('Malformed event envelope payload');
          }

          // 2. Publish with timer-cleared timeout
          await publishWithTimeout(this.eventPublisher, envelope, this.publishTimeoutMs);

          // 3. Fenced CAS Resolution: Mark PUBLISHED
          const updateClient = this.db as unknown as {
            update: (table: unknown) => {
              set: (values: Record<string, unknown>) => {
                where: (clause: unknown) => Promise<Array<{ affectedRows?: number }>>;
              };
            };
          };

          const res = await updateClient
            .update(this.table)
            .set({
              status: 'PUBLISHED',
              publishedAt: new Date(),
              claimedBy: null,
              claimToken: null,
              leaseExpiresAt: null,
              lastError: null
            })
            .where(
              and(
                eq(this.table.id, row.id),
                eq(this.table.status, 'PROCESSING'),
                eq(this.table.claimToken, claimToken)
              )
            );

          const affectedRows = (res && res[0] && res[0].affectedRows) ?? 1;
          if (affectedRows === 0) {
            this.logger.warn(
              `[OutboxRelay:${this.serviceName}] Claim ownership lost for event ${row.eventId} (token: ${claimToken}). Stale worker publication dropped.`
            );
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const isPoison = err instanceof SyntaxError;
          const updateClient = this.db as unknown as {
            update: (table: unknown) => {
              set: (values: Record<string, unknown>) => {
                where: (clause: unknown) => Promise<Array<{ affectedRows?: number }>>;
              };
            };
          };

          if (isPoison) {
            const res = await updateClient
              .update(this.table)
              .set({
                status: 'DEAD',
                claimedBy: null,
                claimToken: null,
                leaseExpiresAt: null,
                lastError: `Poison event: ${errorMsg}`
              })
              .where(
                and(
                  eq(this.table.id, row.id),
                  eq(this.table.status, 'PROCESSING'),
                  eq(this.table.claimToken, claimToken)
                )
              );

            const affectedRows = (res && res[0] && res[0].affectedRows) ?? 1;
            if (affectedRows === 0) {
              this.logger.warn(
                `[OutboxRelay:${this.serviceName}] Claim lost before marking DEAD for event ${row.eventId}`
              );
            }
          } else {
            // Exponential backoff math: min(2^min(attempts, 10), 900) seconds
            const backoffSec = Math.min(Math.pow(2, Math.min(row.attemptCount, 10)), 900);
            const nextAttempt = new Date(Date.now() + backoffSec * 1000);

            const res = await updateClient
              .update(this.table)
              .set({
                status: 'FAILED',
                nextAttemptAt: nextAttempt,
                claimedBy: null,
                claimToken: null,
                leaseExpiresAt: null,
                lastError: errorMsg
              })
              .where(
                and(
                  eq(this.table.id, row.id),
                  eq(this.table.status, 'PROCESSING'),
                  eq(this.table.claimToken, claimToken)
                )
              );

            const affectedRows = (res && res[0] && res[0].affectedRows) ?? 1;
            if (affectedRows === 0) {
              this.logger.warn(
                `[OutboxRelay:${this.serviceName}] Claim lost before marking FAILED for event ${row.eventId}`
              );
            }
          }
        }
      })
    );

    return claimedRows.length;
  }
}
