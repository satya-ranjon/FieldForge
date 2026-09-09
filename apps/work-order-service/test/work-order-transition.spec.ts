import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { WorkOrderStatus, EventType } from '@fieldforge/contracts';
import { workOrders } from '@fieldforge/database';
import {
  resolveBuyerProfileId,
  resolveTechnicianProfileId,
  guardAssignedTransition,
  guardTechnicianLifecycleTransition,
  guardOnSiteTransition,
  guardApprovedTransition,
  guardCancelledTransition,
  guardDisputedTransition,
  guardPaidTransition,
  executeApprovedTransition,
  executeDefaultTransition,
  type TransitionContext
} from '../src/modules/work-orders/work-order-transition';
import type { AssignmentDbTx } from '../src/modules/work-orders/work-order-assignment';

interface MockTx {
  update: jest.Mock;
  insert: jest.Mock;
  select: jest.Mock;
}

describe('work-order-transition strategies & guards', () => {
  let mockTx: MockTx;
  let baseContext: TransitionContext;
  let mockFsmService: { validateTransition: jest.Mock };
  let mockEventPublisher: {
    publishWorkOrderAssigned: jest.Mock;
    publishWorkOrderApproved: jest.Mock;
  };

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
      publishWorkOrderAssigned: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderApproved: jest.fn().mockResolvedValue(undefined)
    };

    baseContext = {
      tx: mockTx as unknown as AssignmentDbTx,
      wo: {
        id: 'wo-1',
        buyerId: 'buyer-profile-1',
        assignedTechnicianId: 'tech-profile-1',
        status: WorkOrderStatus.PUBLISHED,
        latitude: '37.7749',
        longitude: '-122.4194',
        budgetAmount: '500.00'
      } as unknown as typeof workOrders.$inferSelect,
      userId: 'user-1',
      role: 'BUYER',
      dto: { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: 'tech-profile-1' },
      correlationId: 'corr-1',
      currentStatus: WorkOrderStatus.PUBLISHED,
      nextStatus: WorkOrderStatus.ASSIGNED
    };
  });

  describe('profile resolvers', () => {
    it('resolveBuyerProfileId returns cached callerProfileId without DB query', async () => {
      const result = await resolveBuyerProfileId(
        mockTx as unknown as AssignmentDbTx,
        'user-1',
        'cached-buyer-id'
      );
      expect(result).toBe('cached-buyer-id');
      expect(mockTx.select).not.toHaveBeenCalled();
    });

    it('resolveBuyerProfileId queries DB when callerProfileId is omitted', async () => {
      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'db-buyer-id' }])
      });

      const result = await resolveBuyerProfileId(mockTx as unknown as AssignmentDbTx, 'user-1');
      expect(result).toBe('db-buyer-id');
      expect(mockTx.select).toHaveBeenCalled();
    });

    it('resolveTechnicianProfileId returns cached callerProfileId without DB query', async () => {
      const result = await resolveTechnicianProfileId(
        mockTx as unknown as AssignmentDbTx,
        'user-2',
        'cached-tech-id'
      );
      expect(result).toBe('cached-tech-id');
      expect(mockTx.select).not.toHaveBeenCalled();
    });

    it('resolveTechnicianProfileId queries DB when callerProfileId is omitted', async () => {
      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'db-tech-id' }])
      });

      const result = await resolveTechnicianProfileId(
        mockTx as unknown as AssignmentDbTx,
        'user-2'
      );
      expect(result).toBe('db-tech-id');
      expect(mockTx.select).toHaveBeenCalled();
    });
  });

  describe('guardAssignedTransition', () => {
    it('allows ADMIN or DISPATCHER without buyer check', async () => {
      await expect(
        guardAssignedTransition({ ...baseContext, role: 'ADMIN' })
      ).resolves.toBeUndefined();
      await expect(
        guardAssignedTransition({ ...baseContext, role: 'DISPATCHER' })
      ).resolves.toBeUndefined();
    });

    it('allows owning BUYER', async () => {
      await expect(
        guardAssignedTransition({ ...baseContext, callerProfileId: 'buyer-profile-1' })
      ).resolves.toBeUndefined();
    });

    it('rejects non-owning BUYER', async () => {
      await expect(
        guardAssignedTransition({ ...baseContext, callerProfileId: 'different-buyer' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects unauthorized role', async () => {
      await expect(guardAssignedTransition({ ...baseContext, role: 'TECHNICIAN' })).rejects.toThrow(
        ForbiddenException
      );
    });

    it('rejects when assignedTechnicianId is missing from both DTO and existing work order', async () => {
      const contextWithoutTech = {
        ...baseContext,
        role: 'ADMIN',
        wo: {
          ...baseContext.wo,
          assignedTechnicianId: null
        } as unknown as typeof workOrders.$inferSelect,
        dto: { nextStatus: WorkOrderStatus.ASSIGNED }
      };
      await expect(guardAssignedTransition(contextWithoutTech)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('guardTechnicianLifecycleTransition', () => {
    it('allows ADMIN', async () => {
      await expect(
        guardTechnicianLifecycleTransition({ ...baseContext, role: 'ADMIN' })
      ).resolves.toBeUndefined();
    });

    it('allows assigned technician', async () => {
      await expect(
        guardTechnicianLifecycleTransition({
          ...baseContext,
          role: 'TECHNICIAN',
          callerProfileId: 'tech-profile-1'
        })
      ).resolves.toBeUndefined();
    });

    it('rejects unassigned technician', async () => {
      await expect(
        guardTechnicianLifecycleTransition({
          ...baseContext,
          role: 'TECHNICIAN',
          callerProfileId: 'other-tech'
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('guardOnSiteTransition', () => {
    it('rejects missing coordinates', async () => {
      const ctx = {
        ...baseContext,
        role: 'ADMIN',
        dto: { nextStatus: WorkOrderStatus.ON_SITE }
      };
      await expect(guardOnSiteTransition(ctx)).rejects.toThrow(BadRequestException);
    });

    it('rejects coordinates outside 200m geofence tolerance', async () => {
      const ctx = {
        ...baseContext,
        role: 'ADMIN',
        dto: {
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: 37.78, // ~600m away from 37.7749
          longitude: -122.4194
        }
      };
      await expect(guardOnSiteTransition(ctx)).rejects.toThrow(/outside 200m geofence tolerance/);
    });

    it('accepts coordinates within 200m geofence tolerance', async () => {
      const ctx = {
        ...baseContext,
        role: 'ADMIN',
        dto: {
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: 37.775, // ~15m away
          longitude: -122.4194
        }
      };
      await expect(guardOnSiteTransition(ctx)).resolves.toBeUndefined();
    });
  });

  describe('guardApprovedTransition', () => {
    it('allows ADMIN or SYSTEM', async () => {
      await expect(
        guardApprovedTransition({ ...baseContext, role: 'ADMIN' })
      ).resolves.toBeUndefined();
      await expect(
        guardApprovedTransition({ ...baseContext, role: 'SYSTEM' })
      ).resolves.toBeUndefined();
    });

    it('allows owning BUYER and rejects non-owning BUYER', async () => {
      await expect(
        guardApprovedTransition({ ...baseContext, callerProfileId: 'buyer-profile-1' })
      ).resolves.toBeUndefined();

      await expect(
        guardApprovedTransition({ ...baseContext, callerProfileId: 'stranger' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('guardCancelledTransition', () => {
    it('rejects TECHNICIAN from cancelling', async () => {
      await expect(
        guardCancelledTransition({ ...baseContext, role: 'TECHNICIAN' })
      ).rejects.toThrow('Technicians cannot cancel work orders');
    });

    it('allows owning BUYER and rejects non-owning BUYER', async () => {
      await expect(
        guardCancelledTransition({ ...baseContext, callerProfileId: 'buyer-profile-1' })
      ).resolves.toBeUndefined();

      await expect(
        guardCancelledTransition({ ...baseContext, callerProfileId: 'other-buyer' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('guardDisputedTransition', () => {
    it('allows owning BUYER, assigned TECHNICIAN, ADMIN, and DISPATCHER', async () => {
      await expect(
        guardDisputedTransition({
          ...baseContext,
          role: 'BUYER',
          callerProfileId: 'buyer-profile-1'
        })
      ).resolves.toBeUndefined();

      await expect(
        guardDisputedTransition({
          ...baseContext,
          role: 'TECHNICIAN',
          callerProfileId: 'tech-profile-1'
        })
      ).resolves.toBeUndefined();

      await expect(
        guardDisputedTransition({ ...baseContext, role: 'ADMIN' })
      ).resolves.toBeUndefined();
      await expect(
        guardDisputedTransition({ ...baseContext, role: 'DISPATCHER' })
      ).resolves.toBeUndefined();
    });

    it('rejects unauthorized roles or users', async () => {
      await expect(
        guardDisputedTransition({
          ...baseContext,
          role: 'BUYER',
          callerProfileId: 'foreign-buyer'
        })
      ).rejects.toThrow(ForbiddenException);

      await expect(guardDisputedTransition({ ...baseContext, role: 'UNKNOWN' })).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('guardPaidTransition', () => {
    it('always rejects direct transition to PAID via API', () => {
      expect(() => guardPaidTransition()).toThrow(ForbiddenException);
    });
  });

  describe('execution strategies', () => {
    it('executeDefaultTransition updates workOrders and inserts status history', async () => {
      const result = await executeDefaultTransition({
        ...baseContext,
        nextStatus: WorkOrderStatus.EN_ROUTE,
        dto: { nextStatus: WorkOrderStatus.EN_ROUTE, reason: 'Technician driving' }
      });

      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
      expect(result.updatedRow.status).toBe(WorkOrderStatus.EN_ROUTE);
      expect(result.eventsToPublish).toHaveLength(0);
    });

    it('executeApprovedTransition records approval, resolves rate, and returns publishApproved event callback', async () => {
      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ bidAmount: '450.00' }])
      });

      const result = await executeApprovedTransition(
        {
          ...baseContext,
          nextStatus: WorkOrderStatus.APPROVED,
          dto: { nextStatus: WorkOrderStatus.APPROVED, reason: 'Job well done' }
        },
        mockFsmService,
        mockEventPublisher
      );

      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
      expect(result.updatedRow.status).toBe(WorkOrderStatus.APPROVED);
      expect(result.eventsToPublish).toHaveLength(1);

      await result.eventsToPublish[0]();
      expect(mockEventPublisher.publishWorkOrderApproved).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.WORK_ORDER_APPROVED,
          payload: expect.objectContaining({
            workOrderId: 'wo-1',
            buyerId: 'buyer-profile-1',
            technicianId: 'tech-profile-1',
            payoutAmountMinor: 45000
          })
        })
      );
    });
  });
});
