import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@fieldforge/common';
import { UserRole } from '@fieldforge/contracts';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn()
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: { role?: string }) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user })
      }),
      getHandler: () => ({}),
      getClass: () => ({})
    } as unknown as import('@nestjs/common').ExecutionContext;
  };

  it('allows access if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.BUYER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access if user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.TECHNICIAN, UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.TECHNICIAN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access if user does not have a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.TECHNICIAN]);
    const context = createMockContext({ role: UserRole.BUYER });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access if user is not attached to the request', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.BUYER]);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});
