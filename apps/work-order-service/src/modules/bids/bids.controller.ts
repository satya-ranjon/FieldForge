import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BidsService } from './bids.service';
import { submitBidSchema, type AuthJwtPayload } from '@fieldforge/contracts';
import { randomUUID } from 'node:crypto';

@Controller('work-orders')
export class BidsController {
  constructor(
    private readonly bidsService: BidsService,
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
  ): { userId: string; role: string; profileId?: string } {
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
      role: payload.role,
      profileId: payload.profileId || gatewayProfileId
    };
  }

  /**
   * Submit a bid on a work order (canonical path: POST /work-orders/:id/bids).
   */
  @Post(':id/bids')
  async submitBidOnWorkOrder(
    @Param('id') workOrderId: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only certified technicians can submit bids');
    }

    const parsedBody = submitBidSchema.parse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      workOrderId
    });

    const correlationId = correlationHeader || randomUUID();
    return await this.bidsService.submitBid(
      parsedBody,
      user.userId,
      correlationId,
      idempotencyKey,
      user.profileId
    );
  }

  /**
   * List all bids for a work order (canonical path: GET /work-orders/:id/bids).
   */
  @Get(':id/bids')
  async listBidsForWorkOrder(
    @Param('id') workOrderId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return await this.bidsService.listBidsForWorkOrder(
      workOrderId,
      user.userId,
      user.role,
      user.profileId
    );
  }

  /**
   * Accept a bid for a work order (canonical path: POST /work-orders/:id/bids/:bidId/accept).
   */
  @Post(':id/bids/:bidId/accept')
  async acceptBidOnWorkOrder(
    @Param('id') workOrderId: string,
    @Param('bidId') bidId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only enterprise buyers or admins can accept bids');
    }

    const correlationId = correlationHeader || randomUUID();
    return await this.bidsService.acceptBid(
      bidId,
      user.userId,
      user.role,
      correlationId,
      idempotencyKey,
      user.profileId,
      workOrderId
    );
  }

  /**
   * Backwards-compatible alias: POST /work-orders/bids
   */
  @Post('bids')
  async submitBidLegacy(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only certified technicians can submit bids');
    }

    const dto = submitBidSchema.parse(body);
    const correlationId = correlationHeader || randomUUID();
    return await this.bidsService.submitBid(
      dto,
      user.userId,
      correlationId,
      idempotencyKey,
      user.profileId
    );
  }

  /**
   * Backwards-compatible alias: POST /work-orders/bids/:id/accept
   */
  @Post('bids/:id/accept')
  async acceptBidLegacy(
    @Param('id') bidId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only enterprise buyers or admins can accept bids');
    }

    const correlationId = correlationHeader || randomUUID();
    return await this.bidsService.acceptBid(
      bidId,
      user.userId,
      user.role,
      correlationId,
      idempotencyKey,
      user.profileId
    );
  }

  /**
   * Backwards-compatible alias: GET /work-orders/bids/:id
   */
  @Get('bids/:id')
  async getBidById(
    @Param('id') bidId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return await this.bidsService.getBidById(bidId);
  }
}
