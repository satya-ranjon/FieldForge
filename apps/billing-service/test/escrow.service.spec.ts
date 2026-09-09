import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { EscrowStatus, EventType, WorkOrderStatus } from '@fieldforge/contracts';
import type { DrizzleClient, DrizzleTransaction } from '@fieldforge/common';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import type { PaymentProviderPort } from '../src/modules/payments/payment-provider.port';
import type { InvoicesService } from '../src/modules/invoices/invoices.service';
import type { EventPublisher } from '@fieldforge/messaging';

const WORK_ORDER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const BUYER_ID = 'b0000000-0000-4000-8000-000000000001';
const TECH_ID = 't0000000-0000-4000-8000-000000000001';
const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';

type MockDbClient = {
  transaction: jest.Mock;
  select: jest.Mock;
};

describe('EscrowService', () => {
  let escrow: EscrowService;
  let mockDb: MockDbClient;
  let mockTx: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };
  let mockPaymentProvider: jest.Mocked<PaymentProviderPort>;
  let mockInvoicesService: jest.Mocked<InvoicesService>;
  let mockProducer: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    mockTx = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) })
      })
    };

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: DrizzleTransaction) => Promise<unknown>) =>
          cb(mockTx as unknown as DrizzleTransaction)
        ),
      select: jest.fn()
    };

    mockPaymentProvider = {
      captureEscrow: jest.fn().mockResolvedValue({ transactionId: 'tx-1', success: true }),
      disbursePayout: jest.fn().mockResolvedValue({ transactionId: 'tx-2', success: true }),
      refundEscrow: jest.fn().mockResolvedValue({ transactionId: 'tx-3', success: true })
    };

    mockInvoicesService = {
      generateInvoiceWithTx: jest.fn().mockResolvedValue({
        id: 'inv-123',
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        invoiceNumber: 'INV-2026-ABC12345',
        amountMinor: 45000,
        contentHash: 'hash-abc',
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }),
      getInvoice: jest.fn(),
      getInvoiceByWorkOrder: jest.fn(),
      generateInvoicePdf: jest.fn(),
      computeContentHash: jest.fn()
    } as unknown as jest.Mocked<InvoicesService>;

    mockProducer = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventPublisher>;

    escrow = new EscrowService(
      mockDb as unknown as DrizzleClient,
      mockPaymentProvider,
      mockInvoicesService,
      mockProducer
    );
  });

  describe('lockFunds', () => {
    it('opens the hold in HELD status and captures escrow with payment provider', async () => {
      // Simulate no existing escrow account
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([])
          })
        })
      });

      const held = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);

      expect(held.status).toBe(EscrowStatus.HELD);
      expect(held.amountLockedMinor).toBe(45000);
      expect(held.workOrderId).toBe(WORK_ORDER_ID);
      expect(held.escrowId).toBeDefined();

      expect(mockPaymentProvider.captureEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        amountMinor: 45000,
        paymentMethodId: 'pm_card_default'
      });
      expect(mockProducer.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ESCROW_FUNDED,
          payload: expect.objectContaining({
            workOrderId: WORK_ORDER_ID,
            amountMinor: 45000
          })
        })
      );
    });

    it('rejects duplicate escrow hold if one already exists (enforcing 1:1 invariant)', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                { id: 'existing-escrow', workOrderId: WORK_ORDER_ID, status: 'HELD' }
              ])
          })
        })
      });

      await expect(
        escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('releaseFunds (C3 resolution and transactional safety)', () => {
    it('returns cached result when idempotency key is already COMPLETED', async () => {
      const cachedResult = {
        workOrderId: WORK_ORDER_ID,
        technicianId: TECH_ID,
        disbursedAmountMinor: 45000,
        status: EscrowStatus.RELEASED,
        invoiceId: 'inv-cached'
      };

      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  key: 'idempotent-key-1',
                  status: 'COMPLETED',
                  responsePayload: cachedResult
                }
              ])
          })
        })
      });

      const result = await escrow.releaseFunds({
        workOrderId: WORK_ORDER_ID,
        callerUserId: BUYER_ID,
        callerRole: 'BUYER',
        idempotencyKey: 'idempotent-key-1'
      });

      expect(result).toEqual(cachedResult);
      expect(mockPaymentProvider.disbursePayout).not.toHaveBeenCalled();
    });

    it('throws ConflictException when idempotency key is IN_PROGRESS', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  key: 'idempotent-key-1',
                  status: 'IN_PROGRESS'
                }
              ])
          })
        })
      });

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: BUYER_ID,
          callerRole: 'BUYER',
          idempotencyKey: 'idempotent-key-1'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if escrow account does not exist', async () => {
      // 1. Escrow lock FOR UPDATE returns empty
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () => Promise.resolve([])
          })
        })
      });

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'system',
          callerRole: 'SYSTEM'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if escrow status is not HELD', async () => {
      // 1. Escrow lock returns status RELEASED
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'RELEASED'
                }
              ])
          })
        })
      });

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'system',
          callerRole: 'SYSTEM'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if work order is not in APPROVED status', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.COMPLETED,
        buyerId: BUYER_ID,
        assignedTechnicianId: TECH_ID
      });

      // 1. Escrow lock returns HELD
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'system',
          callerRole: 'SYSTEM'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException if non-admin caller is not the owner buyer', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'buyer-owner-profile-id',
        assignedTechnicianId: TECH_ID
      });
      escrow
        .getProfileDirectory()
        .setLocalProfile('attacker-user-id', 'BUYER', 'different-buyer-profile-id');

      // 1. Escrow lock returns HELD
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'attacker-user-id',
          callerRole: 'BUYER'
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('successfully releases funds when work order is APPROVED and caller is authorized', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'owner-buyer-profile-id',
        assignedTechnicianId: TECH_ID
      });
      escrow
        .getProfileDirectory()
        .setLocalProfile('buyer-user-id', 'BUYER', 'owner-buyer-profile-id');

      // 1. Escrow lock returns HELD
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      const result = await escrow.releaseFunds({
        workOrderId: WORK_ORDER_ID,
        callerUserId: 'buyer-user-id',
        callerRole: 'BUYER',
        correlationId: CORRELATION_ID
      });

      expect(result.status).toBe(EscrowStatus.RELEASED);
      expect(result.disbursedAmountMinor).toBe(45000);
      expect(result.technicianId).toBe(TECH_ID);
      expect(result.invoiceId).toBe('inv-123');

      // Assert disbursePayout was called
      expect(mockPaymentProvider.disbursePayout).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        technicianId: TECH_ID,
        amountMinor: 45000
      });

      // Assert invoice generated
      expect(mockInvoicesService.generateInvoiceWithTx).toHaveBeenCalled();

      // Assert PAYOUT_DISBURSED published
      expect(mockProducer.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.PAYOUT_DISBURSED,
          payload: expect.objectContaining({
            workOrderId: WORK_ORDER_ID,
            technicianId: TECH_ID,
            amountMinor: 45000
          })
        })
      );
    });

    it('successfully releases funds when callerProfileId is provided directly (bypassing buyer profile query)', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'direct-profile-id',
        assignedTechnicianId: TECH_ID
      });

      // 1. Escrow lock returns HELD
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      const result = await escrow.releaseFunds({
        workOrderId: WORK_ORDER_ID,
        callerUserId: 'buyer-user-id',
        callerRole: 'BUYER',
        correlationId: CORRELATION_ID,
        callerProfileId: 'direct-profile-id'
      });

      expect(result.status).toBe(EscrowStatus.RELEASED);
      expect(result.disbursedAmountMinor).toBe(45000);
    });

    it('successfully releases partial funds when amountMinor < amountLocked, refunding unused remainder to buyer (FF-ARCH-13)', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'owner-buyer-profile-id',
        assignedTechnicianId: TECH_ID
      });
      escrow
        .getProfileDirectory()
        .setLocalProfile('buyer-user-id', 'BUYER', 'owner-buyer-profile-id');

      // 1. Escrow lock returns HELD with 500.00 locked ($500)
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '500.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      // Release agreed $350.00 (35000 minor)
      const result = await escrow.releaseFunds({
        workOrderId: WORK_ORDER_ID,
        callerUserId: 'buyer-user-id',
        callerRole: 'BUYER',
        correlationId: CORRELATION_ID,
        amountMinor: 35000
      });

      expect(result.status).toBe(EscrowStatus.RELEASED);
      expect(result.disbursedAmountMinor).toBe(35000);

      // Verify technician received exactly $350.00 (35000 minor)
      expect(mockPaymentProvider.disbursePayout).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        technicianId: TECH_ID,
        amountMinor: 35000
      });

      // Verify buyer received automatic refund of the $150.00 unused remainder (15000 minor)
      expect(mockPaymentProvider.refundEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: 'owner-buyer-profile-id',
        amountMinor: 15000,
        reason: expect.stringContaining('Unused escrow balance refunded')
      });

      // Verify invoice generated for agreed payout amount
      expect(mockInvoicesService.generateInvoiceWithTx).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          workOrderId: WORK_ORDER_ID,
          buyerId: 'owner-buyer-profile-id',
          amountMinor: 35000
        })
      );

      // Verify PAYOUT_DISBURSED published with buyerId and agreed amount
      expect(mockProducer.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.PAYOUT_DISBURSED,
          payload: expect.objectContaining({
            workOrderId: WORK_ORDER_ID,
            buyerId: 'owner-buyer-profile-id',
            technicianId: TECH_ID,
            amountMinor: 35000
          })
        })
      );
    });

    it('throws BadRequestException when requested amountMinor exceeds locked escrow amount (FF-ARCH-13)', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'owner-buyer-profile-id',
        assignedTechnicianId: TECH_ID
      });

      // 1. Escrow lock returns HELD with 450.00 locked ($450)
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      // Attempting to release 500.00 (50000 minor) against 450.00 locked
      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'system',
          callerRole: 'SYSTEM',
          amountMinor: 50000
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when requested amountMinor is less than or equal to zero (FF-ARCH-13)', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'owner-buyer-profile-id',
        assignedTechnicianId: TECH_ID
      });

      // 1. Escrow lock returns HELD
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'system',
          callerRole: 'SYSTEM',
          amountMinor: 0
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('supports positional call signature and forwards legacyAmountMinor into disbursement (FF-ARCH-13)', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: 'owner-buyer-profile-id',
        assignedTechnicianId: TECH_ID
      });

      // 1. Escrow lock returns HELD with 500.00 locked
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '500.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      const result = await escrow.releaseFunds(WORK_ORDER_ID, TECH_ID, 35000, CORRELATION_ID);

      expect(result.status).toBe(EscrowStatus.RELEASED);
      expect(result.disbursedAmountMinor).toBe(35000);
      expect(mockPaymentProvider.disbursePayout).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        technicianId: TECH_ID,
        amountMinor: 35000
      });
      expect(mockPaymentProvider.refundEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: 'owner-buyer-profile-id',
        amountMinor: 15000,
        reason: expect.stringContaining('Unused escrow balance refunded')
      });
    });
  });
});
