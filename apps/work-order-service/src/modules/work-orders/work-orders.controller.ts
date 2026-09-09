import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
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
  type CreateWorkOrderDto,
  type TransitionWorkOrderDto,
  type ListWorkOrdersQueryDto,
  type GeneratePresignedUrlDto,
  type RecordSignatureDto
} from '@fieldforge/contracts';
import { verifyGatewayUser, ZodValidationPipe, type AuthenticatedUser } from '@fieldforge/common';
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
    gatewayUserId?: string,
    gatewayProfileId?: string
  ): AuthenticatedUser {
    return verifyGatewayUser(this.jwtService, authHeader, gatewayUserId, gatewayProfileId);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createWorkOrderSchema)) dto: CreateWorkOrderDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers and admins can create work orders');
    }

    return this.workOrdersService.create(
      user.userId,
      dto,
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(listWorkOrdersQuerySchema)) parsedQuery: ListWorkOrdersQueryDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.list(parsedQuery);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.findById(id);
  }

  @Get(':id/history')
  async getHistory(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.getStatusHistory(id);
  }

  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.publish(
      id,
      user.userId,
      user.role,
      correlationId || randomUUID(),
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Post(':id/transition')
  async transition(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionStatusSchema)) dto: TransitionWorkOrderDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.transition(
      id,
      user.userId,
      user.role,
      dto,
      correlationId || randomUUID(),
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Post(':id/transitions')
  async transitionPlural(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionStatusSchema)) dto: TransitionWorkOrderDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.transition(
      id,
      user.userId,
      user.role,
      dto,
      correlationId || randomUUID(),
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionStatusSchema)) dto: TransitionWorkOrderDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.workOrdersService.transition(
      id,
      user.userId,
      user.role,
      dto,
      correlationId || randomUUID(),
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Post(':id/deliverables/presigned-url')
  async getPresignedUploadUrl(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(generatePresignedUrlSchema)) dto: GeneratePresignedUrlDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.deliverablesService.generatePresignedUploadUrl(
      id,
      user.userId,
      user.role,
      dto.deliverableType,
      dto.filename,
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Post(':id/signature')
  async recordSignature(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordSignatureSchema)) dto: RecordSignatureDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.deliverablesService.recordSignatureDeliverable(
      id,
      user.userId,
      user.role,
      dto.signatureSvg,
      dto.clientName,
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Post(':id/deliverables/signature')
  async recordDeliverableSignature(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordSignatureSchema)) dto: RecordSignatureDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.deliverablesService.recordSignatureDeliverable(
      id,
      user.userId,
      user.role,
      dto.signatureSvg,
      dto.clientName,
      ...(user.profileId ? [user.profileId] : [])
    );
  }

  @Get(':id/deliverables')
  async getDeliverables(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.deliverablesService.getDeliverablesByWorkOrderId(
      id,
      user.userId,
      user.role,
      ...(user.profileId ? [user.profileId] : [])
    );
  }
}
