import {
  Injectable,
  Inject,
  Optional,
  OnApplicationShutdown,
  BadRequestException
} from '@nestjs/common';
import Redis from 'ioredis';
import { loadEnv, createLogger } from '@fieldforge/common';
import type { NearbyTechnicianDto, TechnicianSummaryDto } from '@fieldforge/contracts';
import { TechnicianDirectoryService } from './technician-directory.service';
import {
  CANDIDATE_SCORER,
  type CandidateScorerPort,
  CandidateScoringService,
  type CandidateScoringInput
} from '../scoring';

export const REDIS_CLIENT = 'DISPATCH_REDIS_CLIENT';
export const TECH_LOCATIONS_KEY = 'tech:locations';

@Injectable()
export class GeoSearchService implements OnApplicationShutdown {
  private readonly logger = createLogger('dispatch-geo-search');
  private readonly redis: Redis;
  private readonly scorer: CandidateScorerPort;

  constructor(
    @Optional() @Inject(REDIS_CLIENT) redisClient?: Redis,
    @Optional() private readonly directoryService?: TechnicianDirectoryService,
    @Optional() @Inject(CANDIDATE_SCORER) candidateScorer?: CandidateScorerPort
  ) {
    this.scorer = candidateScorer ?? new CandidateScoringService();
    if (redisClient) {
      this.redis = redisClient;
    } else {
      loadEnv();
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT) || 6379;
      const password = process.env.REDIS_PASSWORD || undefined;
      this.redis = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        maxRetriesPerRequest: 1
      });
      this.redis.connect().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`[GeoSearchService] Redis connect failed: ${msg}`);
      });
    }
  }

  /**
   * Update live technician GPS coordinates in the Redis spatial index (ISSUE-004A).
   * Live GPS is operational dispatch telemetry owned strictly by dispatch-matching-service in Redis.
   * Zero SQL writes or foreign database mutations.
   */
  async updateTechnicianLocation(
    technicianProfileId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    if (!technicianProfileId) {
      throw new BadRequestException('Technician profile ID is required for location updates');
    }

    await this.redis.geoadd(TECH_LOCATIONS_KEY, longitude, latitude, technicianProfileId);
  }

  /**
   * Discover and rank certified technicians near a given coordinate using Redis GEOSEARCH.
   * Hydrates candidate profile and certification attributes exclusively via TechnicianDirectoryService.
   * Zero direct SQL access to auth-owned identity tables.
   */
  async findNearbyTechnicians(
    latitude: number,
    longitude: number,
    radiusMiles = 25,
    requiredCertifications: string[] = [],
    correlationId?: string
  ): Promise<NearbyTechnicianDto[]> {
    let rawResults: [string, string, [string, string]][];
    try {
      // ioredis returns array of [member, distance, [lng, lat]]
      const results = (await this.redis.geosearch(
        TECH_LOCATIONS_KEY,
        'FROMLONLAT',
        longitude,
        latitude,
        'BYRADIUS',
        radiusMiles,
        'mi',
        'WITHDIST',
        'WITHCOORD'
      )) as unknown as [string, string, [string, string]][];

      rawResults = Array.isArray(results) ? results : [];
    } catch {
      rawResults = [];
    }

    if (rawResults.length === 0) {
      return [];
    }

    const technicianIds = rawResults.map(([technicianId]) => technicianId);

    let directoryTechs: TechnicianSummaryDto[] = [];
    if (this.directoryService) {
      directoryTechs = correlationId
        ? await this.directoryService.getTechniciansBatch(technicianIds, correlationId)
        : await this.directoryService.getTechniciansBatch(technicianIds);
    }

    const directoryMap = new Map(directoryTechs.map((t) => [t.id, t]));

    interface CandidateEnrichment extends CandidateScoringInput {
      fullName: string;
      latitude: number;
      longitude: number;
      isAvailable: boolean;
      certifications: string[];
    }

    const candidateInputs: CandidateEnrichment[] = rawResults.map(
      ([technicianId, distStr, [lngStr, latStr]]) => {
        const dist = parseFloat(distStr) || 0;
        const tLat = parseFloat(latStr) || latitude;
        const tLng = parseFloat(lngStr) || longitude;
        const meta = directoryMap.get(technicianId);

        // Distinguish display-only fields from eligibility/security-critical fields (ISSUE-004A §9 & §20)
        // If meta cannot be resolved from directoryService:
        // isAvailable MUST be false and certifications empty so unverified technicians are not routed
        const rating = meta ? parseFloat(meta.ratingAverage) || 5.0 : 0;
        const jobs = meta?.jobsCompleted ?? 0;
        const fullName = meta
          ? `${meta.firstName} ${meta.lastName}`.trim() || `Technician ${technicianId.slice(0, 8)}`
          : `Technician ${technicianId.slice(0, 8)}`;
        const certs = meta?.certifications || meta?.badges || [];
        const isAvailable = meta ? meta.userStatus === 'ACTIVE' : false;

        return {
          technicianId,
          distanceMiles: Math.round(dist * 100) / 100,
          radiusMiles,
          rating,
          completedJobsCount: jobs,
          certifications: certs,
          requiredCertifications,
          fullName,
          latitude: tLat,
          longitude: tLng,
          isAvailable
        };
      }
    );

    const ranked = this.scorer.rankCandidates(candidateInputs);

    return ranked.map(({ candidate }) => ({
      technicianId: candidate.technicianId,
      fullName: candidate.fullName,
      rating: candidate.rating,
      completedJobsCount: candidate.completedJobsCount,
      distanceMiles: candidate.distanceMiles,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      isAvailable: candidate.isAvailable,
      certifications: candidate.certifications
    }));
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      if (this.redis && this.redis.status !== 'end') {
        this.redis.disconnect();
      }
    } catch {
      // Ignore cleanup error
    }
  }
}
