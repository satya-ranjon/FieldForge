import { Module } from '@nestjs/common';
import { WorkOrdersService } from './modules/work-orders/work-orders.service';
import { WorkOrderFsmService } from './modules/fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from './events/work-order-event.publisher';
import { HealthController } from '@fieldforge/common';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [WorkOrdersService, WorkOrderFsmService, WorkOrderEventPublisher],
  exports: [WorkOrdersService]
})
export class WorkOrderModule {}
