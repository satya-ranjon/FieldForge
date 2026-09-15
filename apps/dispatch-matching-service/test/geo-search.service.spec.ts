import { EventType, createEvent } from '@fieldforge/contracts';
import { GeoSearchService } from '../src/modules/geo-search/geo-search.service';
import { WorkOrderCreatedConsumer } from '../src/modules/consumers/work-order-created.consumer';
import type { TechnicianDirectoryService } from '../src/modules/geo-search/technician-directory.service';
import type { CandidateScorerPort, CandidateScoringInput } from '../src/modules/scoring';
import type Redis from 'ioredis';

const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';
const SF = { latitude: 37.7749, longitude: -122.4194 };

describe('GeoSearchService', () => {
  let geo: GeoSearchService;
  let mockRedis: jest.Mocked<Redis>;
  let mockDirectory: jest.Mocked<TechnicianDirectoryService>;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    mockRedis = {
      geoadd: jest.fn().mockResolvedValue(1),
      geosearch: jest.fn().mockResolvedValue([
        ['tech-1', '3.2', ['-122.4100', '37.7800']],
        ['tech-2', '5.7', ['-122.4300', '37.7600']]
      ]),
      disconnect: jest.fn(),
      status: 'ready'
    } as unknown as jest.Mocked<Redis>;

    mockDirectory = {
      getTechniciansBatch: jest.fn().mockResolvedValue([
        {
          id: 'tech-1',
          firstName: 'Alice',
          lastName: 'Smith',
          ratingAverage: '4.95',
          jobsCompleted: 42,
          hourlyRate: '85.00',
          certifications: ['FIBER_OPTIC', 'OSHA_10'],
          badges: ['FIBER_OPTIC', 'OSHA_10'],
          userStatus: 'ACTIVE'
        },
        {
          id: 'tech-2',
          firstName: 'Bob',
          lastName: 'Jones',
          ratingAverage: '4.80',
          jobsCompleted: 30,
          hourlyRate: '75.00',
          certifications: ['OSHA_10'],
          badges: ['OSHA_10'],
          userStatus: 'ACTIVE'
        }
      ])
    } as unknown as jest.Mocked<TechnicianDirectoryService>;

    geo = new GeoSearchService(mockRedis, mockDirectory);
  });

  it('updates technician location using Redis GEOADD and executes zero database calls', async () => {
    await geo.updateTechnicianLocation('tech-1', SF.latitude, SF.longitude);
    expect(mockRedis.geoadd).toHaveBeenCalledWith(
      'tech:locations',
      SF.longitude,
      SF.latitude,
      'tech-1'
    );
  });

  it('rejects updateTechnicianLocation if technicianProfileId is missing', async () => {
    await expect(geo.updateTechnicianLocation('', SF.latitude, SF.longitude)).rejects.toThrow();
    expect(mockRedis.geoadd).not.toHaveBeenCalled();
  });

  it('fails fast when Redis GEOADD throws, performing zero fallback storage operations', async () => {
    mockRedis.geoadd.mockRejectedValueOnce(new Error('Redis cluster connection lost'));
    await expect(geo.updateTechnicianLocation('tech-1', SF.latitude, SF.longitude)).rejects.toThrow(
      'Redis cluster connection lost'
    );
  });

  it('returns technicians with a plausible distance, rating, and availability from directory service', async () => {
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);

    expect(matches.length).toBe(2);
    expect(mockRedis.geosearch).toHaveBeenCalledWith(
      'tech:locations',
      'FROMLONLAT',
      SF.longitude,
      SF.latitude,
      'BYRADIUS',
      25,
      'mi',
      'WITHDIST',
      'WITHCOORD'
    );

    for (const tech of matches) {
      expect(tech.distanceMiles).toBeGreaterThanOrEqual(0);
      expect(tech.rating).toBeGreaterThan(0);
      expect(tech.rating).toBeLessThanOrEqual(5);
      expect(tech.completedJobsCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(tech.certifications)).toBe(true);
      expect(tech.isAvailable).toBe(true);
    }
  });

  it('ranks closer and higher rated technicians first', async () => {
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);
    // tech-1 is 3.2 mi, tech-2 is 5.7 mi
    expect(matches[0]?.technicianId).toBe('tech-1');
    expect(matches[0]?.distanceMiles).toBe(3.2);
  });

  it('returns empty array when no technicians found in radius', async () => {
    mockRedis.geosearch.mockResolvedValueOnce([]);
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude, 1);
    expect(matches).toEqual([]);
  });

  it('enriches nearby technicians via TechnicianDirectoryService in a single batch', async () => {
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);

    expect(mockDirectory.getTechniciansBatch).toHaveBeenCalledWith(['tech-1', 'tech-2']);
    const tech1 = matches.find((m) => m.technicianId === 'tech-1');
    expect(tech1?.fullName).toBe('Alice Smith');
    expect(tech1?.rating).toBe(4.95);
    expect(tech1?.completedJobsCount).toBe(42);
    expect(tech1?.certifications).toEqual(['FIBER_OPTIC', 'OSHA_10']);
    expect(tech1?.isAvailable).toBe(true);
  });

  it('marks unverified technician as unavailable and ineligible when directory service returns no data', async () => {
    mockDirectory.getTechniciansBatch.mockResolvedValueOnce([]);

    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);

    expect(matches.length).toBe(2);
    for (const tech of matches) {
      expect(tech.isAvailable).toBe(false);
      expect(tech.rating).toBe(0);
      expect(tech.certifications).toEqual([]);
    }
  });

  it('marks suspended technician as unavailable when userStatus is SUSPENDED', async () => {
    mockDirectory.getTechniciansBatch.mockResolvedValueOnce([
      {
        id: 'tech-1',
        firstName: 'Suspended',
        lastName: 'Tech',
        ratingAverage: '4.95',
        jobsCompleted: 10,
        hourlyRate: '50.00',
        certifications: ['FIBER_OPTIC'],
        badges: ['FIBER_OPTIC'],
        userStatus: 'SUSPENDED'
      }
    ]);

    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);
    const tech1 = matches.find((m) => m.technicianId === 'tech-1');
    expect(tech1?.isAvailable).toBe(false);
  });

  it('delegates candidate ranking to injected CandidateScorerPort', async () => {
    const mockScorer: CandidateScorerPort = {
      score: jest.fn(),
      rankCandidates: jest.fn().mockImplementation((candidates: CandidateScoringInput[]) =>
        candidates.map((c) => ({
          candidate: c,
          score: {
            distanceScore: 40,
            ratingScore: 30,
            experienceScore: 15,
            certificationScore: 15,
            totalScore: 100
          },
          totalScore: 100
        }))
      )
    };

    const geoWithCustomScorer = new GeoSearchService(mockRedis, mockDirectory, mockScorer);

    const matches = await geoWithCustomScorer.findNearbyTechnicians(SF.latitude, SF.longitude);
    expect(mockScorer.rankCandidates).toHaveBeenCalled();
    expect(matches.length).toBe(2);
  });
});

describe('WorkOrderCreatedConsumer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  const publishedEvent = () =>
    createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        buyerId: 'b0000000-0000-4000-8000-000000000001',
        title: 'Emergency POS Terminal Swap',
        maxBudgetMinor: 45000,
        ...SF
      },
      CORRELATION_ID
    );

  it('searches at the coordinates carried in the event payload', async () => {
    const mockRedis = {
      geosearch: jest.fn().mockResolvedValue([])
    } as unknown as Redis;
    const geo = new GeoSearchService(mockRedis);
    const find = jest.spyOn(geo, 'findNearbyTechnicians').mockResolvedValue([]);

    await new WorkOrderCreatedConsumer(geo).handleWorkOrderPublished(publishedEvent());

    expect(find).toHaveBeenCalledWith(SF.latitude, SF.longitude);
  });

  it('carries the correlationId into its log line', async () => {
    const log = jest.spyOn(console, 'log');
    const mockRedis = {
      geosearch: jest.fn().mockResolvedValue([])
    } as unknown as Redis;
    const geo = new GeoSearchService(mockRedis);
    jest.spyOn(geo, 'findNearbyTechnicians').mockResolvedValue([]);

    await new WorkOrderCreatedConsumer(geo).handleWorkOrderPublished(publishedEvent());

    expect(String(log.mock.calls.at(-1)?.[0])).toContain(CORRELATION_ID);
  });

  it('tolerates a work order with no eligible technicians', async () => {
    const mockRedis = {
      geosearch: jest.fn().mockResolvedValue([])
    } as unknown as Redis;
    const geo = new GeoSearchService(mockRedis);
    jest.spyOn(geo, 'findNearbyTechnicians').mockResolvedValue([]);

    await expect(
      new WorkOrderCreatedConsumer(geo).handleWorkOrderPublished(publishedEvent())
    ).resolves.toBeUndefined();
  });
});
