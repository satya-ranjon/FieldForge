import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { verifyGatewayUser, GatewayAuthGuard } from '../src/auth/gateway-auth';
import { UserRole } from '@fieldforge/contracts';

describe('gateway-auth', () => {
  let mockJwtVerifier: { verify: jest.Mock };

  beforeEach(() => {
    mockJwtVerifier = {
      verify: jest.fn()
    };
  });

  describe('verifyGatewayUser', () => {
    it('throws UnauthorizedException when authHeader is missing or empty', () => {
      expect(() => verifyGatewayUser(mockJwtVerifier, undefined)).toThrow(
        new UnauthorizedException('Missing Authorization header')
      );
      expect(() => verifyGatewayUser(mockJwtVerifier, '')).toThrow(
        new UnauthorizedException('Missing Authorization header')
      );
    });

    it('throws UnauthorizedException when authHeader has invalid format', () => {
      expect(() => verifyGatewayUser(mockJwtVerifier, 'Basic abc123')).toThrow(
        new UnauthorizedException('Invalid Authorization format')
      );
      expect(() => verifyGatewayUser(mockJwtVerifier, 'Bearer')).toThrow(
        new UnauthorizedException('Invalid Authorization format')
      );
    });

    it('throws UnauthorizedException when token verification fails', () => {
      mockJwtVerifier.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => verifyGatewayUser(mockJwtVerifier, 'Bearer invalid.token')).toThrow(
        new UnauthorizedException('Invalid or expired token')
      );
    });

    it('throws UnauthorizedException when gatewayUserId does not match token sub (C5 spoofing check)', () => {
      mockJwtVerifier.verify.mockReturnValue({
        sub: 'legitimate-user-id',
        email: 'user@fieldforge.dev',
        role: UserRole.BUYER
      });

      expect(() =>
        verifyGatewayUser(mockJwtVerifier, 'Bearer valid.token', 'attacker-spoofed-id', 'profile-1')
      ).toThrow(new UnauthorizedException('Identity mismatch between header and token'));
    });

    it('returns AuthenticatedUser when token is valid and gatewayUserId matches', () => {
      mockJwtVerifier.verify.mockReturnValue({
        sub: 'user-123',
        email: 'user@fieldforge.dev',
        role: UserRole.TECHNICIAN,
        profileId: 'token-profile-1'
      });

      const user = verifyGatewayUser(
        mockJwtVerifier,
        'Bearer valid.token',
        'user-123',
        'gateway-profile-ignored'
      );

      expect(user).toEqual({
        userId: 'user-123',
        role: UserRole.TECHNICIAN,
        profileId: 'token-profile-1'
      });
    });

    it('falls back to gatewayProfileId when token payload does not contain profileId', () => {
      mockJwtVerifier.verify.mockReturnValue({
        sub: 'user-123',
        email: 'user@fieldforge.dev',
        role: UserRole.BUYER
      });

      const user = verifyGatewayUser(
        mockJwtVerifier,
        'Bearer valid.token',
        'user-123',
        'gateway-profile-999'
      );

      expect(user).toEqual({
        userId: 'user-123',
        role: UserRole.BUYER,
        profileId: 'gateway-profile-999'
      });
    });

    it('allows verification when gatewayUserId is omitted (direct calls/tests)', () => {
      mockJwtVerifier.verify.mockReturnValue({
        sub: 'user-direct',
        email: 'direct@fieldforge.dev',
        role: UserRole.ADMIN
      });

      const user = verifyGatewayUser(mockJwtVerifier, 'Bearer valid.token');

      expect(user).toEqual({
        userId: 'user-direct',
        role: UserRole.ADMIN,
        profileId: undefined
      });
    });
  });

  describe('GatewayAuthGuard', () => {
    const createMockExecutionContext = (requestObj: Record<string, unknown>): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => requestObj
        })
      }) as unknown as ExecutionContext;

    it('throws UnauthorizedException when JwtService is not configured', () => {
      const guard = new GatewayAuthGuard(undefined);
      const ctx = createMockExecutionContext({});

      expect(() => guard.canActivate(ctx)).toThrow(
        new UnauthorizedException('JwtService not configured for GatewayAuthGuard')
      );
    });

    it('extracts headers, verifies caller, and attaches user to request', () => {
      mockJwtVerifier.verify.mockReturnValue({
        sub: 'user-abc',
        email: 'user@fieldforge.dev',
        role: UserRole.BUYER,
        profileId: 'profile-abc'
      });

      const guard = new GatewayAuthGuard(mockJwtVerifier);
      const request: Record<string, unknown> = {
        headers: {
          authorization: 'Bearer test.token',
          'x-ff-user-id': 'user-abc',
          'x-ff-profile-id': 'profile-abc'
        }
      };
      const ctx = createMockExecutionContext(request);

      const result = guard.canActivate(ctx);
      expect(result).toBe(true);
      expect(request.user).toEqual({
        userId: 'user-abc',
        role: UserRole.BUYER,
        profileId: 'profile-abc'
      });
    });

    it('propagates UnauthorizedException on mismatch', () => {
      mockJwtVerifier.verify.mockReturnValue({
        sub: 'user-abc',
        role: UserRole.BUYER
      });

      const guard = new GatewayAuthGuard(mockJwtVerifier);
      const request: Record<string, unknown> = {
        headers: {
          authorization: 'Bearer test.token',
          'x-ff-user-id': 'spoofed-id'
        }
      };
      const ctx = createMockExecutionContext(request);

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });
});
