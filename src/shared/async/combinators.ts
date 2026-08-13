export interface SettledResults<T> {
  fulfilled: T[];
  rejected: unknown[];
}

/**
 * Runs `Promise.allSettled` and partitions the results into fulfilled
 * values and rejection reasons, so callers don't have to filter by
 * `.status` themselves. Order within each group follows the original
 * input order; the two groups are not interleaved/correlated with
 * original indices — if you need that, use `Promise.allSettled` directly.
 */
export async function allSettled<T>(promises: readonly Promise<T>[]): Promise<SettledResults<T>> {
  const results = await Promise.allSettled(promises);

  const fulfilled: T[] = [];
  const rejected: unknown[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') fulfilled.push(result.value);
    else rejected.push(result.reason);
  }

  return { fulfilled, rejected };
}

/**
 * Runs `tasks` with at most `concurrency` running at once, returning
 * results in the same order as the input tasks (not completion order).
 * If any task throws, `concurrently` rejects with that error immediately
 * — already-started tasks are not cancelled (promises can't be), but no
 * *new* tasks are started once the first rejection is observed.
 *
 * @param tasks - Functions to invoke (not already-started promises) so
 *   that concurrency is actually bounded — a pre-started promise has
 *   already begun its work regardless of when you `await` it.
 */
export async function concurrently<T>(
  tasks: readonly (() => Promise<T>)[],
  options: { concurrency: number },
): Promise<T[]> {
  const { concurrency } = options;

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError(`concurrently: concurrency must be a positive integer, got ${concurrency}`);
  }

  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  let firstError: unknown;
  let hasError = false;

  async function worker(): Promise<void> {
    for (;;) {
      const index = nextIndex++;
      if (index >= tasks.length || hasError) return;

      try {
        results[index] = await tasks[index]!();
      } catch (error) {
        if (!hasError) {
          hasError = true;
          firstError = error;
        }
        return;
      }
    }
  }

  const workerCount = Math.min(concurrency, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (hasError) throw firstError;

  return results;
}

/**
 * Runs `tasks` one at a time, in order, awaiting each before starting the
 * next. Equivalent to `concurrently(tasks, { concurrency: 1 })`, exposed
 * separately because "run these in order" is common enough to name
 * directly.
 */
export async function sequential<T>(tasks: readonly (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}
