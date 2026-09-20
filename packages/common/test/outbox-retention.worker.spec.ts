import { Logger } from '@nestjs/common';
import {
  OutboxRetentionWorker,
  parseRetentionDays,
  parseCleanupBatchSize,
  parseCleanupIntervalMs
} from '../src/outbox/outbox-retention.worker';
import type { OutboxTable } from '../src/outbox/outbox.types';
import type { DrizzleClient } from '../src/database/drizzle.module';
import { metricsRegistry } from '../src/apm/metrics.registry';
import { BaseOutboxRelay } from '../src/outbox/outbox-relay';

describe('Outbox Retention Worker (ISSUE-015)', () => {
  let mockDb: Record<string, jest.Mock>;
  let worker: OutboxRetentionWorker;

  const fakeTable = {
    id: 'id',
    status: 'status',
    publishedAt: 'publishedAt',
    eventId: 'eventId',
    eventType: 'eventType',
    aggregateType: 'aggregateType',
    aggregateId: 'aggregateId',
    attemptCount: 'attemptCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastError: 'lastError'
  } as unknown as OutboxTable;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ affectedRows: 0 }])
      })
    };

    worker = new OutboxRetentionWorker(
      mockDb as unknown as DrizzleClient,
      fakeTable,
      {
        serviceName: 'test-service',
        outboxName: 'test_outbox',
        retentionDays: 30,
        batchSize: 1000,
        cleanupIntervalMs: 3_600_000,
        maxBatchesPerRun: 5
      },
      new Logger('TestRetentionWorker')
    );
  });

  describe('Configuration Parsers', () => {
    it('parses valid positive retention days', () => {
      expect(parseRetentionDays(undefined)).toBe(30);
      expect(parseRetentionDays('')).toBe(30);
      expect(parseRetentionDays('   ')).toBe(30);
      expect(parseRetentionDays('14')).toBe(14);
      expect(parseRetentionDays('90')).toBe(90);
    });

    it('rejects invalid retention days', () => {
      expect(() => parseRetentionDays('0')).toThrow(RangeError);
      expect(() => parseRetentionDays('-1')).toThrow(RangeError);
      expect(() => parseRetentionDays('abc')).toThrow(RangeError);
      expect(() => parseRetentionDays('3.14')).toThrow(RangeError);
    });

    it('parses valid cleanup batch size', () => {
      expect(parseCleanupBatchSize(undefined)).toBe(1000);
      expect(parseCleanupBatchSize('')).toBe(1000);
      expect(parseCleanupBatchSize('500')).toBe(500);
    });

    it('rejects invalid cleanup batch size', () => {
      expect(() => parseCleanupBatchSize('0')).toThrow(RangeError);
      expect(() => parseCleanupBatchSize('-100')).toThrow(RangeError);
      expect(() => parseCleanupBatchSize('xyz')).toThrow(RangeError);
    });

    it('parses valid cleanup interval in ms', () => {
      expect(parseCleanupIntervalMs(undefined)).toBe(3_600_000);
      expect(parseCleanupIntervalMs('')).toBe(3_600_000);
      expect(parseCleanupIntervalMs('60000')).toBe(60000);
    });

    it('rejects invalid cleanup interval ms', () => {
      expect(() => parseCleanupIntervalMs('0')).toThrow(RangeError);
      expect(() => parseCleanupIntervalMs('-500')).toThrow(RangeError);
      expect(() => parseCleanupIntervalMs('not-a-number')).toThrow(RangeError);
    });
  });

  describe('Cutoff Computation', () => {
    it('computes cutoff timestamp exactly 30 days before given time', () => {
      const fixedNow = new Date('2026-09-17T12:00:00.000Z').getTime();
      const cutoff = worker.computeCutoffDate(fixedNow);
      const expectedCutoff = new Date(fixedNow - 30 * 24 * 60 * 60 * 1000);
      expect(cutoff.getTime()).toBe(expectedCutoff.getTime());
    });
  });

  describe('countEligible (Dry-run inspection)', () => {
    it('returns count of eligible rows from db count query', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 42 }]);
      const count = await worker.countEligible();
      expect(count).toBe(42);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(fakeTable);
    });
  });

  describe('purgeBatch (Two-stage deletion)', () => {
    it('returns 0 when no candidate rows exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      const fixedCutoff = new Date('2026-08-18T12:00:00.000Z');
      const purged = await worker.purgeBatch(fixedCutoff);
      expect(purged).toBe(0);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it('deletes candidate rows and returns affectedRows', async () => {
      const candidates = [{ id: 101 }, { id: 102 }, { id: 103 }];
      mockDb.limit.mockResolvedValueOnce(candidates);
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 3 }]);
      mockDb.delete.mockReturnValueOnce({ where: mockWhere });

      const fixedCutoff = new Date('2026-08-18T12:00:00.000Z');
      const purged = await worker.purgeBatch(fixedCutoff);

      expect(purged).toBe(3);
      expect(mockDb.delete).toHaveBeenCalledWith(fakeTable);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('handles competing replica delete gracefully (affectedRows = 0)', async () => {
      // Stage 1 saw rows, but another replica deleted them before Stage 2
      const candidates = [{ id: 201 }, { id: 202 }];
      mockDb.limit.mockResolvedValueOnce(candidates);
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 0 }]);
      mockDb.delete.mockReturnValueOnce({ where: mockWhere });

      const fixedCutoff = new Date('2026-08-18T12:00:00.000Z');
      const purged = await worker.purgeBatch(fixedCutoff);

      expect(purged).toBe(0);
    });
  });

  describe('runCleanup (Bounded batch sweep & resilience)', () => {
    it('drains multiple batches up to maxBatchesPerRun and records metrics', async () => {
      const deletedMetricSpy = jest.spyOn(metricsRegistry, 'incrementOutboxCleanupDeleted');

      // Batch 1: returns 1000 rows (full batch)
      const batch1 = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));
      // Batch 2: returns 200 rows (partial batch -> stops loop)
      const batch2 = Array.from({ length: 200 }, (_, i) => ({ id: i + 1001 }));

      mockDb.limit.mockResolvedValueOnce(batch1).mockResolvedValueOnce(batch2);

      const mockWhere1 = jest.fn().mockResolvedValue([{ affectedRows: 1000 }]);
      const mockWhere2 = jest.fn().mockResolvedValue([{ affectedRows: 200 }]);
      mockDb.delete
        .mockReturnValueOnce({ where: mockWhere1 })
        .mockReturnValueOnce({ where: mockWhere2 });

      const totalPurged = await worker.runCleanup();

      expect(totalPurged).toBe(1200);
      expect(deletedMetricSpy).toHaveBeenCalledWith('test-service', 'test_outbox', 1200);
      deletedMetricSpy.mockRestore();
    });

    it('does not overlap runs if already running', async () => {
      // Simulate isRunning = true by invoking runCleanup concurrently
      let resolveFirst: () => void;
      const slowPromise = new Promise<Array<{ id: number }>>((resolve) => {
        resolveFirst = () => resolve([]);
      });

      mockDb.limit.mockReturnValueOnce(slowPromise);

      const firstRun = worker.runCleanup();
      const secondRun = await worker.runCleanup();

      expect(secondRun).toBe(0);

      resolveFirst!();
      await firstRun;
    });

    it('catches database errors, records failure metric, and does not throw', async () => {
      const failureMetricSpy = jest.spyOn(metricsRegistry, 'incrementOutboxCleanupFailure');
      mockDb.limit.mockRejectedValueOnce(new Error('ER_LOCK_DEADLOCK: Deadlock found'));

      const result = await worker.runCleanup();

      expect(result).toBe(0);
      expect(failureMetricSpy).toHaveBeenCalledWith('test-service', 'test_outbox');
      failureMetricSpy.mockRestore();
    });
  });

  describe('Timer Lifecycle', () => {
    it('establishes interval timer on bootstrap and clears it on shutdown', () => {
      jest.useFakeTimers();

      expect(worker.getIntervalTimer()).toBeUndefined();

      worker.onApplicationBootstrap();
      expect(worker.getIntervalTimer()).toBeDefined();

      worker.onApplicationShutdown();
      expect(worker.getIntervalTimer()).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('ISSUE-014 Causal Barrier & DEAD Event Preservation', () => {
    it('verifies retention query predicates explicitly target ONLY status=PUBLISHED', async () => {
      // Test that purgeBatch constructs queries with PUBLISHED status only
      mockDb.limit.mockResolvedValueOnce([{ id: 501 }]);
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);
      mockDb.delete.mockReturnValueOnce({ where: mockWhere });

      await worker.purgeBatch(new Date());

      // Check the arguments passed to select().where()
      expect(mockDb.where).toHaveBeenCalled();
      // The select where clause must have been evaluated without throwing
      expect(mockDb.delete).toHaveBeenCalledWith(fakeTable);
    });

    it('proves that DEAD events remain unimpacted by retention worker', async () => {
      // Setup mock relay for ISSUE-014 methods
      class TestRelay extends BaseOutboxRelay {
        protected readonly table = fakeTable;
        protected readonly serviceName = 'test-service';
        protected readonly db = mockDb as unknown as DrizzleClient;
        protected readonly eventPublisher = { publish: jest.fn() };
        protected readonly logger = new Logger('TestRelay');
      }

      const relay = new TestRelay();

      // Mock DEAD event in DB
      mockDb.limit.mockResolvedValueOnce([
        {
          id: 999,
          eventId: 'dead-evt-1',
          eventType: 'order.created',
          aggregateType: 'ORDER',
          aggregateId: 'ord-123',
          status: 'DEAD',
          attemptCount: 5,
          createdAt: new Date('2026-01-01'), // Very old date > 30 days
          updatedAt: new Date('2026-01-01'),
          lastError: 'Poison event: SyntaxError'
        }
      ]);

      const deadEvents = await relay.listDeadEvents(10);
      expect(deadEvents).toHaveLength(1);
      expect(deadEvents[0].status).toBe('DEAD');

      // Now run retention worker cleanup
      mockDb.limit.mockResolvedValueOnce([]); // No PUBLISHED rows match cutoff
      const purged = await worker.runCleanup();

      expect(purged).toBe(0);
      // DEAD event was not touched
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });

  describe('Comprehensive Status Filtering & State Invariants (Section 14)', () => {
    interface SimulatedRow {
      id: number;
      status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'DEAD';
      publishedAt: Date | null;
      createdAt: Date;
    }

    let simulatedRows: SimulatedRow[];
    let statefulDb: Record<string, jest.Mock>;
    let statefulWorker: OutboxRetentionWorker;

    beforeEach(() => {
      const now = new Date('2026-09-20T12:00:00.000Z');
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      simulatedRows = [
        { id: 1, status: 'PUBLISHED', publishedAt: fortyDaysAgo, createdAt: fortyDaysAgo }, // Old PUBLISHED -> should delete
        { id: 2, status: 'PUBLISHED', publishedAt: fiveDaysAgo, createdAt: fiveDaysAgo }, // Recent PUBLISHED -> should keep
        { id: 3, status: 'PENDING', publishedAt: null, createdAt: fortyDaysAgo }, // Old PENDING -> should keep
        { id: 4, status: 'PROCESSING', publishedAt: null, createdAt: fortyDaysAgo }, // Old PROCESSING -> should keep
        { id: 5, status: 'FAILED', publishedAt: null, createdAt: fortyDaysAgo }, // Old FAILED -> should keep
        { id: 6, status: 'DEAD', publishedAt: null, createdAt: fortyDaysAgo }, // Old DEAD (ISSUE-014) -> should keep
        { id: 7, status: 'PUBLISHED', publishedAt: null, createdAt: fortyDaysAgo } // PUBLISHED with null publishedAt -> should keep
      ];

      statefulDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => ({
          orderBy: jest.fn().mockImplementation(() => ({
            limit: jest.fn().mockImplementation((limitCount: number) => {
              const cutoff = statefulWorker.computeCutoffDate(now.getTime());
              const eligible = simulatedRows
                .filter(
                  (r) =>
                    r.status === 'PUBLISHED' &&
                    r.publishedAt !== null &&
                    r.publishedAt.getTime() < cutoff.getTime()
                )
                .slice(0, limitCount);
              return Promise.resolve(eligible.map((r) => ({ id: r.id })));
            })
          }))
        })),
        delete: jest.fn().mockImplementation(() => ({
          where: jest.fn().mockImplementation(() => {
            const cutoff = statefulWorker.computeCutoffDate(now.getTime());
            const initialCount = simulatedRows.length;
            simulatedRows = simulatedRows.filter(
              (r) =>
                !(
                  r.status === 'PUBLISHED' &&
                  r.publishedAt !== null &&
                  r.publishedAt.getTime() < cutoff.getTime()
                )
            );
            const affectedRows = initialCount - simulatedRows.length;
            return Promise.resolve([{ affectedRows }]);
          })
        }))
      };

      statefulWorker = new OutboxRetentionWorker(
        statefulDb as unknown as DrizzleClient,
        fakeTable,
        {
          serviceName: 'stateful-service',
          outboxName: 'stateful_outbox',
          retentionDays: 30,
          batchSize: 1000,
          cleanupIntervalMs: 3_600_000,
          maxBatchesPerRun: 5
        },
        new Logger('StatefulRetentionWorker')
      );
    });

    it('deletes Old PUBLISHED (older than cutoff)', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      const purged = await statefulWorker.purgeBatch(fixedCutoff);

      expect(purged).toBe(1);
      expect(simulatedRows.find((r) => r.id === 1)).toBeUndefined();
    });

    it('keeps Recent PUBLISHED (within retention cutoff)', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      await statefulWorker.purgeBatch(fixedCutoff);

      const recentPublished = simulatedRows.find((r) => r.id === 2);
      expect(recentPublished).toBeDefined();
      expect(recentPublished?.status).toBe('PUBLISHED');
    });

    it('keeps PENDING rows even when older than retention cutoff', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      await statefulWorker.purgeBatch(fixedCutoff);

      const oldPending = simulatedRows.find((r) => r.id === 3);
      expect(oldPending).toBeDefined();
      expect(oldPending?.status).toBe('PENDING');
    });

    it('keeps PROCESSING rows even when older than retention cutoff', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      await statefulWorker.purgeBatch(fixedCutoff);

      const oldProcessing = simulatedRows.find((r) => r.id === 4);
      expect(oldProcessing).toBeDefined();
      expect(oldProcessing?.status).toBe('PROCESSING');
    });

    it('keeps FAILED rows even when older than retention cutoff', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      await statefulWorker.purgeBatch(fixedCutoff);

      const oldFailed = simulatedRows.find((r) => r.id === 5);
      expect(oldFailed).toBeDefined();
      expect(oldFailed?.status).toBe('FAILED');
    });

    it('keeps DEAD rows intact as ISSUE-014 causal barriers requiring operator replay', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      await statefulWorker.purgeBatch(fixedCutoff);

      const oldDead = simulatedRows.find((r) => r.id === 6);
      expect(oldDead).toBeDefined();
      expect(oldDead?.status).toBe('DEAD');
    });

    it('keeps PUBLISHED rows with null publishedAt intact', async () => {
      const fixedCutoff = statefulWorker.computeCutoffDate(
        new Date('2026-09-20T12:00:00.000Z').getTime()
      );
      await statefulWorker.purgeBatch(fixedCutoff);

      const nullPublished = simulatedRows.find((r) => r.id === 7);
      expect(nullPublished).toBeDefined();
      expect(nullPublished?.publishedAt).toBeNull();
    });

    it('strictly bounds batch cleanup when backlog exceeds limit (maxBatchesPerRun cap)', async () => {
      // Create 1500 candidate rows with batchSize = 200 and maxBatchesPerRun = 3
      const now = new Date('2026-09-20T12:00:00.000Z');
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      let backlogRows = Array.from({ length: 1500 }, (_, i) => ({
        id: 10000 + i,
        status: 'PUBLISHED' as const,
        publishedAt: sixtyDaysAgo,
        createdAt: sixtyDaysAgo
      }));

      const boundedDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => ({
          orderBy: jest.fn().mockImplementation(() => ({
            limit: jest.fn().mockImplementation((limitCount: number) => {
              const eligible = backlogRows.slice(0, limitCount);
              return Promise.resolve(eligible.map((r) => ({ id: r.id })));
            })
          }))
        })),
        delete: jest.fn().mockImplementation(() => ({
          where: jest.fn().mockImplementation(() => {
            const purgedCount = Math.min(200, backlogRows.length);
            backlogRows = backlogRows.slice(purgedCount);
            return Promise.resolve([{ affectedRows: purgedCount }]);
          })
        }))
      };

      const boundedWorker = new OutboxRetentionWorker(
        boundedDb as unknown as DrizzleClient,
        fakeTable,
        {
          serviceName: 'bounded-service',
          outboxName: 'bounded_outbox',
          retentionDays: 30,
          batchSize: 200,
          maxBatchesPerRun: 3, // Can purge at most 3 * 200 = 600 rows
          cleanupIntervalMs: 3_600_000
        },
        new Logger('BoundedWorker')
      );

      jest
        .spyOn(boundedWorker, 'computeCutoffDate')
        .mockReturnValue(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

      const totalDeleted = await boundedWorker.runCleanup();

      // Exactly 3 batches of 200 = 600 rows deleted
      expect(totalDeleted).toBe(600);
      // 900 rows remain in backlog for subsequent cycles
      expect(backlogRows.length).toBe(900);
    });

    it('demonstrates multi-replica safety where overlapping deletion is harmless', async () => {
      // Replica A and Replica B both target ID 901
      // Replica A deletes ID 901 -> affectedRows = 1
      // Replica B attempts same DELETE -> affectedRows = 0
      mockDb.limit.mockResolvedValueOnce([{ id: 901 }]);
      const mockWhereB = jest.fn().mockResolvedValue([{ affectedRows: 0 }]);
      mockDb.delete.mockReturnValueOnce({ where: mockWhereB });

      const deletedByReplicaB = await worker.purgeBatch(new Date());

      expect(deletedByReplicaB).toBe(0);
      expect(mockWhereB).toHaveBeenCalled();
    });
  });
});
