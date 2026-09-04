import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import type {
  CreateWorkOrderDto,
  TransitionWorkOrderDto,
  ListWorkOrdersQueryDto,
  WorkOrderResponseDto,
  WorkOrderStatusHistoryDto
} from '@fieldforge/contracts';
import {
  createEvent,
  EventType,
  WorkOrderStatus,
  BudgetType,
  fromMinor,
  toMinor
} from '@fieldforge/contracts';
import {
  workOrders,
  workOrderStatusHistory,
  buyerProfiles,
  technicianProfiles
} from '@fieldforge/database';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleClient,
  isWithinGeofence,
  calculateDistanceMeters
} from '@fieldforge/common';
import { WorkOrderFsmService } from '../fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from '../../events/work-order-event.publisher';
import { randomUUID } from 'node:crypto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleClient,
    private readonly fsmService: WorkOrderFsmService,
    private readonly eventPublisher: WorkOrderEventPublisher
  ) {}

  private mapToResponseDto(row: typeof workOrders.$inferSelect): WorkOrderResponseDto {
    return {
      id: row.id,
      buyerId: row.buyerId,
      assignedTechnicianId: row.assignedTechnicianId,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status as WorkOrderStatus,
      budgetType: row.budgetType as BudgetType,
      budgetAmountMinor: toMinor(Number(row.budgetAmount)),
      addressLine: row.addressLine,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      scheduledStartTime: row.scheduledStartTime.toISOString(),
      scheduledEndTime: row.scheduledEndTime.toISOString(),
      slaExpirationTime: row.slaExpirationTime.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

  /**
   * `buyerUserId` comes from the verified access token (FR-WO-001).
   * Atomically registers the work order and initial status history in DRAFT.
   */
  async create(buyerUserId: string, dto: CreateWorkOrderDto): Promise<WorkOrderResponseDto> {
    let [buyerProfile] = await this.db
      .select()
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, buyerUserId))
      .limit(1);

    if (!buyerProfile) {
      const profileId = randomUUID();
      await this.db.insert(buyerProfiles).values({
        id: profileId,
        userId: buyerUserId,
        companyName: 'Default Buyer Co',
        billingAddress: dto.addressLine || 'N/A',
        escrowBalance: '0.00'
      });
      buyerProfile = {
        id: profileId,
        userId: buyerUserId,
        companyName: 'Default Buyer Co',
        billingAddress: dto.addressLine || 'N/A',
        escrowBalance: '0.00'
      };
    }

    const startTime = new Date(dto.scheduledStartTime);
    const endTime = new Date(dto.scheduledEndTime);
    const slaTime = new Date(dto.slaExpirationTime);
    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException('scheduledEndTime must be after scheduledStartTime');
    }
    if (slaTime.getTime() < startTime.getTime()) {
      throw new BadRequestException('slaExpirationTime must not be before scheduledStartTime');
    }

    const workOrderId = randomUUID();
    const budgetAmount = fromMinor(dto.budgetAmountMinor).toFixed(2);
    const now = new Date();

    const newRecord: typeof workOrders.$inferInsert = {
      id: workOrderId,
      buyerId: buyerProfile.id,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      status: WorkOrderStatus.DRAFT,
      budgetType: dto.budgetType,
      budgetAmount,
      addressLine: dto.addressLine,
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      scheduledStartTime: new Date(dto.scheduledStartTime),
      scheduledEndTime: new Date(dto.scheduledEndTime),
      slaExpirationTime: new Date(dto.slaExpirationTime),
      createdAt: now,
      updatedAt: now
    };

    await this.db.transaction(async (tx) => {
      await tx.insert(workOrders).values(newRecord);
      await tx.insert(workOrderStatusHistory).values({
        id: randomUUID(),
        workOrderId,
        fromStatus: null,
        toStatus: WorkOrderStatus.DRAFT,
        changedBy: buyerUserId,
        reason: 'Work order created',
        createdAt: now
      });
    });

    return this.mapToResponseDto(newRecord as typeof workOrders.$inferSelect);
  }

  /**
   * List work orders filtered by status and schedule range.
   * Utilizes composite index idx_wo_status_sched (status, scheduled_start_time).
   */
  async list(query: ListWorkOrdersQueryDto): Promise<WorkOrderResponseDto[]> {
    const conditions = [];
    if (query.status) {
      conditions.push(eq(workOrders.status, query.status));
    }
    if (query.buyerId) {
      conditions.push(eq(workOrders.buyerId, query.buyerId));
    }
    if (query.assignedTechnicianId) {
      conditions.push(eq(workOrders.assignedTechnicianId, query.assignedTechnicianId));
    }
    if (
      query.scheduledStartTimeFrom &&
      query.scheduledStartTimeTo &&
      new Date(query.scheduledStartTimeTo).getTime() <
        new Date(query.scheduledStartTimeFrom).getTime()
    ) {
      throw new BadRequestException(
        'scheduledStartTimeTo must be greater than or equal to scheduledStartTimeFrom'
      );
    }
    if (query.scheduledStartTimeFrom) {
      conditions.push(gte(workOrders.scheduledStartTime, new Date(query.scheduledStartTimeFrom)));
    }
    if (query.scheduledStartTimeTo) {
      conditions.push(lte(workOrders.scheduledStartTime, new Date(query.scheduledStartTimeTo)));
    }

    const base = this.db.select().from(workOrders);
    const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;

    const rows = await filtered
      .orderBy(asc(workOrders.scheduledStartTime))
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0);

    return rows.map((row) => this.mapToResponseDto(row));
  }

  async findById(id: string): Promise<WorkOrderResponseDto> {
    const [row] = await this.db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);

    if (!row) {
      throw new NotFoundException(`Work order with ID ${id} not found`);
    }

    return this.mapToResponseDto(row);
  }

  async getStatusHistory(workOrderId: string): Promise<WorkOrderStatusHistoryDto[]> {
    const rows = await this.db
      .select()
      .from(workOrderStatusHistory)
      .where(eq(workOrderStatusHistory.workOrderId, workOrderId))
      .orderBy(asc(workOrderStatusHistory.createdAt));

    return rows.map((r) => ({
      id: r.id,
      workOrderId: r.workOrderId,
      fromStatus: r.fromStatus as WorkOrderStatus | null,
      toStatus: r.toStatus as WorkOrderStatus,
      changedBy: r.changedBy,
      reason: r.reason,
      createdAt: r.createdAt.toISOString()
    }));
  }

  /**
   * Atomically locks row, validates DRAFT -> PUBLISHED against actual state,
   * asserts buyer ownership, records status history, and emits event (FR-WO-001/002).
   */
  async publish(
    workOrderId: string,
    userId: string,
    role: string,
    correlationId: string
  ): Promise<WorkOrderResponseDto> {
    let updatedOrder: WorkOrderResponseDto;
    let publishedEventPayload: {
      workOrderId: string;
      buyerId: string;
      title: string;
      maxBudgetMinor: number;
      latitude: number;
      longitude: number;
    };

    await this.db.transaction(async (tx) => {
      const [wo] = await tx
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, workOrderId))
        .for('update');

      if (!wo) {
        throw new NotFoundException(`Work order with ID ${workOrderId} not found`);
      }

      if (role === 'BUYER') {
        const [buyer] = await tx
          .select()
          .from(buyerProfiles)
          .where(eq(buyerProfiles.userId, userId))
          .limit(1);

        if (!buyer || buyer.id !== wo.buyerId) {
          throw new ForbiddenException(
            'Only the owning buyer or an admin can publish this work order'
          );
        }
      }

      const currentStatus = wo.status as WorkOrderStatus;
      this.fsmService.validateTransition(currentStatus, WorkOrderStatus.PUBLISHED);

      const now = new Date();
      await tx
        .update(workOrders)
        .set({
          status: WorkOrderStatus.PUBLISHED,
          updatedAt: now
        })
        .where(eq(workOrders.id, workOrderId));

      await tx.insert(workOrderStatusHistory).values({
        id: randomUUID(),
        workOrderId,
        fromStatus: currentStatus,
        toStatus: WorkOrderStatus.PUBLISHED,
        changedBy: userId,
        reason: 'Work order published',
        createdAt: now
      });

      updatedOrder = this.mapToResponseDto({
        ...wo,
        status: WorkOrderStatus.PUBLISHED,
        updatedAt: now
      });

      publishedEventPayload = {
        workOrderId: wo.id,
        buyerId: wo.buyerId,
        title: wo.title,
        maxBudgetMinor: toMinor(Number(wo.budgetAmount)),
        latitude: Number(wo.latitude),
        longitude: Number(wo.longitude)
      };
    });

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      publishedEventPayload!,
      correlationId
    );
    await this.eventPublisher.publishWorkOrderPublished(event);

    return updatedOrder!;
  }

  /**
   * Transactionally transition work order status with row lock (SELECT FOR UPDATE).
   * Validates actual status against FSM graph, enforces ownership & roles,
   * performs server-side geofence checks (SRS FR-MOB-001), and logs status history.
   */
  async transition(
    workOrderId: string,
    userId: string,
    role: string,
    dto: TransitionWorkOrderDto,
    correlationId: string
  ): Promise<WorkOrderResponseDto> {
    let updatedOrder: WorkOrderResponseDto;
    const eventsToPublish: Array<() => Promise<void>> = [];

    await this.db.transaction(async (tx) => {
      const [wo] = await tx
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, workOrderId))
        .for('update');

      if (!wo) {
        throw new NotFoundException(`Work order with ID ${workOrderId} not found`);
      }

      const currentStatus = wo.status as WorkOrderStatus;
      this.fsmService.validateTransition(currentStatus, dto.nextStatus);

      // Ownership and Role Enforcement
      if (dto.nextStatus === WorkOrderStatus.ASSIGNED) {
        if (role !== 'ADMIN' && role !== 'DISPATCHER' && role !== 'BUYER') {
          throw new ForbiddenException('Only admin, dispatcher, or buyer can assign work orders');
        }
        if (role === 'BUYER') {
          const [buyer] = await tx
            .select()
            .from(buyerProfiles)
            .where(eq(buyerProfiles.userId, userId))
            .limit(1);

          if (!buyer || buyer.id !== wo.buyerId) {
            throw new ForbiddenException(
              'Only the owning buyer, dispatcher, or admin can assign this work order'
            );
          }
        }
        if (!dto.assignedTechnicianId && !wo.assignedTechnicianId) {
          throw new BadRequestException(
            'assignedTechnicianId is required to transition to ASSIGNED'
          );
        }
      } else if (
        dto.nextStatus === WorkOrderStatus.EN_ROUTE ||
        dto.nextStatus === WorkOrderStatus.ON_SITE ||
        dto.nextStatus === WorkOrderStatus.COMPLETED
      ) {
        if (role !== 'ADMIN') {
          const [tech] = await tx
            .select()
            .from(technicianProfiles)
            .where(eq(technicianProfiles.userId, userId))
            .limit(1);

          if (!tech || tech.id !== wo.assignedTechnicianId) {
            throw new ForbiddenException(
              'Only the assigned technician or an admin can perform this transition'
            );
          }
        }

        // Server-side geofence enforcement for arrival (H5, SRS FR-MOB-001)
        if (dto.nextStatus === WorkOrderStatus.ON_SITE) {
          if (dto.latitude === undefined || dto.longitude === undefined) {
            throw new BadRequestException(
              'latitude and longitude are required to transition to ON_SITE'
            );
          }

          const techLocation = { latitude: dto.latitude, longitude: dto.longitude };
          const jobLocation = { latitude: Number(wo.latitude), longitude: Number(wo.longitude) };
          const withinGeofence = isWithinGeofence(techLocation, jobLocation, 200);

          if (!withinGeofence) {
            const distance = Math.round(calculateDistanceMeters(techLocation, jobLocation));
            throw new BadRequestException(
              `Technician coordinates are outside 200m geofence tolerance (actual: ${distance}m, allowed: 200m)`
            );
          }
        }
      } else if (dto.nextStatus === WorkOrderStatus.APPROVED) {
        if (role !== 'ADMIN') {
          const [buyer] = await tx
            .select()
            .from(buyerProfiles)
            .where(eq(buyerProfiles.userId, userId))
            .limit(1);

          if (!buyer || buyer.id !== wo.buyerId) {
            throw new ForbiddenException(
              'Only the owning buyer or an admin can approve this work order'
            );
          }
        }
      } else if (dto.nextStatus === WorkOrderStatus.CANCELLED) {
        if (role === 'TECHNICIAN') {
          throw new ForbiddenException('Technicians cannot cancel work orders');
        }
        if (role === 'BUYER') {
          const [buyer] = await tx
            .select()
            .from(buyerProfiles)
            .where(eq(buyerProfiles.userId, userId))
            .limit(1);

          if (!buyer || buyer.id !== wo.buyerId) {
            throw new ForbiddenException(
              'Only the owning buyer or an admin can cancel this work order'
            );
          }
        }
      } else if (dto.nextStatus === WorkOrderStatus.DISPUTED) {
        if (role === 'BUYER') {
          const [buyer] = await tx
            .select()
            .from(buyerProfiles)
            .where(eq(buyerProfiles.userId, userId))
            .limit(1);

          if (!buyer || buyer.id !== wo.buyerId) {
            throw new ForbiddenException(
              'Only the owning buyer or assigned technician can dispute this work order'
            );
          }
        } else if (role === 'TECHNICIAN') {
          const [tech] = await tx
            .select()
            .from(technicianProfiles)
            .where(eq(technicianProfiles.userId, userId))
            .limit(1);

          if (!tech || tech.id !== wo.assignedTechnicianId) {
            throw new ForbiddenException(
              'Only the owning buyer or assigned technician can dispute this work order'
            );
          }
        } else if (role !== 'ADMIN' && role !== 'DISPATCHER') {
          throw new ForbiddenException('Unauthorized to dispute this work order');
        }
      } else if (dto.nextStatus === WorkOrderStatus.PAID) {
        if (role !== 'ADMIN') {
          throw new ForbiddenException(
            'Only the billing settlement engine or admin can mark work order as PAID'
          );
        }
      }

      const now = new Date();
      const updateData: Partial<typeof workOrders.$inferInsert> = {
        status: dto.nextStatus,
        updatedAt: now
      };

      if (dto.nextStatus === WorkOrderStatus.ASSIGNED && dto.assignedTechnicianId) {
        updateData.assignedTechnicianId = dto.assignedTechnicianId;
      }

      await tx.update(workOrders).set(updateData).where(eq(workOrders.id, workOrderId));

      await tx.insert(workOrderStatusHistory).values({
        id: randomUUID(),
        workOrderId,
        fromStatus: currentStatus,
        toStatus: dto.nextStatus,
        changedBy: userId,
        reason: dto.reason || null,
        createdAt: now
      });

      const updatedRow = {
        ...wo,
        ...updateData
      };

      updatedOrder = this.mapToResponseDto(updatedRow as typeof workOrders.$inferSelect);

      if (dto.nextStatus === WorkOrderStatus.ASSIGNED) {
        const assignedTechId = dto.assignedTechnicianId || wo.assignedTechnicianId || '';
        const agreedRateMinor = toMinor(Number(wo.budgetAmount));
        eventsToPublish.push(async () => {
          const event = createEvent(
            EventType.WORK_ORDER_ASSIGNED,
            {
              workOrderId: wo.id,
              techId: assignedTechId,
              agreedRateMinor
            },
            correlationId
          );
          await this.eventPublisher.publishWorkOrderAssigned(event);
        });
      } else if (dto.nextStatus === WorkOrderStatus.APPROVED) {
        const payoutAmountMinor = toMinor(Number(wo.budgetAmount));
        const assignedTechId = wo.assignedTechnicianId || '';
        eventsToPublish.push(async () => {
          const event = createEvent(
            EventType.WORK_ORDER_APPROVED,
            {
              workOrderId: wo.id,
              buyerId: wo.buyerId,
              techId: assignedTechId,
              payoutAmountMinor
            },
            correlationId
          );
          await this.eventPublisher.publishWorkOrderApproved(event);
        });
      }
    });

    for (const publishFn of eventsToPublish) {
      await publishFn();
    }

    return updatedOrder!;
  }
}
