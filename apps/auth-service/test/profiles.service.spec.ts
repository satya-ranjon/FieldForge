import { NotFoundException } from '@nestjs/common';
import { ProfilesService } from '../src/modules/profiles/profiles.service';
import { UserRole, UserStatus, toMinor } from '@fieldforge/contracts';
import type { DrizzleClient, DbOrTx } from '@fieldforge/common';

interface MockDb {
  select: jest.Mock;
  insert: jest.Mock;
}

describe('ProfilesService', () => {
  let service: ProfilesService;
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn()
    };
    service = new ProfilesService(mockDb as unknown as DrizzleClient);
  });

  describe('provisionProfile', () => {
    it('provisions buyer profile in transaction', async () => {
      const mockTx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue({})
        })
      };

      const profileId = await service.provisionProfile(mockTx as unknown as DbOrTx, 'u-1', {
        email: 'buyer@example.com',
        password: 'Password123!',
        role: UserRole.BUYER,
        phoneNumber: '+15551234567',
        companyName: 'Acme Logistics'
      });

      expect(profileId).toBeDefined();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('provisions technician profile in transaction', async () => {
      const mockTx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue({})
        })
      };

      const profileId = await service.provisionProfile(mockTx as unknown as DbOrTx, 'u-2', {
        email: 'tech@example.com',
        password: 'Password123!',
        role: UserRole.TECHNICIAN,
        phoneNumber: '+15559876543',
        firstName: 'Alice',
        lastName: 'Cooper',
        hourlyRateMinor: toMinor(85)
      });

      expect(profileId).toBeDefined();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('returns undefined for roles without domain profile (e.g. ADMIN)', async () => {
      const mockTx = {
        insert: jest.fn()
      };

      const profileId = await service.provisionProfile(mockTx as unknown as DbOrTx, 'u-3', {
        email: 'admin@example.com',
        password: 'Password123!',
        role: UserRole.ADMIN,
        phoneNumber: '+15550000000'
      });

      expect(profileId).toBeUndefined();
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe('resolveProfileId', () => {
    it('resolves buyer profile ID for buyer role', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'bp-123' }])
          })
        })
      });

      const profileId = await service.resolveProfileId('u-1', UserRole.BUYER);
      expect(profileId).toBe('bp-123');
    });

    it('resolves technician profile ID for technician role', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'tp-456' }])
          })
        })
      });

      const profileId = await service.resolveProfileId('u-2', UserRole.TECHNICIAN);
      expect(profileId).toBe('tp-456');
    });

    it('returns undefined for roles without domain profiles', async () => {
      const profileId = await service.resolveProfileId('u-3', UserRole.ADMIN);
      expect(profileId).toBeUndefined();
    });

    it('returns undefined if profile record not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      const profileId = await service.resolveProfileId('u-1', UserRole.BUYER);
      expect(profileId).toBeUndefined();
    });
  });

  describe('resolveUserIdByProfileId', () => {
    it('resolves userId from buyer profile', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ userId: 'u-buyer-99' }])
          })
        })
      });

      const userId = await service.resolveUserIdByProfileId('bp-123', UserRole.BUYER);
      expect(userId).toBe('u-buyer-99');
    });

    it('resolves userId from technician profile', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ userId: 'u-tech-88' }])
          })
        })
      });

      const userId = await service.resolveUserIdByProfileId('tp-456', UserRole.TECHNICIAN);
      expect(userId).toBe('u-tech-88');
    });

    it('returns undefined if not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      const userId = await service.resolveUserIdByProfileId('tp-none', UserRole.TECHNICIAN);
      expect(userId).toBeUndefined();
    });
  });

  describe('getUserProfile', () => {
    it('throws NotFoundException when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await expect(service.getUserProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('returns user with buyerProfile for buyer role', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'u-1',
                  email: 'buyer@example.com',
                  role: UserRole.BUYER,
                  status: UserStatus.ACTIVE,
                  phoneNumber: '+15551234567'
                }
              ])
            })
          })
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'bp-1',
                  companyName: 'Acme Inc'
                }
              ])
            })
          })
        });

      const profile = await service.getUserProfile('u-1');
      expect(profile.id).toBe('u-1');
      expect(profile.email).toBe('buyer@example.com');
      expect('buyerProfile' in profile ? profile.buyerProfile : undefined).toEqual({
        id: 'bp-1',
        companyName: 'Acme Inc'
      });
    });

    it('returns user with technicianProfile for technician role', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'u-2',
                  email: 'tech@example.com',
                  role: UserRole.TECHNICIAN,
                  status: UserStatus.ACTIVE,
                  phoneNumber: '+15559876543'
                }
              ])
            })
          })
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'tp-1',
                  firstName: 'Bob',
                  lastName: 'Builder'
                }
              ])
            })
          })
        });

      const profile = await service.getUserProfile('u-2');
      expect(profile.id).toBe('u-2');
      expect('technicianProfile' in profile ? profile.technicianProfile : undefined).toEqual({
        id: 'tp-1',
        firstName: 'Bob',
        lastName: 'Builder'
      });
    });
  });
});
