import { Semaphore } from './semaphore.js';

/**
 * Mutual-exclusion lock — equivalent to a {@link Semaphore} with
 * `maxConcurrency: 1`. Ensures at most one caller runs a critical section
 * at a time.
 */
export class Mutex {
  private readonly semaphore = new Semaphore(1);

  /** `true` if the lock is currently held by someone. */
  get isLocked(): boolean {
    return this.semaphore.availablePermits === 0;
  }

  /** Acquires the lock, waiting if already held. */
  lock(signal?: AbortSignal): Promise<void> {
    return this.semaphore.acquire(signal);
  }

  /** Releases the lock. */
  unlock(): void {
    this.semaphore.release();
  }

  /** Runs `fn` while holding the lock, releasing it afterward even if `fn` throws. */
  run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return this.semaphore.run(fn, signal);
  }
}
