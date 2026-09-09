import { Injectable, Inject, Optional, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { loadEnv, createLogger, DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import type { NearbyTechnicianDto } from '@fieldforge/contracts';
import { technicianProfiles, technicianCertifications, users } from '@fieldforge/database';
import { eq, inArray } from 'drizzle-orm';
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
    @Optional() @Inject(DRIZZLE) private readonly db?: DrizzleClient,
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

  async updateTechnicianLocation(
    technicianId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    let targetProfileId = technicianId;

    if (this.db) {
      const updateResult = await this.db
        .update(technicianProfiles)
        .set({
          currentLatitude: latitude.toFixed(8),
          currentLongitude: longitude.toFixed(8)
        })
        .where(eq(technicianProfiles.id, technicianId));

      const resultHeader = Array.isArray(updateResult)
        ? (updateResult[0] as { affectedRows?: number } | undefined)
        : (updateResult as { affectedRows?: number } | undefined);
      const affected = resultHeader?.affectedRows;
      if (affected === 0) {
        // Fallback: check if technicianId is actually a userId in technicianProfiles
        const [profile] = await this.db
          .select({ id: technicianProfiles.id })
          .from(technicianProfiles)
          .where(eq(technicianProfiles.userId, technicianId))
          .limit(1);

        if (profile?.id) {
          targetProfileId = profile.id;
          await this.db
            .update(technicianProfiles)
            .set({
              currentLatitude: latitude.toFixed(8),
              currentLongitude: longitude.toFixed(8)
            })
            .where(eq(technicianProfiles.id, targetProfileId));
        }
      }
    }

    await this.redis.geoadd(TECH_LOCATIONS_KEY, longitude, latitude, targetProfileId);
  }

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

    let dbTechs: {
      id: string;
      firstName: string;
      lastName: string;
      ratingAverage: string;
      jobsCompleted: number;
      hourlyRate: string;
      userStatus?: string;
    }[] = [];

    const certMap = new Map<string, string[]>();

    if (this.directoryService) {
      const summaries = correlationId
        ? await this.directoryService.getTechniciansBatch(technicianIds, correlationId)
        : await this.directoryService.getTechniciansBatch(technicianIds);
      dbTechs = summaries.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        ratingAverage: s.ratingAverage,
        jobsCompleted: s.jobsCompleted,
        hourlyRate: s.hourlyRate,
        userStatus: s.userStatus
      }));
      for (const s of summaries) {
        certMap.set(s.id, s.certifications || []);
      }
    } else if (this.db) {
      const profiles = await this.db
        .select({
          id: technicianProfiles.id,
          firstName: technicianProfiles.firstName,
          lastName: technicianProfiles.lastName,
          ratingAverage: technicianProfiles.ratingAverage,
          jobsCompleted: technicianProfiles.jobsCompleted,
          hourlyRate: technicianProfiles.hourlyRate,
          userStatus: users.status
        })
        .from(technicianProfiles)
        .innerJoin(users, eq(technicianProfiles.userId, users.id))
        .where(inArray(technicianProfiles.id, technicianIds));

      dbTechs = profiles;

      const certs = await this.db
        .select({
          technicianId: technicianCertifications.technicianId,
          badgeName: technicianCertifications.name
        })
        .from(technicianCertifications)
        .where(inArray(technicianCertifications.technicianId, technicianIds));

      for (const c of certs) {
        const existing = certMap.get(c.technicianId) || [];
        existing.push(c.badgeName);
        certMap.set(c.technicianId, existing);
      }
    }

    const dbMap = new Map(dbTechs.map((t) => [t.id, t]));

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
        const meta = dbMap.get(technicianId);

        const rating = meta ? parseFloat(meta.ratingAverage) || 5.0 : 5.0;
        const jobs = meta?.jobsCompleted ?? 0;
        const fullName = meta
          ? `${meta.firstName} ${meta.lastName}`
          : `Technician ${technicianId.slice(0, 8)}`;
        const certs = certMap.get(technicianId) || [];

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
          isAvailable: meta ? meta.userStatus === 'ACTIVE' : true
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
