export interface EscrowFundedEvent {
  eventId: string;
  escrowId: string;
  workOrderId: string;
  buyerId: string;
  amount: number;
  fundedAt: string;
}

export interface PayoutDisbursedEvent {
  eventId: string;
  workOrderId: string;
  techId: string;
  amount: number;
  disbursedAt: string;
}
