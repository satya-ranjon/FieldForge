import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE, type DrizzleClient, type DbOrTx } from '@fieldforge/common';
import { users, buyerProfiles, technicianProfiles } from '@fieldforge/database';
import { fromMinor, type RegisterUserDto } from '@fieldforge/contracts';

@Injectable()
export class ProfilesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  /**
   * Provisions domain profile within a database transaction or standard client.
   * Isolates profile schema fields and business defaults from core IAM credentials.
   */
  async provisionProfile(
    dbOrTx: DbOrTx | undefined,
    userId: string,
    dto: RegisterUserDto
  ): Promise<string | undefined> {
    const executor = dbOrTx ?? this.db;

    if (dto.role === 'BUYER') {
      const profileId = randomUUID();
      await executor.insert(buyerProfiles).values({
        id: profileId,
        userId,
        companyName: dto.companyName || 'Buyer Company',
        billingAddress: dto.billingAddress || 'N/A',
        escrowBalance: '0.00'
      });
      return profileId;
    }

    if (dto.role === 'TECHNICIAN') {
      const profileId = randomUUID();
      const hourlyRateStr = dto.hourlyRateMinor
        ? fromMinor(dto.hourlyRateMinor).toFixed(2)
        : '50.00';

      await executor.insert(technicianProfiles).values({
        id: profileId,
        userId,
        firstName: dto.firstName || 'Technician',
        lastName: dto.lastName || 'User',
        hourlyRate: hourlyRateStr,
        ratingAverage: '5.00',
        jobsCompleted: 0
      });
      return profileId;
    }

    return undefined;
  }

  /**
   * Resolves the domain profileId for a user without coupling auth logic to profile tables.
   */
  async resolveProfileId(userId: string, role: string): Promise<string | undefined> {
    const normalizedRole = role?.toUpperCase();
    if (normalizedRole === 'BUYER') {
      const rows = await this.db
        .select({ id: buyerProfiles.id })
        .from(buyerProfiles)
        .where(eq(buyerProfiles.userId, userId))
        .limit(1);
      return rows[0]?.id;
    }

    if (normalizedRole === 'TECHNICIAN') {
      const rows = await this.db
        .select({ id: technicianProfiles.id })
        .from(technicianProfiles)
        .where(eq(technicianProfiles.userId, userId))
        .limit(1);
      return rows[0]?.id;
    }

    return undefined;
  }

  /**
   * Resolves the associated userId for a given profileId without ad-hoc table queries.
   */
  async resolveUserIdByProfileId(profileId: string, role?: string): Promise<string | undefined> {
    const normalizedRole = role?.toUpperCase();
    if (normalizedRole === 'BUYER') {
      const rows = await this.db
        .select({ userId: buyerProfiles.userId })
        .from(buyerProfiles)
        .where(eq(buyerProfiles.id, profileId))
        .limit(1);
      return rows[0]?.userId;
    }

    if (normalizedRole === 'TECHNICIAN') {
      const rows = await this.db
        .select({ userId: technicianProfiles.userId })
        .from(technicianProfiles)
        .where(eq(technicianProfiles.id, profileId))
        .limit(1);
      return rows[0]?.userId;
    }

    const techRows = await this.db
      .select({ userId: technicianProfiles.userId })
      .from(technicianProfiles)
      .where(eq(technicianProfiles.id, profileId))
      .limit(1);
    if (techRows[0]?.userId) {
      return techRows[0].userId;
    }

    const buyerRows = await this.db
      .select({ userId: buyerProfiles.userId })
      .from(buyerProfiles)
      .where(eq(buyerProfiles.id, profileId))
      .limit(1);
    return buyerRows[0]?.userId;
  }

  /**
   * Aggregates complete profile details for authenticated user self-lookup.
   */
  async getUserProfile(userId: string) {
    const foundUsers = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        phoneNumber: users.phoneNumber,
        status: users.status,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (foundUsers.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = foundUsers[0];

    if (user.role === 'BUYER') {
      const buyer = await this.db
        .select()
        .from(buyerProfiles)
        .where(eq(buyerProfiles.userId, userId))
        .limit(1);

      return {
        ...user,
        buyerProfile: buyer[0] ?? null
      };
    }

    if (user.role === 'TECHNICIAN') {
      const tech = await this.db
        .select()
        .from(technicianProfiles)
        .where(eq(technicianProfiles.userId, userId))
        .limit(1);

      return {
        ...user,
        technicianProfile: tech[0] ?? null
      };
    }

    return user;
  }
}
