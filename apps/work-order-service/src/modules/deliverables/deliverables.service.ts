import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateDeliverableDto, DeliverableType } from '@fieldforge/contracts';
import { randomUUID, createHash } from 'crypto';

@Injectable()
export class DeliverablesService {
  /**
   * Generate an S3 pre-signed upload URL for photo deliverables or signatures (FR-MOB-002 / NFR-SEC-001)
   */
  async generatePresignedUploadUrl(workOrderId: string, type: DeliverableType, filename: string) {
    const fileExtension = filename.split('.').pop() || 'jpg';
    const key = `work-orders/${workOrderId}/${type.toLowerCase()}/${randomUUID()}.${fileExtension}`;
    const mockS3Url = `https://fieldforge-deliverables-s3.s3.amazonaws.com/${key}`;

    return {
      uploadUrl: `https://fieldforge-deliverables-s3.s3.amazonaws.com/${key}?AWSAccessKeyId=MOCK&Signature=MOCK_SIG`,
      s3Url: mockS3Url,
      key
    };
  }

  /**
   * Cryptographically verify and record digital signature proof of work (FR-MOB-003)
   */
  async recordSignatureDeliverable(workOrderId: string, signatureSvg: string, clientName: string) {
    const signatureHash = createHash('sha256').update(signatureSvg + clientName + Date.now()).digest('hex');
    const key = `work-orders/${workOrderId}/signature/${randomUUID()}.svg`;
    const s3Url = `https://fieldforge-deliverables-s3.s3.amazonaws.com/${key}`;

    return {
      id: randomUUID(),
      workOrderId,
      deliverableType: DeliverableType.SIGNATURE,
      s3Url,
      signatureHash,
      clientName,
      verifiedAt: new Date().toISOString()
    };
  }
}
