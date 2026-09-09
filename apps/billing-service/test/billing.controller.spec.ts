import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { BillingController } from '../src/controllers/billing.controller';
import type { EscrowService } from '../src/modules/escrow/escrow.service';
import type { InvoicesService } from '../src/modules/invoices/invoices.service';
import type { JwtService } from '@nestjs/jwt';
import { UserRole } from '@fieldforge/contracts';
import type { DrizzleClient } from '@fieldforge/common';

describe('BillingController', () => {
  let controller: BillingController;
  let mockEscrowService: {
    lockFunds: jest.Mock;
    releaseFunds: jest.Mock;
    getEscrowByWorkOrder: jest.Mock;
  };
  let mockInvoicesService: {
    getInvoice: jest.Mock;
    generateInvoicePdf: jest.Mock;
  };
  let mockJwtService: {
    verify: jest.Mock;
  };
  let mockDb: Record<string, jest.Mock>;

  const BUYER_USER_ID = 'b1111111-1111-4111-8111-111111111111';
  const TECH_USER_ID = 't1111111-1111-4111-8111-111111111111';
  const WORK_ORDER_ID = 'wo-1111-2222-3333-4444';

  beforeEach(() => {
    mockEscrowService = {
      lockFunds: jest.fn().mockResolvedValue({
        id: 'escrow-1',
        workOrderId: WORK_ORDER_ID,
        amountLocked: '500.00',
        status: 'HELD'
      }),
      releaseFunds: jest.fn().mockResolvedValue({
        success: true,
        payoutId: 'pay-1',
        releasedAmountMinor: 50000,
        refundedAmountMinor: 0
      }),
      getEscrowByWorkOrder: jest.fn().mockResolvedValue({
        id: 'escrow-1',
        workOrderId: WORK_ORDER_ID,
        status: 'HELD'
      })
    };

    mockInvoicesService = {
      getInvoice: jest.fn().mockResolvedValue({
        id: 'inv-1',
        workOrderId: WORK_ORDER_ID
      }),
      generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 test'))
    };

    mockJwtService = {
      verify: jest.fn()
    };

    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ id: 'buyer-prof-1' }])
    };

    controller = new BillingController(
      mockEscrowService as unknown as EscrowService,
      mockInvoicesService as unknown as InvoicesService,
      mockJwtService as unknown as JwtService,
      mockDb as unknown as DrizzleClient
    );
  });

  describe('C5 Authentication and Anti-Spoofing Boundary', () => {
    it('throws UnauthorizedException when Authorization header is missing', async () => {
      await expect(controller.getEscrow(WORK_ORDER_ID, undefined, undefined)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws UnauthorizedException when gateway user ID does not match token sub', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: BUYER_USER_ID,
        email: 'buyer@fieldforge.dev',
        role: UserRole.BUYER
      });

      await expect(
        controller.getEscrow(WORK_ORDER_ID, 'Bearer valid.token', 'attacker-spoofed-user-id')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('allows authorized buyer to access escrow details', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: BUYER_USER_ID,
        email: 'buyer@fieldforge.dev',
        role: UserRole.BUYER
      });

      const res = await controller.getEscrow(WORK_ORDER_ID, 'Bearer valid.token', BUYER_USER_ID);

      expect(res.workOrderId).toBe(WORK_ORDER_ID);
      expect(mockEscrowService.getEscrowByWorkOrder).toHaveBeenCalledWith(WORK_ORDER_ID);
    });

    it('rejects non-buyer and non-admin from pre-authorizing escrow', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: TECH_USER_ID,
        email: 'tech@fieldforge.dev',
        role: UserRole.TECHNICIAN
      });

      await expect(
        controller.preAuthEscrow(
          { workOrderId: WORK_ORDER_ID, amountMinor: 50000, paymentMethodId: 'pm_test_123' },
          'Bearer tech.token',
          TECH_USER_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
