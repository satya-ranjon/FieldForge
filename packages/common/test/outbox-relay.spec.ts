import { Logger } from '@nestjs/common';
import { BaseOutboxRelay, publishWithTimeout } from '../src/outbox/outbox-relay';
import type { EventPublisherPort, OutboxTable } from '../src/outbox/outbox.types';
import type { DrizzleClient } from '../src/database/drizzle.module';
import { EventType } from '@fieldforge/contracts';

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

    it('marks row DEAD when payload is structurally corrupt (poison event)', async () => {
      const row = {
        id: 1,
        eventId: 'evt-poison',
        eventType: EventType.WORK_ORDER_APPROVED,
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
    });

    it('marks row FAILED with exponential backoff on transient publish failure', async () => {
      const row = {
        id: 1,
        eventId: 'evt-transient',
        eventType: EventType.WORK_ORDER_CANCELLED,
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
    });
  });
});
