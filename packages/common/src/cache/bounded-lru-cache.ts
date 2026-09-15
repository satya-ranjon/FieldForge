export interface BoundedLruCacheOptions {
  /**
   * Maximum number of entries allowed in the cache.
   * Must be a positive integer greater than 0.
   */
  maxEntries: number;

  /**
   * Default time-to-live in milliseconds for cached entries.
   * If omitted, entries do not expire unless explicitly passed in `set()`.
   */
  ttlMs?: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * High-performance, zero-dependency in-memory cache with bounded size,
 * time-to-live (TTL) expiration, and Least Recently Used (LRU) eviction.
 * Leverages native JavaScript Map key-iteration order semantics.
 */
export class BoundedLruCache<K, V> {
  private readonly map = new Map<K, CacheEntry<V>>();
  readonly maxEntries: number;
  readonly defaultTtlMs?: number;

  constructor(options: BoundedLruCacheOptions) {
    if (
      !options ||
      typeof options.maxEntries !== 'number' ||
      options.maxEntries <= 0 ||
      !Number.isFinite(options.maxEntries)
    ) {
      throw new Error('BoundedLruCache requires maxEntries to be a positive finite integer > 0');
    }
    this.maxEntries = Math.floor(options.maxEntries);
    this.defaultTtlMs = options.ttlMs;
  }

  /**
   * Retrieves a value by key.
   * 1. If key is missing, returns undefined.
   * 2. If entry has expired, physically deletes it and returns undefined.
   * 3. If entry is valid, moves it to the most-recently-used position and returns value.
   */
  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh LRU position (delete & re-insert to place at iteration tail)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  /**
   * Inserts or updates a value by key.
   * 1. If key already exists, deletes the previous entry.
   * 2. If size >= maxEntries, opportunistically prunes expired entries.
   * 3. If still at capacity, evicts the least-recently-used entry (first item in Map).
   * 4. Inserts new entry as most-recently-used.
   */
  set(key: K, value: V, customTtlMs?: number): this {
    const ttl = customTtlMs ?? this.defaultTtlMs;
    const expiresAt = ttl !== undefined && Number.isFinite(ttl) ? Date.now() + ttl : Infinity;

    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // First, purge any expired entries to avoid evicting live ones prematurely
      this.evictExpired();

      // If still at or above capacity, evict the least recently used entry (first entry in Map)
      if (this.map.size >= this.maxEntries) {
        const oldestKey = this.map.keys().next().value;
        if (oldestKey !== undefined) {
          this.map.delete(oldestKey);
        }
      }
    }

    this.map.set(key, { value, expiresAt });
    return this;
  }

  /**
   * Checks whether a key exists in cache and has not expired.
   * If expired, physically deletes the entry and returns false.
   */
  has(key: K): boolean {
    const entry = this.map.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Deletes an entry by key.
   */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Returns the current number of resident entries.
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Iterates through all entries and physically removes expired ones.
   * Returns the number of entries evicted.
   */
  evictExpired(): number {
    const now = Date.now();
    let evictedCount = 0;
    for (const [key, entry] of this.map.entries()) {
      if (now > entry.expiresAt) {
        this.map.delete(key);
        evictedCount++;
      }
    }
    return evictedCount;
  }

  /**
   * Alias for evictExpired.
   */
  prune(): number {
    return this.evictExpired();
  }

  /**
   * Returns remaining TTL in milliseconds for an entry, or undefined if not found or expired.
   */
  getRemainingTtl(key: K): number | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }
    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.map.delete(key);
      return undefined;
    }
    return remaining;
  }

  /**
   * Returns array of active unexpired keys in LRU order (least recent -> most recent).
   */
  keys(): K[] {
    this.evictExpired();
    return Array.from(this.map.keys());
  }

  /**
   * Returns array of active unexpired values in LRU order.
   */
  values(): V[] {
    this.evictExpired();
    return Array.from(this.map.values()).map((e) => e.value);
  }
}
