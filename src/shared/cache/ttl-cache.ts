interface TTLEntry<V> {
  value: V;
  expiresAt: number;
}

export interface TTLCacheOptions {
  /** Default time-to-live for entries, in milliseconds. Can be overridden per-entry via `set(key, value, ttl)`. */
  ttl: number;
  /** Optional maximum entry count. When exceeded, the least-recently-used entry is evicted (same recency semantics as `LRUCache`). Unbounded if omitted — combine with a reasonable `ttl` to keep memory bounded over time regardless. */
  maxSize?: number;
}

/**
 * A cache where every entry expires after a TTL. Expiration is checked
 * LAZILY — on `get`/`has`/`size` — rather than via a background timer.
 * This is a deliberate choice: a `setInterval`-based sweep would keep
 * the process alive (a real footgun in Node, and simply wasted work in
 * a browser tab that's backgrounded) for the lifetime of the cache. Call
 * `cleanup()` yourself if you want to proactively reclaim memory from
 * expired-but-unread entries (e.g. on a slow periodic timer your own
 * application already manages), rather than waiting for them to be
 * naturally evicted the next time each key is read.
 */
export class TTLCache<K, V> {
  private readonly store = new Map<K, TTLEntry<V>>();
  private readonly defaultTtl: number;
  private readonly maxSize: number | undefined;

  constructor(options: TTLCacheOptions) {
    if (!Number.isFinite(options.ttl) || options.ttl <= 0) {
      throw new RangeError(`TTLCache: ttl must be a positive finite number, got ${options.ttl}`);
    }
    if (options.maxSize !== undefined && (!Number.isInteger(options.maxSize) || options.maxSize < 1)) {
      throw new RangeError(`TTLCache: maxSize must be a positive integer, got ${options.maxSize}`);
    }

    this.defaultTtl = options.ttl;
    this.maxSize = options.maxSize;
  }

  /** Current entry count. NOTE: may include entries that have expired but haven't been read (and thus lazily evicted) or `cleanup()`'d yet. */
  get size(): number {
    return this.store.size;
  }

  /** Writes a value with an optional per-entry TTL override (defaults to the cache's configured TTL). Marks the entry most-recently-used. */
  set(key: K, value: V, ttl?: number): void {
    const actualTtl = ttl ?? this.defaultTtl;
    if (!Number.isFinite(actualTtl) || actualTtl <= 0) {
      throw new RangeError(`TTLCache.set: ttl must be a positive finite number, got ${actualTtl}`);
    }

    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + actualTtl });

    if (this.maxSize !== undefined && this.store.size > this.maxSize) {
      const oldestKey = this.store.keys().next().value as K;
      this.store.delete(oldestKey);
    }
  }

  /** Reads a value if present and not expired, marking it most-recently-used. Returns `undefined` otherwise (including if it just expired — the stale entry is evicted as a side effect of this call). */
  get(key: K): V | undefined {
    const entry = this.peek(key);
    if (!entry) return undefined;

    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /** `true` if the key is present and not expired. Does NOT affect recency (unlike `get`). */
  has(key: K): boolean {
    return this.peek(key) !== undefined;
  }

  /** Removes a key. Returns `true` if it was present (regardless of whether it had already expired). */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /** Removes all entries. */
  clear(): void {
    this.store.clear();
  }

  /** Proactively removes every currently-expired entry. Returns the number removed. See the class docs for why this isn't automatic. */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }

  private peek(key: K): TTLEntry<V> | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }
}
