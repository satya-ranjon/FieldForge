import { Injectable } from '@nestjs/common';
import type { DeliverableType } from '@fieldforge/contracts';
import { randomUUID } from 'node:crypto';
import type { MediaStoragePort, PresignedUrlResult } from './media-storage.port';

@Injectable()
export class LocalDiskMediaStorageAdapter implements MediaStoragePort {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.MEDIA_BASE_URL || 'http://localhost:8002/uploads';
  }

  async generatePresignedUploadUrl(
    workOrderId: string,
    type: DeliverableType,
    filename: string
  ): Promise<PresignedUrlResult> {
    const cleanExt = (filename.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const key = `work-orders/${workOrderId}/${type.toLowerCase()}/${randomUUID()}.${cleanExt}`;
    const uploadUrl = `${this.baseUrl}/${key}?token=local_upload_${randomUUID()}`;
    const mediaUrl = `${this.baseUrl}/${key}`;

    return {
      uploadUrl,
      mediaUrl,
      key
    };
  }
}
