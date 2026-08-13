/** Function utilities: composition, memoization, and rate limiting for calls. */

/** Does nothing and returns `undefined`. Useful as a default callback. */
export function noop(): void {
  // intentionally empty
}

/** Returns its argument unchanged. */
export function identity<T>(value: T): T {
  return value;
}

/** Wraps `fn` so it only ever runs once; subsequent calls return the first call's cached result. */
export function once<T extends (...args: never[]) => unknown>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;

  return ((...args: Parameters<T>) => {
    if (!called) {
      result = fn(...args) as ReturnType<T>;
      called = true;
    }
    return result;
  }) as T;
}

/**
 * Memoizes `fn` by caching results keyed on its arguments. By default,
 * keys are computed via `JSON.stringify(args)` — pass `resolver` for
 * custom cache keys (e.g. when arguments aren't JSON-serializable).
 *
 * The cache grows unboundedly for the lifetime of the returned function;
 * for a bounded cache use the `LRUCache`/`memoizeWithTTL` utilities
 * (cache module) instead.
 */
export function memoize<T extends (...args: never[]) => unknown>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) return cache.get(key) as ReturnType<T>;

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

export interface Cancelable {
  cancel(): void;
}

/**
 * Returns a debounced version of `fn` that delays invocation until `wait`
 * ms have passed without another call. Call `.cancel()` on the returned
 * function to discard a pending invocation.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait: number,
): ((...args: Parameters<T>) => void) & Cancelable {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}

/**
 * Returns a throttled version of `fn` that invokes at most once per
 * `wait` ms. The leading call fires immediately; trailing calls within
 * the window are coalesced into one trailing invocation. Call `.cancel()`
 * to discard any pending trailing invocation.
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  wait: number,
): ((...args: Parameters<T>) => void) & Cancelable {
  let lastCallTime = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: Parameters<T> | undefined;

  const invoke = (args: Parameters<T>) => {
    lastCallTime = Date.now();
    fn(...args);
  };

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    if (remaining <= 0) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      invoke(args);
    } else {
      pendingArgs = args;
      if (timer === undefined) {
        timer = setTimeout(() => {
          timer = undefined;
          if (pendingArgs) invoke(pendingArgs);
          pendingArgs = undefined;
        }, remaining);
      }
    }
  };

  throttled.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    pendingArgs = undefined;
  };

  return throttled;
}

/** Composes functions right-to-left: `compose(f, g, h)(x) === f(g(h(x)))`. */
export function compose<T>(...fns: ((arg: T) => T)[]): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

/** Composes functions left-to-right: `pipe(f, g, h)(x) === h(g(f(x)))`. */
export function pipe<T>(...fns: ((arg: T) => T)[]): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

/** Curries a two-argument function into a chain of single-argument calls. */
export function curry<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a: A) => (b: B) => fn(a, b);
}

/** Returns a new function with `presetArgs` bound as the leading arguments. */
export function partial<A extends unknown[], B extends unknown[], R>(
  fn: (...args: [...A, ...B]) => R,
  ...presetArgs: A
): (...rest: B) => R {
  return (...rest: B) => fn(...presetArgs, ...rest);
}

/** Returns a predicate that's the logical negation of `predicate`. */
export function negate<A extends unknown[]>(predicate: (...args: A) => boolean): (...args: A) => boolean {
  return (...args: A) => !predicate(...args);
}

/** Wraps `fn`, passing it as the first argument to `wrapper` — useful for adding cross-cutting behavior (logging, timing, etc). */
export function wrap<A extends unknown[], R>(
  fn: (...args: A) => R,
  wrapper: (fn: (...args: A) => R, ...args: A) => R,
): (...args: A) => R {
  return (...args: A) => wrapper(fn, ...args);
}
