import {
  Injectable,
  Optional,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  type CanActivate,
  type ExecutionContext
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import { loadEnv } from '../config/env';

export const INTERNAL_SECRET_HEADER = 'x-fieldforge-internal-secret';
export const SERVICE_NAME_HEADER = 'x-fieldforge-service-name';
export const ALLOWED_SERVICES_KEY = 'allowed_internal_services';

/**
 * Decorator to restrict an internal controller or endpoint to specific calling microservices.
 */
export const AllowedServices = (...services: string[]) =>
  SetMetadata(ALLOWED_SERVICES_KEY, services);

/**
 * Constant-time string comparison that prevents timing attacks and guards against
 * RangeError when comparing buffers of different byte lengths.
 */
export function safeCompareSecrets(provided?: string, expected?: string): boolean {
  if (!provided || !expected) {
    return false;
  }
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Resolves the internal service secret from the environment.
 * In production (`NODE_ENV=production`), missing or empty values fail closed (return undefined).
 * In development or test environments, falls back to a non-production development placeholder.
 */
export function getInternalServiceSecret(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (
    env === process.env &&
    (!env.INTERNAL_SERVICE_SECRET || env.INTERNAL_SERVICE_SECRET.trim() === '')
  ) {
    loadEnv(env);
  }

  const raw = env.INTERNAL_SERVICE_SECRET?.trim();
  if (raw && raw.length > 0) {
    return raw;
  }

  if (env.NODE_ENV === 'production') {
    return undefined; // Fail closed in production
  }

  return 'fieldforge_internal_dev_secret';
}

/**
 * Returns the configured internal service secret, or throws in production if missing.
 */
export function requireInternalServiceSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = getInternalServiceSecret(env);
  if (!secret) {
    throw new Error(
      'INTERNAL_SERVICE_SECRET is not configured. Service refused to initialize internal authentication without a shared secret in production.'
    );
  }
  return secret;
}

/**
 * Guard that validates incoming service-to-service requests using:
 * 1. Constant-time comparison of `x-fieldforge-internal-secret` against configured secret.
 * 2. Mandatory presence and authorization of `x-fieldforge-service-name`.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly allowedServices?: string[];
  private readonly configuredSecret?: string;
  private readonly reflector?: Reflector;

  constructor(
    @Optional() reflectorOrAllowedServices?: Reflector | string[],
    @Optional() configuredSecret?: string
  ) {
    if (Array.isArray(reflectorOrAllowedServices)) {
      this.allowedServices = reflectorOrAllowedServices;
    } else if (
      reflectorOrAllowedServices &&
      typeof (reflectorOrAllowedServices as Reflector).getAllAndOverride === 'function'
    ) {
      this.reflector = reflectorOrAllowedServices as Reflector;
    }
    this.configuredSecret = configuredSecret;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers || {};

    const rawProvidedSecret = headers[INTERNAL_SECRET_HEADER];
    const providedSecret =
      typeof rawProvidedSecret === 'string'
        ? rawProvidedSecret.trim()
        : Array.isArray(rawProvidedSecret)
          ? rawProvidedSecret[0]?.trim()
          : undefined;

    const rawServiceName = headers[SERVICE_NAME_HEADER];
    const serviceName =
      typeof rawServiceName === 'string'
        ? rawServiceName.trim()
        : Array.isArray(rawServiceName)
          ? rawServiceName[0]?.trim()
          : undefined;

    // 1. Verify expected secret configuration (Fail-closed in production)
    const expectedSecret = this.configuredSecret ?? getInternalServiceSecret();
    if (!expectedSecret) {
      throw new UnauthorizedException('Internal service authentication secret is not configured');
    }

    // 2. Authenticate provided secret in constant time
    if (!providedSecret || !safeCompareSecrets(providedSecret, expectedSecret)) {
      throw new UnauthorizedException('Invalid or missing internal service secret');
    }

    // 3. Service name is mandatory
    if (!serviceName) {
      throw new UnauthorizedException(`Missing ${SERVICE_NAME_HEADER} header`);
    }

    // 4. Authorize service name against allowed services
    let allowed = this.allowedServices;
    if (!allowed && this.reflector) {
      allowed = this.reflector.getAllAndOverride<string[]>(ALLOWED_SERVICES_KEY, [
        context.getHandler(),
        context.getClass()
      ]);
    }

    if (allowed && allowed.length > 0 && !allowed.includes(serviceName)) {
      throw new ForbiddenException(
        `Service '${serviceName}' is not authorized for this internal resource`
      );
    }

    request.callingService = serviceName;
    return true;
  }
}
