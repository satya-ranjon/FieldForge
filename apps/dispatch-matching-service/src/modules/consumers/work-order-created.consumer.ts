import { Injectable, OnApplicationBootstrap, Optional } from '@nestjs/common';
import type { WorkOrderPublishedEvent, WorkOrderPublishedPayload } from '@fieldforge/contracts';
import { EventType } from '@fieldforge/contracts';
import { IdempotentConsumer } from '@fieldforge/messaging';
import { GeoSearchService } from '../geo-search/geo-search.service';

interface ContextLogger {
  info?: (msg: string) => void;
  error?: (msg: string) => void;
}

export const DISPATCH_WORK_ORDERS_QUEUE = 'fieldforge.dispatch.work-orders';

@Injectable()
export class WorkOrderCreatedConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly geoSearchService: GeoSearchService,
    @Optional() private readonly consumer?: IdempotentConsumer
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.consumer) {
      await this.consumer.subscribe<WorkOrderPublishedPayload>(
        DISPATCH_WORK_ORDERS_QUEUE,
        [EventType.WORK_ORDER_PUBLISHED],
        async (event: WorkOrderPublishedEvent, logger: ContextLogger) => {
          await this.handleWorkOrderPublished(event, logger);
        }
      );
    }
  }

  async handleWorkOrderPublished(
    event: WorkOrderPublishedEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { workOrderId, latitude, longitude } = event.payload;
    const nearbyTechs = await this.geoSearchService.findNearbyTechnicians(latitude, longitude);
    if (logger?.info) {
      logger.info(
        `[Dispatch] work order ${workOrderId}: ${nearbyTechs.length} eligible technicians in radius`
      );
    } else {
      console.log(
        `[Dispatch] work order ${workOrderId}: ${nearbyTechs.length} eligible technicians in radius (correlationId=${event.correlationId})`
      );
    }
  }
}
