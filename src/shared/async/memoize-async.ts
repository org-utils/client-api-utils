type AsyncFn<Args extends unknown[], R> = (...args: Args) => Promise<R>;

/**
 * Wraps an async function so that concurrent calls with the same
 * arguments (by default, deduped via `JSON.stringify(args)` — pass
 * `resolver` for custom keys) share a single in-flight promise instead of
 * each triggering their own call ("single-flight" / request coalescing).
 *
 * Once a call settles (whether it resolves or rejects), its cache entry
 * is cleared immediately — this only deduplicates concurrent/overlapping
 * calls, it does NOT cache results between separate call bursts. For
 * that, use {@link memoizeAsync}.
 *
 * @example
 * ```ts
 * const getUser = dedupePromise(fetchUser);
 * // Both calls below trigger exactly one fetchUser('42') network request.
 * const [a, b] = await Promise.all([getUser('42'), getUser('42')]);
 * ```
 */
export function dedupePromise<Args extends unknown[], R>(
  fn: AsyncFn<Args, R>,
  resolver?: (...args: Args) => string,
): AsyncFn<Args, R> {
  const inFlight = new Map<string, Promise<R>>();

  return (...args: Args) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fn(...args).finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);
    return promise;
  };
}

export interface MemoizeAsyncOptions<Args extends unknown[]> {
  /** How long a resolved value stays cached, in milliseconds. Default: no expiry (cached forever). */
  ttl?: number;
  /** Custom cache-key function. Defaults to `JSON.stringify(args)`. */
  resolver?: (...args: Args) => string;
}

/**
 * Memoizes an async function's resolved values with an optional TTL, and
 * automatically single-flights concurrent in-flight calls for the same
 * key (so a cache-miss stampede triggers exactly one underlying call, not
 * N). Rejections are never cached — a failed call is always retried on
 * the next invocation with the same key.
 *
 * The cache grows unboundedly (aside from TTL expiry) for the lifetime of
 * the returned function. For a size-bounded cache, layer this over
 * `LRUCache`/`TTLCache` (see the cache module) instead.
 */
export function memoizeAsync<Args extends unknown[], R>(
  fn: AsyncFn<Args, R>,
  options: MemoizeAsyncOptions<Args> = {},
): AsyncFn<Args, R> {
  const { ttl, resolver } = options;

  const cache = new Map<string, { value: R; expiresAt: number | undefined }>();
  const inFlight = new Map<string, Promise<R>>();

  return (...args: Args) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached && (cached.expiresAt === undefined || cached.expiresAt > Date.now())) {
      return Promise.resolve(cached.value);
    }

    const existingCall = inFlight.get(key);
    if (existingCall) return existingCall;

    const promise = fn(...args)
      .then((value) => {
        cache.set(key, { value, expiresAt: ttl !== undefined ? Date.now() + ttl : undefined });
        return value;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, promise);
    return promise;
  };
}
