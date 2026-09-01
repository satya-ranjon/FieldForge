import type { EscrowStatus } from '../enums';

export interface PreAuthEscrowDto {
  workOrderId: string;
  buyerId: string;
  amount: number;
  paymentMethodId: string;
}

export interface EscrowDetailsDto {
  id: string;
  workOrderId: string;
  amountLocked: number;
  status: EscrowStatus;
  createdAt: string;
  releasedAt?: string;
}
