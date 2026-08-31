import { Module } from '@nestjs/common';
import { GeoSearchService } from './modules/geo-search/geo-search.service';
import { WorkOrderCreatedConsumer } from './modules/consumers/work-order-created.consumer';
import { HealthController } from '@fieldforge/common';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [GeoSearchService, WorkOrderCreatedConsumer],
  exports: [GeoSearchService]
})
export class DispatchModule {}
