import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { DRIZZLE } from '@fieldforge/common';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import {
  workOrders,
  workOrderBids,
  workOrderStatusHistory,
  buyerProfiles,
  technicianProfiles,
  idempotencyKeys
} from '@fieldforge/database';
import { eq, and, ne } from 'drizzle-orm';
import {
  type SubmitBidDto,
  type AutoRouteDto,
  type BidDetailsDto,
  EventType,
  createEvent,
  minorToDecimalString,
  decimalStringToMinor
} from '@fieldforge/contracts';
import { EventPublisher } from '@fieldforge/messaging';
import { randomUUID } from 'node:crypto';
import { GeoSearchService } from '../geo-search/geo-search.service';

@Injectable()
export class BidsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, unknown>>,
    private readonly eventPublisher: EventPublisher,
    private readonly geoSearchService: GeoSearchService
  ) {}

  async submitBid(
    dto: SubmitBidDto,
    technicianUserId: string,
    correlationId: string,
    idempotencyKey?: string
  ): Promise<BidDetailsDto> {
    return await this.db.transaction(async (tx) => {
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(idempotencyKeys)
          .where(eq(idempotencyKeys.key, idempotencyKey));

        if (existing && existing.status === 'COMPLETED' && existing.responsePayload) {
          return existing.responsePayload as unknown as BidDetailsDto;
        }
      }

      // 1. Resolve technician profile from user ID
      const [tech] = await tx
        .select()
        .from(technicianProfiles)
        .where(eq(technicianProfiles.userId, technicianUserId));

      if (!tech) {
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

      if (wo.status !== 'PUBLISHED') {
        throw new BadRequestException(
          `Cannot bid on work order in ${wo.status} status. Must be PUBLISHED.`
        );
      }

      // 3. Prevent duplicate active bids by same technician
      const [existingBid] = await tx
        .select()
        .from(workOrderBids)
        .where(
          and(
            eq(workOrderBids.workOrderId, dto.workOrderId),
            eq(workOrderBids.technicianId, tech.id),
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
        technicianId: tech.id,
        bidAmount: bidAmountDecimal,
        counterNote: dto.counterNote || null,
        bidStatus: 'PENDING'
      });

      const responseDto: BidDetailsDto = {
        id: bidId,
        workOrderId: dto.workOrderId,
        technicianId: tech.id,
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

      // Publish confirmed event tech.bidding.submitted
      const event = createEvent(
        EventType.TECH_BIDDING_SUBMITTED,
        {
          bidId,
          workOrderId: dto.workOrderId,
          technicianId: tech.id,
          bidAmountMinor: dto.bidAmountMinor,
          counterNote: dto.counterNote
        },
        correlationId
      );

      await this.eventPublisher.publish(event);

      return responseDto;
    });
  }

  async acceptBid(
    bidId: string,
    buyerUserId: string,
    callerRole: string,
    correlationId: string,
    idempotencyKey?: string
  ): Promise<BidDetailsDto> {
    return await this.db.transaction(async (tx) => {
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(idempotencyKeys)
          .where(eq(idempotencyKeys.key, idempotencyKey));

        if (existing && existing.status === 'COMPLETED' && existing.responsePayload) {
          return existing.responsePayload as unknown as BidDetailsDto;
        }
      }

      // 1. Lock bid FOR UPDATE
      const [bid] = await tx
        .select()
        .from(workOrderBids)
        .where(eq(workOrderBids.id, bidId))
        .for('update');

      if (!bid) {
        throw new NotFoundException(`Bid ${bidId} not found`);
      }

      if (bid.bidStatus !== 'PENDING') {
        throw new BadRequestException(
          `Bid ${bidId} cannot be accepted because it is already ${bid.bidStatus}`
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

      if (wo.status !== 'PUBLISHED') {
        throw new BadRequestException(
          `Cannot accept bid on work order in ${wo.status} status. Must be PUBLISHED.`
        );
      }

      // 3. Verify buyer ownership
      if (callerRole !== 'ADMIN') {
        const [buyer] = await tx
          .select()
          .from(buyerProfiles)
          .where(eq(buyerProfiles.userId, buyerUserId));

        if (!buyer || buyer.id !== wo.buyerId) {
          throw new ForbiddenException('Only the work order buyer can accept bids');
        }
      }

      // 4. Update selected bid to ACCEPTED
      await tx
        .update(workOrderBids)
        .set({ bidStatus: 'ACCEPTED' })
        .where(eq(workOrderBids.id, bidId));

      // 5. Reject sibling bids
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

      // 6. Update work order to ASSIGNED
      await tx
        .update(workOrders)
        .set({
          assignedTechnicianId: bid.technicianId,
          status: 'ASSIGNED'
        })
        .where(eq(workOrders.id, bid.workOrderId));

      // 7. Record status audit
      await tx.insert(workOrderStatusHistory).values({
        id: randomUUID(),
        workOrderId: bid.workOrderId,
        fromStatus: 'PUBLISHED',
        toStatus: 'ASSIGNED',
        changedBy: buyerUserId,
        reason: `Bid ${bidId} accepted`
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

      // 8. Publish confirmed event: work_order.lifecycle.assigned
      const assignedEvent = createEvent(
        EventType.WORK_ORDER_ASSIGNED,
        {
          workOrderId: wo.id,
          techId: bid.technicianId,
          agreedRateMinor: decimalStringToMinor(bid.bidAmount)
        },
        correlationId
      );

      await this.eventPublisher.publish(assignedEvent);

      return responseDto;
    });
  }

  async autoRoute(
    dto: AutoRouteDto,
    buyerUserId: string,
    callerRole: string,
    correlationId: string
  ): Promise<{ workOrderId: string; technicianId: string; status: string }> {
    return await this.db.transaction(async (tx) => {
      // 1. Lock work order FOR UPDATE
      const [wo] = await tx
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, dto.workOrderId))
        .for('update');

      if (!wo) {
        throw new NotFoundException(`Work order ${dto.workOrderId} not found`);
      }

      if (wo.status !== 'PUBLISHED') {
        throw new BadRequestException(
          `Cannot auto-route work order in ${wo.status} status. Must be PUBLISHED.`
        );
      }

      if (callerRole !== 'ADMIN') {
        const [buyer] = await tx
          .select()
          .from(buyerProfiles)
          .where(eq(buyerProfiles.userId, buyerUserId));

        if (!buyer || buyer.id !== wo.buyerId) {
          throw new ForbiddenException('Only the work order creator can auto-route');
        }
      }

      const lat = parseFloat(wo.latitude);
      const lng = parseFloat(wo.longitude);
      const radiusMiles = dto.maxRadiusMiles || 5;

      // 2. Find top-rated nearby technician within 5 miles
      const candidates = await this.geoSearchService.findNearbyTechnicians(lat, lng, radiusMiles);
      const availableTech = candidates.find((c) => c.isAvailable && c.distanceMiles <= radiusMiles);

      if (!availableTech) {
        throw new NotFoundException(
          `No eligible contractor found within ${radiusMiles} miles for auto-routing`
        );
      }

      // 3. Assign technician
      await tx
        .update(workOrders)
        .set({
          assignedTechnicianId: availableTech.techId,
          status: 'ASSIGNED'
        })
        .where(eq(workOrders.id, wo.id));

      await tx.insert(workOrderStatusHistory).values({
        id: randomUUID(),
        workOrderId: wo.id,
        fromStatus: 'PUBLISHED',
        toStatus: 'ASSIGNED',
        changedBy: buyerUserId,
        reason: `Auto-routed to top-rated contractor ${availableTech.fullName} (${availableTech.distanceMiles} mi)`
      });

      // 4. Publish confirmed assignment event
      const event = createEvent(
        EventType.WORK_ORDER_ASSIGNED,
        {
          workOrderId: wo.id,
          techId: availableTech.techId,
          agreedRateMinor: decimalStringToMinor(wo.budgetAmount)
        },
        correlationId
      );

      await this.eventPublisher.publish(event);

      return {
        workOrderId: wo.id,
        technicianId: availableTech.techId,
        status: 'ASSIGNED'
      };
    });
  }
}
