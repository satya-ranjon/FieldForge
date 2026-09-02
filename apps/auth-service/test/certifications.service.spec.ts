import { CertificationsService } from '../src/modules/certifications/certifications.service';

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
    expect(badges.map((b) => b.name)).toContain('Cisco CCNA');
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
    const ids = (await certifications.getTechnicianBadges(KNOWN_TECH)).map((b) => b.badgeId);
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
    expect(badges[0].badgeId).toBe('cert-1');
    expect(badges[0].name).toBe('OSHA 10');
    expect(badges[0].isVerified).toBe(true);
    expect(badges[0].issuedDate).toBe('2025-01-01');
  });
});
