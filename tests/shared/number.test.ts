import { describe, expect, it } from 'vitest';
import {
  inRange, round, floor, ceil, percentage, percentageOf, randomInt, randomFloat,
  isInteger, isFiniteNumber, isNaNValue,
} from '../../src/shared/number/number.js';
import { clamp } from '../../src/shared/number/clamp.js';

describe('number utilities', () => {
  it('clamp restricts to [min, max]', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamp throws when min > max', () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });

  it('inRange is inclusive', () => {
    expect(inRange(0, 0, 10)).toBe(true);
    expect(inRange(10, 0, 10)).toBe(true);
    expect(inRange(11, 0, 10)).toBe(false);
  });

  it('round/floor/ceil respect precision', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(floor(1.999, 2)).toBe(1.99);
    expect(ceil(1.001, 2)).toBe(1.01);
  });

  it('percentage/percentageOf', () => {
    expect(percentage(30, 150)).toBe(20);
    expect(percentage(1, 0)).toBe(0); // no divide-by-zero throw
    expect(percentageOf(20, 150)).toBe(30);
  });

  it('randomInt/randomFloat stay within bounds', () => {
    for (let i = 0; i < 50; i++) {
      const n = randomInt(1, 5);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
    const f = randomFloat(0, 1);
    expect(f).toBeGreaterThanOrEqual(0);
    expect(f).toBeLessThan(1);
  });

  it('randomInt throws when min > max', () => {
    expect(() => randomInt(5, 1)).toThrow(RangeError);
  });

  it('isInteger/isFiniteNumber/isNaNValue do not coerce', () => {
    expect(isInteger(5)).toBe(true);
    expect(isInteger(5.5)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber('5')).toBe(false);
    expect(isNaNValue(NaN)).toBe(true);
    expect(isNaNValue('not a number')).toBe(false); // unlike global isNaN
  });
});
