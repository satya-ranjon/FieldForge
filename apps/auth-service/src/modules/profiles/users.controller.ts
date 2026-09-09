import { Controller, Get, Headers, Param } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfilesService } from './profiles.service';
import { verifyGatewayUser } from '@fieldforge/common';

@Controller('users')
export class UsersController {
  constructor(
    private readonly profilesService: ProfilesService,
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
    const user = verifyGatewayUser(this.jwtService, authHeader, gatewayUserId);
    return this.profilesService.getUserProfile(user.userId);
  }

  /**
   * Retrieves profile details for a specific user ID.
   * Serves as the official inter-service directory lookup for domain services
   * (e.g. work-order-service, billing-service) needing to resolve profiles
   * without direct foreign database querying (ADR 006 / RULE-ARCH-01).
   */
  @Get(':id/profile')
  async getUserProfileById(
    @Param('id') userId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    if (authHeader) {
      verifyGatewayUser(this.jwtService, authHeader, gatewayUserId);
    }
    return this.profilesService.getUserProfile(userId);
  }
}
