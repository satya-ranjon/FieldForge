import type { DrizzleClient } from '@fieldforge/common';
import type { WorkOrderResponseDto } from '@fieldforge/contracts';
import { WorkOrderStatus } from '@fieldforge/contracts';
import { SlaAutoApprovalService } from '../src/modules/sla/sla-auto-approval.service';
import type { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';

describe('SlaAutoApprovalService (Work-Order-Service SRS FR-WO-005 / FR-BILL-002)', () => {
  let slaService: SlaAutoApprovalService;
  let mockDb: {
    select: jest.Mock;
  };
  let mockWorkOrdersService: jest.Mocked<WorkOrdersService>;

  beforeEach(() => {
    mockDb = {
      select: jest.fn()
    };

    mockWorkOrdersService = {
      transition: jest.fn().mockResolvedValue({
        id: 'wo-overdue',
        status: WorkOrderStatus.APPROVED
      })
    } as unknown as jest.Mocked<WorkOrdersService>;

    slaService = new SlaAutoApprovalService(
      mockDb as unknown as DrizzleClient,
      mockWorkOrdersService
    );
  });

  it('sweeps and auto-approves overdue completed work orders via WorkOrdersService FSM', async () => {
    const overdueWo = {
      id: 'wo-overdue',
      status: WorkOrderStatus.COMPLETED,
      updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000) // 73 hours ago
    };

    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([overdueWo])
      })
    });

    const processed = await slaService.runAutoApprovalSweep();

    expect(processed).toBe(1);
    expect(mockWorkOrdersService.transition).toHaveBeenCalledWith(
      'wo-overdue',
      'system',
      'SYSTEM',
      {
        nextStatus: WorkOrderStatus.APPROVED,
        reason: '72-hour buyer review SLA timeout auto-approval'
      },
      'sla-auto-approval-wo-overdue'
    );
  });

  it('does nothing when no completed work orders exceed the 72-hour threshold', async () => {
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([])
      })
    });

    const processed = await slaService.runAutoApprovalSweep();

    expect(processed).toBe(0);
    expect(mockWorkOrdersService.transition).not.toHaveBeenCalled();
  });

  it('handles individual transition failures gracefully and continues processing remaining orders', async () => {
    const overdueOrders = [
      {
        id: 'wo-err',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 75 * 60 * 60 * 1000)
      },
      {
        id: 'wo-ok',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 74 * 60 * 60 * 1000)
      }
    ];

    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve(overdueOrders)
      })
    });

    mockWorkOrdersService.transition
      .mockRejectedValueOnce(new Error('FSM state lock timeout'))
      .mockResolvedValueOnce({
        id: 'wo-ok',
        status: WorkOrderStatus.APPROVED
      } as unknown as WorkOrderResponseDto);

    const processed = await slaService.runAutoApprovalSweep();

    expect(processed).toBe(1);
    expect(mockWorkOrdersService.transition).toHaveBeenCalledTimes(2);
  });
});
