import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  OutboxRetentionWorker,
  DRIZZLE,
  type DrizzleClient,
  parseRetentionDays,
  parseCleanupBatchSize,
  parseCleanupIntervalMs
} from '@fieldforge/common';
import { billingOutboxEvents } from '@fieldforge/database';

@Injectable()
export class BillingOutboxRetentionService extends OutboxRetentionWorker {
  constructor(@Inject(DRIZZLE) db: DrizzleClient) {
    super(
      db,
      billingOutboxEvents,
      {
        serviceName: 'billing-service',
        outboxName: 'billing_outbox',
        retentionDays: parseRetentionDays(process.env.OUTBOX_PUBLISHED_RETENTION_DAYS),
        batchSize: parseCleanupBatchSize(process.env.OUTBOX_CLEANUP_BATCH_SIZE),
        cleanupIntervalMs: parseCleanupIntervalMs(process.env.OUTBOX_CLEANUP_INTERVAL_MS)
      },
      new Logger(BillingOutboxRetentionService.name)
    );
  }
}
