import { Injectable } from '@nestjs/common';
import type { EscrowFundedEvent } from '@fieldforge/contracts';
import { EscrowStatus } from '@fieldforge/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class EscrowService {
  async lockFunds(workOrderId: string, buyerId: string, amount: number) {
    const escrowId = randomUUID();
    console.log(`💳 [Stripe PreAuth / Escrow] Holding $${amount} for Work Order ${workOrderId}`);

    const event: EscrowFundedEvent = {
      eventId: randomUUID(),
      escrowId,
      workOrderId,
      buyerId,
      amount,
      fundedAt: new Date().toISOString()
    };
    void event; // Event publication is intentionally not implemented in the scaffold.

    return {
      escrowId,
      workOrderId,
      amountLocked: amount,
      status: EscrowStatus.HELD
    };
  }

  async releaseFunds(workOrderId: string, techId: string, amount: number) {
    console.log(`💰 [Payout Disbursement] Releasing $${amount} from escrow to Tech ${techId}`);
    return {
      workOrderId,
      techId,
      disbursedAmount: amount,
      status: EscrowStatus.RELEASED
    };
  }
}
