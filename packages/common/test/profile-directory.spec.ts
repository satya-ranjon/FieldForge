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
});
