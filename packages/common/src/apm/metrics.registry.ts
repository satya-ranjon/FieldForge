import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export class MetricsRegistry {
  private static instance: MetricsRegistry;
  public readonly register: Registry;

  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDurationSeconds: Histogram<string>;
  public readonly dispatchFanoutLatencySeconds: Histogram<string>;
  public readonly billingReconciliationFailuresTotal: Counter<string>;

  private constructor() {
    this.register = new Registry();

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests processed',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [this.register]
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [this.register]
    });

    this.dispatchFanoutLatencySeconds = new Histogram({
      name: 'dispatch_fanout_latency_seconds',
      help: 'Latency in seconds from work order publication to technician notification dispatch',
      labelNames: ['event_type'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 1.5, 2.0, 5.0],
      registers: [this.register]
    });

    this.billingReconciliationFailuresTotal = new Counter({
      name: 'billing_reconciliation_failures_total',
      help: 'Total number of financial ledger or escrow reconciliation failures',
      labelNames: ['type', 'reason'],
      registers: [this.register]
    });

    collectDefaultMetrics({ register: this.register });
  }

  public static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  public recordHttpRequest(
    service: string,
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number
  ): void {
    const labels = {
      service,
      method: method.toUpperCase(),
      route,
      status_code: String(statusCode)
    };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, durationSeconds);
  }

  public recordDispatchFanoutLatency(eventType: string, durationSeconds: number): void {
    this.dispatchFanoutLatencySeconds.observe({ event_type: eventType }, durationSeconds);
  }

  public incrementBillingReconciliationFailure(type: string, reason: string): void {
    this.billingReconciliationFailuresTotal.inc({ type, reason });
  }

  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  public getContentType(): string {
    return this.register.contentType;
  }

  public clear(): void {
    this.register.clear();
  }
}

export const metricsRegistry = MetricsRegistry.getInstance();
