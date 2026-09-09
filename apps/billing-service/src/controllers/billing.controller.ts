import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Res,
  Inject,
  Optional,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
interface MinimalResponse {
  setHeader(name: string, value: string | number): void;
  end(chunk: Buffer): void;
}
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import {
  DRIZZLE,
  type DrizzleClient,
  verifyGatewayUser,
  type AuthenticatedUser,
  ProfileDirectoryService
} from '@fieldforge/common';
import {
  preAuthEscrowSchema,
  releaseEscrowSchema,
  type EscrowDetailsDto,
  type InvoiceDetailsDto,
  type PreAuthEscrowDto,
  type ReleaseEscrowDto,
  type TechnicianEarningsDto
} from '@fieldforge/contracts';
import { EscrowService, type EscrowReleaseResult } from '../modules/escrow/escrow.service';
import { InvoicesService } from '../modules/invoices/invoices.service';

@Controller('billing')
export class BillingController {
  private readonly profileDirectory: ProfileDirectoryService;

  constructor(
    private readonly escrowService: EscrowService,
    private readonly invoicesService: InvoicesService,
    private readonly jwtService: JwtService,
    @Optional() @Inject(DRIZZLE) private readonly db?: DrizzleClient,
    @Optional() profileDirectory?: ProfileDirectoryService
  ) {
    this.profileDirectory = profileDirectory || new ProfileDirectoryService();
  }

  getProfileDirectory(): ProfileDirectoryService {
    return this.profileDirectory;
  }

  /**
   * Authenticates caller identity from bearer token (respects C5 boundary).
   */
  private authenticateUser(
    authHeader?: string,
    gatewayUserId?: string,
    gatewayProfileId?: string
  ): AuthenticatedUser {
    return verifyGatewayUser(this.jwtService, authHeader, gatewayUserId, gatewayProfileId);
  }

  @Post('escrow/preauth')
  async preAuthEscrow(
    @Body() body: PreAuthEscrowDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers or administrators can pre-authorize escrow');
    }

    const parsed = preAuthEscrowSchema.parse(body);

    // Resolve buyer profile id: fast-path via token profileId or fallback to directory lookup
    let buyerProfileId = user.profileId;
    if (!buyerProfileId) {
      const resolved = await this.profileDirectory.resolveBuyerProfileId(
        user.userId,
        undefined,
        correlationId
      );

      if (!resolved) {
        throw new NotFoundException(`Buyer profile not found for user ${user.userId}`);
      }
      buyerProfileId = resolved;
    }

    return await this.escrowService.lockFunds(
      parsed.workOrderId,
      buyerProfileId,
      parsed.amountMinor,
      correlationId || randomUUID(),
      parsed.paymentMethodId
    );
  }

  @Post('escrow/release')
  async releaseEscrow(
    @Body() body: ReleaseEscrowDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ): Promise<EscrowReleaseResult> {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers or administrators can release escrow');
    }

    const parsed = releaseEscrowSchema.parse(body);

    return await this.escrowService.releaseFunds({
      workOrderId: parsed.workOrderId,
      callerUserId: user.userId,
      callerRole: user.role,
      correlationId: correlationId || randomUUID(),
      idempotencyKey,
      callerProfileId: user.profileId
    });
  }

  @Get('escrow/:workOrderId')
  async getEscrow(
    @Param('workOrderId') workOrderId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<EscrowDetailsDto> {
    this.authenticateUser(authHeader, gatewayUserId);
    return await this.escrowService.getEscrowByWorkOrder(workOrderId);
  }

  @Get('invoices/:id')
  async getInvoice(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<InvoiceDetailsDto> {
    this.authenticateUser(authHeader, gatewayUserId);
    return await this.invoicesService.getInvoice(id);
  }

  @Get('invoices/:id/pdf')
  async getInvoicePdf(
    @Param('id') id: string,
    @Res() res: MinimalResponse,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string
  ) {
    this.authenticateUser(authHeader, gatewayUserId);
    const pdfBuffer = await this.invoicesService.generateInvoicePdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  }

  @Get('technicians/:id/payouts')
  async getTechnicianPayouts(
    @Param('id') technicianId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-ff-profile-id') gatewayProfileId?: string
  ): Promise<TechnicianEarningsDto> {
    const user = this.authenticateUser(authHeader, gatewayUserId, gatewayProfileId);

    // If caller is technician, verify they are accessing their own profile
    if (user.role === 'TECHNICIAN') {
      const resolvedTechnicianId = await this.profileDirectory.resolveTechnicianProfileId(
        user.userId,
        user.profileId
      );

      if (
        !resolvedTechnicianId ||
        (resolvedTechnicianId !== technicianId && user.userId !== technicianId)
      ) {
        throw new ForbiddenException('Technicians may only access their own payouts');
      }
    }

    return await this.escrowService.getTechnicianEarnings(technicianId);
  }
}
