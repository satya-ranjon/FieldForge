import { Injectable } from '@nestjs/common';
import type { CreateWorkOrderDto } from '@fieldforge/contracts';
import { createEvent, EventType, WorkOrderStatus } from '@fieldforge/contracts';
import { WorkOrderFsmService } from '../fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from '../../events/work-order-event.publisher';
import { randomUUID } from 'node:crypto';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly fsmService: WorkOrderFsmService,
    private readonly eventPublisher: WorkOrderEventPublisher
  ) {}

  /**
   * `buyerId` is a parameter, never a DTO field: it comes from the verified
   * access token so a caller cannot open a work order against another account.
   */
  async create(buyerId: string, dto: CreateWorkOrderDto) {
    const workOrderId = randomUUID();

    return {
      ...dto,
      id: workOrderId,
      buyerId,
      status: WorkOrderStatus.DRAFT,
      createdAt: new Date().toISOString()
    };
  }

  async publish(workOrderId: string, buyerId: string, correlationId: string) {
    // Not yet persisted: this validates DRAFT -> PUBLISHED against a hardcoded
    // current state rather than a locked row, and the payload below is a
    // placeholder rather than a read. Phase 2 of docs/DEVELOPMENT_PLAN.md
    // replaces both with a transactional read of the real work order.
    this.fsmService.validateTransition(WorkOrderStatus.DRAFT, WorkOrderStatus.PUBLISHED);

    const event = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId,
        buyerId,
        title: 'Emergency POS Terminal Swap',
        maxBudgetMinor: 45_000,
        latitude: 37.7749,
        longitude: -122.4194
      },
      correlationId
    );

    await this.eventPublisher.publishWorkOrderPublished(event);
    return { id: workOrderId, status: WorkOrderStatus.PUBLISHED };
  }
}
