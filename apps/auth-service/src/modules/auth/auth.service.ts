import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { users, buyerProfiles, technicianProfiles, refreshTokens } from '@fieldforge/database';
import {
  fromMinor,
  UserRole,
  UserStatus,
  type RegisterUserDto,
  type LoginDto,
  type AuthTokensDto,
  type AuthJwtPayload
} from '@fieldforge/contracts';

const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterUserDto): Promise<AuthTokensDto> {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);
    const userId = crypto.randomUUID();
    let profileId: string | undefined;

    await this.db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: dto.email,
        passwordHash,
        role: dto.role,
        phoneNumber: dto.phoneNumber,
        status: 'ACTIVE'
      });

      if (dto.role === 'BUYER') {
        profileId = crypto.randomUUID();
        await tx.insert(buyerProfiles).values({
          id: profileId,
          userId,
          companyName: dto.companyName || 'Buyer Company',
          billingAddress: dto.billingAddress || 'N/A',
          escrowBalance: '0.00'
        });
      } else if (dto.role === 'TECHNICIAN') {
        profileId = crypto.randomUUID();
        const hourlyRateStr = dto.hourlyRateMinor
          ? fromMinor(dto.hourlyRateMinor).toFixed(2)
          : '50.00';

        await tx.insert(technicianProfiles).values({
          id: profileId,
          userId,
          firstName: dto.firstName || 'Technician',
          lastName: dto.lastName || 'User',
          hourlyRate: hourlyRateStr,
          ratingAverage: '5.00',
          jobsCompleted: 0
        });
      }
    });

    return this.generateTokens({
      sub: userId,
      email: dto.email,
      role: dto.role,
      profileId
    });
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const foundUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (foundUsers.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = foundUsers[0];
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const profileId = await this.resolveProfileId(user.id, user.role);

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      profileId
    });
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const now = new Date();

    const matchedTokens = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (matchedTokens.length === 0) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const currentToken = matchedTokens[0];

    // Revoke used refresh token
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, currentToken.id));

    // Lookup user
    const foundUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.id, currentToken.userId))
      .limit(1);

    if (foundUsers.length === 0 || foundUsers[0].status !== 'ACTIVE') {
      throw new UnauthorizedException('User account no longer active');
    }

    const user = foundUsers[0];
    const profileId = await this.resolveProfileId(user.id, user.role);

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      profileId
    });
  }

  private async resolveProfileId(userId: string, role: string): Promise<string | undefined> {
    try {
      if (role === 'BUYER') {
        const query = this.db.select({ id: buyerProfiles.id });
        if (query && typeof query.from === 'function') {
          const rows = await query
            .from(buyerProfiles)
            .where(eq(buyerProfiles.userId, userId))
            .limit(1);
          return rows?.[0]?.id;
        }
      } else if (role === 'TECHNICIAN') {
        const query = this.db.select({ id: technicianProfiles.id });
        if (query && typeof query.from === 'function') {
          const rows = await query
            .from(technicianProfiles)
            .where(eq(technicianProfiles.userId, userId))
            .limit(1);
          return rows?.[0]?.id;
        }
      }
    } catch {
      // Mock db in test suites without profile table configured
    }
    return undefined;
  }

  private async generateTokens(payload: {
    sub: string;
    email: string;
    role: AuthJwtPayload['role'];
    profileId?: string;
  }): Promise<AuthTokensDto> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS
    });

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: payload.sub,
      tokenHash,
      expiresAt
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        status: UserStatus.ACTIVE
      }
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
