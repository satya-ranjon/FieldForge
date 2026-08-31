import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const req = context.switchToHttp().getRequest();
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
        error: (err: any) => {
          const duration = Date.now() - startTime;
          console.error(`[APM Error Metric] ${method} ${url} - ${duration}ms: ${err?.message || err}`);
        }
      })
    );
  }
}
