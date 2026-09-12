import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { technicianCertifications, technicianProfiles, users } from '@fieldforge/database';
import type {
  TechnicianBadgeDto,
  CreateCertificationDto,
  TechnicianSummaryDto
} from '@fieldforge/contracts';
import { ProfilesService } from '../profiles/profiles.service';

export type TechnicianBadge = TechnicianBadgeDto;

@Injectable()
export class CertificationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    @Optional() private readonly profilesService?: ProfilesService
  ) {}

  /**
   * Reads stored certifications from `technician_certifications`,
   * seamlessly resolving technicianProfileId or userId.
   */
  async getTechnicianBadges(technicianIdOrUserId: string): Promise<TechnicianBadgeDto[]> {
    let rows = await this.db
      .select()
      .from(technicianCertifications)
      .where(eq(technicianCertifications.technicianId, technicianIdOrUserId));

    if (rows.length === 0) {
      // Fallback 1: If technicianIdOrUserId is actually a userId rather than technicianProfileId
      let resolvedProfileId: string | undefined;
      if (this.profilesService) {
        resolvedProfileId = await this.profilesService.resolveProfileId(
          technicianIdOrUserId,
          'TECHNICIAN'
        );
      } else {
        const profilesByUser = await this.db
          .select({ id: technicianProfiles.id })
          .from(technicianProfiles)
          .where(eq(technicianProfiles.userId, technicianIdOrUserId))
          .limit(1);
        resolvedProfileId = profilesByUser[0]?.id;
      }

      if (resolvedProfileId) {
        rows = await this.db
          .select()
          .from(technicianCertifications)
          .where(eq(technicianCertifications.technicianId, resolvedProfileId));
      }
    }

    if (rows.length === 0) {
      // Fallback 2: If technicianIdOrUserId is a profileId but rows held legacy userId
      let resolvedUserId: string | undefined;
      if (this.profilesService) {
        resolvedUserId = await this.profilesService.resolveUserIdByProfileId(
          technicianIdOrUserId,
          'TECHNICIAN'
        );
      } else {
        const profilesById = await this.db
          .select({ userId: technicianProfiles.userId })
          .from(technicianProfiles)
          .where(eq(technicianProfiles.id, technicianIdOrUserId))
          .limit(1);
        resolvedUserId = profilesById[0]?.userId;
      }

      if (resolvedUserId) {
        rows = await this.db
          .select()
          .from(technicianCertifications)
          .where(eq(technicianCertifications.technicianId, resolvedUserId));
      }
    }

    return rows.map((row) => ({
      badgeId: row.id,
      technicianId: row.technicianId,
      name: row.name,
      issuedDate:
        row.issuedDate instanceof Date
          ? row.issuedDate.toISOString().split('T')[0]!
          : String(row.issuedDate),
      expiryDate:
        row.expiryDate instanceof Date
          ? row.expiryDate.toISOString().split('T')[0]!
          : String(row.expiryDate),
      isVerified: Boolean(row.isVerified)
    }));
  }

  /**
   * Adds a new technician certification for vetting.
   */
  async addCertification(
    technicianId: string,
    dto: CreateCertificationDto
  ): Promise<TechnicianBadgeDto> {
    const certId = randomUUID();
    const issuedDate = new Date(dto.issuedDate);
    const expiryDate = new Date(dto.expiryDate);

    await this.db.insert(technicianCertifications).values({
      id: certId,
      technicianId,
      name: dto.name,
      issuedDate,
      expiryDate,
      isVerified: false
    });

    return {
      badgeId: certId,
      technicianId,
      name: dto.name,
      issuedDate: dto.issuedDate,
      expiryDate: dto.expiryDate,
      isVerified: false
    };
  }

  /**
   * Verifies or rejects a technician certification (admin / dispatcher vetting).
   */
  async verifyCertification(certId: string, isVerified: boolean): Promise<TechnicianBadgeDto> {
    const rows = await this.db
      .select()
      .from(technicianCertifications)
      .where(eq(technicianCertifications.id, certId))
      .limit(1);

    if (rows.length === 0 || !rows[0]) {
      throw new NotFoundException(`Certification with ID ${certId} not found`);
    }

    await this.db
      .update(technicianCertifications)
      .set({ isVerified })
      .where(eq(technicianCertifications.id, certId));

    const row = rows[0];
    return {
      badgeId: row.id,
      technicianId: row.technicianId,
      name: row.name,
      issuedDate:
        row.issuedDate instanceof Date
          ? row.issuedDate.toISOString().split('T')[0]!
          : String(row.issuedDate),
      expiryDate:
        row.expiryDate instanceof Date
          ? row.expiryDate.toISOString().split('T')[0]!
          : String(row.expiryDate),
      isVerified
    };
  }

  /**
   * Lists all pending certifications awaiting vetting sign-off.
   */
  async listPendingCertifications(): Promise<TechnicianBadgeDto[]> {
    const rows = await this.db
      .select()
      .from(technicianCertifications)
      .where(eq(technicianCertifications.isVerified, false));

    return rows.map((row) => ({
      badgeId: row.id,
      technicianId: row.technicianId,
      name: row.name,
      issuedDate:
        row.issuedDate instanceof Date
          ? row.issuedDate.toISOString().split('T')[0]!
          : String(row.issuedDate),
      expiryDate:
        row.expiryDate instanceof Date
          ? row.expiryDate.toISOString().split('T')[0]!
          : String(row.expiryDate),
      isVerified: false
    }));
  }

  /**
   * Batch resolves technician profiles, ratings, jobs completed, and verified badge names.
   * Serves as the bounded context directory API for external consumers like dispatch.
   */
  async getTechniciansBatch(ids: string[]): Promise<TechnicianSummaryDto[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

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
      .where(inArray(technicianProfiles.id, ids));

    const certs = await this.db
      .select({
        technicianId: technicianCertifications.technicianId,
        badgeName: technicianCertifications.name
      })
      .from(technicianCertifications)
      .where(inArray(technicianCertifications.technicianId, ids));

    const certMap = new Map<string, string[]>();
    for (const c of certs) {
      const existing = certMap.get(c.technicianId) || [];
      existing.push(c.badgeName);
      certMap.set(c.technicianId, existing);
    }

    return profiles.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      ratingAverage: p.ratingAverage,
      jobsCompleted: p.jobsCompleted,
      hourlyRate: p.hourlyRate,
      userStatus: p.userStatus || 'ACTIVE',
      badges: certMap.get(p.id) || [],
      certifications: certMap.get(p.id) || []
    }));
  }
}
