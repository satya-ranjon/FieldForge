import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Res,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
interface MinimalResponse {
  setHeader(name: string, value: string | number): void;
  end(chunk: Buffer): void;
}
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { usersSchema } from '@fieldforge/database';
import {
  preAuthEscrowSchema,
  releaseEscrowSchema,
  type AuthJwtPayload,
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
  constructor(
    private readonly escrowService: EscrowService,
    private readonly invoicesService: InvoicesService,
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE) private readonly db: DrizzleClient
  ) {}

  /**
   * Authenticates caller identity from bearer token (respects C5 boundary).
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

  @Post('escrow/preauth')
  async preAuthEscrow(
    @Body() body: PreAuthEscrowDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-ff-user-id') gatewayUserId?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers or administrators can pre-authorize escrow');
    }

    const parsed = preAuthEscrowSchema.parse(body);

    // Resolve buyer profile id
    const [buyerProfile] = await this.db
      .select()
      .from(usersSchema.buyerProfiles)
      .where(eq(usersSchema.buyerProfiles.userId, user.userId))
      .limit(1);

    if (!buyerProfile) {
      throw new NotFoundException(`Buyer profile not found for user ${user.userId}`);
    }

    return await this.escrowService.lockFunds(
      parsed.workOrderId,
      buyerProfile.id,
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
    @Headers('idempotency-key') idempotencyKey?: string
  ): Promise<EscrowReleaseResult> {
    const user = this.authenticateUser(authHeader, gatewayUserId);
    if (user.role !== 'BUYER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only buyers or administrators can release escrow');
    }

    const parsed = releaseEscrowSchema.parse(body);

    return await this.escrowService.releaseFunds({
      workOrderId: parsed.workOrderId,
      callerUserId: user.userId,
      callerRole: user.role,
      correlationId: correlationId || randomUUID(),
      idempotencyKey
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
    @Headers('x-ff-user-id') gatewayUserId?: string
  ): Promise<TechnicianEarningsDto> {
    const user = this.authenticateUser(authHeader, gatewayUserId);

    // If caller is technician, verify they are accessing their own profile
    if (user.role === 'TECHNICIAN') {
      const [techProfile] = await this.db
        .select()
        .from(usersSchema.technicianProfiles)
        .where(eq(usersSchema.technicianProfiles.userId, user.userId))
        .limit(1);

      if (!techProfile || (techProfile.id !== technicianId && user.userId !== technicianId)) {
        throw new ForbiddenException('Technicians may only access their own payouts');
      }
    }

    return await this.escrowService.getTechnicianEarnings(technicianId);
  }
}
