import {
  WorkOrderCreatedConsumer,
  DISPATCH_WORK_ORDERS_QUEUE
} from '../src/modules/consumers/work-order-created.consumer';
import { GeoSearchService } from '../src/modules/geo-search/geo-search.service';
import type { IdempotentConsumer } from '@fieldforge/messaging';
import { EventType, createEvent, type WorkOrderPublishedEvent } from '@fieldforge/contracts';

describe('WorkOrderCreatedConsumer', () => {
  let consumer: WorkOrderCreatedConsumer;
  let mockGeoSearchService: jest.Mocked<GeoSearchService>;
  let mockMessagingConsumer: jest.Mocked<IdempotentConsumer>;

  beforeEach(() => {
    mockGeoSearchService = {
      findNearbyTechnicians: jest
        .fn()
        .mockResolvedValue([
          { id: 'tech-1', name: 'Alice', latitude: 37.77, longitude: -122.41, distanceMiles: 1.2 }
        ])
    } as unknown as jest.Mocked<GeoSearchService>;

    mockMessagingConsumer = {
      subscribe: jest.fn().mockResolvedValue('consumer-tag-123')
    } as unknown as jest.Mocked<IdempotentConsumer>;

    consumer = new WorkOrderCreatedConsumer(mockGeoSearchService, mockMessagingConsumer);
  });

  it('subscribes to dispatch work-orders queue on application bootstrap', async () => {
    await consumer.onApplicationBootstrap();

    expect(mockMessagingConsumer.subscribe).toHaveBeenCalledWith(
      DISPATCH_WORK_ORDERS_QUEUE,
      [EventType.WORK_ORDER_PUBLISHED],
      expect.any(Function)
    );
  });

  it('triggers geo-search for nearby technicians when handling WorkOrderPublished event', async () => {
    const event: WorkOrderPublishedEvent = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'wo-101',
        buyerId: 'buyer-202',
        title: 'POS Terminal Replacement',
        maxBudgetMinor: 40000,
        latitude: 37.7749,
        longitude: -122.4194
      },
      'corr-dispatch-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handleWorkOrderPublished(event, mockLogger);

    expect(mockGeoSearchService.findNearbyTechnicians).toHaveBeenCalledWith(37.7749, -122.4194);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('1 eligible technicians in radius')
    );
  });
});
