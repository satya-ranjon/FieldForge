import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { CertificationsService } from '../src/modules/vetting/certifications.service';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { technicianProfiles } from '@fieldforge/database';

const KNOWN_TECH = 't0000000-0000-0000-0000-000000000001';

interface CertRecord {
  id: string;
  technicianId: string;
  name: string;
  issuedDate: Date;
  expiryDate: Date;
  isVerified: boolean;
}

interface DrizzleCondition {
  queryChunks?: Array<{ name?: string; value?: unknown } | unknown>;
}

function extractEq(condition: unknown): { col: string; val: unknown } | null {
  const cond = condition as DrizzleCondition | undefined;
  if (cond?.queryChunks && cond.queryChunks.length >= 4) {
    const colObj = cond.queryChunks[1] as { name?: string } | undefined;
    const col = colObj?.name || (typeof colObj === 'string' ? colObj : '');
    const chunk3 = cond.queryChunks[3] as { value?: unknown } | unknown;
    const val = chunk3 && typeof chunk3 === 'object' && 'value' in chunk3 ? chunk3.value : chunk3;
    return { col, val };
  }
  return null;
}

function createMockDb(initialCerts: CertRecord[] = []) {
  const certStore: CertRecord[] = initialCerts.map((c) => ({ ...c }));

  return {
    certStore,
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation((table: unknown) => ({
        where: jest.fn().mockImplementation((condition: unknown) => {
          const executeQuery = () => {
            if (table === technicianProfiles) {
              return [];
            }
            const eqParsed = extractEq(condition);
            if (eqParsed) {
              if (eqParsed.col === 'technician_id') {
                return certStore.filter((c) => c.technicianId === eqParsed.val);
              }
              if (eqParsed.col === 'id') {
                return certStore.filter((c) => c.id === eqParsed.val);
              }
              if (eqParsed.col === 'is_verified') {
                return certStore.filter((c) => c.isVerified === Boolean(eqParsed.val));
              }
            }
            return certStore;
          };

          const promise = Promise.resolve(executeQuery());
          return Object.assign(promise, {
            limit: jest.fn().mockImplementation(async (n: number) => {
              const res = await promise;
              return res.slice(0, n);
            })
          });
        }),
        limit: jest.fn().mockResolvedValue([])
      }))
    })),
    insert: jest.fn().mockImplementation(() => ({
      values: jest
        .fn()
        .mockImplementation(
          async (val: {
            id: string;
            technicianId: string;
            name: string;
            issuedDate: string | Date;
            expiryDate: string | Date;
            isVerified?: boolean;
          }) => {
            const record: CertRecord = {
              id: val.id,
              technicianId: val.technicianId,
              name: val.name,
              issuedDate:
                val.issuedDate instanceof Date ? val.issuedDate : new Date(val.issuedDate),
              expiryDate:
                val.expiryDate instanceof Date ? val.expiryDate : new Date(val.expiryDate),
              isVerified: Boolean(val.isVerified)
            };
            certStore.push(record);
            return [record];
          }
        )
    })),
    update: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockImplementation((setValues: Partial<CertRecord>) => ({
        where: jest.fn().mockImplementation(async (condition: unknown) => {
          const eqParsed = extractEq(condition);
          if (eqParsed && eqParsed.col === 'id') {
            const target = certStore.find((c) => c.id === eqParsed.val);
            if (target) {
              Object.assign(target, setValues);
              return [target];
            }
          }
          return [];
        })
      }))
    }))
  };
}

describe('CertificationsService', () => {
  let moduleRef: TestingModule;
  let certifications: CertificationsService;
  let mockDb: ReturnType<typeof createMockDb>;

  const defaultKnownCerts: CertRecord[] = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      technicianId: KNOWN_TECH,
      name: 'Cisco CCNA',
      issuedDate: new Date('2023-01-15'),
      expiryDate: new Date('2026-01-15'),
      isVerified: true
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      technicianId: KNOWN_TECH,
      name: 'Background Checked',
      issuedDate: new Date('2024-06-01'),
      expiryDate: new Date('2025-06-01'),
      isVerified: true
    }
  ];

  beforeEach(async () => {
    mockDb = createMockDb(defaultKnownCerts);

    moduleRef = await Test.createTestingModule({
      providers: [
        CertificationsService,
        {
          provide: DRIZZLE,
          useValue: mockDb as unknown as DrizzleClient
        }
      ]
    }).compile();

    certifications = moduleRef.get<CertificationsService>(CertificationsService);
  });

  it('returns an empty list for a technician it has never seen', async () => {
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

    const second = await certifications.getTechnicianBadges(KNOWN_TECH);
    expect(second.length).toBeGreaterThan(first.length);
  });

  it('reads certifications from database when Drizzle client is injected via TestingModule', async () => {
    const testDb = {
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

    const module = await Test.createTestingModule({
      providers: [
        CertificationsService,
        {
          provide: DRIZZLE,
          useValue: testDb as unknown as DrizzleClient
        }
      ]
    }).compile();

    const serviceWithDb = module.get<CertificationsService>(CertificationsService);
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

  it('throws NotFoundException when verifying non-existent certification', async () => {
    await expect(certifications.verifyCertification('non-existent-cert', true)).rejects.toThrow(
      NotFoundException
    );
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
    const customMockDb = {
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

    const module = await Test.createTestingModule({
      providers: [
        CertificationsService,
        {
          provide: DRIZZLE,
          useValue: customMockDb as unknown as DrizzleClient
        }
      ]
    }).compile();

    const serviceWithDb = module.get<CertificationsService>(CertificationsService);
    const badges = await serviceWithDb.getTechnicianBadges('u-user-1');

    expect(badges).toHaveLength(1);
    expect(badges[0]?.badgeId).toBe('cert-resolved-1');
    expect(badges[0]?.technicianId).toBe('tp-profile-1');
    expect(badges[0]?.name).toBe('Cisco CCNA');
  });

  it('populates badges and certifications in getTechniciansBatch using profile IDs', async () => {
    const customMockDb = {
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

    const module = await Test.createTestingModule({
      providers: [
        CertificationsService,
        {
          provide: DRIZZLE,
          useValue: customMockDb as unknown as DrizzleClient
        }
      ]
    }).compile();

    const serviceWithDb = module.get<CertificationsService>(CertificationsService);
    const result = await serviceWithDb.getTechniciansBatch(['tp-1']);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('tp-1');
    expect(result[0]?.badges).toEqual(['Cisco CCNA', 'OSHA 10']);
    expect(result[0]?.certifications).toEqual(['Cisco CCNA', 'OSHA 10']);
  });
});
