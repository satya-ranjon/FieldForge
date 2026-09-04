import { Module } from '@nestjs/common';
import { MessagingModule } from '@fieldforge/messaging';
import { GeoSearchService } from './modules/geo-search/geo-search.service';
import { WorkOrderCreatedConsumer } from './modules/consumers/work-order-created.consumer';
import { HealthController } from '@fieldforge/common';

@Module({
  imports: [MessagingModule.forRoot({ serviceName: 'dispatch-service' })],
  controllers: [HealthController],
  providers: [GeoSearchService, WorkOrderCreatedConsumer],
  exports: [GeoSearchService]
})
export class DispatchModule {}
