import { Injectable, Inject, Optional, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { loadEnv } from '@fieldforge/common';
import type { NearbyTechnicianDto } from '@fieldforge/contracts';
import { DRIZZLE } from '@fieldforge/common';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { technicianProfiles, technicianCertifications, users } from '@fieldforge/database';
import { eq, inArray } from 'drizzle-orm';

export const REDIS_CLIENT = 'DISPATCH_REDIS_CLIENT';
export const TECH_LOCATIONS_KEY = 'tech:locations';

@Injectable()
export class GeoSearchService implements OnApplicationShutdown {
  private readonly redis: Redis;

  constructor(
    @Optional() @Inject(REDIS_CLIENT) redisClient?: Redis,
    @Optional() @Inject(DRIZZLE) private readonly db?: MySql2Database<Record<string, unknown>>
  ) {
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
        console.warn(`[GeoSearchService] Redis connect failed: ${msg}`);
      });
    }
  }

  async updateTechnicianLocation(
    techId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    await this.redis.geoadd(TECH_LOCATIONS_KEY, longitude, latitude, techId);

    if (this.db) {
      await this.db
        .update(technicianProfiles)
        .set({
          currentLatitude: latitude.toFixed(8),
          currentLongitude: longitude.toFixed(8)
        })
        .where(eq(technicianProfiles.id, techId));
    }
  }

  async findNearbyTechnicians(
    latitude: number,
    longitude: number,
    radiusMiles = 25,
    requiredCertifications: string[] = []
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

    const techIds = rawResults.map(([techId]) => techId);

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

    if (this.db) {
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
        .where(inArray(technicianProfiles.id, techIds));

      dbTechs = profiles;

      const certs = await this.db
        .select({
          technicianId: technicianCertifications.technicianId,
          badgeName: technicianCertifications.name
        })
        .from(technicianCertifications)
        .where(inArray(technicianCertifications.technicianId, techIds));

      for (const c of certs) {
        const existing = certMap.get(c.technicianId) || [];
        existing.push(c.badgeName);
        certMap.set(c.technicianId, existing);
      }
    }

    const dbMap = new Map(dbTechs.map((t) => [t.id, t]));

    const scoredTechs = rawResults.map(([techId, distStr, [lngStr, latStr]]) => {
      const dist = parseFloat(distStr) || 0;
      const tLat = parseFloat(latStr) || latitude;
      const tLng = parseFloat(lngStr) || longitude;
      const meta = dbMap.get(techId);

      const rating = meta ? parseFloat(meta.ratingAverage) || 5.0 : 5.0;
      const jobs = meta?.jobsCompleted ?? 0;
      const fullName = meta
        ? `${meta.firstName} ${meta.lastName}`
        : `Technician ${techId.slice(0, 8)}`;
      const certs = certMap.get(techId) || [];

      // Multi-parameter scoring algorithm:
      // Distance score: closer is higher (up to 40 pts)
      const distanceScore = Math.max(0, 40 * (1 - dist / Math.max(radiusMiles, 1)));
      // Rating score: 30 pts (normalized 0-5)
      const ratingScore = (rating / 5.0) * 30;
      // Experience score: 15 pts (up to 100 jobs)
      const experienceScore = Math.min(15, (jobs / 100) * 15);
      // Certification match score: 15 pts
      let certScore = 15;
      if (requiredCertifications.length > 0) {
        const matched = requiredCertifications.filter((r) => certs.includes(r)).length;
        certScore = (matched / requiredCertifications.length) * 15;
      }

      const totalScore = distanceScore + ratingScore + experienceScore + certScore;

      const dto: NearbyTechnicianDto = {
        techId,
        fullName,
        rating,
        completedJobsCount: jobs,
        distanceMiles: Math.round(dist * 100) / 100,
        latitude: tLat,
        longitude: tLng,
        isAvailable: meta ? meta.userStatus === 'ACTIVE' : true,
        certifications: certs
      };

      return { dto, totalScore };
    });

    // Sort descending by total composite score
    scoredTechs.sort((a, b) => b.totalScore - a.totalScore);

    return scoredTechs.map((s) => s.dto);
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
