import { Injectable } from '@nestjs/common';

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

  /**
   * Returns copies, not the stored records: a caller holding a reference into
   * `mockCertifications` could delete a technician's background check for every
   * subsequent request. Phase 1 of docs/DEVELOPMENT_PLAN.md replaces this map
   * with a read of `technician_certifications`, which makes the isolation
   * structural rather than defensive.
   */
  async getTechnicianBadges(techId: string): Promise<TechnicianBadge[]> {
    return (this.mockCertifications[techId] ?? []).map((badge) => ({ ...badge }));
  }
}
