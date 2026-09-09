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

    geo = new GeoSearchService(mockRedis);
  });

  it('updates technician location using Redis GEOADD', async () => {
    await geo.updateTechnicianLocation('tech-1', SF.latitude, SF.longitude);
    expect(mockRedis.geoadd).toHaveBeenCalledWith(
      'tech:locations',
      SF.longitude,
      SF.latitude,
      'tech-1'
    );
  });

  it('returns technicians with a plausible distance, rating, and availability', async () => {
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

  it('enriches nearby technicians via TechnicianDirectoryService when provided', async () => {
    const mockDirectory = {
      getTechniciansBatch: jest.fn().mockResolvedValue([
        {
          id: 'tech-1',
          firstName: 'Alice',
          lastName: 'Smith',
          ratingAverage: '4.95',
          jobsCompleted: 42,
          hourlyRate: '85.00',
          certifications: ['FIBER_OPTIC', 'OSHA_10'],
          userStatus: 'ACTIVE'
        }
      ])
    };

    const geoWithDir = new GeoSearchService(
      mockRedis,
      undefined,
      mockDirectory as unknown as TechnicianDirectoryService
    );
    const matches = await geoWithDir.findNearbyTechnicians(SF.latitude, SF.longitude);

    expect(mockDirectory.getTechniciansBatch).toHaveBeenCalledWith(['tech-1', 'tech-2']);
    const tech1 = matches.find((m) => m.technicianId === 'tech-1');
    expect(tech1?.rating).toBe(4.95);
    expect(tech1?.completedJobsCount).toBe(42);
    expect(tech1?.certifications).toEqual(['FIBER_OPTIC', 'OSHA_10']);
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

    const geoWithCustomScorer = new GeoSearchService(mockRedis, undefined, undefined, mockScorer);

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
