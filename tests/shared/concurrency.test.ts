import { describe, expect, it } from 'vitest';
import { sleep } from '../../src/shared/async/sleep.js';
import { Semaphore } from '../../src/shared/concurrency/semaphore.js';
import { Mutex } from '../../src/shared/concurrency/mutex.js';
import { ConcurrencyLimiter } from '../../src/shared/concurrency/concurrency-limiter.js';
import { RateLimiter } from '../../src/shared/concurrency/rate-limiter.js';

describe('Semaphore', () => {
  it('allows up to maxConcurrency callers through at once', async () => {
    const sem = new Semaphore(2);
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      await sem.acquire();
      active++;
      maxActive = Math.max(maxActive, active);
      await sleep(20);
      active--;
      sem.release();
    };

    await Promise.all([task(), task(), task(), task()]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('run() releases the permit even if the task throws', async () => {
    const sem = new Semaphore(1);
    await expect(
      sem.run(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(sem.availablePermits).toBe(1); // released despite the throw
  });

  it('throws RangeError for non-positive maxConcurrency', () => {
    expect(() => new Semaphore(0)).toThrow(RangeError);
  });

  it('acquire rejects if the signal aborts while queued', async () => {
    const sem = new Semaphore(1);
    await sem.acquire(); // hold the only permit

    const controller = new AbortController();
    const waiting = sem.acquire(controller.signal);
    setTimeout(() => controller.abort(new Error('cancelled')), 10);

    await expect(waiting).rejects.toThrow('cancelled');
  });
});

describe('Mutex', () => {
  it('ensures mutual exclusion between concurrent run() calls', async () => {
    const mutex = new Mutex();
    let inCriticalSection = false;
    let violations = 0;

    const task = () =>
      mutex.run(async () => {
        if (inCriticalSection) violations++;
        inCriticalSection = true;
        await sleep(10);
        inCriticalSection = false;
      });

    await Promise.all([task(), task(), task()]);
    expect(violations).toBe(0);
  });

  it('isLocked reflects current lock state', async () => {
    const mutex = new Mutex();
    expect(mutex.isLocked).toBe(false);
    await mutex.lock();
    expect(mutex.isLocked).toBe(true);
    mutex.unlock();
    expect(mutex.isLocked).toBe(false);
  });
});

describe('ConcurrencyLimiter', () => {
  it('bounds concurrent execution', async () => {
    const limiter = new ConcurrencyLimiter(2);
    let active = 0;
    let maxActive = 0;

    const task = () =>
      limiter.run(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await sleep(15);
        active--;
      });

    await Promise.all([task(), task(), task(), task(), task()]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

describe('RateLimiter', () => {
  it('allows bursts up to maxTokens via tryAcquire', () => {
    const limiter = new RateLimiter({ maxTokens: 3, refillIntervalMs: 1000 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false); // bucket exhausted
  });

  it('refills over time', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillIntervalMs: 50 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);

    await sleep(60);
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('acquire() waits for a token instead of rejecting', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillIntervalMs: 50 });
    limiter.tryAcquire(); // drain the bucket

    const start = Date.now();
    await limiter.acquire();
    expect(Date.now() - start).toBeGreaterThanOrEqual(30);
  });

  it('acquire() throws if cost exceeds maxTokens', async () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillIntervalMs: 1000 });
    await expect(limiter.acquire(10)).rejects.toThrow(RangeError);
  });

  it('constructor throws for non-positive options', () => {
    expect(() => new RateLimiter({ maxTokens: 0, refillIntervalMs: 1000 })).toThrow(RangeError);
    expect(() => new RateLimiter({ maxTokens: 5, refillIntervalMs: 0 })).toThrow(RangeError);
  });
});
