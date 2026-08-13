import { TTLCache } from './ttl-cache.js';

export interface MemoizeWithTTLOptions<Args extends unknown[]> {
  /** How long a cached result stays valid, in milliseconds. */
  ttl: number;
  /** Optional max cache entries (LRU-evicted beyond this). Unbounded if omitted. */
  maxSize?: number;
  /** Custom cache-key function. Defaults to `JSON.stringify(args)`. */
  resolver?: (...args: Args) => string;
}

/**
 * Memoizes a SYNCHRONOUS function's results with a TTL and optional
 * size bound, backed by {@link TTLCache}. For memoizing an async
 * function (one that returns a `Promise`), use `memoizeAsync` (async
 * module) instead — it additionally single-flights concurrent in-flight
 * calls, which doesn't apply here since a sync call can't be "in flight."
 */
export function memoizeWithTTL<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  options: MemoizeWithTTLOptions<Args>,
): (...args: Args) => R {
  const { ttl, maxSize, resolver } = options;
  const cache = new TTLCache<string, R>(maxSize !== undefined ? { ttl, maxSize } : { ttl });

  return (...args: Args) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    // has() + get() (rather than just checking get()'s return for
    // undefined) so a legitimately cached `undefined` result is
    // distinguishable from a cache miss.
    if (cache.has(key)) return cache.get(key) as R;

    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
}
