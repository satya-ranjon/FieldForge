import { MetricsRegistry } from '../src/apm/metrics.registry';
import { MetricsInterceptor, normalizeRoute } from '../src/apm/metrics.interceptor';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('Metrics APM System', () => {
  let registry: MetricsRegistry;

  beforeEach(() => {
    registry = MetricsRegistry.getInstance();
  });

  describe('normalizeRoute', () => {
    it('normalizes UUIDs and numeric IDs to :id', () => {
      expect(normalizeRoute('/api/v1/work-orders/550e8400-e29b-41d4-a716-446655440000')).toBe(
        '/api/v1/work-orders/:id'
      );
      expect(normalizeRoute('/api/v1/invoices/12345/pdf')).toBe('/api/v1/invoices/:id/pdf');
      expect(normalizeRoute('/api/v1/work-orders?status=PUBLISHED')).toBe('/api/v1/work-orders');
      expect(normalizeRoute('')).toBe('/');
    });
  });

  describe('MetricsRegistry', () => {
    it('records HTTP request latency and increments total counters', async () => {
      registry.recordHttpRequest('test-service', 'GET', '/api/v1/work-orders', 200, 0.045);
      registry.recordHttpRequest('test-service', 'POST', '/api/v1/work-orders', 201, 0.12);
      registry.recordHttpRequest('test-service', 'GET', '/api/v1/work-orders/:id', 500, 0.25);

      const metricsOutput = await registry.getMetrics();

      expect(metricsOutput).toContain('http_requests_total');
      expect(metricsOutput).toContain('http_request_duration_seconds');
      expect(metricsOutput).toContain('service="test-service"');
      expect(metricsOutput).toContain('status_code="200"');
      expect(metricsOutput).toContain('status_code="500"');
    });

    it('records dispatch fanout latency in seconds', async () => {
      registry.recordDispatchFanoutLatency('work_order.lifecycle.published', 0.85);

      const metricsOutput = await registry.getMetrics();
      expect(metricsOutput).toContain('dispatch_fanout_latency_seconds');
      expect(metricsOutput).toContain('event_type="work_order.lifecycle.published"');
    });

    it('records billing reconciliation failures', async () => {
      registry.incrementBillingReconciliationFailure('escrow_mismatch', 'ledger_discrepancy');

      const metricsOutput = await registry.getMetrics();
      expect(metricsOutput).toContain('billing_reconciliation_failures_total');
      expect(metricsOutput).toContain('type="escrow_mismatch"');
      expect(metricsOutput).toContain('reason="ledger_discrepancy"');
    });

    it('provides standard prometheus content type', () => {
      expect(registry.getContentType()).toContain('text/plain');
    });
  });

  describe('MetricsInterceptor', () => {
    it('observes successful request duration and status code', (done) => {
      const interceptor = new MetricsInterceptor('api-gateway');

      const mockReq = {
        method: 'GET',
        path: '/api/v1/work-orders',
        route: { path: '/api/v1/work-orders' }
      };
      const mockRes = { statusCode: 200 };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes
        })
      } as unknown as ExecutionContext;

      const next: CallHandler = {
        handle: () => of({ data: 'ok' })
      };

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ data: 'ok' });
        },
        complete: async () => {
          const metrics = await registry.getMetrics();
          expect(metrics).toContain('service="api-gateway"');
          expect(metrics).toContain('route="/api/v1/work-orders"');
          done();
        }
      });
    });

    it('captures errors with 500 status code in metrics', (done) => {
      const interceptor = new MetricsInterceptor('work-order-service');

      const mockReq = {
        method: 'POST',
        path: '/api/v1/work-orders',
        route: { path: '/api/v1/work-orders' }
      };
      const mockRes = { statusCode: 500 };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes
        })
      } as unknown as ExecutionContext;

      const next: CallHandler = {
        handle: () => throwError(() => new Error('DB write failure'))
      };

      interceptor.intercept(context, next).subscribe({
        error: async () => {
          const metrics = await registry.getMetrics();
          expect(metrics).toContain('service="work-order-service"');
          expect(metrics).toContain('status_code="500"');
          done();
        }
      });
    });
  });
});
