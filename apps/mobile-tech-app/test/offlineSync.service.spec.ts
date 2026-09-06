import { OfflineSyncService, OfflineQueueItem } from '../src/services/offlineSync.service';
import { InMemoryStorageAdapter } from '../src/services/storage/storage.adapter';

describe('OfflineSyncService (H6 & FR-MOB-004)', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  it('generates collision-safe idempotency keys on enqueue', async () => {
    const service = new OfflineSyncService(async () => true, storage);
    await service.initialize();

    const id1 = await service.enqueue('CHECK_IN', { latitude: 37.77, longitude: -122.41 });
    const id2 = await service.enqueue('COMPLETE_JOB', { workOrderId: 'wo-1' });

    const queue = service.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe(id1);
    expect(queue[0].idempotencyKey).toBe(`mob-offline-${id1}`);
    expect(queue[1].id).toBe(id2);
    expect(queue[1].idempotencyKey).toBe(`mob-offline-${id2}`);
    expect(queue[0].idempotencyKey).not.toBe(queue[1].idempotencyKey);
  });

  it('persists queue across service re-instantiation (Fixes H6 Data Loss)', async () => {
    // Instance 1 enqueues mutations
    const service1 = new OfflineSyncService(async () => true, storage);
    await service1.initialize();

    await service1.enqueue('CHECK_IN', { workOrderId: 'wo-8910', status: 'ON_SITE' });
    await service1.enqueue('UPLOAD_PHOTO', { filename: 'photo_before.jpg' });

    expect(service1.getPendingCount()).toBe(2);

    // Instance 2 boots up pointing at the same storage adapter
    const service2 = new OfflineSyncService(async () => true, storage);
    await service2.initialize();

    expect(service2.getPendingCount()).toBe(2);
    const queue = service2.getQueue();
    expect(queue[0].action).toBe('CHECK_IN');
    expect(queue[1].action).toBe('UPLOAD_PHOTO');
  });

  it('executes mutations in strict FIFO sequence and removes only on success', async () => {
    const executedActions: string[] = [];
    const dispatcher = jest.fn(async (item: OfflineQueueItem) => {
      executedActions.push(item.action);
      return true;
    });

    const service = new OfflineSyncService(dispatcher, storage);
    await service.initialize();

    await service.enqueue('CHECK_IN', { step: 1 });
    await service.enqueue('UPLOAD_PHOTO', { step: 2 });
    await service.enqueue('CAPTURE_SIGNATURE', { step: 3 });
    await service.enqueue('COMPLETE_JOB', { step: 4 });

    const result = await service.flushQueue();

    expect(result.processed).toBe(4);
    expect(result.failed).toBe(0);
    expect(executedActions).toEqual([
      'CHECK_IN',
      'UPLOAD_PHOTO',
      'CAPTURE_SIGNATURE',
      'COMPLETE_JOB'
    ]);
    expect(service.getPendingCount()).toBe(0);

    // Verify storage is also empty
    const rawStorage = await storage.getItem('fieldforge_offline_mutation_queue');
    expect(JSON.parse(rawStorage || '[]')).toEqual([]);
  });

  it('retains mutation and increments retryCount upon failure with backoff', async () => {
    let attempts = 0;
    const dispatcher = jest.fn(async (item: OfflineQueueItem) => {
      attempts++;
      if (item.action === 'UPLOAD_PHOTO') {
        throw new Error('500 Internal Server Error');
      }
      return true;
    });

    const service = new OfflineSyncService(dispatcher, storage);
    await service.initialize();

    await service.enqueue('CHECK_IN', { step: 1 });
    await service.enqueue('UPLOAD_PHOTO', { step: 2 });
    await service.enqueue('COMPLETE_JOB', { step: 3 });

    const result = await service.flushQueue();

    expect(result.processed).toBe(1); // CHECK_IN succeeded
    expect(result.failed).toBe(1); // UPLOAD_PHOTO failed
    expect(attempts).toBe(2);

    // Queue must retain UPLOAD_PHOTO and the subsequent COMPLETE_JOB in FIFO order
    const remaining = service.getQueue();
    expect(remaining.length).toBe(2);
    expect(remaining[0].action).toBe('UPLOAD_PHOTO');
    expect(remaining[0].retryCount).toBe(1);
    expect(remaining[0].error).toBe('500 Internal Server Error');
    expect(remaining[1].action).toBe('COMPLETE_JOB');
  });

  it('computes exponential backoff correctly', () => {
    expect(OfflineSyncService.getBackoffDelayMs(0)).toBe(1000);
    expect(OfflineSyncService.getBackoffDelayMs(1)).toBe(1000);
    expect(OfflineSyncService.getBackoffDelayMs(2)).toBe(2000);
    expect(OfflineSyncService.getBackoffDelayMs(3)).toBe(4000);
    expect(OfflineSyncService.getBackoffDelayMs(4)).toBe(8000);
    expect(OfflineSyncService.getBackoffDelayMs(5)).toBe(16000);
    expect(OfflineSyncService.getBackoffDelayMs(6)).toBe(30000); // capped at 30s
  });

  it('simulates end-to-end airplane mode workflow with zero data loss', async () => {
    let isConnected = false;
    const serverReceived: string[] = [];

    const mockDispatcher = async (item: OfflineQueueItem) => {
      if (!isConnected) {
        throw new Error('Network unreachable (airplane mode active)');
      }
      serverReceived.push(item.action);
      return true;
    };

    const service = new OfflineSyncService(mockDispatcher, storage);
    await service.initialize();

    // 1. Technician in airplane mode on site performs full job flow
    await service.enqueue('CHECK_IN', { latitude: 37.775, longitude: -122.419 });
    await service.enqueue('UPLOAD_PHOTO', { deliverable: 'BEFORE_WORK' });
    await service.enqueue('CAPTURE_SIGNATURE', { client: 'Store Manager', hash: 'sha256-abc' });
    await service.enqueue('COMPLETE_JOB', { workOrderId: 'wo-8910' });

    expect(service.getPendingCount()).toBe(4);

    // 2. Flush while still in airplane mode: fails cleanly without data loss
    const offlineFlush = await service.flushQueue();
    expect(offlineFlush.processed).toBe(0);
    expect(offlineFlush.failed).toBe(1);
    expect(service.getPendingCount()).toBe(4); // All 4 still queued

    // 3. Technician reconnects to cellular/WiFi
    isConnected = true;

    // 4. Flush triggered: all 4 mutations land exactly once
    const onlineFlush = await service.flushQueue();
    expect(onlineFlush.processed).toBe(4);
    expect(onlineFlush.failed).toBe(0);
    expect(serverReceived).toEqual([
      'CHECK_IN',
      'UPLOAD_PHOTO',
      'CAPTURE_SIGNATURE',
      'COMPLETE_JOB'
    ]);
    expect(service.getPendingCount()).toBe(0);
  });
});
