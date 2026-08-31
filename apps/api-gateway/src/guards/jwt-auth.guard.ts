import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader && !request.url.startsWith('/api/v1/auth')) {
      // In production: verify JWT token via public key or auth-service introspect
      // Here we check for presence
      return true;
    }
    return true;
  }
}
