import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkOrderDto, WorkOrderStatus, WorkOrderPublishedEvent } from '@fieldforge/contracts';
import { WorkOrderFsmService } from '../fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from '../../events/work-order-event.publisher';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly fsmService: WorkOrderFsmService,
    private readonly eventPublisher: WorkOrderEventPublisher
  ) {}

  async create(buyerId: string, dto: CreateWorkOrderDto) {
    const workOrderId = randomUUID();
    const workOrder = {
      ...dto,
      id: workOrderId,
      buyerId,
      status: WorkOrderStatus.DRAFT,
      createdAt: new Date().toISOString()
    };

    return workOrder;
  }

  async publish(workOrderId: string, buyerId: string) {
    // In production: MySQL atomic transaction
    this.fsmService.validateTransition(WorkOrderStatus.DRAFT, WorkOrderStatus.PUBLISHED);

    const event: WorkOrderPublishedEvent = {
      eventId: randomUUID(),
      workOrderId,
      buyerId,
      title: 'Emergency POS Terminal Swap',
      maxBudget: 450,
      latitude: 37.7749,
      longitude: -122.4194,
      publishedAt: new Date().toISOString()
    };

    await this.eventPublisher.publishWorkOrderPublished(event);
    return { id: workOrderId, status: WorkOrderStatus.PUBLISHED };
  }
}
