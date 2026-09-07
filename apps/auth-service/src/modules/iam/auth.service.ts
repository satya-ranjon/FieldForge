import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  Optional
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { users, refreshTokens } from '@fieldforge/database';
import {
  UserRole,
  UserStatus,
  type RegisterUserDto,
  type LoginDto,
  type AuthTokensDto,
  type AuthJwtPayload
} from '@fieldforge/contracts';
import { ProfilesService } from '../profiles/profiles.service';

const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    private readonly jwtService: JwtService,
    @Optional() @Inject(ProfilesService) private readonly profilesService?: ProfilesService
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

      // Delegate domain profile creation to ProfilesService (inversion of control)
      if (this.profilesService) {
        profileId = await this.profilesService.provisionProfile(tx, userId, dto);
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

    const profileId = this.profilesService
      ? await this.profilesService.resolveProfileId(user.id, user.role)
      : undefined;

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
    const profileId = this.profilesService
      ? await this.profilesService.resolveProfileId(user.id, user.role)
      : undefined;

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      profileId
    });
  }

  private async generateTokens(payload: {
    sub: string;
    email: string;
    role: AuthJwtPayload['role'];
    profileId?: string;
  }): Promise<AuthTokensDto> {
    const jwtPayload: AuthJwtPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      ...(payload.profileId ? { profileId: payload.profileId } : {})
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
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
