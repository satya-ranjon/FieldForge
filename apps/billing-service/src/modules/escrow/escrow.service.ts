import { Injectable } from '@nestjs/common';
import type { MinorUnits } from '@fieldforge/contracts';
import { createEvent, EscrowStatus, EventType, formatMinor } from '@fieldforge/contracts';
import { randomUUID } from 'node:crypto';

@Injectable()
export class EscrowService {
  /**
   * Amounts are integer minor units end to end. The DECIMAL(10,2) column is
   * converted at the repository edge, once, rather than every service doing its
   * own float arithmetic. See packages/contracts/src/money.ts.
   */
  async lockFunds(
    workOrderId: string,
    buyerId: string,
    amountMinor: MinorUnits,
    correlationId: string
  ) {
    const escrowId = randomUUID();
    console.log(
      `[Escrow] holding ${formatMinor(amountMinor)} for work order ${workOrderId} (buyer ${buyerId})`
    );

    const event = createEvent(
      EventType.ESCROW_FUNDED,
      { escrowId, workOrderId, buyerId, amountMinor },
      correlationId
    );
    // Not published yet: billing has no broker connection until Phase 3 of
    // docs/DEVELOPMENT_PLAN.md.
    void event;

    return {
      escrowId,
      workOrderId,
      amountLockedMinor: amountMinor,
      status: EscrowStatus.HELD
    };
  }

  /**
   * DANGEROUS AS WRITTEN — docs/ISSUES.md (C3). This releases funds without
   * checking approval, escrow state, the amount, or the caller's authority, and
   * persists nothing. Phase 4 of docs/DEVELOPMENT_PLAN.md rewrites it as a
   * single locked transaction; do not build on it before then.
   */
  async releaseFunds(workOrderId: string, techId: string, amountMinor: MinorUnits) {
    console.log(
      `[Payout] releasing ${formatMinor(amountMinor)} to technician ${techId} for work order ${workOrderId}`
    );
    return {
      workOrderId,
      techId,
      disbursedAmountMinor: amountMinor,
      status: EscrowStatus.RELEASED
    };
  }
}
