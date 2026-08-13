import { describe, expect, it, vi } from 'vitest';
import { sleep } from '../../src/shared/async/sleep.js';
import { deferred } from '../../src/shared/async/deferred.js';
import { withTimeout, timeout, TimeoutError } from '../../src/shared/async/timeout.js';
import { retry } from '../../src/shared/async/retry.js';
import { poll, until } from '../../src/shared/async/poll.js';
import { allSettled, concurrently, sequential } from '../../src/shared/async/combinators.js';
import { dedupePromise, memoizeAsync } from '../../src/shared/async/memoize-async.js';

describe('sleep', () => {
  it('resolves after the delay', async () => {
    const start = Date.now();
    await sleep(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });

  it('rejects immediately if signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('pre-aborted'));
    await expect(sleep(1000, controller.signal)).rejects.toThrow('pre-aborted');
  });

  it('rejects when aborted mid-delay, without waiting the full duration', async () => {
    const controller = new AbortController();
    const promise = sleep(1000, controller.signal);
    setTimeout(() => controller.abort(new Error('cancelled')), 10);
    await expect(promise).rejects.toThrow('cancelled');
  });
});

describe('deferred', () => {
  it('exposes externally-callable resolve/reject', async () => {
    const d = deferred<number>();
    setTimeout(() => d.resolve(42), 5);
    expect(await d.promise).toBe(42);
  });

  it('reject propagates to the promise', async () => {
    const d = deferred<number>();
    d.reject(new Error('nope'));
    await expect(d.promise).rejects.toThrow('nope');
  });
});

describe('timeout / withTimeout', () => {
  it('timeout() rejects with TimeoutError after the given delay', async () => {
    await expect(timeout(10)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('withTimeout resolves if the promise settles first', async () => {
    const fast = new Promise((resolve) => setTimeout(() => resolve('done'), 5));
    await expect(withTimeout(fast as Promise<string>, 100)).resolves.toBe('done');
  });

  it('withTimeout rejects with TimeoutError if the promise is too slow', async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve('done'), 200));
    await expect(withTimeout(slow as Promise<string>, 10)).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe('retry', () => {
  it('returns the result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxAttempts then throws the last error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(
      retry(fn, { maxAttempts: 3, initialDelay: 1, maxDelay: 5 }),
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('succeeds after transient failures within maxAttempts', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 3) throw new Error('transient');
      return 'recovered';
    });
    await expect(retry(fn, { maxAttempts: 5, initialDelay: 1, maxDelay: 5 })).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
    const shouldRetry = vi.fn().mockReturnValue(false);
    await expect(retry(fn, { maxAttempts: 5, shouldRetry })).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('stops retrying and rejects when signal aborts mid-backoff', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error('fails'));
    const promise = retry(fn, { maxAttempts: 10, initialDelay: 50, signal: controller.signal });
    setTimeout(() => controller.abort(new Error('cancelled')), 10);
    await expect(promise).rejects.toThrow('cancelled');
  });

  it('rejects synchronously-invalid options', async () => {
    await expect(retry(async () => 1, { maxAttempts: 0 })).rejects.toThrow(RangeError);
  });
});

describe('poll / until', () => {
  it('poll resolves with the first non-nullish value', async () => {
    let calls = 0;
    const fn = vi.fn(() => {
      calls++;
      return calls < 3 ? undefined : 'ready';
    });
    await expect(poll(fn, { interval: 5 })).resolves.toBe('ready');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('poll throws TimeoutError if the budget is exceeded', async () => {
    await expect(poll(() => undefined, { interval: 5, timeoutMs: 20 })).rejects.toBeInstanceOf(TimeoutError);
  });

  it('until resolves once the predicate is true', async () => {
    let calls = 0;
    await expect(
      until(() => {
        calls++;
        return calls >= 3;
      }, { interval: 5 }),
    ).resolves.toBeUndefined();
    expect(calls).toBe(3);
  });
});

describe('allSettled', () => {
  it('partitions fulfilled and rejected results', async () => {
    const result = await allSettled([
      Promise.resolve(1),
      Promise.reject(new Error('bad')),
      Promise.resolve(2),
    ]);
    expect(result.fulfilled).toEqual([1, 2]);
    expect(result.rejected).toHaveLength(1);
    expect((result.rejected[0] as Error).message).toBe('bad');
  });
});

describe('concurrently', () => {
  it('runs tasks with bounded concurrency and preserves result order', async () => {
    let active = 0;
    let maxActive = 0;

    const makeTask = (value: number, delay: number) => async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await sleep(delay);
      active--;
      return value;
    };

    const tasks = [makeTask(1, 20), makeTask(2, 5), makeTask(3, 20), makeTask(4, 5), makeTask(5, 20)];

    const results = await concurrently(tasks, { concurrency: 2 });

    expect(results).toEqual([1, 2, 3, 4, 5]); // input order, not completion order
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('rejects with the first error and does not start new tasks after it', async () => {
    let started = 0;
    const tasks = [
      async () => {
        started++;
        throw new Error('boom');
      },
      async () => {
        started++;
        await sleep(50);
        return 'never observed';
      },
      async () => {
        started++;
        return 'ok';
      },
    ];

    await expect(concurrently(tasks, { concurrency: 1 })).rejects.toThrow('boom');
    expect(started).toBe(1); // sequential concurrency=1, stops right after the failure
  });

  it('throws RangeError for invalid concurrency', async () => {
    await expect(concurrently([], { concurrency: 0 })).rejects.toThrow(RangeError);
  });
});

describe('sequential', () => {
  it('runs tasks one at a time, in order', async () => {
    const order: number[] = [];
    const tasks = [1, 2, 3].map((n) => async () => {
      order.push(n);
      await sleep(5);
      return n * 10;
    });

    const results = await sequential(tasks);
    expect(results).toEqual([10, 20, 30]);
    expect(order).toEqual([1, 2, 3]);
  });
});

describe('dedupePromise', () => {
  it('coalesces concurrent calls with the same key into one underlying call', async () => {
    const fn = vi.fn(async (id: string) => {
      await sleep(20);
      return `user:${id}`;
    });
    const deduped = dedupePromise(fn);

    const [a, b] = await Promise.all([deduped('42'), deduped('42')]);

    expect(a).toBe('user:42');
    expect(b).toBe('user:42');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not dedupe calls with different keys', async () => {
    const fn = vi.fn(async (id: string) => `user:${id}`);
    const deduped = dedupePromise(fn);
    await Promise.all([deduped('1'), deduped('2')]);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('memoizeAsync', () => {
  it('caches resolved values and does not call fn again before TTL expires', async () => {
    const fn = vi.fn(async (id: string) => `value:${id}`);
    const memoized = memoizeAsync(fn, { ttl: 1000 });

    await memoized('a');
    await memoized('a');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-invokes fn after TTL expires', async () => {
    const fn = vi.fn(async (id: string) => `value:${id}`);
    const memoized = memoizeAsync(fn, { ttl: 10 });

    await memoized('a');
    await sleep(20);
    await memoized('a');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('never caches rejections', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error('first call fails');
      return 'ok';
    });
    const memoized = memoizeAsync(fn);

    await expect(memoized()).rejects.toThrow('first call fails');
    await expect(memoized()).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('single-flights concurrent calls for the same key', async () => {
    const fn = vi.fn(async (id: string) => {
      await sleep(20);
      return `value:${id}`;
    });
    const memoized = memoizeAsync(fn);

    await Promise.all([memoized('a'), memoized('a'), memoized('a')]);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
