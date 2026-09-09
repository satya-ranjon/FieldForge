import { BadRequestException } from '@nestjs/common';
import { WorkOrderStatus, EventType } from '@fieldforge/contracts';
import {
  executeWorkOrderAssignment,
  resolveAgreedRateMinor,
  type AssignmentDbTx
} from '../src/modules/work-orders/work-order-assignment';

interface MockTx {
  update: jest.Mock;
  insert: jest.Mock;
  select: jest.Mock;
}

describe('work-order-assignment helper', () => {
  let mockTx: MockTx;
  let mockFsmService: { validateTransition: jest.Mock };
  let mockEventPublisher: { publishWorkOrderAssigned: jest.Mock };

  beforeEach(() => {
    mockTx = {
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      }),
      select: jest.fn()
    };

    mockFsmService = {
      validateTransition: jest.fn()
    };

    mockEventPublisher = {
      publishWorkOrderAssigned: jest.fn().mockResolvedValue(undefined)
    };
  });

  describe('executeWorkOrderAssignment', () => {
    it('executes transition to ASSIGNED, logs status history, and constructs event publish callback', async () => {
      const result = await executeWorkOrderAssignment(
        mockTx as unknown as AssignmentDbTx,
        mockFsmService,
        mockEventPublisher,
        {
          workOrderId: 'wo-123',
          technicianId: 'tech-456',
          fromStatus: WorkOrderStatus.PUBLISHED,
          changedBy: 'user-buyer-1',
          reason: 'Bid accepted ($350.00)',
          agreedRateMinor: 35000,
          correlationId: 'corr-xyz',
          validateFsm: true
        }
      );

      // 1. FSM transition validation
      expect(mockFsmService.validateTransition).toHaveBeenCalledWith(
        WorkOrderStatus.PUBLISHED,
        WorkOrderStatus.ASSIGNED
      );

      // 2. Database updates
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();

      // 3. Event construction
      expect(result.event).toBeDefined();
      expect(result.event.eventType).toBe(EventType.WORK_ORDER_ASSIGNED);
      expect(result.event.payload).toEqual({
        workOrderId: 'wo-123',
        technicianId: 'tech-456',
        agreedRateMinor: 35000
      });
      expect(result.event.correlationId).toBe('corr-xyz');

      // 4. Publish callback execution
      await result.publishEvent();
      expect(mockEventPublisher.publishWorkOrderAssigned).toHaveBeenCalledWith(result.event);
    });

    it('skips FSM validation when validateFsm is explicitly false', async () => {
      await executeWorkOrderAssignment(
        mockTx as unknown as AssignmentDbTx,
        mockFsmService,
        mockEventPublisher,
        {
          workOrderId: 'wo-123',
          technicianId: 'tech-456',
          fromStatus: WorkOrderStatus.DRAFT,
          changedBy: 'user-admin',
          agreedRateMinor: 20000,
          correlationId: 'corr-abc',
          validateFsm: false
        }
      );

      expect(mockFsmService.validateTransition).not.toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('propagates FSM validation errors without updating database', async () => {
      mockFsmService.validateTransition.mockImplementation(() => {
        throw new BadRequestException('Invalid transition from COMPLETED to ASSIGNED');
      });

      await expect(
        executeWorkOrderAssignment(
          mockTx as unknown as AssignmentDbTx,
          mockFsmService,
          mockEventPublisher,
          {
            workOrderId: 'wo-123',
            technicianId: 'tech-456',
            fromStatus: WorkOrderStatus.COMPLETED,
            changedBy: 'user-1',
            agreedRateMinor: 10000,
            correlationId: 'corr-err'
          }
        )
      ).rejects.toThrow(BadRequestException);

      expect(mockTx.update).not.toHaveBeenCalled();
      expect(mockTx.insert).not.toHaveBeenCalled();
      expect(mockEventPublisher.publishWorkOrderAssigned).not.toHaveBeenCalled();
    });
  });

  describe('resolveAgreedRateMinor', () => {
    it('returns accepted bid amount converted to minor units when present', async () => {
      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ bidAmount: '375.50' }])
      });

      const rate = await resolveAgreedRateMinor(
        mockTx as unknown as AssignmentDbTx,
        'wo-123',
        '500.00'
      );
      expect(rate).toBe(37550);
    });

    it('falls back to budget amount when no accepted bid exists', async () => {
      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const rate = await resolveAgreedRateMinor(
        mockTx as unknown as AssignmentDbTx,
        'wo-123',
        '500.00'
      );
      expect(rate).toBe(50000);
    });

    it('returns 0 when neither accepted bid nor fallback budget is provided', async () => {
      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const rate = await resolveAgreedRateMinor(
        mockTx as unknown as AssignmentDbTx,
        'wo-123',
        null
      );
      expect(rate).toBe(0);
    });
  });
});
