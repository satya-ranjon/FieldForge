import { NotFoundException } from '@nestjs/common';
import { ProfileDirectoryService } from '../src/directory/profile-directory.service';
import { UserRole, UserStatus, type UserProfileResponseDto } from '@fieldforge/contracts';

describe('ProfileDirectoryService', () => {
  let service: ProfileDirectoryService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new ProfileDirectoryService();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    service.clearCache();
  });

  const mockUserProfile: UserProfileResponseDto = {
    id: 'usr-123',
    email: 'test@example.com',
    role: UserRole.BUYER,
    phoneNumber: '+15555555555',
    status: UserStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    buyerProfile: {
      id: 'buyer-prof-456',
      userId: 'usr-123',
      companyName: 'Acme Corp',
      billingAddress: '123 Main St',
      escrowBalance: '100.00'
    }
  };

  const mockTechProfile: UserProfileResponseDto = {
    id: 'usr-tech-789',
    email: 'tech@example.com',
    role: UserRole.TECHNICIAN,
    phoneNumber: '+15555555556',
    status: UserStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    technicianProfile: {
      id: 'tech-prof-999',
      userId: 'usr-tech-789',
      firstName: 'John',
      lastName: 'Tech',
      hourlyRate: '60.00',
      ratingAverage: '4.8',
      jobsCompleted: 15
    }
  };

  describe('Fast path with callerProfileId', () => {
    it('returns callerProfileId immediately for buyer without fetch', async () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      const profileId = await service.resolveBuyerProfileId('usr-123', 'fast-buyer-id');
      expect(profileId).toBe('fast-buyer-id');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns callerProfileId immediately for technician without fetch', async () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      const profileId = await service.resolveTechnicianProfileId('usr-tech-789', 'fast-tech-id');
      expect(profileId).toBe('fast-tech-id');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Local overrides (setLocalProfile)', () => {
    it('resolves buyer profile ID from local override without network call', async () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      service.setLocalProfile('usr-123', 'BUYER', 'local-buyer-id');
      const profileId = await service.resolveBuyerProfileId('usr-123');

      expect(profileId).toBe('local-buyer-id');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('resolves technician profile ID from local override without network call', async () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      service.setLocalProfile('usr-tech-789', 'TECHNICIAN', 'local-tech-id');
      const profileId = await service.resolveTechnicianProfileId('usr-tech-789');

      expect(profileId).toBe('local-tech-id');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Network resolution (getUserProfile)', () => {
    it('fetches profile from auth service, caches it, and resolves buyerProfileId', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUserProfile
      });
      global.fetch = fetchSpy;

      const profileId = await service.resolveBuyerProfileId('usr-123', undefined, 'corr-abc');
      expect(profileId).toBe('buyer-prof-456');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users/usr-123/profile'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-correlation-id': 'corr-abc'
          })
        })
      );

      // Second call should hit the cache and not call fetch
      const cachedProfileId = await service.resolveBuyerProfileId('usr-123');
      expect(cachedProfileId).toBe('buyer-prof-456');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('fetches profile from auth service and resolves technicianProfileId', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTechProfile
      });
      global.fetch = fetchSpy;

      const profileId = await service.resolveTechnicianProfileId('usr-tech-789');
      expect(profileId).toBe('tech-prof-999');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('handles 404 / non-ok response gracefully by returning null', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      global.fetch = fetchSpy;

      const profile = await service.getUserProfile('non-existent');
      expect(profile).toBeNull();

      const profileId = await service.resolveBuyerProfileId('non-existent');
      expect(profileId).toBeNull();
    });

    it('handles network / fetch exceptions gracefully by returning null', async () => {
      const fetchSpy = jest.fn().mockRejectedValue(new Error('Connection refused'));
      global.fetch = fetchSpy;

      const profile = await service.getUserProfile('usr-err');
      expect(profile).toBeNull();
    });

    it('returns null when userId is empty', async () => {
      const result = await service.getUserProfile('');
      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('clears memory cache and local profiles', async () => {
      service.setLocalProfile('usr-1', 'BUYER', 'bp-1');
      expect(await service.resolveBuyerProfileId('usr-1')).toBe('bp-1');

      service.clearCache();

      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUserProfile
      });
      global.fetch = fetchSpy;

      const result = await service.resolveBuyerProfileId('usr-1');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('buyer-prof-456');
    });
  });

  describe('resolveProfileId', () => {
    it('returns callerProfileId immediately if provided', async () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      const profileId = await service.resolveProfileId('usr-1', 'BUYER', 'fast-prof-id');
      expect(profileId).toBe('fast-prof-id');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('resolves BUYER role (case-insensitive)', async () => {
      service.setLocalProfile('usr-buyer', 'BUYER', 'bp-local-1');

      expect(await service.resolveProfileId('usr-buyer', 'BUYER')).toBe('bp-local-1');
      expect(await service.resolveProfileId('usr-buyer', 'buyer')).toBe('bp-local-1');
      expect(await service.resolveProfileId('usr-buyer', 'Buyer')).toBe('bp-local-1');
    });

    it('resolves TECHNICIAN role (case-insensitive)', async () => {
      service.setLocalProfile('usr-tech', 'TECHNICIAN', 'tp-local-1');

      expect(await service.resolveProfileId('usr-tech', 'TECHNICIAN')).toBe('tp-local-1');
      expect(await service.resolveProfileId('usr-tech', 'technician')).toBe('tp-local-1');
      expect(await service.resolveProfileId('usr-tech', 'Technician')).toBe('tp-local-1');
    });

    it('resolves via network when role is BUYER and cache is empty', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUserProfile
      });
      global.fetch = fetchSpy;

      const profileId = await service.resolveProfileId('usr-123', 'BUYER');
      expect(profileId).toBe('buyer-prof-456');
    });

    it('resolves via network when role is TECHNICIAN and cache is empty', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTechProfile
      });
      global.fetch = fetchSpy;

      const profileId = await service.resolveProfileId('usr-tech-789', 'TECHNICIAN');
      expect(profileId).toBe('tech-prof-999');
    });

    it('resolves available profile when role is unspecified', async () => {
      service.setLocalProfile('usr-tech-2', 'TECHNICIAN', 'tp-2');
      expect(await service.resolveProfileId('usr-tech-2')).toBe('tp-2');

      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUserProfile
      });
      global.fetch = fetchSpy;
      expect(await service.resolveProfileId('usr-123')).toBe('buyer-prof-456');
    });

    it('returns null when profile cannot be resolved', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      global.fetch = fetchSpy;

      const profileId = await service.resolveProfileId('usr-not-found', 'BUYER');
      expect(profileId).toBeNull();
    });
  });

  describe('resolveProfileIdOrThrow', () => {
    it('returns resolved profile ID when found', async () => {
      service.setLocalProfile('usr-buyer-ok', 'BUYER', 'bp-ok');
      const result = await service.resolveProfileIdOrThrow('usr-buyer-ok', 'BUYER');
      expect(result).toBe('bp-ok');
    });

    it('throws NotFoundException with default message when not found', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      global.fetch = fetchSpy;

      await expect(service.resolveProfileIdOrThrow('usr-missing', 'BUYER')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.resolveProfileIdOrThrow('usr-missing', 'BUYER')).rejects.toThrow(
        'BUYER profile not found for user usr-missing'
      );
    });

    it('throws NotFoundException with custom message when provided', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      global.fetch = fetchSpy;

      await expect(
        service.resolveProfileIdOrThrow(
          'usr-missing',
          'BUYER',
          undefined,
          undefined,
          'Custom not found message'
        )
      ).rejects.toThrow('Custom not found message');
    });
  });
});
