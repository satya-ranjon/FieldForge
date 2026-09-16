import { Logger } from '@nestjs/common';
import { BaseOutboxRelay, publishWithTimeout } from '../src/outbox/outbox-relay';
import type { EventPublisherPort, OutboxTable } from '../src/outbox/outbox.types';
import type { DrizzleClient } from '../src/database/drizzle.module';
import { EventType } from '@fieldforge/contracts';
import { metricsRegistry } from '../src/apm/metrics.registry';

class TestOutboxRelay extends BaseOutboxRelay {
  protected readonly table: OutboxTable;
  protected readonly serviceName = 'test-service';
  protected readonly db: DrizzleClient;
  protected readonly eventPublisher: EventPublisherPort;
  protected readonly logger = new Logger('TestOutboxRelay');

  constructor(
    db: DrizzleClient,
    table: OutboxTable,
    eventPublisher: EventPublisherPort,
    config?: { batchSize?: number; leaseDurationMs?: number; publishTimeoutMs?: number }
  ) {
    super(config);
    this.db = db;
    this.table = table;
    this.eventPublisher = eventPublisher;
  }
}

describe('Outbox Relay Engine', () => {
  describe('publishWithTimeout', () => {
    it('resolves cleanly when publisher finishes before timeout', async () => {
      const mockPublisher: EventPublisherPort = {
        publish: jest.fn().mockResolvedValue(undefined)
      };
      const envelope = {
        eventId: 'evt-1',
        eventType: EventType.WORK_ORDER_PUBLISHED,
        occurredAt: new Date().toISOString(),
        correlationId: 'corr-1',
        payload: { test: true }
      };

      await expect(publishWithTimeout(mockPublisher, envelope, 1000)).resolves.toBeUndefined();
      expect(mockPublisher.publish).toHaveBeenCalledWith(envelope);
    });

    it('rejects with timeout error when publisher exceeds timeout', async () => {
      jest.useFakeTimers();
      const mockPublisher: EventPublisherPort = {
        publish: jest
          .fn()
          .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 5000)))
      };
      const envelope = {
        eventId: 'evt-timeout',
        eventType: EventType.WORK_ORDER_PUBLISHED,
        occurredAt: new Date().toISOString(),
        correlationId: 'corr-1',
        payload: { test: true }
      };

      const promise = publishWithTimeout(mockPublisher, envelope, 1000);
      jest.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrow('RabbitMQ broker confirm timeout after 1000ms');
      jest.useRealTimers();
    });
  });

  describe('Claim and Publish Batch', () => {
    let mockTx: Record<string, jest.Mock>;
    let mockDb: Record<string, jest.Mock>;
    let mockPublisher: jest.Mocked<EventPublisherPort>;
    let relay: TestOutboxRelay;
    const fakeTable = {
      id: 'id',
      status: 'status',
      nextAttemptAt: 'nextAttemptAt',
      leaseExpiresAt: 'leaseExpiresAt',
      aggregateType: 'aggregateType',
      aggregateId: 'aggregateId',
      attemptCount: 'attemptCount'
    } as unknown as OutboxTable;

    beforeEach(() => {
      mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        for: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
      };
      mockDb = {
        transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ affectedRows: 1 }])
      };
      mockPublisher = {
        publish: jest.fn().mockResolvedValue(undefined)
      };
      relay = new TestOutboxRelay(mockDb as unknown as DrizzleClient, fakeTable, mockPublisher, {
        batchSize: 5,
        leaseDurationMs: 30_000,
        publishTimeoutMs: 10_000
      });
    });

    it('returns 0 if no rows are available to claim', async () => {
      mockTx.for.mockResolvedValueOnce([]);
      const count = await relay.claimAndPublishBatch();
      expect(count).toBe(0);
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it('enforces strict per-aggregate causal ordering by checking for prior PENDING, PROCESSING, FAILED, or DEAD events', async () => {
      mockTx.for.mockResolvedValueOnce([]);
      await relay.claimAndPublishBatch();

      expect(mockTx.where).toHaveBeenCalled();
      const whereArg = mockTx.where.mock.calls[0][0];
      const sqlString = JSON.stringify(whereArg);
      expect(sqlString).toContain('NOT EXISTS');
      expect(sqlString).toContain('DEAD');
    });

    it('claims batch, marks PROCESSING, publishes concurrently, and CAS updates to PUBLISHED', async () => {
      const row1 = {
        id: 1,
        eventId: 'evt-1',
        eventType: EventType.WORK_ORDER_PUBLISHED,
        attemptCount: 0,
        payload: { eventId: 'evt-1', eventType: EventType.WORK_ORDER_PUBLISHED }
      };
      const row2 = {
        id: 2,
        eventId: 'evt-2',
        eventType: EventType.WORK_ORDER_ASSIGNED,
        attemptCount: 0,
        payload: { eventId: 'evt-2', eventType: EventType.WORK_ORDER_ASSIGNED }
      };

      mockTx.for.mockResolvedValueOnce([row1, row2]);
      const count = await relay.claimAndPublishBatch();

      expect(count).toBe(2);
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockPublisher.publish).toHaveBeenCalledTimes(2);
      expect(mockDb.update).toHaveBeenCalledTimes(2);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PUBLISHED',
          claimedBy: null,
          claimToken: null
        })
      );
    });

    it('handles stale worker when affectedRows is 0', async () => {
      const row = {
        id: 1,
        eventId: 'evt-stale',
        eventType: EventType.WORK_ORDER_APPROVED,
        attemptCount: 0,
        payload: { eventId: 'evt-stale', eventType: EventType.WORK_ORDER_APPROVED }
      };

      mockTx.for.mockResolvedValueOnce([row]);
      // Simulate CAS failure: another worker reclaimed the row
      mockDb.where.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const count = await relay.claimAndPublishBatch();
      expect(count).toBe(1);
      expect(mockPublisher.publish).toHaveBeenCalledWith(row.payload);
      // DB was updated with CAS predicate
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('marks row DEAD when payload is structurally corrupt (poison event) and increments metric', async () => {
      metricsRegistry.resetMetrics();
      const metricSpy = jest.spyOn(metricsRegistry, 'incrementOutboxDeadEvent');

      const row = {
        id: 1,
        eventId: 'evt-poison',
        eventType: EventType.WORK_ORDER_APPROVED,
        aggregateType: 'WORK_ORDER',
        aggregateId: 'wo-1',
        attemptCount: 0,
        payload: null // corrupt payload
      };

      mockTx.for.mockResolvedValueOnce([row]);
      const count = await relay.claimAndPublishBatch();

      expect(count).toBe(1);
      expect(mockPublisher.publish).not.toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DEAD',
          lastError: expect.stringContaining('Poison event')
        })
      );
      expect(metricSpy).toHaveBeenCalledWith('test-service', 'unknown_outbox', 'structural_poison');
      metricSpy.mockRestore();
    });

    it('does NOT increment dead events metric on transient publish failure (status FAILED)', async () => {
      const metricSpy = jest.spyOn(metricsRegistry, 'incrementOutboxDeadEvent');
      const row = {
        id: 1,
        eventId: 'evt-transient',
        eventType: EventType.WORK_ORDER_CANCELLED,
        aggregateType: 'WORK_ORDER',
        aggregateId: 'wo-1',
        attemptCount: 2,
        payload: { eventId: 'evt-transient', eventType: EventType.WORK_ORDER_CANCELLED }
      };

      mockTx.for.mockResolvedValueOnce([row]);
      mockPublisher.publish.mockRejectedValueOnce(new Error('Broker connection lost'));

      const count = await relay.claimAndPublishBatch();

      expect(count).toBe(1);
      expect(mockPublisher.publish).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          lastError: 'Broker connection lost',
          nextAttemptAt: expect.any(Date)
        })
      );
      expect(metricSpy).not.toHaveBeenCalled();
      metricSpy.mockRestore();
    });

    it('does NOT increment dead events metric if CAS is lost on poison event', async () => {
      const metricSpy = jest.spyOn(metricsRegistry, 'incrementOutboxDeadEvent');
      const row = {
        id: 1,
        eventId: 'evt-poison-lost',
        eventType: EventType.WORK_ORDER_APPROVED,
        aggregateType: 'WORK_ORDER',
        aggregateId: 'wo-1',
        attemptCount: 0,
        payload: null
      };

      mockTx.for.mockResolvedValueOnce([row]);
      // Simulate CAS update returning affectedRows: 0 (stale worker)
      mockDb.where.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const count = await relay.claimAndPublishBatch();
      expect(count).toBe(1);
      expect(metricSpy).not.toHaveBeenCalled();
      metricSpy.mockRestore();
    });
  });

  describe('listDeadEvents', () => {
    let mockDb: Record<string, jest.Mock>;
    let relay: TestOutboxRelay;
    const fakeTable = {
      id: 'id',
      status: 'status',
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
      const selectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn()
      };
      mockDb = {
        select: jest.fn().mockReturnValue(selectChain)
      };
      relay = new TestOutboxRelay(mockDb as unknown as DrizzleClient, fakeTable, {
        publish: jest.fn()
      });
    });

    it('queries for events with status DEAD and returns them', async () => {
      const mockDeadRows = [
        {
          id: 10,
          eventId: 'evt-dead-1',
          eventType: EventType.WORK_ORDER_APPROVED,
          aggregateType: 'WORK_ORDER',
          aggregateId: 'wo-1',
          status: 'DEAD',
          attemptCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastError: 'Poison event: SyntaxError: Malformed event envelope payload'
        }
      ];

      const selectChain = mockDb.select();
      selectChain.limit.mockResolvedValueOnce(mockDeadRows);

      const result = await relay.listDeadEvents(25);
      expect(result).toEqual(mockDeadRows);
      expect(mockDb.select).toHaveBeenCalled();
      expect(selectChain.from).toHaveBeenCalledWith(fakeTable);
      expect(selectChain.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('replayDeadEvent', () => {
    let mockDb: Record<string, jest.Mock>;
    let relay: TestOutboxRelay;
    const fakeTable = {
      id: 'id',
      status: 'status',
      nextAttemptAt: 'nextAttemptAt',
      attemptCount: 'attemptCount',
      claimedBy: 'claimedBy',
      claimToken: 'claimToken',
      leaseExpiresAt: 'leaseExpiresAt',
      lastError: 'lastError',
      updatedAt: 'updatedAt'
    } as unknown as OutboxTable;

    beforeEach(() => {
      mockDb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn()
        })
      };
      relay = new TestOutboxRelay(mockDb as unknown as DrizzleClient, fakeTable, {
        publish: jest.fn()
      });
    });

    it('atomically requeues a DEAD event to PENDING and triggers relay', async () => {
      mockDb.where.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const triggerSpy = jest.spyOn(relay, 'trigger').mockImplementation(() => {});

      const result = await relay.replayDeadEvent(42);

      expect(result).toBe('REQUEUED');
      expect(mockDb.update).toHaveBeenCalledWith(fakeTable);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          attemptCount: 0,
          claimedBy: null,
          claimToken: null,
          leaseExpiresAt: null,
          lastError: 'REPLAY_QUEUED_BY_OPERATOR'
        })
      );
      expect(triggerSpy).toHaveBeenCalled();
      triggerSpy.mockRestore();
    });

    it('returns NOT_FOUND when event ID does not exist in the table', async () => {
      // Replay update affected 0 rows
      mockDb.where.mockResolvedValueOnce([{ affectedRows: 0 }]);
      // Follow-up check finds no record
      const selectChain = mockDb.select();
      selectChain.limit.mockResolvedValueOnce([]);

      const result = await relay.replayDeadEvent(999);

      expect(result).toBe('NOT_FOUND');
    });

    it('returns NOT_DEAD when event exists but has a non-DEAD status', async () => {
      // Replay update affected 0 rows (status != 'DEAD')
      mockDb.where.mockResolvedValueOnce([{ affectedRows: 0 }]);
      // Follow-up check finds row with status 'PROCESSING'
      const selectChain = mockDb.select();
      selectChain.limit.mockResolvedValueOnce([{ id: 42, status: 'PROCESSING' }]);

      const result = await relay.replayDeadEvent(42);

      expect(result).toBe('NOT_DEAD');
    });

    it('re-evaluates replayed event and returns to DEAD if payload is still poison', async () => {
      const metricSpy = jest.spyOn(metricsRegistry, 'incrementOutboxDeadEvent');
      const mockPublisher: EventPublisherPort = { publish: jest.fn() };

      const replayedRow = {
        id: 42,
        eventId: 'evt-poison-replayed',
        eventType: EventType.WORK_ORDER_APPROVED,
        aggregateType: 'WORK_ORDER',
        aggregateId: 'wo-42',
        attemptCount: 0,
        payload: { broken: true } // Missing eventId and eventType
      };

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        for: jest.fn().mockResolvedValueOnce([replayedRow]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
      };

      const testDb = {
        transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ affectedRows: 1 }])
      };

      const testRelay = new TestOutboxRelay(
        testDb as unknown as DrizzleClient,
        fakeTable,
        mockPublisher
      );

      const processedCount = await testRelay.claimAndPublishBatch();

      expect(processedCount).toBe(1);
      expect(mockPublisher.publish).not.toHaveBeenCalled();
      expect(testDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DEAD',
          lastError: expect.stringContaining('Poison event')
        })
      );
      expect(metricSpy).toHaveBeenCalled();
      metricSpy.mockRestore();
    });
  });
});
