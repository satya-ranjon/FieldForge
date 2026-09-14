import * as FileSystem from 'expo-file-system';
import {
  DeliverableType,
  DeliverableResponseDto,
  PresignedUrlResponseDto,
  ALLOWED_DELIVERABLE_MIME_TYPES,
  MAX_DELIVERABLE_SIZE_BYTES
} from '@fieldforge/contracts';

export interface LocalFileMetadata {
  uri: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  deliverableType: DeliverableType;
}

export class DeliverableValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeliverableValidationError';
  }
}

export class DeliverableHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isPermanent: boolean = false
  ) {
    super(message);
    this.name = 'DeliverableHttpError';
  }
}

export class DeliverableUploadService {
  private static defaultGatewayUrl = 'http://localhost:8000/api/v1';

  /**
   * Validate deliverable file against canonical contract limits.
   * Max 15 MiB, valid mime type, positive byte size.
   */
  static validateDeliverableFile(file: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    uri?: string;
  }): void {
    if (!file.filename || !file.filename.trim()) {
      throw new DeliverableValidationError('Deliverable filename cannot be empty');
    }

    if (!file.sizeBytes || file.sizeBytes <= 0) {
      throw new DeliverableValidationError('Deliverable file size must be greater than 0 bytes');
    }

    if (file.sizeBytes > MAX_DELIVERABLE_SIZE_BYTES) {
      throw new DeliverableValidationError(
        `Deliverable exceeds maximum allowed size of ${MAX_DELIVERABLE_SIZE_BYTES / (1024 * 1024)} MiB (actual: ${(file.sizeBytes / (1024 * 1024)).toFixed(2)} MiB)`
      );
    }

    const isAllowedMime = (ALLOWED_DELIVERABLE_MIME_TYPES as readonly string[]).includes(
      file.mimeType.toLowerCase()
    );
    if (!isAllowedMime) {
      throw new DeliverableValidationError(
        `Unsupported MIME type: ${file.mimeType}. Allowed: ${ALLOWED_DELIVERABLE_MIME_TYPES.join(', ')}`
      );
    }
  }

  /**
   * Request S3 presigned PUT URL from backend via API Gateway.
   */
  static async requestPresignedUrl(
    workOrderId: string,
    params: {
      deliverableType: DeliverableType;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    },
    token?: string,
    gatewayUrl = this.defaultGatewayUrl
  ): Promise<PresignedUrlResponseDto> {
    const endpoint = `${gatewayUrl}/work-orders/${workOrderId}/deliverables/presigned-url`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deliverableType: params.deliverableType,
        filename: params.filename,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes
      })
    });

    if (!response.ok) {
      const isPermanent =
        response.status === 401 ||
        response.status === 403 ||
        response.status === 400 ||
        response.status === 422;
      let errorText = `Presign request failed with HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.message) {
          errorText = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
        }
      } catch {
        // ignore parse error
      }
      throw new DeliverableHttpError(response.status, errorText, isPermanent);
    }

    return (await response.json()) as PresignedUrlResponseDto;
  }

  /**
   * PUT actual file bytes directly to Amazon S3 via presigned URL.
   *
   * CRITICAL SECURITY RULE:
   * S3 PUT must NEVER contain FieldForge authorization tokens, cookies,
   * x-ff-* headers, or AWS credentials.
   * Only send signed headers (specifically Content-Type).
   */
  static async uploadBytesToS3(
    uploadUrl: string,
    localUri: string,
    mimeType: string,
    requiredHeaders?: Record<string, string>
  ): Promise<void> {
    // 1. Read local file bytes as a Blob
    const fileRes = await fetch(localUri);
    if (!fileRes.ok) {
      throw new Error(`Failed to read local file bytes from: ${localUri}`);
    }
    const blob = await fileRes.blob();

    // 2. Construct clean S3 request headers without any FieldForge auth
    const s3Headers: Record<string, string> = {
      'Content-Type': requiredHeaders?.['Content-Type'] || mimeType
    };

    // 3. Direct client-to-S3 PUT
    const s3Res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: s3Headers,
      body: blob
    });

    if (!s3Res.ok) {
      throw new Error(
        `Amazon S3 upload failed with HTTP ${s3Res.status} (${s3Res.statusText || 'Upload error'})`
      );
    }
  }

  /**
   * Confirm deliverable with backend work-order-service after successful S3 PUT.
   * Backend executes HeadObject verification on S3 and records the DB entity.
   */
  static async confirmDeliverable(
    workOrderId: string,
    params: {
      objectKey: string;
      deliverableType: DeliverableType;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    },
    token?: string,
    gatewayUrl = this.defaultGatewayUrl
  ): Promise<DeliverableResponseDto> {
    const endpoint = `${gatewayUrl}/work-orders/${workOrderId}/deliverables`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        objectKey: params.objectKey,
        deliverableType: params.deliverableType,
        filename: params.filename,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes
      })
    });

    if (!response.ok) {
      const isPermanent =
        response.status === 401 || response.status === 403 || response.status === 422;
      let errorText = `Deliverable confirmation failed with HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.message) {
          errorText = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
        }
      } catch {
        // ignore parse error
      }
      throw new DeliverableHttpError(response.status, errorText, isPermanent);
    }

    return (await response.json()) as DeliverableResponseDto;
  }

  /**
   * Orchestrate full online deliverable upload flow:
   * validate -> presign -> PUT to S3 -> confirm -> return authoritative deliverable.
   */
  static async executeOnlineUpload(
    workOrderId: string,
    file: LocalFileMetadata,
    token?: string,
    gatewayUrl = this.defaultGatewayUrl
  ): Promise<DeliverableResponseDto> {
    // 1. Client-side contract validation
    this.validateDeliverableFile(file);

    // 2. Request presigned PUT URL
    const presign = await this.requestPresignedUrl(
      workOrderId,
      {
        deliverableType: file.deliverableType,
        filename: file.filename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes
      },
      token,
      gatewayUrl
    );

    // 3. Direct S3 upload (zero FieldForge auth headers)
    await this.uploadBytesToS3(presign.uploadUrl, file.uri, file.mimeType, presign.requiredHeaders);

    // 4. Authoritative backend confirmation (S3 HeadObject verification)
    const confirmed = await this.confirmDeliverable(
      workOrderId,
      {
        objectKey: presign.objectKey,
        deliverableType: file.deliverableType,
        filename: file.filename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes
      },
      token,
      gatewayUrl
    );

    return confirmed;
  }

  /**
   * Copies file to persistent app document storage for durable offline queueing.
   * Avoids data loss if OS purges cache/temporary directory before reconnection.
   */
  static async saveToDurableStorage(localUri: string, filename: string): Promise<string> {
    try {
      if (FileSystem?.documentDirectory) {
        const dir = `${FileSystem.documentDirectory}fieldforge_deliverables/`;
        // Ensure destination directory exists
        try {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        } catch {
          // directory may already exist
        }
        const durablePath = `${dir}${Date.now()}_${filename}`;
        await FileSystem.copyAsync({ from: localUri, to: durablePath });
        return durablePath;
      }
    } catch {
      // Fallback to original localUri if copy fails or in lightweight environments
    }
    return localUri;
  }

  /**
   * Safely deletes local copy created for offline queue after confirmed upload.
   * Never deletes files outside the app's fieldforge_deliverables directory.
   */
  static async cleanupDurableFile(durableUri: string): Promise<void> {
    try {
      if (FileSystem?.deleteAsync && durableUri && durableUri.includes('fieldforge_deliverables')) {
        await FileSystem.deleteAsync(durableUri, { idempotent: true });
      }
    } catch {
      // Suppress deletion cleanup errors
    }
  }
}
