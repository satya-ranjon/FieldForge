import {
  InternalServiceGuard,
  safeCompareSecrets,
  getInternalServiceSecret,
  INTERNAL_SECRET_HEADER,
  SERVICE_NAME_HEADER
} from '../src/auth/internal-service.guard';
import { UnauthorizedException, ForbiddenException, type ExecutionContext } from '@nestjs/common';

describe('safeCompareSecrets', () => {
  it('returns true for matching secrets', () => {
    expect(safeCompareSecrets('secret123', 'secret123')).toBe(true);
  });

  it('returns false for mismatched secrets of same length', () => {
    expect(safeCompareSecrets('secret123', 'secret456')).toBe(false);
  });

  it('returns false without throwing RangeError when lengths differ', () => {
    expect(() => safeCompareSecrets('short', 'much-longer-secret')).not.toThrow();
    expect(safeCompareSecrets('short', 'much-longer-secret')).toBe(false);
    expect(safeCompareSecrets('much-longer-secret', 'short')).toBe(false);
  });

  it('returns false when either secret is missing or empty', () => {
    expect(safeCompareSecrets(undefined, 'secret')).toBe(false);
    expect(safeCompareSecrets('secret', undefined)).toBe(false);
    expect(safeCompareSecrets('', 'secret')).toBe(false);
    expect(safeCompareSecrets('secret', '')).toBe(false);
  });
});

describe('getInternalServiceSecret', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns INTERNAL_SERVICE_SECRET when configured', () => {
    const env = {
      INTERNAL_SERVICE_SECRET: 'custom-secret',
      NODE_ENV: 'production'
    } as NodeJS.ProcessEnv;
    expect(getInternalServiceSecret(env)).toBe('custom-secret');
  });

  it('fails closed (returns undefined) in production if secret is missing', () => {
    const env = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;
    delete env.INTERNAL_SERVICE_SECRET;
    expect(getInternalServiceSecret(env)).toBeUndefined();
  });

  it('returns fallback in non-production if secret is missing', () => {
    const env = { NODE_ENV: 'test' } as NodeJS.ProcessEnv;
    delete env.INTERNAL_SERVICE_SECRET;
    expect(getInternalServiceSecret(env)).toBe('fieldforge_internal_dev_secret');
  });
});

describe('InternalServiceGuard', () => {
  const testSecret = 'correct-internal-test-secret-12345';

  function createMockContext(headers: Record<string, string | undefined>): ExecutionContext {
    const request: Record<string, unknown> = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({})
      })
    } as unknown as ExecutionContext;
  }

  it('allows request when secret matches and service is authorized', () => {
    const guard = new InternalServiceGuard(['billing-service'], testSecret);
    const context = createMockContext({
      [INTERNAL_SECRET_HEADER]: testSecret,
      [SERVICE_NAME_HEADER]: 'billing-service'
    });

    const result = guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req.callingService).toBe('billing-service');
  });

  it('rejects with 401 when secret header is missing', () => {
    const guard = new InternalServiceGuard(['billing-service'], testSecret);
    const context = createMockContext({
      [SERVICE_NAME_HEADER]: 'billing-service'
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid or missing internal service secret');
  });

  it('rejects with 401 when secret is invalid (same length)', () => {
    const guard = new InternalServiceGuard(['billing-service'], testSecret);
    const context = createMockContext({
      [INTERNAL_SECRET_HEADER]: 'wrong-internal-test-secret-12345',
      [SERVICE_NAME_HEADER]: 'billing-service'
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects with 401 when secret length differs without throwing RangeError', () => {
    const guard = new InternalServiceGuard(['billing-service'], testSecret);
    const context = createMockContext({
      [INTERNAL_SECRET_HEADER]: 'short',
      [SERVICE_NAME_HEADER]: 'billing-service'
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects with 401 when service-name header is missing', () => {
    const guard = new InternalServiceGuard(['billing-service'], testSecret);
    const context = createMockContext({
      [INTERNAL_SECRET_HEADER]: testSecret
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(`Missing ${SERVICE_NAME_HEADER} header`);
  });

  it('rejects with 403 when service-name is unauthorized', () => {
    const guard = new InternalServiceGuard(['billing-service'], testSecret);
    const context = createMockContext({
      [INTERNAL_SECRET_HEADER]: testSecret,
      [SERVICE_NAME_HEADER]: 'dispatch-service'
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      "Service 'dispatch-service' is not authorized for this internal resource"
    );
  });

  it('rejects with 401 when configured secret is undefined (production fail closed)', () => {
    const guard = new InternalServiceGuard(['billing-service'], undefined);
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.INTERNAL_SERVICE_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.INTERNAL_SERVICE_SECRET;

      const context = createMockContext({
        [INTERNAL_SECRET_HEADER]: testSecret,
        [SERVICE_NAME_HEADER]: 'billing-service'
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Internal service authentication secret is not configured'
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.INTERNAL_SERVICE_SECRET = originalSecret;
    }
  });
});
