import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { getExtensionFromMimeType } from '@fieldforge/contracts';
import type {
  MediaStoragePort,
  GeneratePresignedUploadUrlParams,
  PresignedUploadUrlResult,
  StorageObjectMetadata
} from './media-storage.port';

@Injectable()
export class LocalDiskMediaStorageAdapter implements MediaStoragePort {
  private readonly baseUrl: string;
  private readonly simulatedStorage = new Map<string, StorageObjectMetadata>();

  constructor() {
    this.baseUrl = process.env.MEDIA_BASE_URL || 'http://localhost:8002/uploads';
  }

  getBucket(): string {
    return 'local-disk-bucket';
  }

  async generatePresignedUploadUrl(
    params: GeneratePresignedUploadUrlParams
  ): Promise<PresignedUploadUrlResult> {
    const ext = getExtensionFromMimeType(params.mimeType) || 'jpg';
    const objectKey = `work-orders/${params.workOrderId}/deliverables/${params.type}/${randomUUID()}.${ext}`;
    const uploadUrl = `${this.baseUrl}/${objectKey}?token=local_upload_${randomUUID()}`;

    // Pre-populate simulated storage metadata so test flows can verify headObject
    this.simulatedStorage.set(objectKey, {
      contentLength: params.sizeBytes,
      contentType: params.mimeType,
      lastModified: new Date()
    });

    return {
      uploadUrl,
      objectKey,
      expiresInSeconds: 900,
      requiredHeaders: {
        'Content-Type': params.mimeType
      }
    };
  }

  async generatePresignedDownloadUrl(objectKey: string, expiresInSeconds = 900): Promise<string> {
    return `${this.baseUrl}/${objectKey}?expires=${expiresInSeconds}`;
  }

  async headObject(objectKey: string): Promise<StorageObjectMetadata | null> {
    const metadata = this.simulatedStorage.get(objectKey);
    return metadata ?? null;
  }

  async deleteObject(objectKey: string): Promise<void> {
    this.simulatedStorage.delete(objectKey);
  }

  // Test helper to manually set object metadata for simulating edge cases
  setSimulatedObject(objectKey: string, metadata: StorageObjectMetadata | null): void {
    if (metadata) {
      this.simulatedStorage.set(objectKey, metadata);
    } else {
      this.simulatedStorage.delete(objectKey);
    }
  }
}
