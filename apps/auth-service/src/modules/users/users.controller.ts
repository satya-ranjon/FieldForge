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

  @Get('me')
  async getProfile(
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    let userId = gatewayUserId;

    if (!userId && authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        try {
          const payload = this.jwtService.verify<AuthJwtPayload>(token);
          userId = payload.sub;
        } catch {
          throw new UnauthorizedException('Invalid token');
        }
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Unauthenticated');
    }

    return this.usersService.getUserProfile(userId);
  }
}
