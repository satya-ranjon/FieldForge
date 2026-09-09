import {
  createParamDecorator,
  Injectable,
  Optional,
  Inject,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext
} from '@nestjs/common';
import type { AuthJwtPayload } from '@fieldforge/contracts';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  profileId?: string;
}

export interface JwtVerifier {
  verify<T extends object = object>(token: string): T;
}

/**
 * Verified user identity extracted from bearer token (respects C5 invariant).
 * Gateway header is compared to token payload to guard against header-spoofing.
 *
 * @param jwtVerifier - JwtService or any object implementing verify()
 * @param authHeader - The raw Authorization header (e.g., 'Bearer <token>')
 * @param gatewayUserId - Downstream identity assertion from API gateway ('x-ff-user-id')
 * @param gatewayProfileId - Optional downstream profile assertion ('x-ff-profile-id')
 * @returns AuthenticatedUser with { userId, role, profileId }
 * @throws UnauthorizedException on missing/malformed auth, invalid token, or identity mismatch
 */
export function verifyGatewayUser(
  jwtVerifier: JwtVerifier,
  authHeader?: string,
  gatewayUserId?: string,
  gatewayProfileId?: string
): AuthenticatedUser {
  if (!authHeader) {
    throw new UnauthorizedException('Missing Authorization header');
  }

  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new UnauthorizedException('Invalid Authorization format');
  }

  let payload: AuthJwtPayload;
  try {
    payload = jwtVerifier.verify<AuthJwtPayload>(token);
  } catch {
    throw new UnauthorizedException('Invalid or expired token');
  }

  if (gatewayUserId && gatewayUserId !== payload.sub) {
    throw new UnauthorizedException('Identity mismatch between header and token');
  }

  return {
    userId: payload.sub,
    role: payload.role,
    profileId: payload.profileId || gatewayProfileId
  };
}

/**
 * Route param decorator to retrieve the authenticated user (or a specific property)
 * from the request object populated by GatewayAuthGuard or downstream handlers.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request?.user as AuthenticatedUser | undefined;
    return data && user ? user[data] : user;
  }
);

/**
 * Guard that verifies bearer token against C5 identity boundaries and attaches
 * the authenticated user to `request.user`.
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(@Optional() @Inject('JwtService') private readonly jwtService?: JwtVerifier) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.jwtService) {
      throw new UnauthorizedException('JwtService not configured for GatewayAuthGuard');
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    const gatewayUserId = request.headers?.['x-ff-user-id'];
    const gatewayProfileId = request.headers?.['x-ff-profile-id'];

    const user = verifyGatewayUser(this.jwtService, authHeader, gatewayUserId, gatewayProfileId);
    request.user = user;
    return true;
  }
}
