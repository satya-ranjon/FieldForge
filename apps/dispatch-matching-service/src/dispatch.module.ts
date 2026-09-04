import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  DrizzleModule,
  HealthController,
  GlobalHttpExceptionFilter,
  requireJwtSecret
} from '@fieldforge/common';
import { MessagingModule } from '@fieldforge/messaging';
import { GeoSearchService } from './modules/geo-search/geo-search.service';
import { WorkOrderCreatedConsumer } from './modules/consumers/work-order-created.consumer';
import { BidsService } from './modules/bids/bids.service';
import { DispatchController } from './modules/dispatch/dispatch.controller';

@Module({
  imports: [
    DrizzleModule.forRoot(),
    MessagingModule.forRoot({ serviceName: 'dispatch-service' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '15m' }
      })
    })
  ],
  controllers: [DispatchController, HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    },
    GeoSearchService,
    BidsService,
    WorkOrderCreatedConsumer
  ],
  exports: [GeoSearchService, BidsService]
})
export class DispatchModule {}
