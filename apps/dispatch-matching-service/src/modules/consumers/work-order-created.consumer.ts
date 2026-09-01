import { Injectable } from '@nestjs/common';
import type { WorkOrderPublishedEvent } from '@fieldforge/contracts';
import { GeoSearchService } from '../geo-search/geo-search.service';

@Injectable()
export class WorkOrderCreatedConsumer {
  constructor(private readonly geoSearchService: GeoSearchService) {}

  /**
   * Not bound to a queue yet — Phase 3 of docs/DEVELOPMENT_PLAN.md adds the
   * binding and the idempotency check on `event.eventId`.
   */
  async handleWorkOrderPublished(event: WorkOrderPublishedEvent): Promise<void> {
    const { workOrderId, latitude, longitude } = event.payload;
    const nearbyTechs = await this.geoSearchService.findNearbyTechnicians(latitude, longitude);
    console.log(
      `[Dispatch] work order ${workOrderId}: ${nearbyTechs.length} eligible technicians in radius (correlationId=${event.correlationId})`
    );
  }
}
