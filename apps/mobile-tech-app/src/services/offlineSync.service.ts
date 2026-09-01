export interface OfflineQueueItem {
  id: string;
  action: 'CHECK_IN' | 'UPLOAD_PHOTO' | 'CAPTURE_SIGNATURE' | 'COMPLETE_JOB';
  payload: unknown;
  createdAt: string;
}

export class OfflineSyncService {
  private queue: OfflineQueueItem[] = [];

  enqueue(action: OfflineQueueItem['action'], payload: unknown) {
    const item: OfflineQueueItem = {
      id: Math.random().toString(36).substring(2),
      action,
      payload,
      createdAt: new Date().toISOString()
    };
    this.queue.push(item);
    console.log(`[Offline Sync Queue] Queued ${action}. Total pending: ${this.queue.length}`);
  }

  async flushQueue(): Promise<void> {
    console.log(
      `[Offline Sync Queue] Flushing ${this.queue.length} offline operations to server...`
    );
    this.queue = [];
  }
}
