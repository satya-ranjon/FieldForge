import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  OutboxRetentionWorker,
  DRIZZLE,
  type DrizzleClient,
  parseRetentionDays,
  parseCleanupBatchSize,
  parseCleanupIntervalMs
} from '@fieldforge/common';
import { workOrderOutboxEvents } from '@fieldforge/database';

@Injectable()
export class WorkOrderOutboxRetentionService extends OutboxRetentionWorker {
  constructor(@Inject(DRIZZLE) db: DrizzleClient) {
    super(
      db,
      workOrderOutboxEvents,
      {
        serviceName: 'work-order-service',
        outboxName: 'work_order_outbox',
        retentionDays: parseRetentionDays(process.env.OUTBOX_PUBLISHED_RETENTION_DAYS),
        batchSize: parseCleanupBatchSize(process.env.OUTBOX_CLEANUP_BATCH_SIZE),
        cleanupIntervalMs: parseCleanupIntervalMs(process.env.OUTBOX_CLEANUP_INTERVAL_MS)
      },
      new Logger(WorkOrderOutboxRetentionService.name)
    );
  }
}
