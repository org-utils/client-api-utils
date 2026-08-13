import { describe, expect, it, vi } from 'vitest';
import {
  noop, identity, once, memoize, debounce, throttle, compose, pipe, curry, partial, negate,
} from '../../src/shared/function/function.js';

describe('function utilities', () => {
  it('noop/identity', () => {
    expect(noop()).toBeUndefined();
    expect(identity(42)).toBe(42);
  });

  it('once only invokes the wrapped function a single time', () => {
    const spy = vi.fn(() => Math.random());
    const wrapped = once(spy);
    const first = wrapped();
    const second = wrapped();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('memoize caches by JSON-stringified args', () => {
    const spy = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(spy);
    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(memoized(2, 3)).toBe(5);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('debounce delays and coalesces calls, supports cancel', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    debounced();
    debounced();
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('throttle invokes leading edge immediately, coalesces trailing calls', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const throttled = throttle(spy, 100);

    throttled('a');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith('a');

    throttled('b');
    throttled('c');
    expect(spy).toHaveBeenCalledTimes(1); // still within window

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith('c');

    vi.useRealTimers();
  });

  it('compose applies right-to-left, pipe applies left-to-right', () => {
    const double = (n: number) => n * 2;
    const inc = (n: number) => n + 1;
    expect(compose(double, inc)(5)).toBe(12); // double(inc(5)) = double(6) = 12
    expect(pipe(double, inc)(5)).toBe(11); // inc(double(5)) = inc(10) = 11
  });

  it('curry/partial/negate', () => {
    const add = (a: number, b: number) => a + b;
    expect(curry(add)(2)(3)).toBe(5);
    expect(partial(add, 2)(3)).toBe(5);

    const isEven = (n: number) => n % 2 === 0;
    expect(negate(isEven)(3)).toBe(true);
    expect(negate(isEven)(4)).toBe(false);
  });
});
