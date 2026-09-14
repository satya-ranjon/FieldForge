import { DeliverableType } from '@fieldforge/contracts';
import {
  DeliverableUploadService,
  DeliverableValidationError
} from '../src/services/deliverableUpload.service';
import { defaultMobileDispatcher, UploadPhotoOfflinePayload } from '../src/services/syncManager';
import { OfflineSyncService, OfflineQueueItem } from '../src/services/offlineSync.service';
import { InMemoryStorageAdapter } from '../src/services/storage/storage.adapter';
import { store } from '../src/store/store';
import {
  setMediaPending,
  setMediaUploading,
  setMediaUploaded,
  setMediaFailed,
  resetDeliverables
} from '../src/store/slices/jobSlice';
import { setOnlineStatus } from '../src/store/slices/syncSlice';

describe('DeliverableUploadService & Mobile S3 Upload Flow (ISSUE-003A)', () => {
  const originalFetch = global.fetch;
  const mockWorkOrderId = '11111111-2222-4333-8444-555555555555';
  const mockLocalUri = 'file:///data/user/0/app/cache/photo_before.jpg';
  const mockUploadUrl =
    'https://fieldforge-deliverables.s3.amazonaws.com/deliverables/wo-123/photo.jpg?AWSAccessKeyId=TEST';
  const mockObjectKey = 'deliverables/11111111-2222-4333-8444-555555555555/photo_before_123.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(resetDeliverables());
    store.dispatch(setOnlineStatus(true));
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Client-Side Metadata Validation (ISSUE-003A §5 & §36)', () => {
    it('accepts valid 2 MiB JPEG image', () => {
      expect(() => {
        DeliverableUploadService.validateDeliverableFile({
          filename: 'site_before.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 2 * 1024 * 1024
        });
      }).not.toThrow();
    });

    it('rejects zero-byte files', () => {
      expect(() => {
        DeliverableUploadService.validateDeliverableFile({
          filename: 'empty.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 0
        });
      }).toThrow(DeliverableValidationError);
    });

    it('rejects files exceeding canonical 15 MiB limit', () => {
      expect(() => {
        DeliverableUploadService.validateDeliverableFile({
          filename: 'oversized.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 15 * 1024 * 1024 + 1
        });
      }).toThrow(/exceeds maximum allowed size of 15 MiB/);
    });

    it('rejects unsupported MIME types (e.g. video/mp4, image/bmp)', () => {
      expect(() => {
        DeliverableUploadService.validateDeliverableFile({
          filename: 'video.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1024 * 1024
        });
      }).toThrow(/Unsupported MIME type/);
    });

    it('rejects empty filenames', () => {
      expect(() => {
        DeliverableUploadService.validateDeliverableFile({
          filename: '   ',
          mimeType: 'image/jpeg',
          sizeBytes: 1024
        });
      }).toThrow(/filename cannot be empty/);
    });
  });

  describe('Online Direct S3 Upload Flow (ISSUE-003A §6, §8, §9, §11, §30)', () => {
    it('executes presign -> direct S3 PUT without auth headers -> confirmation endpoint', async () => {
      const calls: Array<{ url: string; method?: string; headers?: Record<string, string> }> = [];

      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof input === 'string' ? input : input.toString();
        const headers = (init?.headers as Record<string, string>) || {};
        calls.push({ url: urlStr, method: init?.method, headers });

        // 1. Presign endpoint
        if (urlStr.includes('/deliverables/presigned-url')) {
          return new Response(
            JSON.stringify({
              uploadUrl: mockUploadUrl,
              objectKey: mockObjectKey,
              expiresInSeconds: 900,
              requiredHeaders: {
                'Content-Type': 'image/jpeg'
              }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // 2. Reading local file
        if (urlStr.startsWith('file://')) {
          return new Response(new Blob(['fake-image-bytes'], { type: 'image/jpeg' }), {
            status: 200
          });
        }

        // 3. Amazon S3 PUT endpoint
        if (urlStr.includes('s3.amazonaws.com')) {
          return new Response(null, { status: 200 });
        }

        // 4. Confirmation endpoint
        if (urlStr.includes('/deliverables') && init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              id: 'del-confirmed-123',
              workOrderId: mockWorkOrderId,
              deliverableType: DeliverableType.PHOTO_BEFORE,
              mediaUrl: 'https://cdn.fieldforge.dev/wo-123/del-confirmed-123.jpg',
              objectKey: mockObjectKey,
              uploadedAt: new Date().toISOString()
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response('Not found', { status: 404 });
      });

      const confirmed = await DeliverableUploadService.executeOnlineUpload(
        mockWorkOrderId,
        {
          uri: mockLocalUri,
          filename: 'photo_before.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 10,
          deliverableType: DeliverableType.PHOTO_BEFORE
        },
        'valid-technician-jwt'
      );

      // Verify returned authoritative deliverable from backend
      expect(confirmed.id).toBe('del-confirmed-123');
      expect(confirmed.objectKey).toBe(mockObjectKey);

      // Verify sequence: presigned-url -> local read -> S3 PUT -> confirmation
      expect(calls.length).toBe(4);
      expect(calls[0].url).toContain('/deliverables/presigned-url');
      expect(calls[0].headers?.['Authorization']).toBe('Bearer valid-technician-jwt');

      expect(calls[1].url).toBe(mockLocalUri);

      // S3 PUT verification: must NOT contain Authorization or FieldForge internal headers
      expect(calls[2].url).toBe(mockUploadUrl);
      expect(calls[2].method).toBe('PUT');
      expect(calls[2].headers?.['Content-Type']).toBe('image/jpeg');
      expect(calls[2].headers?.['Authorization']).toBeUndefined();
      expect(calls[2].headers?.['x-ff-user-id']).toBeUndefined();

      // Confirmation verification
      expect(calls[3].url).toContain(`/work-orders/${mockWorkOrderId}/deliverables`);
      expect(calls[3].method).toBe('POST');
      expect(calls[3].headers?.['Authorization']).toBe('Bearer valid-technician-jwt');
    });
  });

  describe('S3 Failure Behavior (ISSUE-003A §31)', () => {
    it('aborts without calling confirmation if direct S3 PUT fails', async () => {
      const calls: string[] = [];

      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof input === 'string' ? input : input.toString();
        calls.push(urlStr);

        if (urlStr.includes('/deliverables/presigned-url')) {
          return new Response(
            JSON.stringify({
              uploadUrl: mockUploadUrl,
              objectKey: mockObjectKey,
              expiresInSeconds: 900,
              requiredHeaders: { 'Content-Type': 'image/jpeg' }
            }),
            { status: 200 }
          );
        }

        if (urlStr.startsWith('file://')) {
          return new Response(new Blob(['fake-image-bytes'], { type: 'image/jpeg' }), {
            status: 200
          });
        }

        // S3 PUT fails with 500 error
        if (urlStr.includes('s3.amazonaws.com')) {
          return new Response('S3 Internal Error', { status: 500, statusText: 'Internal Error' });
        }

        if (urlStr.endsWith('/deliverables') && init?.method === 'POST') {
          return new Response(JSON.stringify({ id: 'bad' }), { status: 201 });
        }

        return new Response('Not found', { status: 404 });
      });

      await expect(
        DeliverableUploadService.executeOnlineUpload(
          mockWorkOrderId,
          {
            uri: mockLocalUri,
            filename: 'photo_before.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 1024 * 10,
            deliverableType: DeliverableType.PHOTO_BEFORE
          },
          'jwt'
        )
      ).rejects.toThrow(/Amazon S3 upload failed with HTTP 500/);

      // Verify confirmation was NEVER called
      const confirmationCalls = calls.filter(
        (url) => url.endsWith('/deliverables') && !url.includes('presigned-url')
      );
      expect(confirmationCalls.length).toBe(0);
    });
  });

  describe('Confirmation Failure & Recovery Strategy (ISSUE-003A §19 & §32)', () => {
    it('preserves objectKey when confirmation fails and retries confirmation directly without re-uploading', async () => {
      let s3UploadCount = 0;
      let confirmationAttempts = 0;

      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof input === 'string' ? input : input.toString();

        if (urlStr.includes('/deliverables/presigned-url')) {
          return new Response(
            JSON.stringify({
              uploadUrl: mockUploadUrl,
              objectKey: mockObjectKey,
              expiresInSeconds: 900,
              requiredHeaders: { 'Content-Type': 'image/jpeg' }
            }),
            { status: 200 }
          );
        }

        if (urlStr.startsWith('file://')) {
          return new Response(new Blob(['fake-bytes']), { status: 200 });
        }

        if (urlStr.includes('s3.amazonaws.com')) {
          s3UploadCount++;
          return new Response(null, { status: 200 });
        }

        if (urlStr.endsWith('/deliverables') && init?.method === 'POST') {
          confirmationAttempts++;
          if (confirmationAttempts === 1) {
            // First attempt network drops
            throw new Error('Network timeout during confirmation');
          }
          // Second attempt succeeds
          return new Response(
            JSON.stringify({
              id: 'del-recovered-123',
              workOrderId: mockWorkOrderId,
              deliverableType: DeliverableType.PHOTO_BEFORE,
              mediaUrl: 'https://cdn.fieldforge.dev/del-recovered-123.jpg',
              objectKey: mockObjectKey,
              uploadedAt: new Date().toISOString()
            }),
            { status: 201 }
          );
        }

        return new Response('Not found', { status: 404 });
      });

      const queueItem: OfflineQueueItem = {
        id: 'upload-job-1',
        action: 'UPLOAD_PHOTO',
        payload: {
          workOrderId: mockWorkOrderId,
          deliverableType: DeliverableType.PHOTO_BEFORE,
          localUri: mockLocalUri,
          filename: 'photo_before.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 10
        } as UploadPhotoOfflinePayload,
        idempotencyKey: 'mob-offline-upload-job-1',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      // Attempt 1: PUT succeeds, confirmation fails with timeout
      await expect(defaultMobileDispatcher(queueItem)).rejects.toThrow(
        'Network timeout during confirmation'
      );
      expect(s3UploadCount).toBe(1);
      expect(confirmationAttempts).toBe(1);

      // Verify payload retained objectKey (ISSUE-003A §19)
      const payloadAfterAttempt1 = queueItem.payload as UploadPhotoOfflinePayload;
      expect(payloadAfterAttempt1.objectKey).toBe(mockObjectKey);

      // Attempt 2 (retry): should reuse existing objectKey and call confirmation directly without S3 PUT
      const success = await defaultMobileDispatcher(queueItem);
      expect(success).toBe(true);
      expect(s3UploadCount).toBe(1); // S3 PUT was NOT called again!
      expect(confirmationAttempts).toBe(2);
    });
  });

  describe('Offline Queue & Reconnect Flow (ISSUE-003A §13, §14, §33, §34, §35)', () => {
    it('enqueues job with local metadata and NO presigned URL, then requests fresh presign on reconnect', async () => {
      const storage = new InMemoryStorageAdapter();
      let presignRequests = 0;
      let s3Puts = 0;
      let confirmations = 0;

      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof input === 'string' ? input : input.toString();

        if (urlStr.includes('/deliverables/presigned-url')) {
          presignRequests++;
          return new Response(
            JSON.stringify({
              uploadUrl: `${mockUploadUrl}&attempt=${presignRequests}`,
              objectKey: `${mockObjectKey}_${presignRequests}`,
              expiresInSeconds: 900,
              requiredHeaders: { 'Content-Type': 'image/jpeg' }
            }),
            { status: 200 }
          );
        }

        if (urlStr.startsWith('file://')) {
          return new Response(new Blob(['bytes']), { status: 200 });
        }

        if (urlStr.includes('s3.amazonaws.com')) {
          s3Puts++;
          return new Response(null, { status: 200 });
        }

        if (urlStr.endsWith('/deliverables') && init?.method === 'POST') {
          confirmations++;
          return new Response(
            JSON.stringify({
              id: `del-${confirmations}`,
              workOrderId: mockWorkOrderId,
              deliverableType: DeliverableType.PHOTO_BEFORE,
              mediaUrl: `https://cdn.fieldforge.dev/del-${confirmations}.jpg`,
              objectKey: `${mockObjectKey}_${presignRequests}`,
              uploadedAt: new Date().toISOString()
            }),
            { status: 201 }
          );
        }

        return new Response('Not found', { status: 404 });
      });

      const service = new OfflineSyncService(defaultMobileDispatcher, storage);
      await service.initialize();

      // 1. Technician offline captures photo
      store.dispatch(setOnlineStatus(false));
      const payload: UploadPhotoOfflinePayload = {
        workOrderId: mockWorkOrderId,
        deliverableType: DeliverableType.PHOTO_BEFORE,
        localUri: mockLocalUri,
        filename: 'offline_photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024 * 50
      };

      await service.enqueue('UPLOAD_PHOTO', payload);
      expect(service.getPendingCount()).toBe(1);

      // Verify queued item contains NO presigned URL and NO credentials
      const queuedItem = service.getQueue()[0];
      const qPayload = queuedItem.payload as Record<string, unknown>;
      expect(qPayload.uploadUrl).toBeUndefined();
      expect(qPayload.downloadUrl).toBeUndefined();
      expect(qPayload.accessKeyId).toBeUndefined();
      expect(qPayload.secretAccessKey).toBeUndefined();

      // Flush while offline: fails cleanly
      const offlineFlush = await service.flushQueue();
      expect(offlineFlush.processed).toBe(0);
      expect(offlineFlush.failed).toBe(1);
      expect(service.getPendingCount()).toBe(1);
      expect(presignRequests).toBe(0);

      // 2. Reconnect
      store.dispatch(setOnlineStatus(true));

      // Flush while online: completes full flow
      const onlineFlush = await service.flushQueue();
      expect(onlineFlush.processed).toBe(1);
      expect(onlineFlush.failed).toBe(0);
      expect(service.getPendingCount()).toBe(0);

      expect(presignRequests).toBe(1);
      expect(s3Puts).toBe(1);
      expect(confirmations).toBe(1);
    });
  });

  describe('Authorization & Lifecycle Rejection Handling (ISSUE-003A §23, §24)', () => {
    it('stops retrying immediately upon permanent 401 or 403 authorization rejection', async () => {
      global.fetch = jest.fn(async (input: RequestInfo | URL) => {
        const urlStr = typeof input === 'string' ? input : input.toString();

        if (urlStr.includes('/deliverables/presigned-url')) {
          return new Response(
            JSON.stringify({
              statusCode: 403,
              message: 'Technician not assigned to this work order'
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response('Not found', { status: 404 });
      });

      const queueItem: OfflineQueueItem = {
        id: 'job-unauth',
        action: 'UPLOAD_PHOTO',
        payload: {
          workOrderId: mockWorkOrderId,
          deliverableType: DeliverableType.PHOTO_BEFORE,
          localUri: mockLocalUri,
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024
        } as UploadPhotoOfflinePayload,
        idempotencyKey: 'mob-offline-unauth',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      const result = await defaultMobileDispatcher(queueItem);
      expect(result).toBe(false);
      expect(queueItem.retryCount).toBe(5); // Marked dead-lettered immediately to avoid infinite loop
      expect(queueItem.error).toContain('Technician not assigned to this work order');
    });
  });

  describe('Durable Local Storage Management (ISSUE-003A §16 & §27)', () => {
    it('copies file into durable directory when documentDirectory exists', async () => {
      const durablePath = await DeliverableUploadService.saveToDurableStorage(
        mockLocalUri,
        'photo_before.jpg'
      );
      expect(durablePath).toContain('fieldforge_deliverables');
    });

    it('cleans up durable file without throwing errors', async () => {
      await expect(
        DeliverableUploadService.cleanupDurableFile(
          'file:///data/user/0/app/documents/fieldforge_deliverables/photo_before.jpg'
        )
      ).resolves.toBeUndefined();
    });
  });

  describe('Redux State Lifecycle Management (ISSUE-003A §25 & §26)', () => {
    it('tracks Pending -> Uploading -> Uploaded state transitions without fake URLs', () => {
      // 1. Pending (offline)
      store.dispatch(
        setMediaPending({
          type: 'BEFORE',
          file: {
            localUri: mockLocalUri,
            filename: 'photo_before.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 1024 * 10
          }
        })
      );
      let deliverablesState = store.getState().job.deliverables;
      expect(deliverablesState.photoBefore?.status).toBe('PENDING');
      expect(deliverablesState.photoBeforeUrl).toBeNull(); // No fake URL!

      // 2. Uploading (online started)
      store.dispatch(
        setMediaUploading({
          type: 'BEFORE'
        })
      );
      deliverablesState = store.getState().job.deliverables;
      expect(deliverablesState.photoBefore?.status).toBe('UPLOADING');
      expect(deliverablesState.photoBeforeUrl).toBeNull();

      // 3. Uploaded (confirmed by backend)
      store.dispatch(
        setMediaUploaded({
          type: 'BEFORE',
          deliverable: {
            id: 'del-confirmed-123',
            mediaUrl: 'https://cdn.fieldforge.dev/del-confirmed-123.jpg',
            objectKey: mockObjectKey
          }
        })
      );
      deliverablesState = store.getState().job.deliverables;
      expect(deliverablesState.photoBefore?.status).toBe('UPLOADED');
      expect(deliverablesState.photoBefore?.mediaUrl).toBe(
        'https://cdn.fieldforge.dev/del-confirmed-123.jpg'
      );
      expect(deliverablesState.photoBeforeUrl).toBe(
        'https://cdn.fieldforge.dev/del-confirmed-123.jpg'
      );

      // 4. Failed state
      store.dispatch(
        setMediaFailed({
          type: 'BEFORE',
          error: 'Network timeout'
        })
      );
      deliverablesState = store.getState().job.deliverables;
      expect(deliverablesState.photoBefore?.status).toBe('FAILED');
      expect(deliverablesState.photoBefore?.error).toBe('Network timeout');
    });
  });
});
