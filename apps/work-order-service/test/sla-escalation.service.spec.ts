import { SlaEscalationService } from '../src/modules/sla/sla-escalation.service';
import type { DrizzleClient } from '@fieldforge/common';

describe('SlaEscalationService (FR-WO-003 / M8)', () => {
  let service: SlaEscalationService;
  let mockDb: Record<string, jest.Mock>;

  beforeEach(() => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([])
    };
    service = new SlaEscalationService(mockDb as unknown as DrizzleClient);
  });

  describe('checkSlaBreachRisk', () => {
    it('returns TRUE for orders already past SLA expiration (resolving M8)', () => {
      // Previously, checkSlaBreachRisk returned `timeRemainingMs <= warningWindowMs && timeRemainingMs > 0`
      // which returned FALSE for already-breached orders, ignoring exactly the breached orders.
      const alreadyBreachedTime = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
      expect(service.checkSlaBreachRisk(alreadyBreachedTime)).toBe(true);
    });

    it('returns TRUE for orders expiring right now', () => {
      const expiringNow = new Date(Date.now() - 10);
      expect(service.checkSlaBreachRisk(expiringNow)).toBe(true);
    });

    it('returns TRUE for orders within warning window (e.g. 45 min remaining in 60 min window)', () => {
      const withinWindowTime = new Date(Date.now() + 45 * 60 * 1000);
      expect(service.checkSlaBreachRisk(withinWindowTime, 60)).toBe(true);
    });

    it('returns FALSE for orders comfortably within SLA (e.g. 120 min remaining in 60 min window)', () => {
      const safeTime = new Date(Date.now() + 120 * 60 * 1000);
      expect(service.checkSlaBreachRisk(safeTime, 60)).toBe(false);
    });
  });

  describe('isBreached', () => {
    it('returns true if expired and false if future', () => {
      expect(service.isBreached(new Date(Date.now() - 1000))).toBe(true);
      expect(service.isBreached(new Date(Date.now() + 60000))).toBe(false);
    });
  });

  describe('sweepSlaBreaches', () => {
    it('scans active orders and reports breached count', async () => {
      const mockOrders = [
        {
          id: 'wo-breached',
          status: 'PUBLISHED',
          slaExpirationTime: new Date(Date.now() - 10 * 60 * 1000)
        },
        {
          id: 'wo-warning',
          status: 'ASSIGNED',
          slaExpirationTime: new Date(Date.now() + 20 * 60 * 1000)
        },
        {
          id: 'wo-safe',
          status: 'PUBLISHED',
          slaExpirationTime: new Date(Date.now() + 300 * 60 * 1000)
        }
      ];

      mockDb.where.mockResolvedValueOnce(mockOrders);

      const result = await service.sweepSlaBreaches();
      expect(result.checked).toBe(3);
      expect(result.breachedCount).toBe(1);
    });
  });
});
