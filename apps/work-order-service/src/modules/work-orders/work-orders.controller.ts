import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WorkOrdersService } from './work-orders.service';
import { DeliverablesService } from '../deliverables/deliverables.service';
import {
  createWorkOrderSchema,
  transitionStatusSchema,
  listWorkOrdersQuerySchema,
  generatePresignedUrlSchema,
  recordSignatureSchema,
  type AuthJwtPayload
} from '@fieldforge/contracts';
import { randomUUID } from 'node:crypto';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly deliverablesService: DeliverablesService,
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

  @Post()
  async create(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers and admins can create work orders');
    }

    const dto = createWorkOrderSchema.parse(body);
    return this.workOrdersService.create(user.userId, dto);
  }

  @Get()
  async list(
    @Query() query: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId);
    const parsedQuery = listWorkOrdersQuerySchema.parse(query);
    return this.workOrdersService.list(parsedQuery);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId);
    return this.workOrdersService.findById(id);
  }

  @Get(':id/history')
  async getHistory(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId);
    return this.workOrdersService.getStatusHistory(id);
  }

  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    return this.workOrdersService.publish(
      id,
      user.userId,
      user.role,
      correlationId || randomUUID()
    );
  }

  @Post(':id/transition')
  async transition(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    const dto = transitionStatusSchema.parse(body);
    return this.workOrdersService.transition(
      id,
      user.userId,
      user.role,
      dto,
      correlationId || randomUUID()
    );
  }

  @Post(':id/transitions')
  async transitionPlural(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    return this.transition(id, body, authHeader, gatewayUserId, correlationId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    return this.transition(id, body, authHeader, gatewayUserId, correlationId);
  }

  @Post(':id/deliverables/presigned-url')
  async getPresignedUploadUrl(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    const dto = generatePresignedUrlSchema.parse(body);
    return this.deliverablesService.generatePresignedUploadUrl(
      id,
      user.userId,
      user.role,
      dto.deliverableType,
      dto.filename
    );
  }

  @Post(':id/signature')
  async recordSignature(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    const dto = recordSignatureSchema.parse(body);
    return this.deliverablesService.recordSignatureDeliverable(
      id,
      user.userId,
      user.role,
      dto.signatureSvg,
      dto.clientName
    );
  }

  @Post(':id/deliverables/signature')
  async recordDeliverableSignature(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    return this.recordSignature(id, body, authHeader, gatewayUserId);
  }

  @Get(':id/deliverables')
  async getDeliverables(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    return this.deliverablesService.getDeliverablesByWorkOrderId(id, user.userId, user.role);
  }
}
