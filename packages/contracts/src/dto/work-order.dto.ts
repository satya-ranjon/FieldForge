import type { BudgetType, DeliverableType, WorkOrderStatus } from '../enums';
import type { MinorUnits } from '../money';

/**
 * Work order creation request.
 *
 * There is no `buyerId`: the owning buyer is taken from the verified access
 * token. Accepting it from the request body would let any authenticated caller
 * create work orders billed to someone else.
 */
export interface CreateWorkOrderDto {
  title: string;
  description: string;
  category: string;
  budgetType: BudgetType;
  budgetAmountMinor: MinorUnits;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
}

/**
 * Requests a work order state change.
 *
 * `latitude`/`longitude` are required for the EN_ROUTE -> ON_SITE transition,
 * which the server geofences against the work order's stored coordinates
 * (docs/SRS.md FR-MOB-001). They are ignored for every other transition.
 */
export interface TransitionWorkOrderDto {
  nextStatus: WorkOrderStatus;
  latitude?: number;
  longitude?: number;
  reason?: string;
  assignedTechnicianId?: string;
}

export interface WorkOrderResponseDto {
  id: string;
  buyerId: string;
  assignedTechnicianId?: string | null;
  title: string;
  description: string;
  category: string;
  status: WorkOrderStatus;
  budgetType: BudgetType;
  budgetAmountMinor: MinorUnits;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Narrow work order context required by billing service for escrow authorization and payout.
 * Does not expose customer personal data, addresses, descriptions, or unrelated fields (RULE-ARCH-01).
 */
export interface WorkOrderBillingContextDto {
  id: string;
  buyerId: string;
  assignedTechnicianId: string | null;
  status: WorkOrderStatus;
}

export interface CreateDeliverableDto {
  workOrderId: string;
  deliverableType: DeliverableType;
  s3Url: string;
  signatureHash?: string;
}

export interface ListWorkOrdersQueryDto {
  status?: WorkOrderStatus;
  buyerId?: string;
  assignedTechnicianId?: string;
  scheduledStartTimeFrom?: string;
  scheduledStartTimeTo?: string;
  limit?: number;
  offset?: number;
}

export interface WorkOrderStatusHistoryDto {
  id: string;
  workOrderId: string;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  changedBy: string;
  reason?: string | null;
  createdAt: string;
}

export const MIME_TO_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'text/plain': 'txt'
};

export function getExtensionFromMimeType(mimeType: string): string | null {
  return MIME_TO_EXTENSION_MAP[mimeType.toLowerCase()] ?? null;
}

export function formatS3Uri(bucket: string, objectKey: string): string {
  return `s3://${bucket}/${objectKey}`;
}

export function parseS3Uri(uri: string): { bucket: string; key: string } | null {
  const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!match) return null;
  return { bucket: match[1], key: match[2] };
}

export interface GeneratePresignedUrlDto {
  deliverableType: DeliverableType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignedUrlResponseDto {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  requiredHeaders: {
    'Content-Type': string;
  };
}

export interface ConfirmDeliverableDto {
  objectKey: string;
  deliverableType: DeliverableType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignedDownloadUrlResponseDto {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface RecordSignatureDto {
  signatureSvg: string;
  clientName: string;
}

export interface DeliverableResponseDto {
  id: string;
  workOrderId: string;
  deliverableType: DeliverableType;
  mediaUrl: string;
  objectKey?: string | null;
  signatureHash?: string | null;
  clientName?: string | null;
  signedAt?: string | null;
  uploadedAt: string;
}
