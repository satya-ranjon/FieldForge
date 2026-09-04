import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DrizzleModule,
  HealthController,
  GlobalHttpExceptionFilter,
  requireJwtSecret
} from '@fieldforge/common';
import { MessagingModule } from '@fieldforge/messaging';
import { WorkOrdersController } from './modules/work-orders/work-orders.controller';
import { WorkOrdersService } from './modules/work-orders/work-orders.service';
import { WorkOrderFsmService } from './modules/fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from './events/work-order-event.publisher';
import { DeliverablesService } from './modules/deliverables/deliverables.service';
import { SlaEscalationService } from './modules/sla/sla-escalation.service';
import { MEDIA_STORAGE_PORT } from './modules/deliverables/media-storage.port';
import { LocalDiskMediaStorageAdapter } from './modules/deliverables/local-disk-media-storage.adapter';

@Module({
  imports: [
    DrizzleModule.forRoot(),
    ScheduleModule.forRoot(),
    MessagingModule.forRoot({ serviceName: 'work-order-service' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '15m' }
      })
    })
  ],
  controllers: [WorkOrdersController, HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    },
    {
      provide: MEDIA_STORAGE_PORT,
      useClass: LocalDiskMediaStorageAdapter
    },
    WorkOrdersService,
    WorkOrderFsmService,
    WorkOrderEventPublisher,
    DeliverablesService,
    SlaEscalationService
  ],
  exports: [WorkOrdersService, WorkOrderFsmService, DeliverablesService, SlaEscalationService]
})
export class WorkOrderModule {}
