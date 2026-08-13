/**
 * A size-bounded least-recently-used cache. Reading a key marks it
 * most-recently-used; when `maxSize` is exceeded, the least-recently-used
 * entry is evicted. Built on a `Map` (which preserves insertion order),
 * so recency is tracked by re-inserting on access rather than a separate
 * linked-list structure — O(1) for get/set either way.
 */
export class LRUCache<K, V> {
  private readonly store = new Map<K, V>();
  private readonly maxSize: number;

  constructor(options: { maxSize: number }) {
    if (!Number.isInteger(options.maxSize) || options.maxSize < 1) {
      throw new RangeError(`LRUCache: maxSize must be a positive integer, got ${options.maxSize}`);
    }
    this.maxSize = options.maxSize;
  }

  /** Number of entries currently cached. */
  get size(): number {
    return this.store.size;
  }

  /** Reads a value, marking it most-recently-used. Returns `undefined` if absent — use `has()` first if you need to distinguish "absent" from "cached `undefined`" (not applicable if `V` can't be `undefined`). */
  get(key: K): V | undefined {
    if (!this.store.has(key)) return undefined;

    const value = this.store.get(key) as V;
    // Re-insert to move this key to the "most recently used" end.
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  /** Writes a value, marking it most-recently-used. Evicts the least-recently-used entry if this write pushes the cache over `maxSize`. */
  set(key: K, value: V): void {
    this.store.delete(key);
    this.store.set(key, value);

    if (this.store.size > this.maxSize) {
      const oldestKey = this.store.keys().next().value as K;
      this.store.delete(oldestKey);
    }
  }

  /** `true` if the key is present. Does NOT affect recency (unlike `get`). */
  has(key: K): boolean {
    return this.store.has(key);
  }

  /** Removes a key. Returns `true` if it was present. */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /** Removes all entries. */
  clear(): void {
    this.store.clear();
  }
}
