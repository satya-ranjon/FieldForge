import type { DeliverableType } from '@fieldforge/contracts';

export interface GeneratePresignedUploadUrlParams {
  workOrderId: string;
  type: DeliverableType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  requiredHeaders: {
    'Content-Type': string;
  };
}

export interface StorageObjectMetadata {
  contentLength: number;
  contentType: string;
  eTag?: string;
  lastModified?: Date;
}

export const MEDIA_STORAGE_PORT = Symbol('MEDIA_STORAGE_PORT');

export interface MediaStoragePort {
  generatePresignedUploadUrl(
    params: GeneratePresignedUploadUrlParams
  ): Promise<PresignedUploadUrlResult>;

  generatePresignedDownloadUrl(objectKey: string, expiresInSeconds?: number): Promise<string>;

  headObject(objectKey: string): Promise<StorageObjectMetadata | null>;

  deleteObject?(objectKey: string): Promise<void>;

  getBucket?(): string;

  saveFile?(key: string, content: Buffer | string): Promise<string>;
}
