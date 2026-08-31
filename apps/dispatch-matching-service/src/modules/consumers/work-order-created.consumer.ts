import { Injectable } from '@nestjs/common';
import { WorkOrderPublishedEvent } from '@fieldforge/contracts';
import { GeoSearchService } from '../geo-search/geo-search.service';

@Injectable()
export class WorkOrderCreatedConsumer {
  constructor(private readonly geoSearchService: GeoSearchService) {}

  async handleWorkOrderPublished(event: WorkOrderPublishedEvent): Promise<void> {
    console.log(`⚡ [Dispatch Consumer] Received WorkOrderPublishedEvent: ${event.workOrderId}`);
    const nearbyTechs = await this.geoSearchService.findNearbyTechnicians(event.latitude, event.longitude);
    console.log(`🎯 Identified ${nearbyTechs.length} eligible technicians within 25-mile radius.`);
  }
}
