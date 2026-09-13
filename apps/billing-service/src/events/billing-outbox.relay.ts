import { Injectable, Inject, Logger } from '@nestjs/common';
import { BaseOutboxRelay, DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { billingOutboxEvents } from '@fieldforge/database';
import { EventPublisher } from '@fieldforge/messaging';

@Injectable()
export class BillingOutboxRelay extends BaseOutboxRelay {
  protected readonly table = billingOutboxEvents;
  protected readonly serviceName = 'billing-service';
  protected readonly logger = new Logger(BillingOutboxRelay.name);

  constructor(
    @Inject(DRIZZLE)
    protected readonly db: DrizzleClient,
    protected readonly eventPublisher: EventPublisher
  ) {
    super({
      serviceName: 'billing-service',
      batchSize: 5,
      leaseDurationMs: 30_000,
      publishTimeoutMs: 10_000,
      pollIntervalMs: 2_000
    });
  }
}
