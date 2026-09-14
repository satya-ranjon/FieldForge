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
import {
  DRIZZLE,
  type DrizzleClient,
  createLogger,
  metricsRegistry,
  ProfileDirectoryService,
  insertOutboxEvent
} from '@fieldforge/common';
import { billingSchema, idempotencySchema, billingOutboxEvents } from '@fieldforge/database';
import type {
  EscrowDetailsDto,
  MinorUnits,
  PayoutLedgerItemDto,
  TechnicianEarningsDto,
  EventEnvelope
} from '@fieldforge/contracts';
import {
  createEvent,
  EscrowStatus,
  EventType,
  formatMinor,
  minorToDecimalString,
  decimalStringToMinor
} from '@fieldforge/contracts';
import { EventPublisher } from '@fieldforge/messaging';
import { BillingOutboxRelay } from '../../events/billing-outbox.relay';
import { InvoicesService } from '../invoices/invoices.service';
import { PAYMENT_PROVIDER, type PaymentProviderPort } from '../payments/payment-provider.port';
import { WorkOrderDirectoryService } from '../work-orders/work-order-directory.service';

export interface ReleaseEscrowParams {
  workOrderId: string;
  callerUserId?: string;
  callerRole?: string;
  correlationId?: string;
  idempotencyKey?: string;
  callerProfileId?: string;
  amountMinor?: MinorUnits;
  technicianId?: string;
  buyerId?: string;
}

export interface EscrowReleaseResult {
  workOrderId: string;
  technicianId: string;
  disbursedAmountMinor: MinorUnits;
  status: EscrowStatus;
  invoiceId?: string;
}

export interface RefundEscrowParams {
  workOrderId: string;
  buyerId?: string;
  reason?: string;
  correlationId?: string;
  idempotencyKey?: string;
}

export interface EscrowRefundResult {
  escrowId: string;
  workOrderId: string;
  refundedAmountMinor: MinorUnits;
  status: EscrowStatus;
}

@Injectable()
export class EscrowService {
  private readonly logger = createLogger('billing-escrow');
  private readonly workOrderDirectory: WorkOrderDirectoryService;
  private readonly profileDirectory: ProfileDirectoryService;

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProviderPort,
    private readonly invoicesService: InvoicesService,
    @Optional() private readonly producer?: EventPublisher,
    @Optional() workOrderDirectory?: WorkOrderDirectoryService,
    @Optional() profileDirectory?: ProfileDirectoryService,
    @Optional() private readonly outboxRelay?: BillingOutboxRelay
  ) {
    this.workOrderDirectory = workOrderDirectory || new WorkOrderDirectoryService();
    this.profileDirectory = profileDirectory || new ProfileDirectoryService();
  }

  getWorkOrderDirectory(): WorkOrderDirectoryService {
    return this.workOrderDirectory;
  }

  getProfileDirectory(): ProfileDirectoryService {
    return this.profileDirectory;
  }

  /**
   * Pre-authorizes and locks funds in escrow for a work order.
   * Amounts are integer minor units end to end (RULE-ARCH-01).
   */
  async lockFunds(
    workOrderId: string,
    buyerId: string,
    amountMinor: MinorUnits,
    correlationId: string,
    paymentMethodId = 'pm_card_default',
    idempotencyKey?: string
  ): Promise<{
    escrowId: string;
    workOrderId: string;
    amountLockedMinor: MinorUnits;
    status: EscrowStatus;
  }> {
    const providerIdempotencyKey = idempotencyKey
      ? idempotencyKey.startsWith('escrow-capture:')
        ? idempotencyKey
        : `escrow-capture:${idempotencyKey}`
      : `escrow-capture:${workOrderId}`;

    let fundedEvent: EventEnvelope<unknown> | undefined;
    const result = await this.db.transaction(async (tx) => {
      // 1. Idempotency Check if key provided
      if (idempotencyKey) {
        const [existingKey] = await tx
          .select()
          .from(idempotencySchema.idempotencyKeys)
          .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey))
          .limit(1);

        if (existingKey) {
          if (existingKey.status === 'COMPLETED' && existingKey.responsePayload) {
            return existingKey.responsePayload as {
              escrowId: string;
              workOrderId: string;
              amountLockedMinor: MinorUnits;
              status: EscrowStatus;
            };
          }
          if (existingKey.status === 'IN_PROGRESS') {
            throw new ConflictException(
              `An escrow lock operation with idempotency key ${idempotencyKey} is already in progress`
            );
          }
        } else {
          await tx.insert(idempotencySchema.idempotencyKeys).values({
            key: idempotencyKey,
            scope: 'ESCROW_CAPTURE',
            resourceId: workOrderId,
            status: 'IN_PROGRESS'
          });
        }
      }

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
        paymentMethodId,
        idempotencyKey: providerIdempotencyKey
      });

      const escrowId = randomUUID();
      const amountDecimal = minorToDecimalString(amountMinor);

      await tx.insert(billingSchema.escrowAccounts).values({
        id: escrowId,
        workOrderId,
        amountLocked: amountDecimal,
        status: 'HELD',
        createdAt: new Date()
      });

      this.logger.info(
        `[Escrow] holding ${formatMinor(amountMinor)} for work order ${workOrderId} (buyer ${buyerId})`
      );

      const result = {
        escrowId,
        workOrderId,
        amountLockedMinor: amountMinor,
        status: EscrowStatus.HELD
      };

      if (idempotencyKey) {
        await tx
          .update(idempotencySchema.idempotencyKeys)
          .set({
            status: 'COMPLETED',
            responsePayload: result
          })
          .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
      }

      // Record escrow funded event in outbox inside business transaction
      const event = createEvent(
        EventType.ESCROW_FUNDED,
        { escrowId, workOrderId, buyerId, amountMinor },
        correlationId
      );

      await insertOutboxEvent(tx, billingOutboxEvents, {
        event,
        aggregateType: 'escrow',
        aggregateId: escrowId
      });
      fundedEvent = event;

      return result;
    });

    if (this.outboxRelay) {
      this.outboxRelay.trigger();
    } else if (this.producer && fundedEvent) {
      await this.producer.publish(fundedEvent).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[Escrow] Failed to publish ESCROW_FUNDED event: ${msg}`);
      });
    }

    return result;
  }

  /**
   * Resolves docs/ISSUES.md (C3).
   * Executes a concurrency-safe, locked transaction to verify work order approval,
   * caller authority, escrow HELD status, updates status to RELEASED and PAID,
   * inserts payout ledger credit, generates the immutable invoice, and dispatches payout.
   */
  async releaseFunds(
    workOrderIdOrParams: string | ReleaseEscrowParams,
    callerUserIdOrTechnicianId?: string,
    legacyAmountMinor?: MinorUnits,
    legacyCorrelationId?: string,
    legacyIdempotencyKey?: string,
    legacyBuyerId?: string
  ): Promise<EscrowReleaseResult> {
    let params: ReleaseEscrowParams;

    if (typeof workOrderIdOrParams === 'string') {
      params = {
        workOrderId: workOrderIdOrParams,
        callerUserId: callerUserIdOrTechnicianId,
        technicianId: callerUserIdOrTechnicianId,
        buyerId: legacyBuyerId,
        callerRole: 'SYSTEM',
        amountMinor: legacyAmountMinor,
        correlationId: legacyCorrelationId,
        idempotencyKey: legacyIdempotencyKey
      };
    } else {
      params = workOrderIdOrParams;
    }

    const {
      workOrderId,
      callerUserId,
      callerRole,
      correlationId,
      idempotencyKey,
      callerProfileId,
      amountMinor: requestedAmountMinor
    } = params;

    // 1. Resolve work-order billing context & caller authority outside DB transaction (ISSUE-002, RULE-ARCH-01)
    // Never hold an InnoDB row lock across inter-service network HTTP calls.
    let woTechnicianId = params.technicianId;
    let woBuyerId = params.buyerId;

    if (
      !woTechnicianId ||
      !woBuyerId ||
      (callerRole && callerRole !== 'SYSTEM' && callerRole !== 'ADMIN')
    ) {
      const workOrder = await this.workOrderDirectory.getWorkOrder(workOrderId, correlationId);
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

      woTechnicianId = workOrder.assignedTechnicianId;
      woBuyerId = workOrder.buyerId;
    }

    if (callerRole && callerRole !== 'ADMIN' && callerRole !== 'SYSTEM') {
      // Must be the buyer who owns the work order
      const resolvedBuyerId = await this.profileDirectory.resolveProfileId(
        callerUserId || '',
        callerRole,
        callerProfileId,
        correlationId
      );

      if (!resolvedBuyerId || resolvedBuyerId !== woBuyerId) {
        throw new ForbiddenException(
          'Only the work order buyer or an administrator may authorize escrow release'
        );
      }
    }

    let payoutEvent: EventEnvelope<unknown> | undefined;
    try {
      const result = await this.db.transaction(async (tx) => {
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
              status: 'IN_PROGRESS'
            });
          }
        }

        // 2. Fetch Escrow Account with row lock (concurrency-safe financial invariant)
        const [escrow] = await tx
          .select()
          .from(billingSchema.escrowAccounts)
          .where(eq(billingSchema.escrowAccounts.workOrderId, workOrderId))
          .for('update');

        if (!escrow) {
          throw new NotFoundException(`Escrow record for work order ${workOrderId} not found`);
        }

        if (escrow.status === 'RELEASED') {
          throw new ConflictException(
            `Escrow for work order ${workOrderId} has already been released`
          );
        }

        if (escrow.status !== 'HELD') {
          throw new ConflictException(
            `Escrow cannot be released: current status is ${escrow.status} (expected HELD)`
          );
        }

        const lockedMinor = decimalStringToMinor(escrow.amountLocked);
        let amountMinor: MinorUnits = lockedMinor;

        if (requestedAmountMinor !== undefined) {
          if (requestedAmountMinor <= 0) {
            throw new BadRequestException('Disbursed payout amount must be greater than zero');
          }
          if (requestedAmountMinor > lockedMinor) {
            throw new BadRequestException(
              `Requested payout (${formatMinor(requestedAmountMinor)}) exceeds locked escrow (${formatMinor(lockedMinor)})`
            );
          }
          amountMinor = requestedAmountMinor;
        }

        // 5. Update Escrow Status
        const now = new Date();
        await tx
          .update(billingSchema.escrowAccounts)
          .set({
            status: 'RELEASED',
            releasedAt: now
          })
          .where(eq(billingSchema.escrowAccounts.id, escrow.id));

        // 6. Disburse Payout to Technician via Provider
        const keySuffix = params.idempotencyKey
          ? params.idempotencyKey.replace(/^(escrow-release:|auto-release-)/, '')
          : workOrderId;
        const payoutIdempotencyKey = `escrow-payout:${keySuffix}`;

        await this.paymentProvider.disbursePayout({
          workOrderId,
          technicianId: woTechnicianId,
          amountMinor,
          idempotencyKey: payoutIdempotencyKey
        });

        // 7. Refund any unused escrow remainder to the buyer (e.g. agreed bid < budget ceiling)
        const unusedRemainderMinor = lockedMinor - amountMinor;
        if (unusedRemainderMinor > 0) {
          const remainderIdempotencyKey = `escrow-remainder-refund:${keySuffix}`;
          await this.paymentProvider.refundEscrow({
            workOrderId,
            buyerId: woBuyerId,
            amountMinor: unusedRemainderMinor,
            reason: 'Unused escrow balance refunded upon work order completion payout',
            idempotencyKey: remainderIdempotencyKey
          });
          this.logger.info(
            `[Escrow] refunded unused escrow remainder of ${formatMinor(unusedRemainderMinor)} to buyer ${woBuyerId} for work order ${workOrderId}`
          );
        }

        // 8. Record Double-Entry Payout Ledger Entry
        await tx.insert(billingSchema.payoutLedger).values({
          id: randomUUID(),
          technicianId: woTechnicianId,
          workOrderId,
          amount: minorToDecimalString(amountMinor),
          type: 'CREDIT',
          description: 'Work order completion payout',
          createdAt: now
        });

        // 9. Generate Immutable Content-Hashed Invoice (FR-BILL-003)
        const invoice = await this.invoicesService.generateInvoiceWithTx(tx, {
          workOrderId,
          buyerId: woBuyerId,
          amountMinor
        });

        this.logger.info(
          `[Payout] released ${formatMinor(amountMinor)} to technician ${woTechnicianId} for work order ${workOrderId}`
        );

        const result: EscrowReleaseResult = {
          workOrderId,
          technicianId: woTechnicianId,
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

        // 11. Record PAYOUT_DISBURSED Event in outbox inside business transaction
        const event = createEvent(
          EventType.PAYOUT_DISBURSED,
          {
            escrowId: escrow.id,
            workOrderId,
            buyerId: woBuyerId,
            technicianId: woTechnicianId,
            amountMinor
          },
          correlationId || randomUUID()
        );

        await insertOutboxEvent(tx, billingOutboxEvents, {
          event,
          aggregateType: 'escrow',
          aggregateId: escrow.id
        });
        payoutEvent = event;

        return result;
      });

      if (this.outboxRelay) {
        this.outboxRelay.trigger();
      } else if (this.producer && payoutEvent) {
        await this.producer.publish(payoutEvent).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`[Escrow] Failed to publish PAYOUT_DISBURSED event: ${msg}`);
        });
      }

      return result;
    } catch (error) {
      if (
        !(error instanceof ConflictException) &&
        !(error instanceof BadRequestException) &&
        !(error instanceof ForbiddenException) &&
        !(error instanceof NotFoundException)
      ) {
        metricsRegistry.incrementBillingReconciliationFailure(
          'escrow_release',
          (error as Error)?.name || 'unknown'
        );
      }
      throw error;
    }
  }

  /**
   * Resolves ISSUE-001.
   * Refunds HELD escrow funds back to the buyer when a work order is cancelled.
   * Concurrency-safe with row locking (SELECT ... FOR UPDATE) and multi-layer idempotency.
   *
   * State rules:
   * - No escrow found: idempotent no-op (logs info, returns null, no 404).
   * - Escrow REFUNDED: idempotent no-op (returns existing refund result without calling payment provider).
   * - Escrow RELEASED: logs warning, returns null (cannot refund funds already disbursed to technician).
   * - Escrow not HELD: logs warning, returns null.
   * - Escrow HELD: updates status to REFUNDED, dispatches refundEscrow to payment provider.
   *   Transaction rolls back DB update if payment provider call fails.
   */
  async refundEscrow(params: RefundEscrowParams): Promise<EscrowRefundResult | null> {
    const { workOrderId, correlationId, idempotencyKey } = params;

    // Resolve buyerId before entering DB transaction (avoid holding InnoDB lock during HTTP call)
    let buyerId = params.buyerId;
    if (!buyerId) {
      const wo = await this.workOrderDirectory.getWorkOrder(workOrderId, correlationId);
      buyerId = wo?.buyerId || 'unknown-buyer';
    }

    try {
      return await this.db.transaction(async (tx) => {
        // 1. Idempotency Check
        if (idempotencyKey) {
          const [existingKey] = await tx
            .select()
            .from(idempotencySchema.idempotencyKeys)
            .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey))
            .limit(1);

          if (existingKey) {
            if (existingKey.status === 'COMPLETED') {
              return existingKey.responsePayload as EscrowRefundResult | null;
            }
            if (existingKey.status === 'IN_PROGRESS') {
              throw new ConflictException(
                `An escrow refund with idempotency key ${idempotencyKey} is already in progress`
              );
            }
          } else {
            await tx.insert(idempotencySchema.idempotencyKeys).values({
              key: idempotencyKey,
              scope: 'ESCROW_REFUND',
              resourceId: workOrderId,
              status: 'IN_PROGRESS'
            });
          }
        }

        // 2. Fetch Escrow Account with row lock
        const [escrow] = await tx
          .select()
          .from(billingSchema.escrowAccounts)
          .where(eq(billingSchema.escrowAccounts.workOrderId, workOrderId))
          .for('update');

        // Case A: No escrow exists (e.g. cancelled while DRAFT before pre-authorization)
        if (!escrow) {
          this.logger.info(
            `[Escrow] No escrow found for cancelled work order ${workOrderId}; skipping refund`
          );
          if (idempotencyKey) {
            await tx
              .update(idempotencySchema.idempotencyKeys)
              .set({ status: 'COMPLETED', responsePayload: null })
              .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
          }
          return null;
        }

        // Case B: Escrow is already REFUNDED (idempotent duplicate event)
        if (escrow.status === 'REFUNDED') {
          this.logger.info(
            `[Escrow] Escrow for work order ${workOrderId} is already REFUNDED; skipping refund`
          );
          const result: EscrowRefundResult = {
            escrowId: escrow.id,
            workOrderId: escrow.workOrderId,
            refundedAmountMinor: decimalStringToMinor(escrow.amountLocked),
            status: EscrowStatus.REFUNDED
          };
          if (idempotencyKey) {
            await tx
              .update(idempotencySchema.idempotencyKeys)
              .set({ status: 'COMPLETED', responsePayload: result })
              .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
          }
          return result;
        }

        // Case C: Escrow is RELEASED (payout already disbursed; cannot refund, log warning)
        if (escrow.status === 'RELEASED') {
          this.logger.warn(
            `[Escrow] Cannot refund escrow for work order ${workOrderId}: escrow is already RELEASED`
          );
          if (idempotencyKey) {
            await tx
              .update(idempotencySchema.idempotencyKeys)
              .set({ status: 'COMPLETED', responsePayload: null })
              .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
          }
          return null;
        }

        // Case D: Escrow is not in HELD status (e.g. DISPUTED)
        if (escrow.status !== 'HELD') {
          this.logger.warn(
            `[Escrow] Cannot refund escrow for work order ${workOrderId}: status is ${escrow.status} (expected HELD)`
          );
          if (idempotencyKey) {
            await tx
              .update(idempotencySchema.idempotencyKeys)
              .set({ status: 'COMPLETED', responsePayload: null })
              .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
          }
          return null;
        }

        // Case E: Escrow is HELD -> execute refund
        const amountMinor = decimalStringToMinor(escrow.amountLocked);

        // Update DB status to REFUNDED
        await tx
          .update(billingSchema.escrowAccounts)
          .set({ status: 'REFUNDED' })
          .where(eq(billingSchema.escrowAccounts.id, escrow.id));

        // Call payment provider to disburse refund back to buyer
        const providerIdempotencyKey = idempotencyKey || `escrow-refund:${workOrderId}`;
        await this.paymentProvider.refundEscrow({
          workOrderId,
          buyerId,
          amountMinor,
          reason: params.reason || 'Work order cancelled',
          idempotencyKey: providerIdempotencyKey
        });

        this.logger.info(
          `[Escrow] Refunded ${formatMinor(amountMinor)} to buyer ${buyerId} for cancelled work order ${workOrderId}`
        );

        const result: EscrowRefundResult = {
          escrowId: escrow.id,
          workOrderId,
          refundedAmountMinor: amountMinor,
          status: EscrowStatus.REFUNDED
        };

        if (idempotencyKey) {
          await tx
            .update(idempotencySchema.idempotencyKeys)
            .set({
              status: 'COMPLETED',
              responsePayload: result
            })
            .where(eq(idempotencySchema.idempotencyKeys.key, idempotencyKey));
        }

        return result;
      });
    } catch (error) {
      if (
        !(error instanceof ConflictException) &&
        !(error instanceof BadRequestException) &&
        !(error instanceof ForbiddenException) &&
        !(error instanceof NotFoundException)
      ) {
        metricsRegistry.incrementBillingReconciliationFailure(
          'escrow_refund',
          (error as Error)?.name || 'unknown'
        );
      }
      throw error;
    }
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
      amountLockedMinor: decimalStringToMinor(row.amountLocked),
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
      const amountMinor = decimalStringToMinor(row.amount);
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
