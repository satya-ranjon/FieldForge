import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  ForbiddenException,
  BadRequestException,
  Optional,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CertificationsService } from './certifications.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
  createCertificationSchema,
  verifyCertificationSchema,
  batchTechniciansSchema,
  type CreateCertificationDto,
  type VerifyCertificationDto,
  type TechnicianBadgeDto,
  type TechnicianSummaryDto,
  UserRole
} from '@fieldforge/contracts';
import { verifyGatewayUser, type AuthenticatedUser } from '@fieldforge/common';

@Controller('technicians')
export class CertificationsController {
  constructor(
    private readonly certService: CertificationsService,
    private readonly jwtService: JwtService,
    @Optional() private readonly profilesService?: ProfilesService
  ) {}

  private authenticateUser(
    authHeader?: string,
    gatewayUserId?: string,
    gatewayProfileId?: string
  ): AuthenticatedUser {
    return verifyGatewayUser(this.jwtService, authHeader, gatewayUserId, gatewayProfileId);
  }

  /**
   * Fetch technician certifications & vetting badges.
   */
  @Get(':id/badges')
  async getBadges(
    @Param('id') technicianId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ): Promise<TechnicianBadgeDto[]> {
    this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    return this.certService.getTechnicianBadges(technicianId);
  }

  /**
   * Submit technician certification for vetting.
   * Derives technician identity from verified JWT profileId or user resolution.
   */
  @Post('certifications')
  @HttpCode(HttpStatus.CREATED)
  async addCertification(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ): Promise<TechnicianBadgeDto> {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);

    if (user.role !== UserRole.TECHNICIAN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only technicians may submit certifications');
    }

    const parsed = createCertificationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    let technicianId = user.profileId;
    if (!technicianId && this.profilesService) {
      technicianId = await this.profilesService.resolveProfileId(user.userId, UserRole.TECHNICIAN);
    }

    const targetTechnicianId = technicianId || user.userId;

    return this.certService.addCertification(
      targetTechnicianId,
      parsed.data as CreateCertificationDto
    );
  }

  /**
   * Admin / Dispatcher verification of technician certification.
   */
  @Patch('certifications/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyCertification(
    @Param('id') certId: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<TechnicianBadgeDto> {
    const user = this.authenticateUser(authHeader, gatewayUserId);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DISPATCHER) {
      throw new ForbiddenException('Only administrators or dispatchers may verify certifications');
    }

    const parsed = verifyCertificationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    const { isVerified } = parsed.data as VerifyCertificationDto;
    return this.certService.verifyCertification(certId, isVerified);
  }

  /**
   * Lists all pending certifications awaiting admin review.
   */
  @Get('certifications/pending')
  async listPending(
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<TechnicianBadgeDto[]> {
    const user = this.authenticateUser(authHeader, gatewayUserId);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DISPATCHER) {
      throw new ForbiddenException(
        'Only administrators or dispatchers may view pending certifications'
      );
    }

    return this.certService.listPendingCertifications();
  }

  /**
   * Batch resolves technician directory details for dispatch matching.
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async getBatchTechnicians(@Body() body: unknown): Promise<TechnicianSummaryDto[]> {
    const parsed = batchTechniciansSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.certService.getTechniciansBatch(parsed.data.ids);
  }
}
