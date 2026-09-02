import { Injectable, Inject, Optional } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { technicianCertifications } from '@fieldforge/database';

export interface TechnicianBadge {
  badgeId: string;
  name: 'Background Checked' | 'OSHA 10' | 'Cisco CCNA' | 'CompTIA A+' | 'Fiber Optic Certified';
  issuedDate: string;
  expiryDate: string;
  isVerified: boolean;
}

@Injectable()
export class CertificationsService {
  private readonly mockCertifications: Record<string, TechnicianBadge[]> = {
    't0000000-0000-0000-0000-000000000001': [
      {
        badgeId: 'badge-01',
        name: 'Cisco CCNA',
        issuedDate: '2025-01-15',
        expiryDate: '2028-01-15',
        isVerified: true
      },
      {
        badgeId: 'badge-02',
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
   * available, falling back to mockCertifications for standalone tests.
   */
  async getTechnicianBadges(techId: string): Promise<TechnicianBadge[]> {
    if (this.db) {
      const rows = await this.db
        .select()
        .from(technicianCertifications)
        .where(eq(technicianCertifications.technicianId, techId));

      if (rows.length > 0) {
        return rows.map((row) => ({
          badgeId: row.id,
          name: row.name as TechnicianBadge['name'],
          issuedDate:
            row.issuedDate instanceof Date
              ? row.issuedDate.toISOString().split('T')[0]
              : String(row.issuedDate),
          expiryDate:
            row.expiryDate instanceof Date
              ? row.expiryDate.toISOString().split('T')[0]
              : String(row.expiryDate),
          isVerified: Boolean(row.isVerified)
        }));
      }
    }

    return (this.mockCertifications[techId] ?? []).map((badge) => ({ ...badge }));
  }
}
