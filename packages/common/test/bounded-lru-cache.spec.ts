import { BoundedLruCache } from '../src/cache/bounded-lru-cache';

describe('BoundedLruCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization & Validation', () => {
    it('initializes with valid maxEntries and ttlMs', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 10, ttlMs: 5000 });
      expect(cache.maxEntries).toBe(10);
      expect(cache.defaultTtlMs).toBe(5000);
      expect(cache.size).toBe(0);
    });

    it('throws when maxEntries is invalid or non-positive', () => {
      expect(() => new BoundedLruCache({ maxEntries: 0 })).toThrow(/maxEntries/);
      expect(() => new BoundedLruCache({ maxEntries: -5 })).toThrow(/maxEntries/);
      expect(() => new BoundedLruCache({ maxEntries: NaN })).toThrow(/maxEntries/);
    });
  });

  describe('Basic set and get', () => {
    it('sets and retrieves an entry', () => {
      const cache = new BoundedLruCache<string, number>({ maxEntries: 5 });
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
      expect(cache.size).toBe(1);
    });

    it('returns undefined for missing keys', () => {
      const cache = new BoundedLruCache<string, number>({ maxEntries: 5 });
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('updates existing key without increasing size', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 2 });
      cache.set('a', 'first');
      cache.set('a', 'second');
      expect(cache.get('a')).toBe('second');
      expect(cache.size).toBe(1);
    });
  });

  describe('Capacity and True LRU Eviction', () => {
    it('strictly bounds size to maxEntries', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 2 });
      cache.set('A', 'valA');
      cache.set('B', 'valB');
      cache.set('C', 'valC');

      expect(cache.size).toBe(2);
      expect(cache.get('A')).toBeUndefined(); // A was oldest, evicted
      expect(cache.get('B')).toBe('valB');
      expect(cache.get('C')).toBe('valC');
    });

    it('enforces true LRU eviction when an entry is accessed before capacity overflow', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 2 });
      cache.set('A', 'valA');
      cache.set('B', 'valB');

      // Access A -> A becomes most recently used, B is now least recently used
      expect(cache.get('A')).toBe('valA');

      // Insert C -> should evict B, preserving A and C
      cache.set('C', 'valC');

      expect(cache.get('B')).toBeUndefined();
      expect(cache.get('A')).toBe('valA');
      expect(cache.get('C')).toBe('valC');
      expect(cache.size).toBe(2);
    });
  });

  describe('TTL and Expiration', () => {
    it('returns undefined and physically deletes an entry after TTL expiration on get()', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5, ttlMs: 1000 });
      cache.set('temp', 'value');

      expect(cache.get('temp')).toBe('value');
      expect(cache.size).toBe(1);

      // Advance time past TTL
      jest.advanceTimersByTime(1001);

      expect(cache.get('temp')).toBeUndefined();
      expect(cache.size).toBe(0); // Physically purged on access
    });

    it('respects custom TTL passed to set()', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5, ttlMs: 5000 });
      cache.set('short', 'value', 500);

      jest.advanceTimersByTime(600);
      expect(cache.get('short')).toBeUndefined();
    });

    it('opportunistically evicts expired entries before evicting live entries when capacity is reached', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 2 });
      cache.set('expiredKey', 'expiredVal', 500);
      cache.set('liveKey', 'liveVal', 10000);

      // Advance past expiredKey's TTL
      jest.advanceTimersByTime(600);

      // Adding new key when at capacity (size was 2)
      cache.set('newKey', 'newVal', 10000);

      expect(cache.size).toBe(2);
      expect(cache.get('expiredKey')).toBeUndefined();
      expect(cache.get('liveKey')).toBe('liveVal'); // liveKey was preserved!
      expect(cache.get('newKey')).toBe('newVal');
    });

    it('prunes all expired entries with evictExpired()', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5, ttlMs: 1000 });
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');
      cache.set('k3', 'v3', 10000);

      jest.advanceTimersByTime(1500);

      const evicted = cache.evictExpired();
      expect(evicted).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.get('k3')).toBe('v3');
    });

    it('reports remaining TTL accurately via getRemainingTtl()', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5, ttlMs: 2000 });
      cache.set('k1', 'v1');

      jest.advanceTimersByTime(500);
      expect(cache.getRemainingTtl('k1')).toBe(1500);

      jest.advanceTimersByTime(1600);
      expect(cache.getRemainingTtl('k1')).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe('delete, has, clear, and introspection', () => {
    it('deletes an entry', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5 });
      cache.set('k1', 'v1');
      expect(cache.delete('k1')).toBe(true);
      expect(cache.delete('nonexistent')).toBe(false);
      expect(cache.get('k1')).toBeUndefined();
    });

    it('checks existence via has() taking TTL into account', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5, ttlMs: 1000 });
      cache.set('k1', 'v1');
      expect(cache.has('k1')).toBe(true);

      jest.advanceTimersByTime(1500);
      expect(cache.has('k1')).toBe(false);
      expect(cache.size).toBe(0);
    });

    it('clears all entries with clear()', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 5 });
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('k1')).toBeUndefined();
    });

    it('returns keys and values in LRU order', () => {
      const cache = new BoundedLruCache<string, string>({ maxEntries: 3 });
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      cache.get('a'); // moves 'a' to the most recent position

      expect(cache.keys()).toEqual(['b', 'c', 'a']);
      expect(cache.values()).toEqual(['2', '3', '1']);
    });
  });
});
