import { InternalWorkOrdersController } from '../src/modules/work-orders/internal-work-orders.controller';
import { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';
import { NotFoundException } from '@nestjs/common';
import { WorkOrderStatus } from '@fieldforge/contracts';

describe('InternalWorkOrdersController', () => {
  let controller: InternalWorkOrdersController;
  let mockWorkOrdersService: Partial<WorkOrdersService>;

  beforeEach(() => {
    mockWorkOrdersService = {
      getBillingContext: async (id: string) => {
        if (id === 'wo-not-found') {
          throw new NotFoundException(`Work order with ID ${id} not found`);
        }
        return {
          id,
          buyerId: 'buyer-profile-123',
          assignedTechnicianId: 'tech-profile-456',
          status: WorkOrderStatus.APPROVED
        };
      }
    };

    controller = new InternalWorkOrdersController(mockWorkOrdersService as WorkOrdersService);
  });

  it('returns narrow WorkOrderBillingContextDto for existing work order', async () => {
    const result = await controller.getBillingContext('wo-123');

    expect(result).toEqual({
      id: 'wo-123',
      buyerId: 'buyer-profile-123',
      assignedTechnicianId: 'tech-profile-456',
      status: WorkOrderStatus.APPROVED
    });

    // Verify it does NOT contain sensitive fields
    const untypedResult = result as unknown as Record<string, unknown>;
    expect(untypedResult.addressLine).toBeUndefined();
    expect(untypedResult.description).toBeUndefined();
    expect(untypedResult.budgetAmountMinor).toBeUndefined();
    expect(untypedResult.latitude).toBeUndefined();
    expect(untypedResult.longitude).toBeUndefined();
  });

  it('throws NotFoundException when work order does not exist', async () => {
    await expect(controller.getBillingContext('wo-not-found')).rejects.toThrow(NotFoundException);
  });
});
