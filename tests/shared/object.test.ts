import { describe, expect, it } from 'vitest';
import {
  isPlainObject, isObject, isEmptyObject, hasOwn, pick, omit, keys, values, entries,
  get, set, unset, deepGet, deepSet, deepMerge, merge, mapValues, mapKeys, invert,
} from '../../src/shared/object/object.js';

describe('object utilities', () => {
  it('isPlainObject distinguishes plain objects from arrays/instances/null', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });

  it('isObject accepts any non-null object', () => {
    expect(isObject([])).toBe(true);
    expect(isObject(null)).toBe(false);
  });

  it('isEmptyObject', () => {
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject({ a: 1 })).toBe(false);
    expect(isEmptyObject([])).toBe(false);
  });

  it('hasOwn checks own properties only', () => {
    expect(hasOwn({ a: 1 }, 'a')).toBe(true);
    expect(hasOwn({ a: 1 }, 'toString')).toBe(false);
  });

  it('pick/omit select/exclude keys without mutating', () => {
    const user = { id: '1', name: 'John', email: 'john@example.com' };
    expect(pick(user, ['id', 'name'])).toEqual({ id: '1', name: 'John' });
    expect(omit(user, ['email'])).toEqual({ id: '1', name: 'John' });
    expect(user).toEqual({ id: '1', name: 'John', email: 'john@example.com' });
  });

  it('keys/values/entries', () => {
    const obj = { a: 1, b: 2 };
    expect(keys(obj)).toEqual(['a', 'b']);
    expect(values(obj)).toEqual([1, 2]);
    expect(entries(obj)).toEqual([['a', 1], ['b', 2]]);
  });

  it('get returns fallback for missing keys or nullish objects', () => {
    expect(get({ a: 1 } as Record<string, number>, 'a')).toBe(1);
    expect(get(undefined as unknown as Record<string, number>, 'a', 99)).toBe(99);
  });

  it('set/unset return new objects without mutating', () => {
    const obj = { a: 1 };
    expect(set(obj, 'a', 2)).toEqual({ a: 2 });
    expect(obj).toEqual({ a: 1 });
    expect(unset({ a: 1, b: 2 }, 'b')).toEqual({ a: 1 });
  });

  it('deepGet/deepSet traverse dot-notation paths', () => {
    const obj = { a: { b: { c: 1 } } };
    expect(deepGet(obj, 'a.b.c')).toBe(1);
    expect(deepGet(obj, 'a.x.y', 'fallback')).toBe('fallback');

    const updated = deepSet(obj, 'a.b.d', 2);
    expect(updated).toEqual({ a: { b: { c: 1, d: 2 } } });
    expect(obj).toEqual({ a: { b: { c: 1 } } }); // original untouched
  });

  it('deepMerge merges nested plain objects but replaces arrays wholesale', () => {
    const a = { x: 1, nested: { y: 1, arr: [1, 2] } };
    const b = { nested: { z: 2, arr: [3] } };
    expect(deepMerge(a, b)).toEqual({ x: 1, nested: { y: 1, z: 2, arr: [3] } });
    expect(a).toEqual({ x: 1, nested: { y: 1, arr: [1, 2] } }); // untouched
  });

  it('merge is a shallow, non-mutating Object.assign', () => {
    const a = { x: 1, y: 1 };
    expect(merge(a, { y: 2 })).toEqual({ x: 1, y: 2 });
    expect(a).toEqual({ x: 1, y: 1 });
  });

  it('mapValues/mapKeys', () => {
    expect(mapValues({ a: 1, b: 2 }, (v) => v * 2)).toEqual({ a: 2, b: 4 });
    expect(mapKeys({ a: 1, b: 2 }, (k) => String(k).toUpperCase())).toEqual({ A: 1, B: 2 });
  });

  it('invert swaps keys and values', () => {
    expect(invert({ a: 'x', b: 'y' })).toEqual({ x: 'a', y: 'b' });
  });
});
