import {
  DeliverableType,
  WorkOrderStatus,
  type TransitionWorkOrderDto
} from '@fieldforge/contracts';
import { OfflineSyncService, OfflineQueueItem } from './offlineSync.service';
import { store } from '../store/store';
import { setPendingCount, syncCompleted, setIsSyncing } from '../store/slices/syncSlice';
import { setMediaUploaded, setMediaFailed } from '../store/slices/jobSlice';
import { DeliverableUploadService, DeliverableHttpError } from './deliverableUpload.service';

export interface UploadPhotoOfflinePayload {
  workOrderId: string;
  deliverableType: DeliverableType;
  localUri: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  objectKey?: string;
  stage?: 'LOCAL_PENDING' | 'S3_UPLOADED_PENDING_CONFIRMATION';
}

export interface TransitionOfflinePayload {
  workOrderId: string;
  nextStatus?: WorkOrderStatus | string;
  latitude?: number;
  longitude?: number;
  reason?: string;
  assignedTechnicianId?: string;
}

/**
 * Generate cryptographically secure UUID or collision-safe fallback.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Canonical helper for constructing TransitionWorkOrderDto payloads.
 * Strips undefined and null keys so the wire request matches @fieldforge/contracts.
 */
export function buildTransitionPayload(params: {
  nextStatus: WorkOrderStatus | string;
  latitude?: number;
  longitude?: number;
  reason?: string;
  assignedTechnicianId?: string;
}): TransitionWorkOrderDto {
  const body: TransitionWorkOrderDto = {
    nextStatus: params.nextStatus as WorkOrderStatus
  };
  if (params.latitude !== undefined && params.latitude !== null) {
    body.latitude = params.latitude;
  }
  if (params.longitude !== undefined && params.longitude !== null) {
    body.longitude = params.longitude;
  }
  if (params.reason !== undefined && params.reason !== null) {
    body.reason = params.reason;
  }
  if (params.assignedTechnicianId !== undefined && params.assignedTechnicianId !== null) {
    body.assignedTechnicianId = params.assignedTechnicianId;
  }
  return body;
}

/**
 * Mobile API Dispatcher that transmits mutations to the backend.
 * Carries x-idempotency-key to guarantee zero duplicate executions.
 */
export async function defaultMobileDispatcher(item: OfflineQueueItem): Promise<boolean> {
  const state = store.getState();
  const token = state.auth.accessToken;
  const isOnline = state.sync.isOnline;

  // If in simulated or real offline airplane mode, fail immediately so mutation stays queued
  if (!isOnline) {
    throw new Error('Device is offline (network unreachable)');
  }

  const gatewayUrl = 'http://localhost:8000/api/v1';

  try {
    switch (item.action) {
      case 'CHECK_IN': {
        const payload = item.payload as TransitionOfflinePayload;
        const endpoint = `${gatewayUrl}/work-orders/${payload.workOrderId}/transition`;
        const nextStatus = (payload.nextStatus as WorkOrderStatus) || WorkOrderStatus.ON_SITE;
        const body = buildTransitionPayload({
          nextStatus,
          latitude: payload.latitude,
          longitude: payload.longitude,
          reason: payload.reason,
          assignedTechnicianId: payload.assignedTechnicianId
        });
        return await dispatchJsonMutation(
          endpoint,
          body as unknown as Record<string, unknown>,
          item.idempotencyKey,
          token
        );
      }

      case 'UPLOAD_PHOTO': {
        const payload = item.payload as UploadPhotoOfflinePayload;

        // If objectKey already exists (S3 PUT succeeded earlier, but confirmation failed)
        // Attempt idempotent confirmation retry without re-uploading bytes (ISSUE-003A §19)
        if (payload.objectKey) {
          try {
            const confirmed = await DeliverableUploadService.confirmDeliverable(
              payload.workOrderId,
              {
                objectKey: payload.objectKey,
                deliverableType: payload.deliverableType,
                filename: payload.filename,
                mimeType: payload.mimeType,
                sizeBytes: payload.sizeBytes
              },
              token || undefined,
              gatewayUrl
            );

            const type =
              payload.deliverableType === DeliverableType.PHOTO_BEFORE ? 'BEFORE' : 'AFTER';
            store.dispatch(
              setMediaUploaded({
                type,
                deliverable: {
                  id: confirmed.id,
                  mediaUrl: confirmed.mediaUrl,
                  objectKey: confirmed.objectKey
                }
              })
            );

            await DeliverableUploadService.cleanupDurableFile(payload.localUri);
            return true;
          } catch (err) {
            if (err instanceof DeliverableHttpError) {
              if (err.statusCode === 404) {
                // Object not in S3, clear objectKey to trigger full re-upload
                delete payload.objectKey;
                payload.stage = 'LOCAL_PENDING';
              } else if (err.isPermanent) {
                const type =
                  payload.deliverableType === DeliverableType.PHOTO_BEFORE ? 'BEFORE' : 'AFTER';
                store.dispatch(setMediaFailed({ type, error: err.message }));
                item.error = err.message;
                item.retryCount = 5;
                return false;
              } else {
                throw err;
              }
            } else {
              throw err;
            }
          }
        }

        // Full upload flow: validate -> request fresh presign -> PUT to S3 -> confirm
        DeliverableUploadService.validateDeliverableFile({
          filename: payload.filename,
          mimeType: payload.mimeType,
          sizeBytes: payload.sizeBytes
        });

        // 1. Request fresh presigned URL (ISSUE-003A §14: never reuse stale/persisted presign URLs)
        const presign = await DeliverableUploadService.requestPresignedUrl(
          payload.workOrderId,
          {
            deliverableType: payload.deliverableType,
            filename: payload.filename,
            mimeType: payload.mimeType,
            sizeBytes: payload.sizeBytes
          },
          token || undefined,
          gatewayUrl
        );

        // 2. Direct client-to-S3 PUT with file bytes (zero FieldForge auth headers)
        await DeliverableUploadService.uploadBytesToS3(
          presign.uploadUrl,
          payload.localUri,
          payload.mimeType,
          presign.requiredHeaders
        );

        // Record objectKey on queue item so if subsequent confirmation drops, retry will confirm directly
        payload.objectKey = presign.objectKey;
        payload.stage = 'S3_UPLOADED_PENDING_CONFIRMATION';

        // 3. Backend HeadObject confirmation
        const confirmed = await DeliverableUploadService.confirmDeliverable(
          payload.workOrderId,
          {
            objectKey: presign.objectKey,
            deliverableType: payload.deliverableType,
            filename: payload.filename,
            mimeType: payload.mimeType,
            sizeBytes: payload.sizeBytes
          },
          token || undefined,
          gatewayUrl
        );

        const type = payload.deliverableType === DeliverableType.PHOTO_BEFORE ? 'BEFORE' : 'AFTER';
        store.dispatch(
          setMediaUploaded({
            type,
            deliverable: {
              id: confirmed.id,
              mediaUrl: confirmed.mediaUrl,
              objectKey: confirmed.objectKey
            }
          })
        );

        // Clean up temporary durable copy
        await DeliverableUploadService.cleanupDurableFile(payload.localUri);
        return true;
      }

      case 'CAPTURE_SIGNATURE': {
        const payload = item.payload as {
          workOrderId: string;
          signatureSvg: string;
          clientName: string;
        };
        const endpoint = `${gatewayUrl}/work-orders/${payload.workOrderId}/deliverables/signature`;
        const body = {
          signatureSvg: payload.signatureSvg,
          clientName: payload.clientName
        };
        return await dispatchJsonMutation(endpoint, body, item.idempotencyKey, token);
      }

      case 'COMPLETE_JOB': {
        const payload = item.payload as {
          workOrderId: string;
          nextStatus?: WorkOrderStatus | string;
          reason?: string;
        };
        const endpoint = `${gatewayUrl}/work-orders/${payload.workOrderId}/transition`;
        const nextStatus = (payload.nextStatus as WorkOrderStatus) || WorkOrderStatus.COMPLETED;
        const body = buildTransitionPayload({
          nextStatus,
          reason: payload.reason
        });
        return await dispatchJsonMutation(
          endpoint,
          body as unknown as Record<string, unknown>,
          item.idempotencyKey,
          token
        );
      }

      default:
        return false;
    }
  } catch (err) {
    if (err instanceof DeliverableHttpError && err.isPermanent) {
      item.error = err.message;
      item.retryCount = 5;
      return false;
    }
    throw err;
  }
}

export async function dispatchJsonMutation(
  endpoint: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
  token?: string | null
): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-idempotency-key': idempotencyKey
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok || response.status === 409) {
      return true;
    }

    let errDetail = `Dispatch failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson === 'object' && 'message' in errJson) {
        errDetail = Array.isArray(errJson.message)
          ? errJson.message.join('; ')
          : String(errJson.message);
      }
    } catch {
      // ignore json parse error
    }

    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403 ||
      response.status === 422
    ) {
      throw new DeliverableHttpError(response.status, errDetail, true);
    }
    throw new Error(errDetail);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Executes an immediate online transition against the API gateway.
 * Returns true if successful; throws DeliverableHttpError or Error on failure.
 */
export async function executeOnlineTransition(
  workOrderId: string,
  payload: TransitionWorkOrderDto,
  token?: string | null,
  gatewayUrl = 'http://localhost:8000/api/v1'
): Promise<boolean> {
  const endpoint = `${gatewayUrl}/work-orders/${workOrderId}/transition`;
  const idempotencyKey = `mob-online-${generateId()}`;
  return await dispatchJsonMutation(
    endpoint,
    payload as unknown as Record<string, unknown>,
    idempotencyKey,
    token
  );
}

export const syncServiceInstance = new OfflineSyncService(defaultMobileDispatcher);

// Wire syncServiceInstance to Redux store updates
syncServiceInstance.subscribe((queue) => {
  store.dispatch(setPendingCount(queue.length));
});

export async function triggerManualSync(): Promise<{ processed: number; failed: number }> {
  store.dispatch(setIsSyncing(true));
  try {
    const result = await syncServiceInstance.flushQueue();
    store.dispatch(syncCompleted());
    return result;
  } finally {
    store.dispatch(setIsSyncing(false));
  }
}
