import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  type ExecutionContext
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CertificationsController } from '../src/modules/vetting/certifications.controller';
import { CertificationsService } from '../src/modules/vetting/certifications.service';
import {
  ZodValidationPipe,
  InternalServiceGuard,
  INTERNAL_SECRET_HEADER,
  SERVICE_NAME_HEADER
} from '@fieldforge/common';
import { createCertificationSchema, batchTechniciansSchema, UserRole } from '@fieldforge/contracts';

describe('CertificationsController', () => {
  const TECH_USER_ID = 't1111111-1111-4111-8111-111111111111';
  const ADMIN_USER_ID = 'a1111111-1111-4111-8111-111111111111';
  const BUYER_USER_ID = 'b1111111-1111-4111-8111-111111111111';

  let controller: CertificationsController;
  let mockCertService: jest.Mocked<CertificationsService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockCertService = {
      getTechnicianBadges: jest.fn().mockResolvedValue([
        {
          badgeId: 'b-1',
          technicianId: TECH_USER_ID,
          name: 'Cisco CCNA',
          issuedDate: '2025-01-15',
          expiryDate: '2028-01-15',
          isVerified: true
        }
      ]),
      addCertification: jest.fn().mockResolvedValue({
        badgeId: 'b-new',
        technicianId: TECH_USER_ID,
        name: 'OSHA 10',
        issuedDate: '2025-02-01',
        expiryDate: '2028-02-01',
        isVerified: false
      }),
      verifyCertification: jest.fn().mockResolvedValue({
        badgeId: 'b-new',
        technicianId: TECH_USER_ID,
        name: 'OSHA 10',
        issuedDate: '2025-02-01',
        expiryDate: '2028-02-01',
        isVerified: true
      }),
      listPendingCertifications: jest.fn().mockResolvedValue([]),
      getTechniciansBatch: jest.fn().mockResolvedValue([
        {
          id: TECH_USER_ID,
          firstName: 'Alex',
          lastName: 'Rivas',
          ratingAverage: '4.95',
          jobsCompleted: 42,
          hourlyRate: '85.00',
          userStatus: 'ACTIVE',
          badges: ['Cisco CCNA']
        }
      ])
    } as unknown as jest.Mocked<CertificationsService>;

    mockJwtService = {
      verify: jest.fn().mockReturnValue({
        sub: TECH_USER_ID,
        email: 'tech@example.com',
        role: UserRole.TECHNICIAN
      })
    } as unknown as jest.Mocked<JwtService>;

    controller = new CertificationsController(mockCertService, mockJwtService);
  });

  describe('GET /technicians/:id/badges', () => {
    it('returns badges for authenticated caller', async () => {
      const badges = await controller.getBadges(TECH_USER_ID, 'Bearer valid.jwt');
      expect(badges).toHaveLength(1);
      expect(mockCertService.getTechnicianBadges).toHaveBeenCalledWith(TECH_USER_ID);
    });

    it('rejects unauthenticated request', async () => {
      await expect(controller.getBadges(TECH_USER_ID, undefined)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('rejects identity header mismatch (anti-spoofing C5)', async () => {
      await expect(
        controller.getBadges(TECH_USER_ID, 'Bearer valid.jwt', 'wrong-user-id')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /technicians/certifications', () => {
    it('allows technician to add certification derived from JWT sub', async () => {
      const res = await controller.addCertification(
        {
          name: 'OSHA 10',
          issuedDate: '2025-02-01',
          expiryDate: '2028-02-01'
        },
        'Bearer valid.jwt'
      );

      expect(res.name).toBe('OSHA 10');
      expect(mockCertService.addCertification).toHaveBeenCalledWith(TECH_USER_ID, {
        name: 'OSHA 10',
        issuedDate: '2025-02-01',
        expiryDate: '2028-02-01'
      });
    });

    it('prefers technicianProfileId from JWT profileId payload when available', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: TECH_USER_ID,
        email: 'tech@example.com',
        role: UserRole.TECHNICIAN,
        profileId: 'tp-profile-999'
      });

      await controller.addCertification(
        {
          name: 'OSHA 10',
          issuedDate: '2025-02-01',
          expiryDate: '2028-02-01'
        },
        'Bearer valid.jwt'
      );

      expect(mockCertService.addCertification).toHaveBeenCalledWith('tp-profile-999', {
        name: 'OSHA 10',
        issuedDate: '2025-02-01',
        expiryDate: '2028-02-01'
      });
    });

    it('resolves profileId via ProfilesService when absent from token', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: TECH_USER_ID,
        email: 'tech@example.com',
        role: UserRole.TECHNICIAN
      });

      const mockProfilesService = {
        resolveProfileId: jest.fn().mockResolvedValue('tp-resolved-888')
      };

      const controllerWithProfiles = new CertificationsController(
        mockCertService,
        mockJwtService,
        mockProfilesService as unknown as import('../src/modules/profiles/profiles.service').ProfilesService
      );

      await controllerWithProfiles.addCertification(
        {
          name: 'OSHA 10',
          issuedDate: '2025-02-01',
          expiryDate: '2028-02-01'
        },
        'Bearer valid.jwt'
      );

      expect(mockProfilesService.resolveProfileId).toHaveBeenCalledWith(
        TECH_USER_ID,
        UserRole.TECHNICIAN
      );
      expect(mockCertService.addCertification).toHaveBeenCalledWith('tp-resolved-888', {
        name: 'OSHA 10',
        issuedDate: '2025-02-01',
        expiryDate: '2028-02-01'
      });
    });

    it('forbids buyer from submitting certifications', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: BUYER_USER_ID,
        email: 'buyer@example.com',
        role: UserRole.BUYER
      });

      await expect(
        controller.addCertification(
          {
            name: 'OSHA 10',
            issuedDate: '2025-02-01',
            expiryDate: '2028-02-01'
          },
          'Bearer buyer.jwt'
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects malformed date formats via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(createCertificationSchema);
      expect(() =>
        pipe.transform(
          { name: 'OSHA 10', issuedDate: '02-01-2025', expiryDate: '2028-02-01' },
          { type: 'body', metatype: Object, data: '' }
        )
      ).toThrow(BadRequestException);
    });
  });

  describe('PATCH /technicians/certifications/:id/verify', () => {
    it('allows admin to verify certification', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: ADMIN_USER_ID,
        email: 'admin@fieldforge.io',
        role: UserRole.ADMIN
      });

      const res = await controller.verifyCertification(
        'b-new',
        { isVerified: true },
        'Bearer admin.jwt'
      );

      expect(res.isVerified).toBe(true);
      expect(mockCertService.verifyCertification).toHaveBeenCalledWith('b-new', true);
    });

    it('forbids technician from self-verifying credentials', async () => {
      await expect(
        controller.verifyCertification('b-new', { isVerified: true }, 'Bearer valid.jwt')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /technicians/certifications/pending', () => {
    it('allows admin to list pending certifications', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: ADMIN_USER_ID,
        email: 'admin@fieldforge.io',
        role: UserRole.ADMIN
      });

      const res = await controller.listPending('Bearer admin.jwt');
      expect(res).toEqual([]);
      expect(mockCertService.listPendingCertifications).toHaveBeenCalled();
    });

    it('forbids technician from viewing pending review queue', async () => {
      await expect(controller.listPending('Bearer valid.jwt')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('POST /technicians/batch (ISSUE-007)', () => {
    const TEST_SECRET = 'test-internal-service-secret-12345';

    const createMockExecutionContext = (
      headers: Record<string, string | undefined>
    ): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            headers
          })
        }),
        getHandler: () => controller.getBatchTechnicians,
        getClass: () => CertificationsController
      }) as unknown as ExecutionContext;

    it('returns batch technician summaries for valid IDs', async () => {
      const res = await controller.getBatchTechnicians({ ids: [TECH_USER_ID] });
      expect(res.length).toBe(1);
      expect(res[0]?.id).toBe(TECH_USER_ID);
      expect(res[0]?.firstName).toBe('Alex');
      expect(mockCertService.getTechniciansBatch).toHaveBeenCalledWith([TECH_USER_ID]);
    });

    it('rejects invalid payload format via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(batchTechniciansSchema);
      expect(() =>
        pipe.transform({ ids: [''] }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);
      expect(() =>
        pipe.transform({ ids: 'invalid' }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);
      expect(() =>
        pipe.transform({ ids: [] }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);
      expect(() =>
        pipe.transform(
          { ids: Array.from({ length: 101 }, (_, i) => `tech-${i}`) },
          { type: 'body', metatype: Object, data: '' }
        )
      ).toThrow(BadRequestException);
    });

    it('allows valid internal request from dispatch-matching-service with correct secret', () => {
      const guard = new InternalServiceGuard(['dispatch-matching-service'], TEST_SECRET);
      const context = createMockExecutionContext({
        [SERVICE_NAME_HEADER]: 'dispatch-matching-service',
        [INTERNAL_SECRET_HEADER]: TEST_SECRET
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('rejects internal request when internal secret is missing', () => {
      const guard = new InternalServiceGuard(['dispatch-matching-service'], TEST_SECRET);
      const context = createMockExecutionContext({
        [SERVICE_NAME_HEADER]: 'dispatch-matching-service'
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('rejects internal request when internal secret is invalid', () => {
      const guard = new InternalServiceGuard(['dispatch-matching-service'], TEST_SECRET);
      const context = createMockExecutionContext({
        [SERVICE_NAME_HEADER]: 'dispatch-matching-service',
        [INTERNAL_SECRET_HEADER]: 'wrong-secret'
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('rejects internal request when service name header is missing', () => {
      const guard = new InternalServiceGuard(['dispatch-matching-service'], TEST_SECRET);
      const context = createMockExecutionContext({
        [INTERNAL_SECRET_HEADER]: TEST_SECRET
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('forbids request from unauthorized internal service (e.g. billing-service)', () => {
      const guard = new InternalServiceGuard(['dispatch-matching-service'], TEST_SECRET);
      const context = createMockExecutionContext({
        [SERVICE_NAME_HEADER]: 'billing-service',
        [INTERNAL_SECRET_HEADER]: TEST_SECRET
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('rejects external user request with valid JWT but missing internal service headers', () => {
      const guard = new InternalServiceGuard(['dispatch-matching-service'], TEST_SECRET);
      const context = createMockExecutionContext({
        authorization: 'Bearer valid.buyer.jwt',
        'x-ff-user-id': BUYER_USER_ID,
        'x-ff-user-role': UserRole.BUYER
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('verifies InternalServiceGuard metadata is applied to getBatchTechnicians method', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getBatchTechnicians);
      expect(guards).toBeDefined();
      expect(Array.isArray(guards)).toBe(true);
      const internalGuard = guards.find((g: unknown) => g instanceof InternalServiceGuard);
      expect(internalGuard).toBeDefined();
    });
  });
});
