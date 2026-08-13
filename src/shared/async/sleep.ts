/**
 * Resolves after `ms` milliseconds. If `signal` is provided and aborts
 * before the delay elapses, the returned promise rejects with the
 * signal's abort reason (or a generic `Error` if none was given) instead
 * of resolving late.
 *
 * @example
 * ```ts
 * await sleep(1000);
 * await sleep(5000, controller.signal); // cancellable
 * ```
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason ?? new Error('sleep: aborted'));
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('sleep: aborted'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
