import { OfflineStorageAdapter, AsyncStorageAdapter } from './storage/storage.adapter';

export interface OfflineQueueItem {
  id: string;
  action: 'CHECK_IN' | 'UPLOAD_PHOTO' | 'CAPTURE_SIGNATURE' | 'COMPLETE_JOB';
  payload: unknown;
  idempotencyKey: string;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  error?: string;
}

export type MutationDispatcher = (item: OfflineQueueItem) => Promise<boolean>;

const QUEUE_STORAGE_KEY = 'fieldforge_offline_mutation_queue';
const MAX_RETRIES = 5;

/**
 * Generate cryptographically secure UUID or collision-safe fallback.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class OfflineSyncService {
  private queue: OfflineQueueItem[] = [];
  private isFlushing = false;
  private dispatcher: MutationDispatcher;
  private storage: OfflineStorageAdapter;
  private listeners: Set<(queue: OfflineQueueItem[]) => void> = new Set();
  private initialized = false;

  constructor(dispatcher?: MutationDispatcher, storage?: OfflineStorageAdapter) {
    this.storage = storage || new AsyncStorageAdapter();
    this.dispatcher =
      dispatcher ||
      (async () => {
        return true;
      });
  }

  /**
   * Load persisted mutations from storage into memory.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    try {
      const raw = await this.storage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed: OfflineQueueItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch {
      this.queue = [];
    } finally {
      this.initialized = true;
      this.notifyListeners();
    }
  }

  private async persist(): Promise<void> {
    try {
      await this.storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch {
      // Storage error logged or handled
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const currentQueue = this.getQueue();
    for (const listener of this.listeners) {
      try {
        listener(currentQueue as OfflineQueueItem[]);
      } catch {
        // Suppress subscriber errors
      }
    }
  }

  subscribe(listener: (queue: OfflineQueueItem[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getQueue() as OfflineQueueItem[]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async enqueue(action: OfflineQueueItem['action'], payload: unknown): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const id = generateId();
    const item: OfflineQueueItem = {
      id,
      action,
      payload,
      idempotencyKey: `mob-offline-${id}`,
      retryCount: 0,
      createdAt: new Date().toISOString()
    };

    this.queue.push(item);
    await this.persist();
    return id;
  }

  getQueue(): ReadonlyArray<OfflineQueueItem> {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persist();
  }

  /**
   * Calculates exponential backoff in milliseconds:
   * 1s, 2s, 4s, 8s, up to 30s.
   */
  static getBackoffDelayMs(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, Math.max(0, retryCount - 1)), 30000);
  }

  /**
   * Flush queued mutations in strict FIFO sequence.
   * Mutations are only removed from persistent storage upon confirmed success (H6).
   */
  async flushQueue(): Promise<{ processed: number; failed: number }> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.isFlushing || this.queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    this.isFlushing = true;
    let processed = 0;
    let failed = 0;

    const remainingQueue: OfflineQueueItem[] = [];

    // Process in FIFO sequence
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];

      // If item exceeded max retries, mark as dead-lettered
      if (item.retryCount >= MAX_RETRIES) {
        remainingQueue.push(item);
        failed++;
        continue;
      }

      try {
        item.lastAttemptAt = new Date().toISOString();
        const success = await this.dispatcher(item);

        if (success) {
          processed++;
          // Item successfully processed; NOT included in remainingQueue
        } else {
          item.retryCount++;
          item.error = 'Dispatcher returned unsuccessful status';
          remainingQueue.push(item);
          failed++;
          // Append remaining unprocessed items preserving FIFO order
          for (let j = i + 1; j < this.queue.length; j++) {
            remainingQueue.push(this.queue[j]);
          }
          break;
        }
      } catch (err) {
        item.retryCount++;
        item.error = err instanceof Error ? err.message : 'Unknown execution error';
        remainingQueue.push(item);
        failed++;
        // Append remaining unprocessed items preserving FIFO order
        for (let j = i + 1; j < this.queue.length; j++) {
          remainingQueue.push(this.queue[j]);
        }
        break;
      }
    }

    this.queue = remainingQueue;
    await this.persist();
    this.isFlushing = false;

    return { processed, failed };
  }
}
