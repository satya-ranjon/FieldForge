import type { BudgetType, WorkOrderStatus } from '../enums';

export interface CreateWorkOrderDto {
  buyerId: string;
  title: string;
  description: string;
  category: string;
  budgetType: BudgetType;
  budgetAmount: number;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
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
  budgetAmount: number;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverableDto {
  workOrderId: string;
  deliverableType: 'PHOTO_BEFORE' | 'PHOTO_AFTER' | 'CHECKLIST' | 'SIGNATURE';
  s3Url: string;
  signatureHash?: string;
}
