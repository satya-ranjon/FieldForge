import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InternalServiceGuard } from '@fieldforge/common';
import type { WorkOrderBillingContextDto } from '@fieldforge/contracts';
import { WorkOrdersService } from './work-orders.service';

/**
 * Dedicated internal controller for inter-service communication (ISSUE-002).
 * Not routed via API Gateway and protected by internal service authentication.
 */
@Controller('internal/work-orders')
@UseGuards(new InternalServiceGuard(['billing-service']))
export class InternalWorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get(':id/billing-context')
  async getBillingContext(@Param('id') id: string): Promise<WorkOrderBillingContextDto> {
    return this.workOrdersService.getBillingContext(id);
  }
}
