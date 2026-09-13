import { Injectable, Inject, Logger } from '@nestjs/common';
import { BaseOutboxRelay, DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { workOrderOutboxEvents } from '@fieldforge/database';
import { EventPublisher } from '@fieldforge/messaging';

@Injectable()
export class WorkOrderOutboxRelay extends BaseOutboxRelay {
  protected readonly table = workOrderOutboxEvents;
  protected readonly serviceName = 'work-order-service';
  protected readonly logger = new Logger(WorkOrderOutboxRelay.name);

  constructor(
    @Inject(DRIZZLE)
    protected readonly db: DrizzleClient,
    protected readonly eventPublisher: EventPublisher
  ) {
    super({
      serviceName: 'work-order-service',
      batchSize: 5,
      leaseDurationMs: 30_000,
      publishTimeoutMs: 10_000,
      pollIntervalMs: 2_000
    });
  }
}
