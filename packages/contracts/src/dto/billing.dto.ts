import type { EscrowStatus } from '../enums';
import type { MinorUnits } from '../money';

/**
 * Escrow pre-authorization request. The funding buyer comes from the verified
 * access token, never from the body — see CreateWorkOrderDto.
 */
export interface PreAuthEscrowDto {
  workOrderId: string;
  amountMinor: MinorUnits;
  paymentMethodId: string;
}

export interface EscrowDetailsDto {
  id: string;
  workOrderId: string;
  amountLockedMinor: MinorUnits;
  status: EscrowStatus;
  createdAt: string;
  releasedAt?: string;
}

export interface ReleaseEscrowDto {
  workOrderId: string;
  payoutAmountMinor?: MinorUnits;
}

export interface InvoiceDetailsDto {
  id: string;
  workOrderId: string;
  buyerId: string;
  invoiceNumber: string;
  amountMinor: MinorUnits;
  contentHash: string;
  issuedAt: string;
  createdAt: string;
}

export interface PayoutLedgerItemDto {
  id: string;
  technicianId: string;
  workOrderId: string;
  amountMinor: MinorUnits;
  type: 'CREDIT' | 'DEBIT';
  description?: string | null;
  createdAt: string;
}

export interface TechnicianEarningsDto {
  technicianId: string;
  totalEarningsMinor: MinorUnits;
  payouts: PayoutLedgerItemDto[];
}
