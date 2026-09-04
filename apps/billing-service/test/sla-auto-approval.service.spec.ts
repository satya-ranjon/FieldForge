import type { DrizzleClient } from '@fieldforge/common';
import { SlaAutoApprovalService } from '../src/modules/sla/sla-auto-approval.service';
import type { EscrowService } from '../src/modules/escrow/escrow.service';

describe('SlaAutoApprovalService (FR-BILL-002)', () => {
  let slaService: SlaAutoApprovalService;
  let mockDb: {
    select: jest.Mock;
    transaction: jest.Mock;
  };
  let mockTx: {
    update: jest.Mock;
    insert: jest.Mock;
  };
  let mockEscrowService: jest.Mocked<EscrowService>;

  beforeEach(() => {
    mockTx = {
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) })
      }),
      insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) })
    };

    mockDb = {
      select: jest.fn(),
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockTx))
    };

    mockEscrowService = {
      releaseFunds: jest.fn().mockResolvedValue({
        workOrderId: 'wo-overdue',
        techId: 'tech-1',
        disbursedAmountMinor: 45000,
        status: 'RELEASED'
      })
    } as unknown as jest.Mocked<EscrowService>;

    slaService = new SlaAutoApprovalService(mockDb as unknown as DrizzleClient, mockEscrowService);
  });

  it('sweeps and auto-approves overdue completed work orders and releases escrow', async () => {
    const overdueWo = {
      id: 'wo-overdue',
      status: 'COMPLETED',
      updatedAt: new Date(Date.now() - 73 * 60 * 60 * 1000) // 73 hours ago
    };

    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([overdueWo])
      })
    });

    const processed = await slaService.runAutoApprovalSweep();

    expect(processed).toBe(1);
    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockEscrowService.releaseFunds).toHaveBeenCalledWith(
      expect.objectContaining({
        workOrderId: 'wo-overdue',
        callerUserId: 'system',
        callerRole: 'SYSTEM'
      })
    );
  });

  it('does nothing when no work orders have exceeded the 72-hour threshold', async () => {
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([])
      })
    });

    const processed = await slaService.runAutoApprovalSweep();

    expect(processed).toBe(0);
    expect(mockEscrowService.releaseFunds).not.toHaveBeenCalled();
  });
});
