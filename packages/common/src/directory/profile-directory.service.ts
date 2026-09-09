import { Injectable, Logger } from '@nestjs/common';
import type { UserProfileResponseDto } from '@fieldforge/contracts';

export const PROFILE_DIRECTORY_CACHE_TTL_SECONDS = 300; // 5 minutes

interface MemoryCacheEntry {
  data: UserProfileResponseDto;
  expiresAt: number;
}

@Injectable()
export class ProfileDirectoryService {
  private readonly logger = new Logger(ProfileDirectoryService.name);
  private readonly authServiceUrl: string;
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();
  private readonly localProfiles = new Map<
    string,
    { buyerProfileId?: string; technicianProfileId?: string }
  >();

  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
  }

  /**
   * Sets an in-memory profile mapping for a user.
   * Useful for testing or local simulation to bypass network calls completely.
   */
  setLocalProfile(userId: string, role: 'BUYER' | 'TECHNICIAN', profileId: string): void {
    const existing = this.localProfiles.get(userId) || {};
    if (role === 'BUYER') {
      existing.buyerProfileId = profileId;
    } else {
      existing.technicianProfileId = profileId;
    }
    this.localProfiles.set(userId, existing);
  }

  /**
   * Clears all in-memory caches and test overrides.
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.localProfiles.clear();
  }

  /**
   * Resolves the buyerProfileId for a given userId.
   * 1. Uses callerProfileId directly if provided (zero network overhead fast-path).
   * 2. Checks local test overrides.
   * 3. Checks in-memory cache.
   * 4. Queries auth-service GET /users/:id/profile over REST.
   */
  async resolveBuyerProfileId(
    userId: string,
    callerProfileId?: string,
    correlationId?: string
  ): Promise<string | null> {
    if (callerProfileId) {
      return callerProfileId;
    }

    const local = this.localProfiles.get(userId);
    if (local?.buyerProfileId) {
      return local.buyerProfileId;
    }

    const profile = await this.getUserProfile(userId, correlationId);
    return profile?.buyerProfile?.id ?? null;
  }

  /**
   * Resolves the technicianProfileId for a given userId.
   * 1. Uses callerProfileId directly if provided (zero network overhead fast-path).
   * 2. Checks local test overrides.
   * 3. Checks in-memory cache.
   * 4. Queries auth-service GET /users/:id/profile over REST.
   */
  async resolveTechnicianProfileId(
    userId: string,
    callerProfileId?: string,
    correlationId?: string
  ): Promise<string | null> {
    if (callerProfileId) {
      return callerProfileId;
    }

    const local = this.localProfiles.get(userId);
    if (local?.technicianProfileId) {
      return local.technicianProfileId;
    }

    const profile = await this.getUserProfile(userId, correlationId);
    return profile?.technicianProfile?.id ?? null;
  }

  /**
   * Retrieves aggregated profile details for a user from auth-service.
   * Caches results in-memory with TTL.
   */
  async getUserProfile(
    userId: string,
    correlationId?: string
  ): Promise<UserProfileResponseDto | null> {
    if (!userId) {
      return null;
    }

    const cached = this.getFromMemoryCache(userId);
    if (cached) {
      return cached;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (correlationId) {
        headers['x-correlation-id'] = correlationId;
      }

      const response = await fetch(`${this.authServiceUrl}/users/${userId}/profile`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        this.logger.warn(
          `[ProfileDirectoryService] Profile lookup for user ${userId} returned HTTP ${response.status}`
        );
        return null;
      }

      const data = (await response.json()) as UserProfileResponseDto;
      if (data && data.id) {
        this.saveToMemoryCache(userId, data);
        return data;
      }

      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[ProfileDirectoryService] Profile lookup failed for user ${userId}: ${msg}`
      );
      return null;
    }
  }

  private getFromMemoryCache(userId: string): UserProfileResponseDto | null {
    const entry = this.memoryCache.get(userId);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(userId);
      return null;
    }
    return entry.data;
  }

  private saveToMemoryCache(userId: string, data: UserProfileResponseDto): void {
    const expiresAt = Date.now() + PROFILE_DIRECTORY_CACHE_TTL_SECONDS * 1000;
    this.memoryCache.set(userId, { data, expiresAt });
  }
}
