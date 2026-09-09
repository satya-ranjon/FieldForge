import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GeoSearchService } from '../geo-search/geo-search.service';
import {
  updateTechnicianLocationSchema,
  nearbyTechniciansQuerySchema
} from '@fieldforge/contracts';
import { verifyGatewayUser, type AuthenticatedUser } from '@fieldforge/common';

@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly geoSearchService: GeoSearchService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Verified user identity extracted from bearer token (respects C5 invariant).
   * Gateway header is compared to token payload to guard against header-spoofing.
   */
  private authenticateUser(
    authHeader?: string,
    gatewayUserId?: string,
    gatewayProfileId?: string
  ): AuthenticatedUser {
    return verifyGatewayUser(this.jwtService, authHeader, gatewayUserId, gatewayProfileId);
  }

  /**
   * Update live technician GPS coordinates in the Redis spatial index.
   */
  @Post('technicians/location')
  async updateLocation(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only technicians can update location');
    }

    const dto = updateTechnicianLocationSchema.parse(body);
    const technicianId = user.profileId || user.userId;
    await this.geoSearchService.updateTechnicianLocation(technicianId, dto.latitude, dto.longitude);

    return {
      statusCode: 200,
      message: 'Technician location updated successfully',
      latitude: dto.latitude,
      longitude: dto.longitude
    };
  }

  /**
   * Discover and rank certified technicians near a given coordinate using Redis GEOSEARCH.
   */
  @Get('technicians/nearby')
  async findNearby(
    @Query() query: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);

    const parsedQuery = nearbyTechniciansQuerySchema.parse(query);
    const technicians = correlationId
      ? await this.geoSearchService.findNearbyTechnicians(
          parsedQuery.latitude,
          parsedQuery.longitude,
          parsedQuery.radiusMiles,
          [],
          correlationId
        )
      : await this.geoSearchService.findNearbyTechnicians(
          parsedQuery.latitude,
          parsedQuery.longitude,
          parsedQuery.radiusMiles
        );

    return {
      count: technicians.length,
      technicians
    };
  }

  /**
   * Intelligent dispatch routing recommendation based on proximity and composite score.
   */
  @Post('auto-route')
  async autoRouteRecommend(
    @Body()
    body: { latitude?: number; longitude?: number; maxRadiusMiles?: number; workOrderId?: string },
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);

    const lat = body.latitude ?? 37.7749;
    const lng = body.longitude ?? -122.4194;
    const radiusMiles = body.maxRadiusMiles || 5;

    const candidates = correlationId
      ? await this.geoSearchService.findNearbyTechnicians(lat, lng, radiusMiles, [], correlationId)
      : await this.geoSearchService.findNearbyTechnicians(lat, lng, radiusMiles);
    const candidate = candidates.find((c) => c.isAvailable && c.distanceMiles <= radiusMiles);

    if (!candidate) {
      throw new NotFoundException(
        `No eligible contractor found within ${radiusMiles} miles for auto-routing`
      );
    }

    return {
      workOrderId: body.workOrderId || 'recommendation',
      technicianId: candidate.technicianId,
      status: 'MATCHED',
      candidate
    };
  }
}
