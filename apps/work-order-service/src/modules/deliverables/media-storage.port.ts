import type { DeliverableType } from '@fieldforge/contracts';

export interface PresignedUrlResult {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
}

export const MEDIA_STORAGE_PORT = Symbol('MEDIA_STORAGE_PORT');

export interface MediaStoragePort {
  generatePresignedUploadUrl(
    workOrderId: string,
    type: DeliverableType,
    filename: string
  ): Promise<PresignedUrlResult>;
  saveFile?(key: string, content: Buffer | string): Promise<string>;
}
