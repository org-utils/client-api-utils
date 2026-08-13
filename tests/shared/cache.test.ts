import { describe, expect, it, vi } from 'vitest';
import { LRUCache } from '../../src/shared/cache/lru-cache.js';
import { TTLCache } from '../../src/shared/cache/ttl-cache.js';
import { memoizeWithTTL } from '../../src/shared/cache/memoize-with-ttl.js';

describe('LRUCache', () => {
  it('evicts the least-recently-used entry, not simply the oldest inserted', () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.get('a'); // touches 'a' -> 'b' becomes least-recently-used
    cache.set('d', 4); // should evict 'b', not 'a'

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
    expect(cache.size).toBe(3);
  });

  it('has() does not affect recency', () => {
    const cache = new LRUCache<string, number>({ maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.has('a'); // must NOT count as a "use"
    cache.set('c', 3); // 'a' should still be evicted (least-recently-used)

    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
  });

  it('rejects invalid maxSize', () => {
    expect(() => new LRUCache({ maxSize: 0 })).toThrow(RangeError);
  });
});

describe('TTLCache', () => {
  it('returns values before expiry and undefined after', async () => {
    const cache = new TTLCache<string, string>({ ttl: 30 });
    cache.set('x', 'value');
    expect(cache.get('x')).toBe('value');

    await new Promise((r) => setTimeout(r, 50));
    expect(cache.get('x')).toBeUndefined();
    expect(cache.size).toBe(0); // lazily evicted on the failed get
  });

  it('supports a per-entry TTL override', async () => {
    const cache = new TTLCache<string, number>({ ttl: 1000 });
    cache.set('a', 1);
    cache.set('b', 2, 10);

    await new Promise((r) => setTimeout(r, 30));
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('respects maxSize with LRU-style eviction', () => {
    const cache = new TTLCache<string, number>({ ttl: 1000, maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // 'a' was never read, should be evicted first

    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
  });

  it('cleanup() proactively sweeps expired entries and reports the count', async () => {
    const cache = new TTLCache<string, number>({ ttl: 10 });
    cache.set('x', 1);
    cache.set('y', 2);

    await new Promise((r) => setTimeout(r, 20));
    expect(cache.cleanup()).toBe(2);
    expect(cache.size).toBe(0);
  });

  it('rejects invalid ttl/maxSize', () => {
    expect(() => new TTLCache({ ttl: 0 })).toThrow(RangeError);
    expect(() => new TTLCache({ ttl: 100, maxSize: 0 })).toThrow(RangeError);
  });
});

describe('memoizeWithTTL', () => {
  it('caches results and re-invokes after expiry', async () => {
    const fn = vi.fn((n: number) => n * 2);
    const memoized = memoizeWithTTL(fn, { ttl: 30 });

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    await new Promise((r) => setTimeout(r, 50));
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('correctly caches a legitimate undefined result instead of treating it as a miss', () => {
    const fn = vi.fn(() => undefined);
    const memoized = memoizeWithTTL(fn, { ttl: 1000 });

    memoized();
    memoized();
    memoized();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
