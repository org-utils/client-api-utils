import { Semaphore } from './semaphore.js';

/**
 * Runs async tasks with a bounded maximum concurrency. Thin, task-runner
 * oriented wrapper around {@link Semaphore} — use this when you're
 * submitting tasks one at a time from different call sites (e.g. a
 * shared limiter injected into several functions); use `concurrently()`
 * instead when you already have the full list of tasks upfront.
 *
 * @example
 * ```ts
 * const limiter = new ConcurrencyLimiter(5);
 * const results = await Promise.all(urls.map((url) => limiter.run(() => fetch(url))));
 * ```
 */
export class ConcurrencyLimiter {
  private readonly semaphore: Semaphore;

  constructor(readonly limit: number) {
    this.semaphore = new Semaphore(limit);
  }

  /** Number of tasks currently allowed to run before new ones must wait. */
  get availableSlots(): number {
    return this.semaphore.availablePermits;
  }

  /** Runs `fn`, waiting for a free slot first if the limit is currently reached. */
  run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return this.semaphore.run(fn, signal);
  }
}
