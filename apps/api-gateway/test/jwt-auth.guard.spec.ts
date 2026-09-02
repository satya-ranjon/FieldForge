import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { UserRole } from '@fieldforge/contracts';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn()
    } as unknown as jest.Mocked<Reflector>;

    jwtService = {
      verifyAsync: jest.fn()
    } as unknown as jest.Mocked<JwtService>;

    guard = new JwtAuthGuard(reflector, jwtService);
  });

  const createMockContext = (url: string, authorization?: string) => {
    const request = {
      originalUrl: url,
      headers: {
        authorization
      },
      user: undefined
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request
      }),
      getHandler: () => ({}),
      getClass: () => ({})
    } as unknown as import('@nestjs/common').ExecutionContext;
  };

  it('allows access when route is decorated with @Public', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext('/api/v1/protected-resource');

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('allows access to public auth endpoints without token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext('/api/v1/auth/login');

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('allows access to health check endpoints without token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext('/api/v1/healthz');

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('throws UnauthorizedException on protected endpoint without authorization header', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext('/api/v1/users/me');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException on protected endpoint with invalid token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));
    const context = createMockContext('/api/v1/users/me', 'Bearer invalid.token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('populates req.user and allows access on valid token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'usr-123',
      email: 'buyer@example.com',
      role: UserRole.BUYER
    });

    const context = createMockContext('/api/v1/users/me', 'Bearer valid.jwt.token');
    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({
      userId: 'usr-123',
      email: 'buyer@example.com',
      role: UserRole.BUYER
    });
  });
});
