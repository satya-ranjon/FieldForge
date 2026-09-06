import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '@fieldforge/common';
import type { AuthJwtPayload } from '@fieldforge/contracts';

const PUBLIC_PREFIXES = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/healthz',
  '/api/v1/readyz',
  '/api/v1/metrics',
  '/healthz',
  '/readyz',
  '/metrics'
];

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const request = context.switchToHttp().getRequest();
    const url = request.originalUrl || request.url || '';

    const isPublicPath = PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix));

    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && typeof authHeader === 'string') {
      const [type, credentials] = authHeader.split(' ');
      if (type === 'Bearer' && credentials) {
        token = credentials;
      }
    }

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token);
        request.user = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role
        };
        return true;
      } catch {
        if (!isPublic && !isPublicPath) {
          throw new UnauthorizedException('Invalid or expired token');
        }
      }
    }

    if (isPublic || isPublicPath) {
      return true;
    }

    throw new UnauthorizedException('Missing authorization token');
  }
}
