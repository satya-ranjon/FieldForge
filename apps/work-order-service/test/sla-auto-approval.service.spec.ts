import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import type { DrizzleClient } from '@fieldforge/common';
import type { WorkOrderResponseDto } from '@fieldforge/contracts';
import { WorkOrderStatus } from '@fieldforge/contracts';
import { SlaAutoApprovalService } from '../src/modules/sla/sla-auto-approval.service';
import type { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';

describe('SlaAutoApprovalService (Work-Order-Service SRS FR-WO-005 / FR-BILL-002 / ISSUE-006)', () => {
  let slaService: SlaAutoApprovalService;
  let serviceLogger: Logger;
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
      }),
      findById: jest.fn().mockResolvedValue({
        id: 'wo-overdue',
        status: WorkOrderStatus.COMPLETED
      })
    } as unknown as jest.Mocked<WorkOrdersService>;

    slaService = new SlaAutoApprovalService(
      mockDb as unknown as DrizzleClient,
      mockWorkOrdersService
    );
    serviceLogger = (slaService as unknown as { logger: Logger }).logger;
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

    mockWorkOrdersService.findById.mockResolvedValueOnce({
      id: 'wo-err',
      status: WorkOrderStatus.COMPLETED
    } as unknown as WorkOrderResponseDto);

    const processed = await slaService.runAutoApprovalSweep();

    expect(processed).toBe(1);
    expect(mockWorkOrdersService.transition).toHaveBeenCalledTimes(2);
  });

  describe('ISSUE-006 Multi-Pod Concurrency & Stale Candidate Handling', () => {
    it('skips work order cleanly with DEBUG log when concurrently advanced to APPROVED', async () => {
      const debugSpy = jest.spyOn(serviceLogger, 'debug');
      const errorSpy = jest.spyOn(serviceLogger, 'error');

      const overdueWo = {
        id: 'wo-race-1',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
      };

      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([overdueWo])
        })
      });

      // Competing pod already transitioned to APPROVED; FSM rejects
      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new BadRequestException(
          'Invalid FSM transition: Cannot transition work order from APPROVED to APPROVED'
        )
      );

      // Re-read confirms work order is now APPROVED
      mockWorkOrdersService.findById.mockResolvedValueOnce({
        id: 'wo-race-1',
        status: WorkOrderStatus.APPROVED
      } as unknown as WorkOrderResponseDto);

      const processed = await slaService.runAutoApprovalSweep();

      expect(processed).toBe(0);
      expect(mockWorkOrdersService.findById).toHaveBeenCalledWith('wo-race-1');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'SLA auto-approval skipped for work order wo-race-1 because it was already advanced to status APPROVED'
        )
      );
    });

    it('skips work order cleanly when advanced beyond APPROVED (e.g. PAID)', async () => {
      const debugSpy = jest.spyOn(serviceLogger, 'debug');
      const errorSpy = jest.spyOn(serviceLogger, 'error');

      const overdueWo = {
        id: 'wo-paid-1',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
      };

      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([overdueWo])
        })
      });

      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new BadRequestException(
          'Invalid FSM transition: Cannot transition work order from PAID to APPROVED'
        )
      );

      mockWorkOrdersService.findById.mockResolvedValueOnce({
        id: 'wo-paid-1',
        status: WorkOrderStatus.PAID
      } as unknown as WorkOrderResponseDto);

      const processed = await slaService.runAutoApprovalSweep();

      expect(processed).toBe(0);
      expect(mockWorkOrdersService.findById).toHaveBeenCalledWith('wo-paid-1');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'SLA auto-approval skipped for work order wo-paid-1 because it was already advanced to status PAID'
        )
      );
    });

    it('preserves ERROR logging when work order transition failed while still COMPLETED (real failure)', async () => {
      const errorSpy = jest.spyOn(serviceLogger, 'error');
      const debugSpy = jest.spyOn(serviceLogger, 'debug');

      const overdueWo = {
        id: 'wo-stuck-1',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
      };

      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([overdueWo])
        })
      });

      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new Error('Outbox event constraint failure')
      );

      // Re-read confirms work order is STILL COMPLETED — genuine unexpected failure
      mockWorkOrdersService.findById.mockResolvedValueOnce({
        id: 'wo-stuck-1',
        status: WorkOrderStatus.COMPLETED
      } as unknown as WorkOrderResponseDto);

      const processed = await slaService.runAutoApprovalSweep();

      expect(processed).toBe(0);
      expect(debugSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to auto-approve work order wo-stuck-1: Outbox event constraint failure'
        ),
        expect.anything()
      );
    });

    it('logs WARN and continues when work order no longer exists during recheck', async () => {
      const warnSpy = jest.spyOn(serviceLogger, 'warn');
      const errorSpy = jest.spyOn(serviceLogger, 'error');

      const overdueWo = {
        id: 'wo-deleted-1',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
      };

      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([overdueWo])
        })
      });

      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new NotFoundException('Work order with ID wo-deleted-1 not found')
      );

      mockWorkOrdersService.findById.mockRejectedValueOnce(
        new NotFoundException('Work order with ID wo-deleted-1 not found')
      );

      const processed = await slaService.runAutoApprovalSweep();

      expect(processed).toBe(0);
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'SLA auto-approval skipped for work order wo-deleted-1 because work order no longer exists'
        )
      );
    });

    it('logs ERROR with original cause if re-reading state encounters a database failure', async () => {
      const errorSpy = jest.spyOn(serviceLogger, 'error');

      const overdueWo = {
        id: 'wo-db-fail',
        status: WorkOrderStatus.COMPLETED,
        updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
      };

      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([overdueWo])
        })
      });

      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new Error('Initial transition DB connection timeout')
      );

      mockWorkOrdersService.findById.mockRejectedValueOnce(
        new Error('Secondary recheck DB connection lost')
      );

      const processed = await slaService.runAutoApprovalSweep();

      expect(processed).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to auto-approve work order wo-db-fail: Initial transition DB connection timeout'
        ),
        expect.anything()
      );
    });

    it('processes a mixed batch with success, concurrent advance, and genuine failure independently', async () => {
      const debugSpy = jest.spyOn(serviceLogger, 'debug');
      const errorSpy = jest.spyOn(serviceLogger, 'error');

      const batch = [
        {
          id: 'wo-success',
          status: WorkOrderStatus.COMPLETED,
          updatedAt: new Date(Date.now() - 75 * 60 * 60 * 1000)
        },
        {
          id: 'wo-concurrent',
          status: WorkOrderStatus.COMPLETED,
          updatedAt: new Date(Date.now() - 74 * 60 * 60 * 1000)
        },
        {
          id: 'wo-failure',
          status: WorkOrderStatus.COMPLETED,
          updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000)
        }
      ];

      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve(batch)
        })
      });

      // WO-1: success
      mockWorkOrdersService.transition.mockResolvedValueOnce({
        id: 'wo-success',
        status: WorkOrderStatus.APPROVED
      } as unknown as WorkOrderResponseDto);

      // WO-2: concurrent advance
      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new BadRequestException('Already transitioned')
      );
      mockWorkOrdersService.findById.mockResolvedValueOnce({
        id: 'wo-concurrent',
        status: WorkOrderStatus.APPROVED
      } as unknown as WorkOrderResponseDto);

      // WO-3: real failure
      mockWorkOrdersService.transition.mockRejectedValueOnce(
        new Error('Lock wait timeout exceeded')
      );
      mockWorkOrdersService.findById.mockResolvedValueOnce({
        id: 'wo-failure',
        status: WorkOrderStatus.COMPLETED
      } as unknown as WorkOrderResponseDto);

      const processed = await slaService.runAutoApprovalSweep();

      expect(processed).toBe(1);
      expect(mockWorkOrdersService.transition).toHaveBeenCalledTimes(3);
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('SLA auto-approval skipped for work order wo-concurrent')
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to auto-approve work order wo-failure: Lock wait timeout exceeded'
        ),
        expect.anything()
      );
    });
  });
});
