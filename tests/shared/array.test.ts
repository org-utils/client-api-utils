import { describe, expect, it } from 'vitest';
import {
  chunk, compact, unique, uniqueBy, groupBy, partition, difference, intersection,
  union, flatten, flattenDeep, first, last, take, takeRight, drop, dropRight,
  range, zip, zipWith, move, removeAt, insertAt,
} from '../../src/shared/array/array.js';

describe('array utilities', () => {
  it('chunk splits into fixed-size groups, last group may be smaller', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it('chunk throws on non-positive-integer size', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
    expect(() => chunk([1], -1)).toThrow(RangeError);
    expect(() => chunk([1], 1.5)).toThrow(RangeError);
  });

  it('compact removes falsy values', () => {
    expect(compact([0, 1, false, 2, '', 3, null, undefined, NaN])).toEqual([1, 2, 3]);
  });

  it('unique removes duplicates, preserving order', () => {
    expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    expect(unique([])).toEqual([]);
  });

  it('uniqueBy dedupes by derived key, keeping first occurrence', () => {
    const input = [{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }];
    expect(uniqueBy(input, (x) => x.id)).toEqual([{ id: 1, v: 'a' }, { id: 2, v: 'b' }]);
  });

  it('groupBy groups by key', () => {
    expect(groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? 'even' : 'odd'))).toEqual({
      odd: [1, 3],
      even: [2, 4],
    });
  });

  it('partition splits matching/non-matching', () => {
    expect(partition([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([[2, 4], [1, 3]]);
  });

  it('difference/intersection/union behave per set semantics', () => {
    expect(difference([1, 2, 3], [2, 3])).toEqual([1]);
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    expect(union([1, 2], [2, 3], [3, 4])).toEqual([1, 2, 3, 4]);
  });

  it('flatten/flattenDeep', () => {
    expect(flatten([1, [2, 3], [4]])).toEqual([1, 2, 3, 4]);
    expect(flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
  });

  it('first/last handle empty arrays', () => {
    expect(first([1, 2])).toBe(1);
    expect(first([])).toBeUndefined();
    expect(last([1, 2])).toBe(2);
    expect(last([])).toBeUndefined();
  });

  it('take/takeRight/drop/dropRight', () => {
    expect(take([1, 2, 3], 2)).toEqual([1, 2]);
    expect(takeRight([1, 2, 3], 2)).toEqual([2, 3]);
    expect(drop([1, 2, 3], 1)).toEqual([2, 3]);
    expect(dropRight([1, 2, 3], 1)).toEqual([1, 2]);
    expect(take([1, 2, 3], -5)).toEqual([]);
  });

  it('range generates ascending, descending, and stepped sequences', () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    expect(range(5, 0, -1)).toEqual([5, 4, 3, 2, 1]);
  });

  it('range throws on step of 0', () => {
    expect(() => range(0, 5, 0)).toThrow(RangeError);
  });

  it('zip pairs by index, padding with undefined', () => {
    expect(zip([1, 2], ['a', 'b'])).toEqual([[1, 'a'], [2, 'b']]);
    expect(zip([1, 2, 3], ['a'])).toEqual([[1, 'a'], [2, undefined], [3, undefined]]);
  });

  it('zipWith combines pairs', () => {
    expect(zipWith([1, 2], [10, 20], (a, b) => a + b)).toEqual([11, 22]);
  });

  it('move/removeAt/insertAt do not mutate the input', () => {
    const input = ['a', 'b', 'c'];
    expect(move(input, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(removeAt(input, 1)).toEqual(['a', 'c']);
    expect(insertAt(input, 1, 'x')).toEqual(['a', 'x', 'b', 'c']);
    expect(input).toEqual(['a', 'b', 'c']); // unchanged
  });
});
