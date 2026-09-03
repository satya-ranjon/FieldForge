import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import type { AuthJwtPayload } from '@fieldforge/contracts';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Identity comes from the signed token, never from a header.
   *
   * `x-ff-user-id` is injected by the API Gateway after it verifies the bearer
   * token, but nothing on the wire makes that header trustworthy: this service
   * listens on 0.0.0.0 and no NetworkPolicy or mesh restricts who may reach it,
   * so any client that can open a socket to this port can also set the header.
   * Preferring it over the token — as this handler previously did — let an
   * unauthenticated caller read any profile by guessing a user id.
   *
   * The token is therefore the only accepted source of identity. The gateway
   * header is still read, but only to detect disagreement: a mismatch means the
   * request was tampered with between the gateway and here, and is refused
   * rather than silently resolved in either direction.
   */
  @Get('me')
  async getProfile(
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    if (!authHeader) {
      throw new UnauthorizedException('Unauthenticated');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Unauthenticated');
    }

    let payload: AuthJwtPayload;
    try {
      payload = this.jwtService.verify<AuthJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (gatewayUserId && gatewayUserId !== payload.sub) {
      throw new UnauthorizedException('Identity mismatch');
    }

    return this.usersService.getUserProfile(payload.sub);
  }
}
