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
