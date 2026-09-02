import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { users, buyerProfiles, technicianProfiles } from '@fieldforge/database';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

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
