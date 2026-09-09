import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import {
  DrizzleModule,
  HealthController,
  GlobalHttpExceptionFilter,
  requireJwtSecret,
  loadEnv
} from '@fieldforge/common';
import { MessagingModule } from '@fieldforge/messaging';
import { CandidateScoringService, CANDIDATE_SCORER } from './modules/scoring';
import { GeoSearchService, REDIS_CLIENT } from './modules/geo-search/geo-search.service';
import { TechnicianDirectoryService } from './modules/geo-search/technician-directory.service';
import { WorkOrderCreatedConsumer } from './modules/consumers/work-order-created.consumer';
import { DispatchController } from './modules/dispatch/dispatch.controller';

const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    loadEnv();
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;
    const client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
    client.connect().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[DispatchModule] Redis connect failed: ${msg}`);
    });
    return client;
  }
};

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
    redisProvider,
    CandidateScoringService,
    {
      provide: CANDIDATE_SCORER,
      useClass: CandidateScoringService
    },
    TechnicianDirectoryService,
    GeoSearchService,
    WorkOrderCreatedConsumer
  ],
  exports: [
    CandidateScoringService,
    CANDIDATE_SCORER,
    GeoSearchService,
    TechnicianDirectoryService,
    REDIS_CLIENT
  ]
})
export class DispatchModule {}
