/**
 * A uniform, always-safe key-value storage interface, backed by
 * `localStorage`, `sessionStorage`, or plain memory depending on the
 * adapter. Every method is synchronous (matching the underlying Web
 * Storage API) and NEVER throws — unavailable storage, private-browsing
 * restrictions, quota errors, and non-browser (SSR) contexts are all
 * handled by degrading gracefully rather than throwing, per the design
 * goal of never failing "just because storage isn't there."
 */
export interface StorageAdapter {
  /** Reads and JSON-parses a value. Returns `undefined` if the key is absent, storage is unavailable, or the stored value isn't valid JSON. */
  get<T = unknown>(key: string): T | undefined;
  /** JSON-serializes and stores a value. Returns `true` if the value was actually persisted to the underlying store, `false` if it silently fell back to an in-memory cache instead (see `storage`'s docs for what that means). */
  set<T = unknown>(key: string, value: T): boolean;
  /** Removes a key. No-op (does not throw) if the key is absent or storage is unavailable. */
  remove(key: string): void;
  /** Removes all keys managed by this adapter. */
  clear(): void;
  /** `true` if the key is present. */
  has(key: string): boolean;
}

/**
 * An in-memory `StorageAdapter`. Always available, in any environment
 * (including SSR/Node) — useful as an explicit choice, or as the
 * fallback backing store inside `storage`/`localStorageAdapter`/
 * `sessionStorageAdapter`. Values are held by reference in a `Map`, not
 * JSON round-tripped, so it doesn't lose fidelity the way the web-storage
 * adapters necessarily do (e.g. it can store functions, `Map`s, etc. —
 * though relying on that means your code will behave differently if you
 * ever swap in a web-storage-backed adapter).
 *
 * Data does NOT persist across reloads/process restarts — that's the
 * fundamental trade-off for "always works everywhere."
 */
export function createMemoryStorage(): StorageAdapter {
  const store = new Map<string, unknown>();

  return {
    get<T>(key: string): T | undefined {
      return store.has(key) ? (store.get(key) as T) : undefined;
    },
    set<T>(key: string, value: T): boolean {
      store.set(key, value);
      return true;
    },
    remove(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    has(key: string): boolean {
      return store.has(key);
    },
  };
}

/** Shared singleton memory storage instance, for convenience when you don't need a dedicated one. */
export const memoryStorage: StorageAdapter = createMemoryStorage();

function getWebStorage(kind: 'local' | 'session'): Storage | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    // Accessing `.localStorage`/`.sessionStorage` itself can throw in some
    // privacy-restricted contexts (notably older Safari private browsing),
    // not just the individual get/set/remove calls — hence the try/catch
    // around the property access, not just around each operation below.
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    // Some environments expose the property but throw/behave oddly on
    // actual use; do a cheap round-trip to confirm it really works.
    const probeKey = '__org_utils_storage_probe__';
    store.setItem(probeKey, '1');
    store.removeItem(probeKey);
    return store;
  } catch {
    return undefined;
  }
}

/**
 * Creates a `StorageAdapter` backed directly by `localStorage` or
 * `sessionStorage`, with no fallback — `get` returns `undefined` and
 * `set` returns `false` whenever the underlying store is unavailable
 * (SSR, private browsing, disabled storage, etc.), rather than throwing
 * or silently caching elsewhere. Use `storage`/`localStorageAdapter`/
 * `sessionStorageAdapter` (the pre-built, fallback-enabled exports) for
 * the common case where you want writes to always "succeed" from the
 * caller's point of view.
 */
export function createWebStorageAdapter(kind: 'local' | 'session'): StorageAdapter {
  return {
    get<T>(key: string): T | undefined {
      const store = getWebStorage(kind);
      if (!store) return undefined;

      try {
        const raw = store.getItem(key);
        if (raw === null) return undefined;
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    },
    set<T>(key: string, value: T): boolean {
      const store = getWebStorage(kind);
      if (!store) return false;

      try {
        store.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        // Most commonly a quota-exceeded error, but treated the same as
        // any other storage failure: report false, don't throw.
        return false;
      }
    },
    remove(key: string): void {
      try {
        getWebStorage(kind)?.removeItem(key);
      } catch {
        // ignore
      }
    },
    clear(): void {
      try {
        getWebStorage(kind)?.clear();
      } catch {
        // ignore
      }
    },
    has(key: string): boolean {
      try {
        return getWebStorage(kind)?.getItem(key) !== null;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Wraps a web-storage-backed adapter with an in-memory fallback: if the
 * underlying store is unavailable, writes still "succeed" (from the
 * caller's perspective) by landing in memory instead. This means calling
 * code never needs to special-case "storage might not work" — but it
 * also means data written while falling back does NOT persist across
 * reloads, silently. If that distinction matters to your use case
 * (e.g. you need to know whether a value will survive a refresh), check
 * `set()`'s boolean return value, which is `true` only when the write
 * actually reached persistent storage.
 */
function createSafeStorage(kind: 'local' | 'session'): StorageAdapter {
  const primary = createWebStorageAdapter(kind);
  const fallback = createMemoryStorage();

  return {
    get<T>(key: string): T | undefined {
      const primaryValue = primary.get<T>(key);
      return primaryValue !== undefined ? primaryValue : fallback.get<T>(key);
    },
    set<T>(key: string, value: T): boolean {
      const persisted = primary.set(key, value);
      if (!persisted) fallback.set(key, value);
      return persisted;
    },
    remove(key: string): void {
      primary.remove(key);
      fallback.remove(key);
    },
    clear(): void {
      primary.clear();
      fallback.clear();
    },
    has(key: string): boolean {
      return primary.has(key) || fallback.has(key);
    },
  };
}

/** `localStorage`-backed adapter with an automatic in-memory fallback. This is the adapter most apps want by default. */
export const localStorageAdapter: StorageAdapter = createSafeStorage('local');

/** `sessionStorage`-backed adapter with an automatic in-memory fallback. */
export const sessionStorageAdapter: StorageAdapter = createSafeStorage('session');

/** Alias for {@link localStorageAdapter} — the general-purpose default most call sites should reach for. */
export const storage: StorageAdapter = localStorageAdapter;
