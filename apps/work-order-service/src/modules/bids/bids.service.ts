import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import {
  DRIZZLE,
  ProfileDirectoryService,
  type DrizzleClient,
  insertOutboxEvent
} from '@fieldforge/common';
import {
  workOrders,
  workOrderBids,
  idempotencyKeys,
  workOrderOutboxEvents
} from '@fieldforge/database';
import { eq, and, ne, desc } from 'drizzle-orm';
import {
  type SubmitBidDto,
  type BidDetailsDto,
  type EventEnvelope,
  WorkOrderStatus,
  EventType,
  createEvent,
  minorToDecimalString,
  decimalStringToMinor
} from '@fieldforge/contracts';
import { WorkOrderEventPublisher } from '../../events/work-order-event.publisher';
import { WorkOrderOutboxRelay } from '../../events/work-order-outbox.relay';
import { WorkOrderFsmService } from '../fsm/work-order-fsm.service';
import { executeWorkOrderAssignment } from '../work-orders/work-order-assignment';
import { randomUUID } from 'node:crypto';

@Injectable()
export class BidsService {
  private readonly profileDirectory: ProfileDirectoryService;

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    private readonly eventPublisher: WorkOrderEventPublisher,
    private readonly fsmService: WorkOrderFsmService,
    @Optional() profileDirectory?: ProfileDirectoryService,
    @Optional() private readonly outboxRelay?: WorkOrderOutboxRelay
  ) {
    this.profileDirectory = profileDirectory || new ProfileDirectoryService();
  }

  getProfileDirectory(): ProfileDirectoryService {
    return this.profileDirectory;
  }

  /**
   * Submits a technician proposal/bid for a published work order.
   */
  async submitBid(
    dto: SubmitBidDto,
    technicianUserId: string,
    correlationId: string,
    idempotencyKey?: string,
    callerProfileId?: string
  ): Promise<BidDetailsDto> {
    let eventToPublish: EventEnvelope<unknown> | undefined;
    const responseDto = await this.db.transaction(async (tx) => {
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(idempotencyKeys)
          .where(eq(idempotencyKeys.key, idempotencyKey));

        if (existing && existing.status === 'COMPLETED' && existing.responsePayload) {
          return existing.responsePayload as unknown as BidDetailsDto;
        }
      }

      // 1. Resolve technician profile from callerProfileId or user ID
      const technicianId = await this.profileDirectory.resolveProfileId(
        technicianUserId,
        'TECHNICIAN',
        callerProfileId,
        correlationId
      );

      if (!technicianId) {
        throw new ForbiddenException('Only registered technicians can submit bids');
      }

      // 2. Lock work order FOR UPDATE
      const [wo] = await tx
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, dto.workOrderId))
        .for('update');

      if (!wo) {
        throw new NotFoundException(`Work order ${dto.workOrderId} not found`);
      }

      if (wo.status !== WorkOrderStatus.PUBLISHED) {
        throw new BadRequestException(
          `Cannot bid on work order in ${wo.status} status. Must be PUBLISHED.`
        );
      }

      // 3. Prevent duplicate active bids by the same technician
      const [existingBid] = await tx
        .select()
        .from(workOrderBids)
        .where(
          and(
            eq(workOrderBids.workOrderId, dto.workOrderId),
            eq(workOrderBids.technicianId, technicianId),
            eq(workOrderBids.bidStatus, 'PENDING')
          )
        );

      if (existingBid) {
        throw new ConflictException('You already have a pending bid for this work order');
      }

      const bidId = randomUUID();
      const bidAmountDecimal = minorToDecimalString(dto.bidAmountMinor);

      await tx.insert(workOrderBids).values({
        id: bidId,
        workOrderId: dto.workOrderId,
        technicianId,
        bidAmount: bidAmountDecimal,
        counterNote: dto.counterNote || null,
        bidStatus: 'PENDING'
      });

      const responseDto: BidDetailsDto = {
        id: bidId,
        workOrderId: dto.workOrderId,
        technicianId,
        bidAmountMinor: dto.bidAmountMinor,
        counterNote: dto.counterNote || null,
        bidStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };

      if (idempotencyKey) {
        await tx
          .insert(idempotencyKeys)
          .values({
            key: idempotencyKey,
            scope: 'bid_submission',
            resourceId: bidId,
            status: 'COMPLETED',
            responsePayload: responseDto
          })
          .onDuplicateKeyUpdate({
            set: { status: 'COMPLETED', responsePayload: responseDto }
          });
      }

      // 4. Record confirmed event in outbox
      const event = createEvent(
        EventType.TECH_BIDDING_SUBMITTED,
        {
          bidId,
          workOrderId: dto.workOrderId,
          technicianId,
          bidAmountMinor: dto.bidAmountMinor,
          counterNote: dto.counterNote
        },
        correlationId
      );

      await insertOutboxEvent(tx, workOrderOutboxEvents, {
        event,
        aggregateType: 'bid',
        aggregateId: bidId
      });
      eventToPublish = event;

      return responseDto;
    });

    if (this.outboxRelay) {
      this.outboxRelay.trigger();
    } else if (eventToPublish) {
      await this.eventPublisher.publishTechBiddingSubmitted(eventToPublish);
    }

    return responseDto;
  }

  /**
   * Atomically accepts a bid: marks the bid ACCEPTED, rejects siblings, transitions the
   * work order from PUBLISHED to ASSIGNED, logs status history, and emits assigned events.
   */
  async acceptBid(
    bidId: string,
    buyerUserId: string,
    callerRole: string,
    correlationId: string,
    idempotencyKey?: string,
    callerProfileId?: string,
    targetWorkOrderId?: string
  ): Promise<BidDetailsDto> {
    const result = await this.db.transaction(async (tx) => {
      // 1. Check idempotency
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(idempotencyKeys)
          .where(eq(idempotencyKeys.key, idempotencyKey));

        if (existing && existing.status === 'COMPLETED' && existing.responsePayload) {
          return {
            responseDto: existing.responsePayload as unknown as BidDetailsDto,
            publishAssignedEvent: undefined
          };
        }
      }

      const [bid] = await tx
        .select()
        .from(workOrderBids)
        .where(eq(workOrderBids.id, bidId))
        .for('update');

      if (!bid) {
        throw new NotFoundException(`Bid ${bidId} not found`);
      }

      if (targetWorkOrderId && bid.workOrderId !== targetWorkOrderId) {
        throw new BadRequestException(
          `Bid ${bidId} does not belong to work order ${targetWorkOrderId}`
        );
      }

      if (bid.bidStatus !== 'PENDING') {
        throw new BadRequestException(
          `Cannot accept bid with status ${bid.bidStatus}. Only PENDING bids can be accepted.`
        );
      }

      // 2. Lock work order FOR UPDATE
      const [wo] = await tx
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, bid.workOrderId))
        .for('update');

      if (!wo) {
        throw new NotFoundException(`Work order ${bid.workOrderId} not found`);
      }

      if (wo.status !== WorkOrderStatus.PUBLISHED) {
        throw new BadRequestException(
          `Cannot accept bid on work order in ${wo.status} status. Must be PUBLISHED.`
        );
      }

      // 3. Verify buyer ownership
      if (callerRole !== 'ADMIN') {
        const resolvedBuyerId = await this.profileDirectory.resolveProfileId(
          buyerUserId,
          'BUYER',
          callerProfileId,
          correlationId
        );

        if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
          throw new ForbiddenException('Only the work order buyer can accept bids');
        }
      }

      // 4. Validate FSM transition: PUBLISHED -> ASSIGNED
      this.fsmService.validateTransition(wo.status as WorkOrderStatus, WorkOrderStatus.ASSIGNED);

      // 5. Update selected bid to ACCEPTED
      await tx
        .update(workOrderBids)
        .set({ bidStatus: 'ACCEPTED' })
        .where(eq(workOrderBids.id, bidId));

      // 6. Reject sibling pending bids
      await tx
        .update(workOrderBids)
        .set({ bidStatus: 'REJECTED' })
        .where(
          and(
            eq(workOrderBids.workOrderId, bid.workOrderId),
            ne(workOrderBids.id, bidId),
            eq(workOrderBids.bidStatus, 'PENDING')
          )
        );

      // 7 & 8. Atomically transition work order to ASSIGNED and record status history
      const { event: assignedEvent, publishEvent: publishAssignedEvent } =
        await executeWorkOrderAssignment(tx, this.fsmService, this.eventPublisher, {
          workOrderId: wo.id,
          technicianId: bid.technicianId,
          fromStatus: (wo.status as WorkOrderStatus) || WorkOrderStatus.PUBLISHED,
          changedBy: buyerUserId,
          reason: `Bid accepted (agreed rate $${bid.bidAmount})`,
          agreedRateMinor: decimalStringToMinor(bid.bidAmount),
          correlationId,
          validateFsm: false
        });

      // Record assigned event in outbox inside business transaction
      await insertOutboxEvent(tx, workOrderOutboxEvents, {
        event: assignedEvent,
        aggregateType: 'work_order',
        aggregateId: wo.id
      });

      const responseDto: BidDetailsDto = {
        id: bid.id,
        workOrderId: bid.workOrderId,
        technicianId: bid.technicianId,
        bidAmountMinor: decimalStringToMinor(bid.bidAmount),
        counterNote: bid.counterNote,
        bidStatus: 'ACCEPTED',
        createdAt: (bid.createdAt ? new Date(bid.createdAt) : new Date()).toISOString()
      };

      if (idempotencyKey) {
        await tx
          .insert(idempotencyKeys)
          .values({
            key: idempotencyKey,
            scope: 'bid_acceptance',
            resourceId: bidId,
            status: 'COMPLETED',
            responsePayload: responseDto
          })
          .onDuplicateKeyUpdate({
            set: { status: 'COMPLETED', responsePayload: responseDto }
          });
      }

      return { responseDto, publishAssignedEvent };
    });

    if (this.outboxRelay) {
      this.outboxRelay.trigger();
    } else if (result.publishAssignedEvent) {
      await result.publishAssignedEvent();
    }

    return result.responseDto;
  }

  /**
   * Retrieves all bids for a work order.
   * Buyers can view all bids on their work order. Technicians see their own bids.
   */
  async listBidsForWorkOrder(
    workOrderId: string,
    callerUserId: string,
    callerRole: string,
    callerProfileId?: string
  ): Promise<BidDetailsDto[]> {
    const [wo] = await this.db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    if (callerRole === 'BUYER') {
      const resolvedBuyerId = await this.profileDirectory.resolveProfileId(
        callerUserId,
        callerRole,
        callerProfileId
      );

      if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
        throw new ForbiddenException('Only the work order creator can view all submitted bids');
      }
    }

    let query = this.db
      .select()
      .from(workOrderBids)
      .where(eq(workOrderBids.workOrderId, workOrderId))
      .orderBy(desc(workOrderBids.createdAt));

    if (callerRole === 'TECHNICIAN') {
      const resolvedTechId = await this.profileDirectory.resolveProfileId(
        callerUserId,
        callerRole,
        callerProfileId
      );
      if (resolvedTechId) {
        query = this.db
          .select()
          .from(workOrderBids)
          .where(
            and(
              eq(workOrderBids.workOrderId, workOrderId),
              eq(workOrderBids.technicianId, resolvedTechId)
            )
          )
          .orderBy(desc(workOrderBids.createdAt));
      }
    }

    const rows = await query;

    return rows.map((b) => ({
      id: b.id,
      workOrderId: b.workOrderId,
      technicianId: b.technicianId,
      bidAmountMinor: decimalStringToMinor(b.bidAmount),
      counterNote: b.counterNote,
      bidStatus: b.bidStatus as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN',
      createdAt: (b.createdAt ? new Date(b.createdAt) : new Date()).toISOString()
    }));
  }

  /**
   * Retrieves details of a specific bid.
   */
  async getBidById(bidId: string): Promise<BidDetailsDto> {
    const [bid] = await this.db
      .select()
      .from(workOrderBids)
      .where(eq(workOrderBids.id, bidId))
      .limit(1);

    if (!bid) {
      throw new NotFoundException(`Bid ${bidId} not found`);
    }

    return {
      id: bid.id,
      workOrderId: bid.workOrderId,
      technicianId: bid.technicianId,
      bidAmountMinor: decimalStringToMinor(bid.bidAmount),
      counterNote: bid.counterNote,
      bidStatus: bid.bidStatus as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN',
      createdAt: (bid.createdAt ? new Date(bid.createdAt) : new Date()).toISOString()
    };
  }
}
