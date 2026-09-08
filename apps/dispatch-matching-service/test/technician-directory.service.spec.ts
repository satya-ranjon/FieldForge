import {
  TechnicianDirectoryService,
  DIRECTORY_CACHE_PREFIX,
  DIRECTORY_CACHE_TTL_SECONDS
} from '../src/modules/geo-search/technician-directory.service';
import type { TechnicianSummaryDto } from '@fieldforge/contracts';
import type Redis from 'ioredis';

describe('TechnicianDirectoryService', () => {
  let service: TechnicianDirectoryService;
  let mockFetch: jest.Mock;

  const mockTech1: TechnicianSummaryDto = {
    id: 'tech-1',
    firstName: 'Alice',
    lastName: 'Smith',
    ratingAverage: '4.95',
    jobsCompleted: 42,
    hourlyRate: '85.00',
    userStatus: 'ACTIVE',
    badges: ['Cisco CCNA'],
    certifications: ['Cisco CCNA']
  };

  const mockTech2: TechnicianSummaryDto = {
    id: 'tech-2',
    firstName: 'Bob',
    lastName: 'Jones',
    ratingAverage: '4.80',
    jobsCompleted: 30,
    hourlyRate: '75.00',
    userStatus: 'ACTIVE',
    badges: ['CompTIA A+'],
    certifications: ['CompTIA A+']
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    service = new TechnicianDirectoryService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty array when given empty IDs array', async () => {
    const result = await service.getTechniciansBatch([]);
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  describe('In-Memory Caching', () => {
    it('fetches from auth-service on cache miss and populates in-memory cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });

      const result = await service.getTechniciansBatch(['tech-1']);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/technicians/batch',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ids: ['tech-1'] })
        })
      );
      expect(result).toEqual([mockTech1]);

      // Second call for the same ID should be a cache hit (0 additional fetch calls)
      const cachedResult = await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(cachedResult).toEqual([mockTech1]);
    });

    it('optimizes partial cache hits by fetching ONLY missing IDs from HTTP', async () => {
      // First populate tech-1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Now request tech-1 and tech-2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech2])
      });

      const combined = await service.getTechniciansBatch(['tech-1', 'tech-2']);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Crucial: second call only asked for tech-2!
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8001/technicians/batch',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ids: ['tech-2'] })
        })
      );
      expect(combined).toEqual([mockTech1, mockTech2]);
    });

    it('propagates x-correlation-id header when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });

      await service.getTechniciansBatch(['tech-1'], 'test-correlation-id-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/technicians/batch',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': 'test-correlation-id-123'
          })
        })
      );
    });

    it('returns cached results gracefully if HTTP call fails', async () => {
      // Seed tech-1 into cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);

      // Now tech-2 fails with 500 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await service.getTechniciansBatch(['tech-1', 'tech-2']);
      // Still returns cached tech-1
      expect(result).toEqual([mockTech1]);
    });

    it('handles network exceptions gracefully and returns cached data', async () => {
      // Seed tech-1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);

      // Network throws error for tech-2
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await service.getTechniciansBatch(['tech-1', 'tech-2']);
      expect(result).toEqual([mockTech1]);
    });

    it('invalidates cached item properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await service.invalidate('tech-1');

      // Subsequent call should re-fetch from HTTP
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('clears all in-memory cache when clearMemoryCache is invoked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      service.clearMemoryCache();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });
      await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Redis Multi-Tier Caching', () => {
    let mockRedis: jest.Mocked<Redis>;
    let mockPipeline: {
      setex: jest.Mock;
      exec: jest.Mock;
    };

    beforeEach(() => {
      mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      mockRedis = {
        mget: jest.fn(),
        pipeline: jest.fn().mockReturnValue(mockPipeline),
        del: jest.fn().mockResolvedValue(1)
      } as unknown as jest.Mocked<Redis>;

      service = new TechnicianDirectoryService(mockRedis);
    });

    it('resolves items from Redis mget when present', async () => {
      mockRedis.mget.mockResolvedValueOnce([JSON.stringify(mockTech1)]);

      const result = await service.getTechniciansBatch(['tech-1']);

      expect(mockRedis.mget).toHaveBeenCalledWith(`${DIRECTORY_CACHE_PREFIX}tech-1`);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual([mockTech1]);
    });

    it('fetches missing items and writes them to Redis pipeline with TTL', async () => {
      // Redis mget returns null for tech-1
      mockRedis.mget.mockResolvedValueOnce([null]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });

      const result = await service.getTechniciansBatch(['tech-1']);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockPipeline.setex).toHaveBeenCalledWith(
        `${DIRECTORY_CACHE_PREFIX}tech-1`,
        DIRECTORY_CACHE_TTL_SECONDS,
        JSON.stringify(mockTech1)
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
      expect(result).toEqual([mockTech1]);
    });

    it('handles Redis error by falling back to in-memory cache gracefully', async () => {
      mockRedis.mget.mockRejectedValueOnce(new Error('Redis connection reset'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockTech1])
      });

      const result = await service.getTechniciansBatch(['tech-1']);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTech1]);

      // Next call: Redis fails again, but in-memory cache has it!
      mockRedis.mget.mockRejectedValueOnce(new Error('Redis down'));
      const cachedResult = await service.getTechniciansBatch(['tech-1']);
      expect(mockFetch).toHaveBeenCalledTimes(1); // 0 extra fetch!
      expect(cachedResult).toEqual([mockTech1]);
    });

    it('invalidates both in-memory and Redis keys', async () => {
      await service.invalidate('tech-1');
      expect(mockRedis.del).toHaveBeenCalledWith(`${DIRECTORY_CACHE_PREFIX}tech-1`);
    });
  });
});
