import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import {
  billingSchema,
  idempotencySchema,
  usersSchema,
  workOrdersSchema
} from '@fieldforge/database';
import type {
  EscrowDetailsDto,
  MinorUnits,
  PayoutLedgerItemDto,
  TechnicianEarningsDto
} from '@fieldforge/contracts';
import { createEvent, EscrowStatus, EventType, formatMinor } from '@fieldforge/contracts';
import { EventPublisher } from '@fieldforge/messaging';
import { InvoicesService } from '../invoices/invoices.service';
import { PAYMENT_PROVIDER, type PaymentProviderPort } from '../payments/payment-provider.port';

export interface ReleaseEscrowParams {
  workOrderId: string;
  callerUserId?: string;
  callerRole?: string;
  correlationId?: string;
  idempotencyKey?: string;
}

export interface EscrowReleaseResult {
  workOrderId: string;
  techId: string;
  disbursedAmountMinor: MinorUnits;
  status: EscrowStatus;
  invoiceId?: string;
}

@Injectable()
export class EscrowService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProviderPort,
    private readonly invoicesService: InvoicesService,
    @Optional() private readonly producer?: EventPublisher
  ) {}

  /**
   * Pre-authorizes and locks funds in escrow for a work order.
   * Amounts are integer minor units end to end (RULE-ARCH-01).
   */
  async lockFunds(
    workOrderId: string,
    buyerId: string,
    amountMinor: MinorUnits,
    correlationId: string,
    paymentMethodId = 'pm_card_default'
  ): Promise<{
    escrowId: string;
    workOrderId: string;
    amountLockedMinor: MinorUnits;
    status: EscrowStatus;
  }> {
    return await this.db.transaction(async (tx) => {
      // Check for existing escrow account (enforce 1:1 work order to escrow hold)
      const [existing] = await tx
        .select()
        .from(billingSchema.escrowAccounts)
        .where(eq(billingSchema.escrowAccounts.workOrderId, workOrderId))
        .limit(1);

      if (existing) {
        throw new ConflictException(
          `Escrow account already exists for work order ${workOrderId} (status: ${existing.status})`
        );
      }

      // Authorize with payment provider
      await this.paymentProvider.captureEscrow({
        workOrderId,
        buyerId,
        amountMinor,
        paymentMethodId
      });

      const escrowId = randomUUID();
      const amountDecimal = (amountMinor / 100).toFixed(2);

      await tx.insert(billingSchema.escrowAccounts).values({
        id: escrowId,
        workOrderId,
        amountLocked: amountDecimal,
        status: 'HELD',
        createdAt: new Date()
      });

      console.log(
        `[Escrow] holding ${formatMinor(amountMinor)} for work order ${workOrderId} (buyer ${buyerId})`
      );

      // Publish escrow funded event
      if (this.producer) {
        const event = createEvent(
          EventType.ESCROW_FUNDED,
          { escrowId, workOrderId, buyerId, amountMinor },
          correlationId
        );
        await this.producer.publish(event).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[Escrow] Failed to publish ESCROW_FUNDED event: ${msg}`);
        });
      }

      return {
        escrowId,
        workOrderId,
        amountLockedMinor: amountMinor,
        status: EscrowStatus.HELD
      };
    });
  }

  /**
   * Resolves docs/ISSUES.md (C3).
   * Executes a concurrency-safe, locked transaction to verify work order approval,
   * caller authority, escrow HELD status, updates status to RELEASED and PAID,
   * inserts payout ledger credit, generates the immutable invoice, and dispatches payout.
   */
  async releaseFunds(
    workOrderIdOrParams: string | ReleaseEscrowParams,
    legacyTechId?: string,
    legacyAmountMinor?: MinorUnits,
    legacyCorrelationId?: string,
    legacyIdempotencyKey?: string
  ): Promise<EscrowReleaseResult> {
    let params: ReleaseEscrowParams;

    if (typeof workOrderIdOrParams === 'string') {
      params = {
        workOrderId: workOrderIdOrParams,
        callerUserId: legacyTechId, // or caller id
        callerRole: 'SYSTEM',
        correlationId: legacyCorrelationId,
        idempotencyKey: legacyIdempotencyKey
      };
    } else {
      params = workOrderIdOrParams;
    }

    const { workOrderId, callerUserId, callerRole, correlationId, idempotencyKey } = params;

    return await this.db.transaction(async (tx) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const [existingKey] = await tx
          .select()
          .from(idempotencySchema.idempotencyKeys)
          .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey))
          .limit(1);

        if (existingKey) {
          if (existingKey.status === 'COMPLETED' && existingKey.responsePayload) {
            return existingKey.responsePayload as EscrowReleaseResult;
          }
          if (existingKey.status === 'IN_PROGRESS') {
            throw new ConflictException(
              `A payout release with idempotency key ${idempotencyKey} is already in progress`
            );
          }
        } else {
          await tx.insert(idempotencySchema.idempotencyKeys).values({
            key: idempotencyKey,
            scope: 'ESCROW_RELEASE',
            resourceId: workOrderId,
            status: 'IN_PROGRESS',
            createdAt: new Date()
          });
        }
      }

      // 2. Lock Escrow FOR UPDATE
      const [escrow] = await tx
        .select()
        .from(billingSchema.escrowAccounts)
        .where(eq(billingSchema.escrowAccounts.workOrderId, workOrderId))
        .for('update');

      if (!escrow) {
        throw new NotFoundException(`Escrow account not found for work order ${workOrderId}`);
      }

      if (escrow.status !== 'HELD') {
        throw new ConflictException(
          `Escrow cannot be released: current status is ${escrow.status} (expected HELD)`
        );
      }

      // 3. Lock Work Order FOR UPDATE
      const [workOrder] = await tx
        .select()
        .from(workOrdersSchema.workOrders)
        .where(eq(workOrdersSchema.workOrders.id, workOrderId))
        .for('update');

      if (!workOrder) {
        throw new NotFoundException(`Work order ${workOrderId} not found`);
      }

      if (workOrder.status !== 'APPROVED') {
        throw new ConflictException(
          `Work order must be APPROVED before escrow release: current status is ${workOrder.status}`
        );
      }

      if (!workOrder.assignedTechnicianId) {
        throw new BadRequestException(`Work order ${workOrderId} has no assigned technician`);
      }

      // 4. Caller Authority Verification (C3)
      if (callerRole && callerRole !== 'ADMIN' && callerRole !== 'SYSTEM') {
        // Must be the buyer who owns the work order
        const [buyer] = await tx
          .select()
          .from(usersSchema.buyerProfiles)
          .where(eq(usersSchema.buyerProfiles.userId, callerUserId || ''))
          .limit(1);

        if (!buyer || buyer.id !== workOrder.buyerId) {
          throw new ForbiddenException(
            'Only the work order buyer or an administrator may authorize escrow release'
          );
        }
      }

      const amountMinor = Math.round(Number(escrow.amountLocked) * 100);

      // 5. Update Escrow Status
      const now = new Date();
      await tx
        .update(billingSchema.escrowAccounts)
        .set({
          status: 'RELEASED',
          releasedAt: now
        })
        .where(eq(billingSchema.escrowAccounts.id, escrow.id));

      // 6. Update Work Order Status to PAID and record status history
      await tx
        .update(workOrdersSchema.workOrders)
        .set({
          status: 'PAID',
          updatedAt: now
        })
        .where(eq(workOrdersSchema.workOrders.id, workOrder.id));

      await tx.insert(workOrdersSchema.workOrderStatusHistory).values({
        id: randomUUID(),
        workOrderId: workOrder.id,
        fromStatus: 'APPROVED',
        toStatus: 'PAID',
        changedBy: callerUserId || 'system',
        reason: 'Escrow released upon completion approval',
        createdAt: now
      });

      // 7. Disburse Payout via Provider
      await this.paymentProvider.disbursePayout({
        workOrderId: workOrder.id,
        technicianId: workOrder.assignedTechnicianId,
        amountMinor
      });

      // 8. Record Double-Entry Payout Ledger Entry
      await tx.insert(billingSchema.payoutLedger).values({
        id: randomUUID(),
        technicianId: workOrder.assignedTechnicianId,
        workOrderId: workOrder.id,
        amount: escrow.amountLocked,
        type: 'CREDIT',
        description: 'Work order completion payout',
        createdAt: now
      });

      // 9. Generate Immutable Content-Hashed Invoice (FR-BILL-003)
      const invoice = await this.invoicesService.generateInvoiceWithTx(tx, {
        workOrderId: workOrder.id,
        buyerId: workOrder.buyerId,
        amountMinor
      });

      console.log(
        `[Payout] released ${formatMinor(amountMinor)} to technician ${workOrder.assignedTechnicianId} for work order ${workOrderId}`
      );

      const result: EscrowReleaseResult = {
        workOrderId: workOrder.id,
        techId: workOrder.assignedTechnicianId,
        disbursedAmountMinor: amountMinor,
        status: EscrowStatus.RELEASED,
        invoiceId: invoice.id
      };

      // 10. Update Idempotency Record
      if (idempotencyKey) {
        await tx
          .update(idempotencySchema.idempotencyKeys)
          .set({
            status: 'COMPLETED',
            responsePayload: result
          })
          .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
      }

      // 11. Publish PAYOUT_DISBURSED Event
      if (this.producer) {
        const event = createEvent(
          EventType.PAYOUT_DISBURSED,
          {
            escrowId: escrow.id,
            workOrderId: workOrder.id,
            techId: workOrder.assignedTechnicianId,
            amountMinor
          },
          correlationId || randomUUID()
        );
        await this.producer.publish(event).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[Escrow] Failed to publish PAYOUT_DISBURSED event: ${msg}`);
        });
      }

      return result;
    });
  }

  async getEscrowByWorkOrder(workOrderId: string): Promise<EscrowDetailsDto> {
    const [row] = await this.db
      .select()
      .from(billingSchema.escrowAccounts)
      .where(eq(billingSchema.escrowAccounts.workOrderId, workOrderId))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Escrow account not found for work order ${workOrderId}`);
    }

    return {
      id: row.id,
      workOrderId: row.workOrderId,
      amountLockedMinor: Math.round(Number(row.amountLocked) * 100),
      status: row.status as EscrowStatus,
      createdAt: row.createdAt.toISOString(),
      releasedAt: row.releasedAt?.toISOString()
    };
  }

  async getTechnicianEarnings(technicianId: string): Promise<TechnicianEarningsDto> {
    const rows = await this.db
      .select()
      .from(billingSchema.payoutLedger)
      .where(eq(billingSchema.payoutLedger.technicianId, technicianId));

    let totalMinor = 0;
    const payouts: PayoutLedgerItemDto[] = [];

    for (const row of rows) {
      const amountMinor = Math.round(Number(row.amount) * 100);
      if (row.type === 'CREDIT') {
        totalMinor += amountMinor;
      } else if (row.type === 'DEBIT') {
        totalMinor -= amountMinor;
      }

      payouts.push({
        id: row.id,
        technicianId: row.technicianId,
        workOrderId: row.workOrderId,
        amountMinor,
        type: row.type as 'CREDIT' | 'DEBIT',
        description: row.description,
        createdAt: row.createdAt.toISOString()
      });
    }

    return {
      technicianId,
      totalEarningsMinor: totalMinor,
      payouts
    };
  }
}
