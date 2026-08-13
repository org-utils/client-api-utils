/**
 * Returns a promise that rejects after `ms` milliseconds with a
 * `TimeoutError`. On its own this is mostly useful raced against other
 * promises — see {@link withTimeout} for the common case of doing that
 * for a single promise.
 */
export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/** Returns a promise that rejects with a {@link TimeoutError} after `ms` milliseconds. The underlying timer is `unref`'d where supported so it never keeps a Node process alive on its own. */
export function timeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(message)), ms);
    // Only Node timers have unref(); browsers/edge runtimes don't, so we
    // feature-detect rather than assume.
    (timer as unknown as { unref?: () => void }).unref?.();
  });
}

/**
 * Races `promise` against a `ms`-millisecond timeout. If the timeout
 * fires first, the returned promise rejects with a {@link TimeoutError};
 * `promise` itself is NOT cancelled (JS promises aren't cancellable) —
 * it keeps running in the background and its eventual result/error is
 * simply ignored. If your operation supports `AbortSignal`, prefer
 * passing one directly to it instead of (or alongside) this.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  return Promise.race([promise, timeout(ms, message)]);
}
