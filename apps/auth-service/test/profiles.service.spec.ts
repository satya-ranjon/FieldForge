import { NotFoundException } from '@nestjs/common';
import { ProfilesService } from '../src/modules/profiles/profiles.service';
import { UserRole, UserStatus, toMinor } from '@fieldforge/contracts';
import type { DrizzleClient, DbOrTx } from '@fieldforge/common';

interface MockQueryBuilder<T = unknown> {
  from: jest.Mock<MockQueryBuilder<T>, [unknown]>;
  where: jest.Mock<MockQueryBuilder<T>, [unknown]>;
  limit: jest.Mock<Promise<T[]>, [number]>;
}

interface MockDb {
  select: jest.Mock<MockQueryBuilder, [unknown?]>;
  insert: jest.Mock;
}

function createQueryChain<T>(results: T[] = []): MockQueryBuilder<T> {
  const chain: MockQueryBuilder<T> = {
    from: jest.fn().mockImplementation(() => chain),
    where: jest.fn().mockImplementation(() => chain),
    limit: jest.fn().mockResolvedValue(results)
  };
  return chain;
}

function createMockDb(): MockDb {
  return {
    select: jest.fn().mockImplementation(() => createQueryChain([])),
    insert: jest.fn()
  };
}

describe('ProfilesService', () => {
  let service: ProfilesService;
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
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
      mockDb.select.mockReturnValue(createQueryChain([{ id: 'bp-123' }]));

      const profileId = await service.resolveProfileId('u-1', UserRole.BUYER);
      expect(profileId).toBe('bp-123');
    });

    it('resolves technician profile ID for technician role', async () => {
      mockDb.select.mockReturnValue(createQueryChain([{ id: 'tp-456' }]));

      const profileId = await service.resolveProfileId('u-2', UserRole.TECHNICIAN);
      expect(profileId).toBe('tp-456');
    });

    it('returns undefined for roles without domain profiles', async () => {
      const profileId = await service.resolveProfileId('u-3', UserRole.ADMIN);
      expect(profileId).toBeUndefined();
    });

    it('returns undefined if profile record not found', async () => {
      mockDb.select.mockReturnValue(createQueryChain([]));

      const profileId = await service.resolveProfileId('u-1', UserRole.BUYER);
      expect(profileId).toBeUndefined();
    });

    it('propagates database runtime errors instead of swallowing them', async () => {
      const errorChain: MockQueryBuilder = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Connection lost to DB replica'))
      };
      mockDb.select.mockReturnValue(errorChain);

      await expect(service.resolveProfileId('u-1', UserRole.BUYER)).rejects.toThrow(
        'Connection lost to DB replica'
      );
    });
  });

  describe('resolveUserIdByProfileId', () => {
    it('resolves userId from buyer profile', async () => {
      mockDb.select.mockReturnValue(createQueryChain([{ userId: 'u-buyer-99' }]));

      const userId = await service.resolveUserIdByProfileId('bp-123', UserRole.BUYER);
      expect(userId).toBe('u-buyer-99');
    });

    it('resolves userId from technician profile', async () => {
      mockDb.select.mockReturnValue(createQueryChain([{ userId: 'u-tech-88' }]));

      const userId = await service.resolveUserIdByProfileId('tp-456', UserRole.TECHNICIAN);
      expect(userId).toBe('u-tech-88');
    });

    it('returns undefined if not found', async () => {
      mockDb.select.mockReturnValue(createQueryChain([]));

      const userId = await service.resolveUserIdByProfileId('tp-none', UserRole.TECHNICIAN);
      expect(userId).toBeUndefined();
    });

    it('resolves userId from technician profile when role is omitted', async () => {
      mockDb.select.mockReturnValueOnce(createQueryChain([{ userId: 'u-tech-fallback' }]));

      const userId = await service.resolveUserIdByProfileId('tp-fallback');
      expect(userId).toBe('u-tech-fallback');
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('resolves userId from buyer profile when role is omitted and tech lookup is empty', async () => {
      mockDb.select
        .mockReturnValueOnce(createQueryChain([]))
        .mockReturnValueOnce(createQueryChain([{ userId: 'u-buyer-fallback' }]));

      const userId = await service.resolveUserIdByProfileId('bp-fallback');
      expect(userId).toBe('u-buyer-fallback');
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('returns undefined when role is omitted and both lookups return empty', async () => {
      mockDb.select
        .mockReturnValueOnce(createQueryChain([]))
        .mockReturnValueOnce(createQueryChain([]));

      const userId = await service.resolveUserIdByProfileId('none-fallback');
      expect(userId).toBeUndefined();
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('propagates database runtime errors instead of swallowing them', async () => {
      const errorChain: MockQueryBuilder = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Deadlock detected during query'))
      };
      mockDb.select.mockReturnValue(errorChain);

      await expect(service.resolveUserIdByProfileId('bp-err', UserRole.BUYER)).rejects.toThrow(
        'Deadlock detected during query'
      );
    });
  });

  describe('getUserProfile', () => {
    it('throws NotFoundException when user not found', async () => {
      mockDb.select.mockReturnValue(createQueryChain([]));

      await expect(service.getUserProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('returns user with buyerProfile for buyer role', async () => {
      mockDb.select
        .mockReturnValueOnce(
          createQueryChain([
            {
              id: 'u-1',
              email: 'buyer@example.com',
              role: UserRole.BUYER,
              status: UserStatus.ACTIVE,
              phoneNumber: '+15551234567'
            }
          ])
        )
        .mockReturnValueOnce(
          createQueryChain([
            {
              id: 'bp-1',
              companyName: 'Acme Inc'
            }
          ])
        );

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
        .mockReturnValueOnce(
          createQueryChain([
            {
              id: 'u-2',
              email: 'tech@example.com',
              role: UserRole.TECHNICIAN,
              status: UserStatus.ACTIVE,
              phoneNumber: '+15559876543'
            }
          ])
        )
        .mockReturnValueOnce(
          createQueryChain([
            {
              id: 'tp-1',
              firstName: 'Bob',
              lastName: 'Builder'
            }
          ])
        );

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
