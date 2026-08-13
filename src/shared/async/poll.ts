import { sleep } from './sleep.js';
import { TimeoutError } from './timeout.js';

export interface PollOptions {
  /** Delay between attempts, in milliseconds. Default: 100. */
  interval?: number;
  /** Overall time budget across all attempts, in milliseconds. Default: no limit. */
  timeoutMs?: number;
  /** Aborts polling (and any in-flight delay) when triggered. */
  signal?: AbortSignal;
}

/**
 * Repeatedly calls `fn` at `interval`-ms intervals until it returns a
 * value that isn't `undefined`/`null`, then resolves with that value.
 *
 * @throws {TimeoutError} If `timeoutMs` elapses before `fn` returns a
 *   non-nullish value.
 *
 * @example
 * ```ts
 * const job = await poll(() => getJobIfComplete(id), { interval: 500, timeoutMs: 30_000 });
 * ```
 */
export async function poll<T>(fn: () => T | Promise<T> | null | undefined, options: PollOptions = {}): Promise<T> {
  const { interval = 100, timeoutMs, signal } = options;

  const startedAt = Date.now();

  for (;;) {
    signal?.throwIfAborted();

    const result = await fn();

    if (result !== undefined && result !== null) {
      return result;
    }

    if (timeoutMs !== undefined && Date.now() - startedAt >= timeoutMs) {
      throw new TimeoutError(`poll: timed out after ${timeoutMs}ms`);
    }

    await sleep(interval, signal);
  }
}

/**
 * Waits until `predicate` returns (or resolves to) `true`, checking every
 * `interval` ms. Unlike {@link poll}, discards the predicate's return
 * value — use this when you only care that a condition became true, not
 * about a value it produces.
 *
 * @throws {TimeoutError} If `timeoutMs` elapses before `predicate` is true.
 */
export async function until(
  predicate: () => boolean | Promise<boolean>,
  options: PollOptions = {},
): Promise<void> {
  await poll(async () => ((await predicate()) ? true : undefined), options);
}
