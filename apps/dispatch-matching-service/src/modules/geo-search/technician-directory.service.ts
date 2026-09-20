import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { TechnicianSummaryDto } from '@fieldforge/contracts';
import {
  INTERNAL_SECRET_HEADER,
  SERVICE_NAME_HEADER,
  getInternalServiceSecret,
  BoundedLruCache
} from '@fieldforge/common';
import { REDIS_CLIENT } from './geo-search.constants';

export const DIRECTORY_CACHE_PREFIX = 'tech:directory:';
export const DIRECTORY_CACHE_TTL_SECONDS = 300; // 5 minutes
export const DIRECTORY_MEMORY_CACHE_MAX_ENTRIES = 1000;
export const TECHNICIAN_DIRECTORY_INTERNAL_SECRET = 'TECHNICIAN_DIRECTORY_INTERNAL_SECRET';
export const TECHNICIAN_DIRECTORY_MAX_ENTRIES = 'TECHNICIAN_DIRECTORY_MAX_ENTRIES';

@Injectable()
export class TechnicianDirectoryService {
  private readonly logger = new Logger(TechnicianDirectoryService.name);
  private readonly authServiceUrl: string;
  private readonly internalSecret?: string;
  private readonly memoryCache: BoundedLruCache<string, TechnicianSummaryDto>;

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
    @Optional() @Inject(TECHNICIAN_DIRECTORY_INTERNAL_SECRET) internalSecret?: string,
    @Optional() @Inject(TECHNICIAN_DIRECTORY_MAX_ENTRIES) maxEntries?: number
  ) {
    const limit =
      typeof maxEntries === 'number' && Number.isFinite(maxEntries) && maxEntries > 0
        ? maxEntries
        : DIRECTORY_MEMORY_CACHE_MAX_ENTRIES;
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
    this.internalSecret = internalSecret;
    this.memoryCache = new BoundedLruCache<string, TechnicianSummaryDto>({
      maxEntries: limit,
      ttlMs: DIRECTORY_CACHE_TTL_SECONDS * 1000
    });
  }

  /**
   * Retrieves technician profile summaries for a batch of technician IDs.
   * Leverages multi-tier caching (Redis + in-memory fallback):
   * 1. Resolves all cached technicians first (zero network calls for cache hits).
   * 2. Issues authenticated HTTP POST to auth-service ONLY for missing/uncached IDs.
   * 3. Bounds outbound request batches to <= 100 IDs per chunk (ISSUE-007).
   * 4. Populates cache with newly fetched summaries (300s TTL).
   * 5. Merges cached and freshly fetched records.
   */
  async getTechniciansBatch(
    ids: string[],
    correlationId?: string
  ): Promise<TechnicianSummaryDto[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ids));
    const { cached, missing } = await this.getBatchFromCache(uniqueIds);

    if (missing.length === 0) {
      this.logger.debug(
        `[TechnicianDirectoryService] All ${uniqueIds.length} technicians resolved from cache`
      );
      return uniqueIds.map((id) => cached.get(id)!).filter(Boolean);
    }

    this.logger.debug(
      `[TechnicianDirectoryService] Cache hit: ${cached.size}/${uniqueIds.length}, fetching ${missing.length} missing from auth-service`
    );

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        [SERVICE_NAME_HEADER]: 'dispatch-matching-service'
      };
      const secret =
        this.internalSecret ?? (process.env.INTERNAL_SERVICE_SECRET || getInternalServiceSecret());
      if (secret) {
        headers[INTERNAL_SECRET_HEADER] = secret;
      }
      if (correlationId) {
        headers['x-correlation-id'] = correlationId;
      }

      // Bound batches to at most 100 IDs per chunk (ISSUE-007)
      const CHUNK_SIZE = 100;
      for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
        const chunk = missing.slice(i, i + CHUNK_SIZE);
        const response = await fetch(`${this.authServiceUrl}/technicians/batch`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ids: chunk }),
          signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
          this.logger.warn(`Technician directory batch lookup failed with HTTP ${response.status}`);
          continue;
        }

        const data = (await response.json()) as TechnicianSummaryDto[];
        if (Array.isArray(data)) {
          await this.saveToCache(data);
          for (const tech of data) {
            cached.set(tech.id, tech);
          }
        }
      }

      return uniqueIds.map((id) => cached.get(id)!).filter(Boolean);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Technician directory lookup error: ${msg}`);
      return Array.from(cached.values());
    }
  }

  /**
   * Queries Redis and in-memory cache for a batch of technician IDs.
   */
  private async getBatchFromCache(
    ids: string[]
  ): Promise<{ cached: Map<string, TechnicianSummaryDto>; missing: string[] }> {
    const cached = new Map<string, TechnicianSummaryDto>();
    const missing: string[] = [];

    // 1. Try Redis MGET if available
    if (this.redis) {
      try {
        const keys = ids.map((id) => `${DIRECTORY_CACHE_PREFIX}${id}`);
        const results = await this.redis.mget(...keys);

        for (let i = 0; i < ids.length; i++) {
          const id = ids[i]!;
          const raw = results[i];
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as TechnicianSummaryDto;
              cached.set(id, parsed);
              continue;
            } catch {
              // Corrupted JSON, treat as missing
            }
          }

          // Fallback to memory cache for this ID
          const mem = this.getFromMemoryCache(id);
          if (mem) {
            cached.set(id, mem);
          } else {
            missing.push(id);
          }
        }

        return { cached, missing };
      } catch (redisErr: unknown) {
        const msg = redisErr instanceof Error ? redisErr.message : String(redisErr);
        this.logger.warn(
          `[TechnicianDirectoryService] Redis MGET failed: ${msg}; falling back to in-memory`
        );
      }
    }

    // 2. Fallback to in-memory cache
    for (const id of ids) {
      const mem = this.getFromMemoryCache(id);
      if (mem) {
        cached.set(id, mem);
      } else {
        missing.push(id);
      }
    }

    return { cached, missing };
  }

  private getFromMemoryCache(id: string): TechnicianSummaryDto | null {
    return this.memoryCache.get(id) ?? null;
  }

  /**
   * Caches technician summaries in both memory and Redis with TTL.
   */
  private async saveToCache(technicians: TechnicianSummaryDto[]): Promise<void> {
    if (!technicians || technicians.length === 0) {
      return;
    }

    // In-memory cache (bounded LRU with TTL)
    for (const tech of technicians) {
      this.memoryCache.set(tech.id, tech);
    }

    // Redis cache pipeline
    if (this.redis) {
      try {
        const pipeline = this.redis.pipeline();
        for (const tech of technicians) {
          pipeline.setex(
            `${DIRECTORY_CACHE_PREFIX}${tech.id}`,
            DIRECTORY_CACHE_TTL_SECONDS,
            JSON.stringify(tech)
          );
        }
        await pipeline.exec();
      } catch (redisErr: unknown) {
        const msg = redisErr instanceof Error ? redisErr.message : String(redisErr);
        this.logger.warn(`[TechnicianDirectoryService] Redis pipeline SETEX failed: ${msg}`);
      }
    }
  }

  /**
   * Invalidates a technician's cached summary.
   */
  async invalidate(id: string): Promise<void> {
    this.memoryCache.delete(id);
    if (this.redis) {
      try {
        await this.redis.del(`${DIRECTORY_CACHE_PREFIX}${id}`);
      } catch {
        // Best effort
      }
    }
  }

  /**
   * Clears the entire local in-memory directory cache.
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Introspection method for tests.
   */
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }
}
