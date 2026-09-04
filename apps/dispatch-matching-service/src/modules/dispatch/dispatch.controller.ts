import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GeoSearchService } from '../geo-search/geo-search.service';
import { BidsService } from '../bids/bids.service';
import {
  updateTechnicianLocationSchema,
  nearbyTechniciansQuerySchema,
  submitBidSchema,
  autoRouteSchema,
  type AuthJwtPayload
} from '@fieldforge/contracts';
import { randomUUID } from 'node:crypto';

@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly geoSearchService: GeoSearchService,
    private readonly bidsService: BidsService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Verified user identity extracted from bearer token (respects C5 invariant).
   * Gateway header is compared to token payload to guard against header-spoofing.
   */
  private authenticateUser(
    authHeader?: string,
    gatewayUserId?: string
  ): { userId: string; role: string } {
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization format');
    }

    let payload: AuthJwtPayload;
    try {
      payload = this.jwtService.verify<AuthJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (gatewayUserId && gatewayUserId !== payload.sub) {
      throw new UnauthorizedException('Identity mismatch between header and token');
    }

    return {
      userId: payload.sub,
      role: payload.role
    };
  }

  @Post('technicians/location')
  async updateLocation(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only technicians can update location');
    }

    const dto = updateTechnicianLocationSchema.parse(body);
    await this.geoSearchService.updateTechnicianLocation(user.userId, dto.latitude, dto.longitude);

    return {
      statusCode: 200,
      message: 'Technician location updated successfully',
      latitude: dto.latitude,
      longitude: dto.longitude
    };
  }

  @Get('technicians/nearby')
  async findNearby(
    @Query() query: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId);

    const parsedQuery = nearbyTechniciansQuerySchema.parse(query);
    const technicians = await this.geoSearchService.findNearbyTechnicians(
      parsedQuery.latitude,
      parsedQuery.longitude,
      parsedQuery.radiusMiles
    );

    return {
      count: technicians.length,
      technicians
    };
  }

  @Post('bids')
  async submitBid(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only certified technicians can submit bids');
    }

    const dto = submitBidSchema.parse(body);
    const correlationId = correlationHeader || randomUUID();

    const bid = await this.bidsService.submitBid(dto, user.userId, correlationId, idempotencyKey);

    return bid;
  }

  @Post('bids/:id/accept')
  async acceptBid(
    @Param('id') bidId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only enterprise buyers or admins can accept bids');
    }

    const correlationId = correlationHeader || randomUUID();

    const result = await this.bidsService.acceptBid(
      bidId,
      user.userId,
      user.role,
      correlationId,
      idempotencyKey
    );

    return result;
  }

  @Post('auto-route')
  async autoRoute(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'BUYER' && user.role !== 'DISPATCHER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers, dispatchers, or admins can trigger auto-route');
    }

    const dto = autoRouteSchema.parse(body);
    const correlationId = correlationHeader || randomUUID();

    const result = await this.bidsService.autoRoute(dto, user.userId, user.role, correlationId);

    return result;
  }
}
