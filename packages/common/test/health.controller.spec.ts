import { HealthController } from '../src/health/health.controller';
import { HttpStatus } from '@nestjs/common';
import type { DrizzleClient } from '../src/database/drizzle.module';
import type { Response } from 'express';

describe('HealthController', () => {
  it('returns UP for liveness probe (/healthz)', () => {
    const controller = new HealthController();
    const liveness = controller.getLiveness();
    expect(liveness.status).toBe('UP');
    expect(liveness.timestamp).toBeDefined();
  });

  it('returns READY for readiness probe when all dependencies pass', async () => {
    const mockDb = {
      execute: jest.fn().mockResolvedValue([{ 1: 1 }])
    };
    const mockRedis = {
      isHealthy: jest.fn().mockResolvedValue(true)
    };
    const mockRabbitmq = {
      isHealthy: jest.fn().mockResolvedValue(true)
    };

    const controller = new HealthController(
      mockDb as unknown as DrizzleClient,
      mockRedis,
      mockRabbitmq
    );
    const mockRes = {
      status: jest.fn()
    } as unknown as Response;

    const readiness = await controller.getReadiness(mockRes);

    expect(readiness.status).toBe('READY');
    expect(readiness.checks).toEqual({
      database: 'UP',
      redis: 'UP',
      rabbitmq: 'UP'
    });
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('returns NOT_READY with HTTP 503 if database check fails', async () => {
    const mockDb = {
      execute: jest.fn().mockRejectedValue(new Error('Connection timeout'))
    };

    const controller = new HealthController(mockDb as unknown as DrizzleClient);
    const mockRes = {
      status: jest.fn()
    } as unknown as Response;

    const readiness = await controller.getReadiness(mockRes);

    expect(readiness.status).toBe('NOT_READY');
    expect((readiness.checks as Record<string, string>).database).toBe('DOWN');
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('serves prometheus metrics on /metrics', async () => {
    const controller = new HealthController();
    const metrics = await controller.getMetrics();
    expect(typeof metrics).toBe('string');
    expect(metrics).toContain('http_requests_total');
  });
});
