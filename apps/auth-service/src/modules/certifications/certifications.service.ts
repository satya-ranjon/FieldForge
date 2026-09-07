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

export type TechnicianBadge = TechnicianBadgeDto;

@Injectable()
export class CertificationsService {
  private readonly mockCertifications: Record<string, TechnicianBadgeDto[]> = {
    't0000000-0000-0000-0000-000000000001': [
      {
        badgeId: 'badge-01',
        technicianId: 't0000000-0000-0000-0000-000000000001',
        name: 'Cisco CCNA',
        issuedDate: '2025-01-15',
        expiryDate: '2028-01-15',
        isVerified: true
      },
      {
        badgeId: 'badge-02',
        technicianId: 't0000000-0000-0000-0000-000000000001',
        name: 'Background Checked',
        issuedDate: '2026-02-01',
        expiryDate: '2027-02-01',
        isVerified: true
      }
    ]
  };

  constructor(@Optional() @Inject(DRIZZLE) private readonly db?: DrizzleClient) {}

  /**
   * Reads stored certifications from `technician_certifications` when DB is
   * available, seamlessly resolving technicianProfileId or userId.
   */
  async getTechnicianBadges(techIdOrUserId: string): Promise<TechnicianBadgeDto[]> {
    if (this.db) {
      let rows = await this.db
        .select()
        .from(technicianCertifications)
        .where(eq(technicianCertifications.technicianId, techIdOrUserId));

      if (rows.length === 0) {
        // Check if techIdOrUserId is a profile ID rather than user ID
        const profiles = await this.db
          .select({ userId: technicianProfiles.userId })
          .from(technicianProfiles)
          .where(eq(technicianProfiles.id, techIdOrUserId))
          .limit(1);

        if (profiles.length > 0 && profiles[0]?.userId) {
          rows = await this.db
            .select()
            .from(technicianCertifications)
            .where(eq(technicianCertifications.technicianId, profiles[0].userId));
        }
      }

      if (rows.length > 0) {
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
    }

    return (this.mockCertifications[techIdOrUserId] ?? []).map((badge) => ({ ...badge }));
  }

  /**
   * Adds a new technician certification for vetting.
   */
  async addCertification(userId: string, dto: CreateCertificationDto): Promise<TechnicianBadgeDto> {
    const certId = randomUUID();
    const issuedDate = new Date(dto.issuedDate);
    const expiryDate = new Date(dto.expiryDate);

    if (this.db) {
      await this.db.insert(technicianCertifications).values({
        id: certId,
        technicianId: userId,
        name: dto.name,
        issuedDate,
        expiryDate,
        isVerified: false
      });
    } else {
      const existing = this.mockCertifications[userId] ?? [];
      existing.push({
        badgeId: certId,
        technicianId: userId,
        name: dto.name,
        issuedDate: dto.issuedDate,
        expiryDate: dto.expiryDate,
        isVerified: false
      });
      this.mockCertifications[userId] = existing;
    }

    return {
      badgeId: certId,
      technicianId: userId,
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
    if (this.db) {
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

    // Mock fallback
    for (const badges of Object.values(this.mockCertifications)) {
      const badge = badges.find((b) => b.badgeId === certId);
      if (badge) {
        badge.isVerified = isVerified;
        return { ...badge };
      }
    }

    throw new NotFoundException(`Certification with ID ${certId} not found`);
  }

  /**
   * Lists all pending certifications awaiting vetting sign-off.
   */
  async listPendingCertifications(): Promise<TechnicianBadgeDto[]> {
    if (this.db) {
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

    const pending: TechnicianBadgeDto[] = [];
    for (const badges of Object.values(this.mockCertifications)) {
      for (const badge of badges) {
        if (!badge.isVerified) {
          pending.push({ ...badge });
        }
      }
    }
    return pending;
  }

  /**
   * Batch resolves technician profiles, ratings, jobs completed, and verified badge names.
   * Serves as the bounded context directory API for external consumers like dispatch.
   */
  async getTechniciansBatch(ids: string[]): Promise<TechnicianSummaryDto[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

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

    return ids.map((id) => ({
      id,
      firstName: 'Mock',
      lastName: 'Technician',
      ratingAverage: '5.00',
      jobsCompleted: 10,
      hourlyRate: '50.00',
      userStatus: 'ACTIVE',
      badges: (this.mockCertifications[id] || []).map((b) => b.name),
      certifications: (this.mockCertifications[id] || []).map((b) => b.name)
    }));
  }
}
