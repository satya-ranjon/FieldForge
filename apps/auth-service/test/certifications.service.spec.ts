import { CertificationsService } from '../src/modules/vetting/certifications.service';

const KNOWN_TECH = 't0000000-0000-0000-0000-000000000001';

/**
 * Certifications are read from an in-memory map until Phase 1 of
 * docs/DEVELOPMENT_PLAN.md adds the `technician_certifications` table
 * (FR-AUTH-003). The invariant worth pinning now is the failure mode: an
 * unknown technician must read as "holds no badges", never as "unverified" or
 * as an error, because dispatch scoring will gate eligibility on this list.
 */
describe('CertificationsService', () => {
  let certifications: CertificationsService;

  beforeEach(() => {
    certifications = new CertificationsService();
  });

  it('returns an empty list for a technician it has never seen', async () => {
    // Not undefined and not a throw: a caller that has to distinguish "no
    // record" from "no badges" will eventually get it wrong in the direction
    // that grants access.
    await expect(certifications.getTechnicianBadges('nobody')).resolves.toEqual([]);
  });

  it('returns the badges it holds for a known technician', async () => {
    const badges = await certifications.getTechnicianBadges(KNOWN_TECH);

    expect(badges.length).toBeGreaterThan(0);
    expect(badges.map((b: { name: string }) => b.name)).toContain('Cisco CCNA');
  });

  it('gives every badge an issue date before its expiry', async () => {
    for (const badge of await certifications.getTechnicianBadges(KNOWN_TECH)) {
      expect(Date.parse(badge.issuedDate)).not.toBeNaN();
      expect(Date.parse(badge.expiryDate)).not.toBeNaN();
      expect(Date.parse(badge.issuedDate)).toBeLessThan(Date.parse(badge.expiryDate));
    }
  });

  it('marks verification explicitly rather than by omission', async () => {
    // `isVerified` decides whether a badge counts toward eligibility, so it has
    // to be a real boolean on every record, not an absent field read as falsy.
    for (const badge of await certifications.getTechnicianBadges(KNOWN_TECH)) {
      expect(typeof badge.isVerified).toBe('boolean');
    }
  });

  it('gives each badge a distinct identifier', async () => {
    const ids = (await certifications.getTechnicianBadges(KNOWN_TECH)).map(
      (b: { badgeId: string }) => b.badgeId
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not let a caller mutate the stored badges', async () => {
    const first = await certifications.getTechnicianBadges(KNOWN_TECH);
    first.pop();

    // A shared array handed out by reference is a background check one caller
    // can delete for everyone. Phase 1's table read makes this structural; the
    // test states the requirement in the meantime.
    const second = await certifications.getTechnicianBadges(KNOWN_TECH);
    expect(second.length).toBeGreaterThan(first.length);
  });

  it('reads certifications from database when Drizzle client is injected', async () => {
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'cert-1',
              technicianId: 't-123',
              name: 'OSHA 10',
              issuedDate: new Date('2025-01-01'),
              expiryDate: new Date('2028-01-01'),
              isVerified: true
            }
          ])
        })
      })
    };

    const serviceWithDb = new CertificationsService(
      mockDb as unknown as import('@fieldforge/common').DrizzleClient
    );
    const badges = await serviceWithDb.getTechnicianBadges('t-123');

    expect(badges).toHaveLength(1);
    expect(badges[0]?.badgeId).toBe('cert-1');
    expect(badges[0]?.name).toBe('OSHA 10');
    expect(badges[0]?.isVerified).toBe(true);
    expect(badges[0]?.issuedDate).toBe('2025-01-01');
  });

  it('adds a certification in unverified status', async () => {
    const res = await certifications.addCertification('t-999', {
      name: 'Fiber Optic Certified',
      issuedDate: '2025-03-01',
      expiryDate: '2028-03-01'
    });

    expect(res.name).toBe('Fiber Optic Certified');
    expect(res.isVerified).toBe(false);
    expect(res.technicianId).toBe('t-999');

    const badges = await certifications.getTechnicianBadges('t-999');
    expect(badges).toHaveLength(1);
    expect(badges[0]?.isVerified).toBe(false);
  });

  it('verifies an existing certification', async () => {
    const added = await certifications.addCertification('t-888', {
      name: 'CompTIA A+',
      issuedDate: '2024-11-20',
      expiryDate: '2027-11-20'
    });

    const verified = await certifications.verifyCertification(added.badgeId, true);
    expect(verified.isVerified).toBe(true);

    const badges = await certifications.getTechnicianBadges('t-888');
    expect(badges[0]?.isVerified).toBe(true);
  });

  it('lists pending certifications', async () => {
    await certifications.addCertification('t-777', {
      name: 'OSHA 10',
      issuedDate: '2025-01-01',
      expiryDate: '2028-01-01'
    });

    const pending = await certifications.listPendingCertifications();
    expect(
      pending.some(
        (p: { name: string; technicianId?: string }) =>
          p.name === 'OSHA 10' && p.technicianId === 't-777'
      )
    ).toBe(true);
  });

  it('resolves certifications when queried by userId fallback in getTechnicianBadges', async () => {
    const mockDb = {
      select: jest
        .fn()
        // 1st call: select from technicianCertifications where technicianId = 'u-user-1' -> empty
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([])
          })
        })
        // 2nd call: select id from technicianProfiles where userId = 'u-user-1' -> finds profile 'tp-profile-1'
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ id: 'tp-profile-1' }])
            })
          })
        })
        // 3rd call: select from technicianCertifications where technicianId = 'tp-profile-1' -> finds cert
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              {
                id: 'cert-resolved-1',
                technicianId: 'tp-profile-1',
                name: 'Cisco CCNA',
                issuedDate: new Date('2025-01-15'),
                expiryDate: new Date('2028-01-15'),
                isVerified: true
              }
            ])
          })
        })
    };

    const serviceWithDb = new CertificationsService(
      mockDb as unknown as import('@fieldforge/common').DrizzleClient
    );
    const badges = await serviceWithDb.getTechnicianBadges('u-user-1');

    expect(badges).toHaveLength(1);
    expect(badges[0]?.badgeId).toBe('cert-resolved-1');
    expect(badges[0]?.technicianId).toBe('tp-profile-1');
    expect(badges[0]?.name).toBe('Cisco CCNA');
  });

  it('populates badges and certifications in getTechniciansBatch using profile IDs', async () => {
    const mockDb = {
      select: jest
        .fn()
        // 1st call: select from technicianProfiles innerJoin users where id IN ('tp-1')
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                {
                  id: 'tp-1',
                  firstName: 'Alex',
                  lastName: 'Rivas',
                  ratingAverage: '4.95',
                  jobsCompleted: 42,
                  hourlyRate: '85.00',
                  userStatus: 'ACTIVE'
                }
              ])
            })
          })
        })
        // 2nd call: select from technicianCertifications where technicianId IN ('tp-1')
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { technicianId: 'tp-1', badgeName: 'Cisco CCNA' },
              { technicianId: 'tp-1', badgeName: 'OSHA 10' }
            ])
          })
        })
    };

    const serviceWithDb = new CertificationsService(
      mockDb as unknown as import('@fieldforge/common').DrizzleClient
    );
    const result = await serviceWithDb.getTechniciansBatch(['tp-1']);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('tp-1');
    expect(result[0]?.badges).toEqual(['Cisco CCNA', 'OSHA 10']);
    expect(result[0]?.certifications).toEqual(['Cisco CCNA', 'OSHA 10']);
  });
});
