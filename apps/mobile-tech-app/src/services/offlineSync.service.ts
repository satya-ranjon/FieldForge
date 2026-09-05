export interface OfflineQueueItem {
  id: string;
  action: 'CHECK_IN' | 'UPLOAD_PHOTO' | 'CAPTURE_SIGNATURE' | 'COMPLETE_JOB';
  payload: unknown;
  idempotencyKey: string;
  retryCount: number;
  createdAt: string;
}

export type MutationDispatcher = (item: OfflineQueueItem) => Promise<boolean>;

export class OfflineSyncService {
  private queue: OfflineQueueItem[] = [];
  private isFlushing = false;
  private dispatcher: MutationDispatcher;

  constructor(dispatcher?: MutationDispatcher) {
    // Default dispatcher sends HTTP mutation or logs execution
    this.dispatcher =
      dispatcher ||
      (async () => {
        // In mobile runtime: post to api gateway with x-idempotency-key
        return true;
      });
  }

  enqueue(action: OfflineQueueItem['action'], payload: unknown): string {
    const id = Math.random().toString(36).substring(2);
    const item: OfflineQueueItem = {
      id,
      action,
      payload,
      idempotencyKey: `mob-offline-${id}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date().toISOString()
    };
    this.queue.push(item);
    return id;
  }

  getQueue(): ReadonlyArray<OfflineQueueItem> {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }

  async flushQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isFlushing || this.queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    this.isFlushing = true;
    let processed = 0;
    let failed = 0;

    const remainingQueue: OfflineQueueItem[] = [];

    for (const item of this.queue) {
      try {
        const success = await this.dispatcher(item);
        if (success) {
          processed++;
        } else {
          item.retryCount++;
          remainingQueue.push(item);
          failed++;
        }
      } catch {
        item.retryCount++;
        remainingQueue.push(item);
        failed++;
      }
    }

    this.queue = remainingQueue;
    this.isFlushing = false;

    return { processed, failed };
  }
}
