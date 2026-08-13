import { sleep } from './sleep.js';

export interface RetryOptions {
  /** Maximum number of attempts, including the first. Default: 3. */
  maxAttempts?: number;
  /** Delay before the first retry, in milliseconds. Default: 200. */
  initialDelay?: number;
  /** Upper bound on the delay between retries, in milliseconds. Default: 10_000. */
  maxDelay?: number;
  /** Multiplier applied to the delay after each attempt (exponential backoff). Default: 2. */
  factor?: number;
  /**
   * Adds random jitter to each delay to avoid thundering-herd retries
   * across many callers. `true` uses full jitter (`random(0, delay)`).
   * Default: `false`.
   */
  jitter?: boolean;
  /**
   * Decides whether a given error should be retried. Defaults to
   * "retry everything". IMPORTANT: retry is opt-out only for errors you
   * explicitly recognize as non-retryable (e.g. 4xx client errors,
   * validation errors) — don't rely on the default for operations where
   * blindly retrying could cause harm (e.g. non-idempotent writes).
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Aborts retrying (and the in-flight delay) when triggered. */
  signal?: AbortSignal;
}

/**
 * Retries `fn` with exponential backoff until it succeeds, `maxAttempts`
 * is exhausted, `shouldRetry` returns `false`, or `signal` aborts.
 *
 * Never retries by default forever, and never retries an error that
 * `shouldRetry` rejects — only retries errors for which `shouldRetry`
 * (or the default "retry everything") returns `true`, and only up to
 * `maxAttempts`.
 *
 * @throws The last error encountered, once attempts are exhausted or
 *   `shouldRetry` returns `false`. If `signal` aborts mid-delay, throws
 *   the abort reason instead.
 *
 * @example
 * ```ts
 * const data = await retry(() => fetchData(), {
 *   maxAttempts: 5,
 *   initialDelay: 250,
 *   maxDelay: 5000,
 *   jitter: true,
 *   shouldRetry: (err) => isRetryableStatus(getErrorCode(err) as number),
 * });
 * ```
 */
export async function retry<T>(fn: () => T | Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 200,
    maxDelay = 10_000,
    factor = 2,
    jitter = false,
    shouldRetry = () => true,
    signal,
  } = options;

  if (maxAttempts < 1) {
    throw new RangeError(`retry: maxAttempts must be >= 1, got ${maxAttempts}`);
  }

  let attempt = 0;
  let delay = initialDelay;

  for (;;) {
    attempt++;
    signal?.throwIfAborted();

    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt >= maxAttempts;

      if (isLastAttempt || !shouldRetry(error, attempt)) {
        throw error;
      }

      const boundedDelay = Math.min(delay, maxDelay);
      const actualDelay = jitter ? Math.random() * boundedDelay : boundedDelay;

      await sleep(actualDelay, signal);

      delay = Math.min(delay * factor, maxDelay);
    }
  }
}

/**
 * Alias for {@link retry}. `retry` already performs exponential backoff
 * by default (see `factor`/`initialDelay`/`maxDelay`) — this export
 * exists purely for call sites that want the more explicit name.
 */
export const retryWithBackoff = retry;
