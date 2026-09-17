import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DrizzleModule,
  HealthController,
  GlobalHttpExceptionFilter,
  requireJwtSecret,
  ProfileDirectoryService
} from '@fieldforge/common';
import { MessagingModule } from '@fieldforge/messaging';
import { WorkOrdersController } from './modules/work-orders/work-orders.controller';
import { InternalWorkOrdersController } from './modules/work-orders/internal-work-orders.controller';
import { WorkOrdersService } from './modules/work-orders/work-orders.service';
import { BidsController } from './modules/bids/bids.controller';
import { BidsService } from './modules/bids/bids.service';
import { WorkOrderFsmService } from './modules/fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from './events/work-order-event.publisher';
import { WorkOrderOutboxRelay } from './events/work-order-outbox.relay';
import { WorkOrderOutboxRetentionService } from './events/work-order-outbox-retention.service';
import { DeliverablesService } from './modules/deliverables/deliverables.service';
import { SlaEscalationService } from './modules/sla/sla-escalation.service';
import { SlaAutoApprovalService } from './modules/sla/sla-auto-approval.service';
import { MEDIA_STORAGE_PORT } from './modules/deliverables/media-storage.port';
import { S3MediaStorageAdapter } from './modules/deliverables/s3-media-storage.adapter';

import { WorkOrderEventsConsumer } from './consumers/work-order-events.consumer';

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
  controllers: [
    WorkOrdersController,
    InternalWorkOrdersController,
    BidsController,
    HealthController
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    },
    {
      provide: MEDIA_STORAGE_PORT,
      useClass: S3MediaStorageAdapter
    },
    S3MediaStorageAdapter,
    WorkOrdersService,
    BidsService,
    WorkOrderFsmService,
    WorkOrderEventPublisher,
    WorkOrderOutboxRelay,
    WorkOrderOutboxRetentionService,
    DeliverablesService,
    SlaEscalationService,
    SlaAutoApprovalService,
    WorkOrderEventsConsumer,
    ProfileDirectoryService
  ],
  exports: [
    WorkOrdersService,
    BidsService,
    WorkOrderFsmService,
    WorkOrderOutboxRelay,
    WorkOrderOutboxRetentionService,
    DeliverablesService,
    SlaEscalationService,
    SlaAutoApprovalService,
    WorkOrderEventsConsumer,
    ProfileDirectoryService
  ]
})
export class WorkOrderModule {}
