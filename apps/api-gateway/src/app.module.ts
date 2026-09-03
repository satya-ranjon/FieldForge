import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProxyController } from './controllers/proxy.controller';
import {
  GlobalHttpExceptionFilter,
  MetricsInterceptor,
  HealthController,
  RolesGuard,
  requireJwtSecret
} from '@fieldforge/common';

@Module({
  imports: [
    // registerAsync, not register: the factory runs while `bootstrap()` builds
    // the app, so a missing or public JWT_SECRET is reported by the fatal logger
    // in main.ts instead of throwing during module import.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret()
      })
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100
      }
    ])
  ],
  controllers: [HealthController, ProxyController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
