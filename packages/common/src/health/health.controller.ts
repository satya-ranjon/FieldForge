import { Controller, Get, Header, Res, HttpStatus, Inject, Optional } from '@nestjs/common';
import type { Response } from 'express';
import { DRIZZLE, type DrizzleClient } from '../database/drizzle.module';
import { sql } from '@fieldforge/database';
import { metricsRegistry } from '../apm/metrics.registry';

export const REDIS_HEALTH_INDICATOR = Symbol('REDIS_HEALTH_INDICATOR');
export const RABBITMQ_HEALTH_INDICATOR = Symbol('RABBITMQ_HEALTH_INDICATOR');

export interface HealthIndicator {
  isHealthy: () => Promise<boolean> | boolean;
}

@Controller()
export class HealthController {
  constructor(
    @Optional() @Inject(DRIZZLE) private readonly db?: DrizzleClient,
    @Optional() @Inject(REDIS_HEALTH_INDICATOR) private readonly redisHealth?: HealthIndicator,
    @Optional() @Inject(RABBITMQ_HEALTH_INDICATOR) private readonly rabbitmqHealth?: HealthIndicator
  ) {}

  @Get('/healthz')
  getLiveness() {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  @Get('/readyz')
  async getReadiness(@Res({ passthrough: true }) res?: Response) {
    const memoryUsage = process.memoryUsage();
    const checks: Record<string, 'UP' | 'DOWN'> = {};
    let isReady = true;

    if (this.db) {
      try {
        await this.db.execute(sql`SELECT 1`);
        checks.database = 'UP';
      } catch {
        checks.database = 'DOWN';
        isReady = false;
      }
    }

    if (this.redisHealth) {
      try {
        const ok = await this.redisHealth.isHealthy();
        checks.redis = ok ? 'UP' : 'DOWN';
        if (!ok) isReady = false;
      } catch {
        checks.redis = 'DOWN';
        isReady = false;
      }
    }

    if (this.rabbitmqHealth) {
      try {
        const ok = await this.rabbitmqHealth.isHealthy();
        checks.rabbitmq = ok ? 'UP' : 'DOWN';
        if (!ok) isReady = false;
      } catch {
        checks.rabbitmq = 'DOWN';
        isReady = false;
      }
    }

    if (!isReady && res) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: isReady ? 'READY' : 'NOT_READY',
      checks: Object.keys(checks).length > 0 ? checks : { system: 'UP' },
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      timestamp: new Date().toISOString()
    };
  }

  @Get('/metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return metricsRegistry.getMetrics();
  }
}
