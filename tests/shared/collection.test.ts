import { describe, expect, it } from 'vitest';
import { mapToObject, objectToMap, setToArray, arrayToSet, countBy, keyBy } from '../../src/shared/collection/collection.js';

describe('collection utilities', () => {
  it('mapToObject/objectToMap round-trip', () => {
    const obj = { a: 1, b: 2 };
    expect(mapToObject(objectToMap(obj))).toEqual(obj);
  });

  it('setToArray/arrayToSet', () => {
    expect(setToArray(new Set([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(arrayToSet([1, 1, 2]).size).toBe(2);
  });

  it('countBy counts occurrences per derived key', () => {
    expect(countBy([1, 2, 2, 3], String)).toEqual({ '1': 1, '2': 2, '3': 1 });
  });

  it('keyBy indexes by key, last one wins on collision', () => {
    const result = keyBy([{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }], (x) => x.id);
    expect(result).toEqual({ 1: { id: 1, v: 'c' }, 2: { id: 2, v: 'b' } });
  });
});
