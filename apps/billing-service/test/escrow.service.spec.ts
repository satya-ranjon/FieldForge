import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException
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
        paymentMethodId: 'pm_card_default',
        idempotencyKey: `escrow-capture:${WORK_ORDER_ID}`
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

    it('forwards caller-supplied idempotencyKey directly to paymentProvider.captureEscrow with prefix', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]) // idempotency check: no existing key
          })
        })
      });

      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]) // escrow check: no existing escrow
          })
        })
      });

      const customKey = 'req-buyer-preauth-999';
      await escrow.lockFunds(
        WORK_ORDER_ID,
        BUYER_ID,
        45000,
        CORRELATION_ID,
        'pm_card_visa',
        customKey
      );

      expect(mockPaymentProvider.captureEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        amountMinor: 45000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: `escrow-capture:${customKey}`
      });
    });

    it('returns cached result when preauth idempotencyKey is already COMPLETED', async () => {
      const cached = {
        escrowId: 'escrow-cached-1',
        workOrderId: WORK_ORDER_ID,
        amountLockedMinor: 45000,
        status: EscrowStatus.HELD
      };

      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  key: 'preauth-completed-key',
                  status: 'COMPLETED',
                  responsePayload: cached
                }
              ])
          })
        })
      });

      const res = await escrow.lockFunds(
        WORK_ORDER_ID,
        BUYER_ID,
        45000,
        CORRELATION_ID,
        'pm_card_default',
        'preauth-completed-key'
      );

      expect(res).toEqual(cached);
      expect(mockPaymentProvider.captureEscrow).not.toHaveBeenCalled();
    });

    it('throws ConflictException when preauth idempotencyKey is IN_PROGRESS', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  key: 'preauth-in-progress-key',
                  status: 'IN_PROGRESS'
                }
              ])
          })
        })
      });

      await expect(
        escrow.lockFunds(
          WORK_ORDER_ID,
          BUYER_ID,
          45000,
          CORRELATION_ID,
          'pm_card_default',
          'preauth-in-progress-key'
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('releaseFunds (C3 resolution and transactional safety)', () => {
    beforeEach(() => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: BUYER_ID,
        assignedTechnicianId: TECH_ID
      });
      escrow.getProfileDirectory().setLocalProfile(BUYER_ID, 'BUYER', BUYER_ID);
    });

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

    it('rejects manual release with ConflictException and aborts before DB transaction when work order status is COMPLETED', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.COMPLETED,
        buyerId: 'owner-buyer-profile-id',
        assignedTechnicianId: TECH_ID
      });
      escrow
        .getProfileDirectory()
        .setLocalProfile('buyer-user-id', 'BUYER', 'owner-buyer-profile-id');

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'buyer-user-id',
          callerRole: 'BUYER',
          correlationId: CORRELATION_ID
        })
      ).rejects.toThrow(ConflictException);

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: 'buyer-user-id',
          callerRole: 'BUYER',
          correlationId: CORRELATION_ID
        })
      ).rejects.toThrow(
        `Work order must be APPROVED before escrow release: current status is ${WorkOrderStatus.COMPLETED}`
      );

      // Verify financial transaction and payment provider were NEVER reached
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockPaymentProvider.disbursePayout).not.toHaveBeenCalled();
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
        amountMinor: 45000,
        idempotencyKey: `escrow-payout:${WORK_ORDER_ID}`
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
        amountMinor: 35000,
        idempotencyKey: `escrow-payout:${WORK_ORDER_ID}`
      });

      // Verify buyer received automatic refund of the $150.00 unused remainder (15000 minor)
      expect(mockPaymentProvider.refundEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: 'owner-buyer-profile-id',
        amountMinor: 15000,
        reason: expect.stringContaining('Unused escrow balance refunded'),
        idempotencyKey: `escrow-remainder-refund:${WORK_ORDER_ID}`
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
        amountMinor: 35000,
        idempotencyKey: `escrow-payout:${WORK_ORDER_ID}`
      });
      expect(mockPaymentProvider.refundEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: 'owner-buyer-profile-id',
        amountMinor: 15000,
        reason: expect.stringContaining('Unused escrow balance refunded'),
        idempotencyKey: `escrow-remainder-refund:${WORK_ORDER_ID}`
      });
    });

    it('throws NotFoundException when work order is not found in directory (ISSUE-002)', async () => {
      escrow.getWorkOrderDirectory().clearCache();
      jest.spyOn(escrow.getWorkOrderDirectory(), 'getWorkOrder').mockResolvedValueOnce(null);

      await expect(
        escrow.releaseFunds({
          workOrderId: 'wo-unlisted',
          callerUserId: BUYER_ID,
          callerRole: 'BUYER'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('does NOT convert internal auth failure (401/403) into 404 NotFound (ISSUE-002)', async () => {
      escrow.getWorkOrderDirectory().clearCache();
      jest
        .spyOn(escrow.getWorkOrderDirectory(), 'getWorkOrder')
        .mockRejectedValueOnce(
          new InternalServerErrorException('Internal work-order service authentication failed')
        );

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: BUYER_ID,
          callerRole: 'BUYER'
        })
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('does NOT convert network/offline failure into 404 NotFound (ISSUE-002)', async () => {
      escrow.getWorkOrderDirectory().clearCache();
      jest
        .spyOn(escrow.getWorkOrderDirectory(), 'getWorkOrder')
        .mockRejectedValueOnce(
          new ServiceUnavailableException(
            'Internal work-order service unreachable: Connection refused'
          )
        );

      await expect(
        escrow.releaseFunds({
          workOrderId: WORK_ORDER_ID,
          callerUserId: BUYER_ID,
          callerRole: 'BUYER'
        })
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('bypasses WorkOrderDirectoryService when caller is SYSTEM with complete payload (ISSUE-002 / FR-BILL-002)', async () => {
      const dirSpy = jest.spyOn(escrow.getWorkOrderDirectory(), 'getWorkOrder');

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
        callerRole: 'SYSTEM',
        technicianId: TECH_ID,
        buyerId: BUYER_ID,
        amountMinor: 45000
      });

      expect(result.status).toBe(EscrowStatus.RELEASED);
      expect(dirSpy).not.toHaveBeenCalled();
    });
  });

  describe('getEscrowByWorkOrder', () => {
    it('accurately parses decimal amountLocked into minor units without floating-point drift', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 'escrow-99',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '123.45',
                  status: 'HELD',
                  createdAt: new Date('2026-09-01T00:00:00.000Z'),
                  releasedAt: null
                }
              ])
          })
        })
      });

      const details = await escrow.getEscrowByWorkOrder(WORK_ORDER_ID);

      expect(details.id).toBe('escrow-99');
      expect(details.workOrderId).toBe(WORK_ORDER_ID);
      expect(details.amountLockedMinor).toBe(12345);
      expect(details.status).toBe(EscrowStatus.HELD);
    });

    it('throws NotFoundException when escrow account is not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([])
          })
        })
      });

      await expect(escrow.getEscrowByWorkOrder('non-existent-wo')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getTechnicianEarnings', () => {
    it('aggregates credits and debits into exact integer minor units without float rounding errors', async () => {
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () =>
            Promise.resolve([
              {
                id: 'payout-1',
                technicianId: TECH_ID,
                workOrderId: 'wo-1',
                amount: '0.10',
                type: 'CREDIT',
                description: 'Minor service fee',
                createdAt: new Date('2026-09-01T00:00:00.000Z')
              },
              {
                id: 'payout-2',
                technicianId: TECH_ID,
                workOrderId: 'wo-2',
                amount: '0.20',
                type: 'CREDIT',
                description: 'Tip disbursement',
                createdAt: new Date('2026-09-02T00:00:00.000Z')
              },
              {
                id: 'payout-3',
                technicianId: TECH_ID,
                workOrderId: 'wo-3',
                amount: '0.05',
                type: 'DEBIT',
                description: 'Adjustment fee',
                createdAt: new Date('2026-09-03T00:00:00.000Z')
              }
            ])
        })
      });

      const earnings = await escrow.getTechnicianEarnings(TECH_ID);

      expect(earnings.technicianId).toBe(TECH_ID);
      // 10 + 20 - 5 = 25 minor units (0.10 + 0.20 - 0.05 in float is 0.25000000000000006)
      expect(earnings.totalEarningsMinor).toBe(25);
      expect(earnings.payouts).toHaveLength(3);
      expect(earnings.payouts[0].amountMinor).toBe(10);
      expect(earnings.payouts[1].amountMinor).toBe(20);
      expect(earnings.payouts[2].amountMinor).toBe(5);
    });
  });

  describe('refundEscrow', () => {
    it('refunds HELD escrow account, updates status to REFUNDED, and calls payment provider', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-held-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      const result = await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        reason: 'Work order cancelled by buyer',
        correlationId: CORRELATION_ID
      });

      expect(result).not.toBeNull();
      expect(result!.escrowId).toBe('escrow-held-1');
      expect(result!.workOrderId).toBe(WORK_ORDER_ID);
      expect(result!.refundedAmountMinor).toBe(45000);
      expect(result!.status).toBe(EscrowStatus.REFUNDED);

      expect(mockPaymentProvider.refundEscrow).toHaveBeenCalledWith({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        amountMinor: 45000,
        reason: 'Work order cancelled by buyer',
        idempotencyKey: `escrow-refund:${WORK_ORDER_ID}`
      });

      expect(mockTx.update).toHaveBeenCalled();
    });

    it('returns null and does not throw if no escrow account exists (e.g. cancelled in DRAFT)', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () => Promise.resolve([])
          })
        })
      });

      const result = await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        correlationId: CORRELATION_ID
      });

      expect(result).toBeNull();
      expect(mockPaymentProvider.refundEscrow).not.toHaveBeenCalled();
    });

    it('returns existing refund result as idempotent no-op if escrow is already REFUNDED', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-refunded-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'REFUNDED'
                }
              ])
          })
        })
      });

      const result = await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        correlationId: CORRELATION_ID
      });

      expect(result).not.toBeNull();
      expect(result!.status).toBe(EscrowStatus.REFUNDED);
      expect(result!.refundedAmountMinor).toBe(45000);
      expect(mockPaymentProvider.refundEscrow).not.toHaveBeenCalled();
    });

    it('skips refund and logs warning if escrow is already RELEASED', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-released-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'RELEASED'
                }
              ])
          })
        })
      });

      const result = await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        correlationId: CORRELATION_ID
      });

      expect(result).toBeNull();
      expect(mockPaymentProvider.refundEscrow).not.toHaveBeenCalled();
    });

    it('skips refund and logs warning if escrow is in DISPUTED status', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-disputed-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'DISPUTED'
                }
              ])
          })
        })
      });

      const result = await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        correlationId: CORRELATION_ID
      });

      expect(result).toBeNull();
      expect(mockPaymentProvider.refundEscrow).not.toHaveBeenCalled();
    });

    it('returns cached response when idempotency key is COMPLETED', async () => {
      const cachedResult = {
        escrowId: 'escrow-1',
        workOrderId: WORK_ORDER_ID,
        refundedAmountMinor: 45000,
        status: EscrowStatus.REFUNDED
      };

      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  key: 'idempotent-refund-1',
                  status: 'COMPLETED',
                  responsePayload: cachedResult
                }
              ])
          })
        })
      });

      const result = await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        idempotencyKey: 'idempotent-refund-1'
      });

      expect(result).toEqual(cachedResult);
      expect(mockPaymentProvider.refundEscrow).not.toHaveBeenCalled();
    });

    it('throws ConflictException when idempotency key is IN_PROGRESS', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  key: 'idempotent-refund-2',
                  status: 'IN_PROGRESS'
                }
              ])
          })
        })
      });

      await expect(
        escrow.refundEscrow({
          workOrderId: WORK_ORDER_ID,
          buyerId: BUYER_ID,
          idempotencyKey: 'idempotent-refund-2'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows and records failure metric when payment provider refund fails', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-held-fail',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      mockPaymentProvider.refundEscrow.mockRejectedValueOnce(
        new Error('Payment gateway refund failure')
      );

      await expect(
        escrow.refundEscrow({
          workOrderId: WORK_ORDER_ID,
          buyerId: BUYER_ID,
          reason: 'Work order cancelled'
        })
      ).rejects.toThrow('Payment gateway refund failure');
    });

    it('propagates caller-supplied idempotencyKey directly to paymentProvider.refundEscrow', async () => {
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => [] // idempotency check
          })
        })
      });

      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-held-2',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '450.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      const customKey = 'escrow-refund:custom-evt-uuid-999';
      await escrow.refundEscrow({
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        reason: 'Cancellation test',
        idempotencyKey: customKey
      });

      expect(mockPaymentProvider.refundEscrow).toHaveBeenCalledWith(
        expect.objectContaining({
          workOrderId: WORK_ORDER_ID,
          buyerId: BUYER_ID,
          idempotencyKey: customKey
        })
      );
    });
  });
});
