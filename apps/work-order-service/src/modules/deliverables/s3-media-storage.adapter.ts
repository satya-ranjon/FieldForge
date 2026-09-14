import { Injectable, Optional, Inject } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { getExtensionFromMimeType } from '@fieldforge/contracts';
import type {
  MediaStoragePort,
  GeneratePresignedUploadUrlParams,
  PresignedUploadUrlResult,
  StorageObjectMetadata
} from './media-storage.port';

export const S3_CONFIG = Symbol('S3_CONFIG');

export interface S3StorageConfig {
  bucket?: string;
  region?: string;
  client?: S3Client;
}

@Injectable()
export class S3MediaStorageAdapter implements MediaStoragePort {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(@Optional() @Inject(S3_CONFIG) config?: S3StorageConfig) {
    this.region =
      config?.region ||
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      (process.env.NODE_ENV === 'test' ? 'us-east-1' : '');

    this.bucket =
      config?.bucket ||
      process.env.S3_DELIVERABLES_BUCKET ||
      (process.env.NODE_ENV === 'test' ? 'test-deliverables-bucket' : '');

    if (!this.region) {
      throw new Error(
        'AWS_REGION (or AWS_DEFAULT_REGION) environment variable is required for S3MediaStorageAdapter'
      );
    }

    if (!this.bucket) {
      throw new Error(
        'S3_DELIVERABLES_BUCKET environment variable is required for S3MediaStorageAdapter'
      );
    }

    this.s3Client =
      config?.client ||
      new S3Client({
        region: this.region
      });
  }

  getBucket(): string {
    return this.bucket;
  }

  getRegion(): string {
    return this.region;
  }

  async generatePresignedUploadUrl(
    params: GeneratePresignedUploadUrlParams
  ): Promise<PresignedUploadUrlResult> {
    const ext = getExtensionFromMimeType(params.mimeType) || 'jpg';
    const objectKey = `work-orders/${params.workOrderId}/deliverables/${params.type}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes
    });

    const expiresInSeconds = 900; // 15 minutes
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds
    });

    return {
      uploadUrl,
      objectKey,
      expiresInSeconds,
      requiredHeaders: {
        'Content-Type': params.mimeType
      }
    };
  }

  async generatePresignedDownloadUrl(objectKey: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds
    });
  }

  async headObject(objectKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey
        })
      );

      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType ?? '',
        eTag: response.ETag,
        lastModified: response.LastModified
      };
    } catch (err: unknown) {
      const error = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (
        error.name === 'NotFound' ||
        error.name === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      })
    );
  }
}
