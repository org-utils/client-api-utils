import { deferred } from '../async/deferred.js';

/**
 * Limits how many callers may hold a permit concurrently. Prefer
 * {@link Semaphore.run} over manual `acquire`/`release` where possible —
 * it guarantees the permit is released even if the task throws.
 */
export class Semaphore {
  private available: number;
  private readonly queue: (() => void)[] = [];

  constructor(readonly maxConcurrency: number) {
    if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
      throw new RangeError(`Semaphore: maxConcurrency must be a positive integer, got ${maxConcurrency}`);
    }
    this.available = maxConcurrency;
  }

  /** Number of permits currently free. */
  get availablePermits(): number {
    return this.available;
  }

  /** Number of callers currently waiting for a permit. */
  get queueLength(): number {
    return this.queue.length;
  }

  /**
   * Acquires a permit, waiting if none are free. Resolves once a permit
   * is held — the caller is responsible for calling `release()` exactly
   * once. If `signal` aborts while waiting, rejects with the abort
   * reason and never acquires a permit.
   */
  async acquire(signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();

    if (this.available > 0) {
      this.available--;
      return;
    }

    const wait = deferred<void>();
    this.queue.push(wait.resolve);

    if (signal) {
      const onAbort = () => {
        const idx = this.queue.indexOf(wait.resolve);
        if (idx !== -1) this.queue.splice(idx, 1);
        wait.reject(signal.reason ?? new Error('Semaphore.acquire: aborted'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      wait.promise.finally(() => signal.removeEventListener('abort', onAbort));
    }

    return wait.promise;
  }

  /** Releases a permit, waking the next queued waiter (if any). */
  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.available = Math.min(this.available + 1, this.maxConcurrency);
    }
  }

  /** Runs `fn` while holding a permit, releasing it afterward even if `fn` throws. */
  async run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    await this.acquire(signal);
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
