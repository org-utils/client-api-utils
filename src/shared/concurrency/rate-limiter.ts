import { sleep } from '../async/sleep.js';

export interface RateLimiterOptions {
  /** Maximum number of tokens the bucket can hold (i.e. the max burst size). */
  maxTokens: number;
  /** Milliseconds it takes to refill `maxTokens` tokens from empty (i.e. the sustained rate is `maxTokens` per `refillIntervalMs`). */
  refillIntervalMs: number;
}

/**
 * Token-bucket rate limiter. Tokens refill continuously (not in discrete
 * steps) at a rate of `maxTokens` per `refillIntervalMs`, up to a cap of
 * `maxTokens` — so short bursts up to `maxTokens` are allowed, while the
 * sustained rate is capped.
 *
 * @example
 * ```ts
 * // Allow bursts of up to 10 requests, sustained rate 10/second.
 * const limiter = new RateLimiter({ maxTokens: 10, refillIntervalMs: 1000 });
 *
 * if (limiter.tryAcquire()) {
 *   makeRequest();
 * }
 *
 * // Or, to wait rather than reject:
 * await limiter.acquire();
 * makeRequest();
 * ```
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillAt: number;
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  constructor(options: RateLimiterOptions) {
    const { maxTokens, refillIntervalMs } = options;

    if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
      throw new RangeError(`RateLimiter: maxTokens must be > 0, got ${maxTokens}`);
    }
    if (!Number.isFinite(refillIntervalMs) || refillIntervalMs <= 0) {
      throw new RangeError(`RateLimiter: refillIntervalMs must be > 0, got ${refillIntervalMs}`);
    }

    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.tokens = maxTokens;
    this.lastRefillAt = Date.now();
  }

  /** Current token count, after applying any refill owed since the last check. */
  get availableTokens(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillAt;
    if (elapsed <= 0) return;

    const refillRate = this.maxTokens / this.refillIntervalMs; // tokens per ms
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * refillRate);
    this.lastRefillAt = now;
  }

  /**
   * Attempts to consume `cost` tokens immediately, without waiting.
   * @returns `true` and consumes the tokens if enough were available,
   *   `false` (consuming nothing) otherwise.
   */
  tryAcquire(cost = 1): boolean {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    return false;
  }

  /**
   * Waits until `cost` tokens are available, then consumes them. Resolves
   * immediately if tokens are already available.
   */
  async acquire(cost = 1, signal?: AbortSignal): Promise<void> {
    if (cost > this.maxTokens) {
      throw new RangeError(
        `RateLimiter.acquire: cost (${cost}) exceeds maxTokens (${this.maxTokens}) and could never be satisfied`,
      );
    }

    for (;;) {
      signal?.throwIfAborted();

      if (this.tryAcquire(cost)) return;

      const refillRate = this.maxTokens / this.refillIntervalMs;
      const tokensNeeded = cost - this.tokens;
      const waitMs = Math.max(1, Math.ceil(tokensNeeded / refillRate));

      await sleep(waitMs, signal);
    }
  }
}
