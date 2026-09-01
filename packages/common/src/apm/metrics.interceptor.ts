import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          // In production: Push to Prometheus registry / OpenTelemetry gauge
          if (process.env.NODE_ENV !== 'test') {
            console.log(`[APM Metric] ${method} ${url} - ${duration}ms (SLI bound)`);
          }
        },
        error: (error: unknown) => {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[APM Error Metric] ${method} ${url} - ${duration}ms: ${errorMessage}`);
        }
      })
    );
  }
}
