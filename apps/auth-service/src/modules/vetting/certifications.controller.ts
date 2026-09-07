import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CertificationsService } from './certifications.service';
import {
  createCertificationSchema,
  verifyCertificationSchema,
  batchTechniciansSchema,
  type AuthJwtPayload,
  type CreateCertificationDto,
  type VerifyCertificationDto,
  type TechnicianBadgeDto,
  type TechnicianSummaryDto,
  UserRole
} from '@fieldforge/contracts';

@Controller('technicians')
export class CertificationsController {
  constructor(
    private readonly certService: CertificationsService,
    private readonly jwtService: JwtService
  ) {}

  private extractAndVerifyPayload(authHeader?: string, gatewayUserId?: string): AuthJwtPayload {
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

    return payload;
  }

  /**
   * Fetch technician certifications & vetting badges.
   */
  @Get(':id/badges')
  async getBadges(
    @Param('id') techId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<TechnicianBadgeDto[]> {
    this.extractAndVerifyPayload(authHeader, gatewayUserId);
    return this.certService.getTechnicianBadges(techId);
  }

  /**
   * Submit technician certification for vetting.
   * Derives technician identity from verified JWT.
   */
  @Post('certifications')
  @HttpCode(HttpStatus.CREATED)
  async addCertification(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<TechnicianBadgeDto> {
    const payload = this.extractAndVerifyPayload(authHeader, gatewayUserId);

    if (payload.role !== UserRole.TECHNICIAN && payload.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only technicians may submit certifications');
    }

    const parsed = createCertificationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    return this.certService.addCertification(payload.sub, parsed.data as CreateCertificationDto);
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
    const payload = this.extractAndVerifyPayload(authHeader, gatewayUserId);

    if (payload.role !== UserRole.ADMIN && payload.role !== UserRole.DISPATCHER) {
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
    const payload = this.extractAndVerifyPayload(authHeader, gatewayUserId);

    if (payload.role !== UserRole.ADMIN && payload.role !== UserRole.DISPATCHER) {
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
