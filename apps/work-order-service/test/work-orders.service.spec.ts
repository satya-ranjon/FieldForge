import { EVENT_EXCHANGE, EventType, WorkOrderStatus } from '@fieldforge/contracts';
import type { WorkOrderPublishedEvent } from '@fieldforge/contracts';
import { WorkOrderEventPublisher } from '../src/events/work-order-event.publisher';
import { WorkOrderFsmService } from '../src/modules/fsm/work-order-fsm.service';
import { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';

const BUYER_ID = 'b0000000-0000-4000-8000-000000000001';
const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';

describe('WorkOrdersService', () => {
  let publisher: WorkOrderEventPublisher;
  let service: WorkOrdersService;

  beforeEach(() => {
    publisher = new WorkOrderEventPublisher();
    service = new WorkOrdersService(new WorkOrderFsmService(), publisher);
  });

  describe('create', () => {
    const dto = {
      title: 'Emergency POS Terminal Swap',
      description: 'Replace the failed lane 3 terminal and verify the payment path.',
      category: 'POS Hardware',
      budgetType: 'FIXED' as const,
      budgetAmountMinor: 45000,
      addressLine: '1 Market St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      scheduledStartTime: '2026-09-02T15:00:00.000Z',
      scheduledEndTime: '2026-09-02T18:00:00.000Z',
      slaExpirationTime: '2026-09-02T19:00:00.000Z'
    };

    it('takes the owning buyer from the caller, not the payload', async () => {
      // buyerId is a parameter precisely so that no request body can name a
      // different account. If it ever becomes a DTO field, this breaks.
      const created = await service.create(BUYER_ID, {
        ...dto,
        // @ts-expect-error the DTO has no buyerId; sending one must not win
        buyerId: 'victim-buyer-id'
      });

      expect(created.buyerId).toBe(BUYER_ID);
    });

    it('opens every work order in DRAFT', async () => {
      // A work order created straight into PUBLISHED would reach dispatch
      // without the buyer ever confirming the scope or funding the escrow.
      expect((await service.create(BUYER_ID, dto)).status).toBe(WorkOrderStatus.DRAFT);
    });

    it('assigns the identifier server-side', async () => {
      const a = await service.create(BUYER_ID, dto);
      const b = await service.create(BUYER_ID, dto);

      expect(a.id).not.toBe(b.id);
      expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('publish', () => {
    it('publishes exactly one enveloped event with the caller correlationId', async () => {
      const emitted: WorkOrderPublishedEvent[] = [];
      jest
        .spyOn(publisher, 'publishWorkOrderPublished')
        .mockImplementation(async (event) => void emitted.push(event));

      const result = await service.publish('wo-1', BUYER_ID, CORRELATION_ID);

      expect(result.status).toBe(WorkOrderStatus.PUBLISHED);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toMatchObject({
        eventType: EventType.WORK_ORDER_PUBLISHED,
        correlationId: CORRELATION_ID
      });
      expect(emitted[0].payload).toMatchObject({ workOrderId: 'wo-1', buyerId: BUYER_ID });
    });

    it('carries the budget as integer minor units', async () => {
      const emitted: WorkOrderPublishedEvent[] = [];
      jest
        .spyOn(publisher, 'publishWorkOrderPublished')
        .mockImplementation(async (event) => void emitted.push(event));

      await service.publish('wo-1', BUYER_ID, CORRELATION_ID);

      // Dispatch scores bids against this number; a float would make two
      // services disagree about the same budget in the last cent.
      expect(Number.isSafeInteger(emitted[0].payload.maxBudgetMinor)).toBe(true);
    });

    it('validates the transition before publishing', async () => {
      const fsm = new WorkOrderFsmService();
      const validate = jest.spyOn(fsm, 'validateTransition');
      const publish = jest.spyOn(publisher, 'publishWorkOrderPublished').mockResolvedValue();

      await new WorkOrdersService(fsm, publisher).publish('wo-1', BUYER_ID, CORRELATION_ID);

      // Ordering matters: an event published before the guard runs cannot be
      // recalled once dispatch has acted on it.
      expect(validate).toHaveBeenCalledWith(WorkOrderStatus.DRAFT, WorkOrderStatus.PUBLISHED);
      expect(validate.mock.invocationCallOrder[0]).toBeLessThan(
        publish.mock.invocationCallOrder[0]
      );
    });

    it('does not publish when the transition is rejected', async () => {
      const fsm = new WorkOrderFsmService();
      jest.spyOn(fsm, 'validateTransition').mockImplementation(() => {
        throw new Error('invalid transition');
      });
      const publish = jest.spyOn(publisher, 'publishWorkOrderPublished').mockResolvedValue();

      await expect(
        new WorkOrdersService(fsm, publisher).publish('wo-1', BUYER_ID, CORRELATION_ID)
      ).rejects.toThrow('invalid transition');
      expect(publish).not.toHaveBeenCalled();
    });
  });
});

describe('WorkOrderEventPublisher', () => {
  it('reads the routing key off the envelope rather than retyping it', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const publisher = new WorkOrderEventPublisher();

    await publisher.publishWorkOrderAssigned({
      eventId: 'evt-1',
      eventType: EventType.WORK_ORDER_ASSIGNED,
      occurredAt: '2026-09-01T00:00:00.000Z',
      correlationId: CORRELATION_ID,
      payload: { workOrderId: 'wo-1', techId: 't-1', agreedRateMinor: 42000 }
    });

    // Phase 3 replaces the log with a confirmed publish; what must survive is
    // that the key comes from `eventType` and the exchange is the shared const.
    const line = String(log.mock.calls[0][0]);
    expect(line).toContain(EVENT_EXCHANGE);
    expect(line).toContain(`routingKey=${EventType.WORK_ORDER_ASSIGNED}`);
    expect(line).toContain(`correlationId=${CORRELATION_ID}`);
  });
});
