import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable, Optional, Inject } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { metricsRegistry } from './metrics.registry';

export const METRICS_SERVICE_NAME = Symbol('METRICS_SERVICE_NAME');

/**
 * Normalize path to prevent metric label cardinality explosion:
 * - Replace UUIDs with :id
 * - Replace numeric segments with :id
 * - Strip query strings
 */
export function normalizeRoute(path: string): string {
  if (!path) return '/';
  const cleanPath = path.split('?')[0];
  return cleanPath
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ':id')
    .replace(/\/([0-9]+)(?=\/|$)/g, '/:id');
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly serviceName: string;

  constructor(@Optional() @Inject(METRICS_SERVICE_NAME) serviceName?: string) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'fieldforge-service';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const method = req.method || 'GET';
    const rawRoute =
      req.route && req.route.path ? `${req.baseUrl || ''}${req.route.path}` : req.path || '/';
    const route = normalizeRoute(rawRoute);

    return next.handle().pipe(
      tap({
        next: () => {
          const durationSeconds = (Date.now() - startTime) / 1000;
          const statusCode = res?.statusCode || 200;
          metricsRegistry.recordHttpRequest(
            this.serviceName,
            method,
            route,
            statusCode,
            durationSeconds
          );
        },
        error: (error: unknown) => {
          const durationSeconds = (Date.now() - startTime) / 1000;
          const statusCode =
            typeof error === 'object' && error !== null && 'status' in error
              ? Number((error as { status: unknown }).status) || 500
              : 500;
          metricsRegistry.recordHttpRequest(
            this.serviceName,
            method,
            route,
            statusCode,
            durationSeconds
          );
        }
      })
    );
  }
}
