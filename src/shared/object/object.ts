/**
 * Object utilities. None of these mutate their input.
 */

/** Returns `true` for plain objects (`{}` or `Object.create(null)`), `false` for arrays, class instances, `null`, etc. */
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Returns `true` for any non-null object, including arrays, dates, class instances, etc. */
export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Returns `true` if the value is a plain object with no own enumerable keys. */
export function isEmptyObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

/** Type-safe wrapper around `Object.prototype.hasOwnProperty`. */
export function hasOwn<T extends object>(obj: T, key: PropertyKey): key is keyof T & PropertyKey {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Creates a new object with only the specified `keys` from `obj`. Missing keys are silently skipped. */
export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    // NOTE: intentionally not using the exported hasOwn() type-guard here.
    // key is already statically known to extend keyof T, so re-narrowing
    // it through hasOwn's generic predicate confuses TS across the
    // distributive union (see git history for the TS2322 error this
    // produced). A plain boolean check is both correct and simpler here.
    if (Object.prototype.hasOwnProperty.call(obj, key)) result[key] = obj[key];
  }
  return result;
}

/** Creates a new object with the specified `keys` excluded from `obj`. */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys);
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!excluded.has(key)) (result as Record<PropertyKey, unknown>)[key as PropertyKey] = obj[key];
  }
  return result;
}

/** Type-safe wrapper around `Object.keys`. */
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/** Type-safe wrapper around `Object.values`. */
export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

/** Type-safe wrapper around `Object.entries`. */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/** Reads a single top-level property, returning `fallback` if `obj` is nullish or the key is absent. */
export function get<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback?: T[K],
): T[K] | undefined {
  if (obj == null || !Object.prototype.hasOwnProperty.call(obj, key)) return fallback;
  return obj[key];
}

/** Returns a shallow copy of `obj` with `key` set to `value`. */
export function set<T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}

/** Returns a shallow copy of `obj` with `key` removed. */
export function unset<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  return omit(obj, [key]);
}

/**
 * Reads a nested value via a dot-notation path (e.g. `'a.b.c'`), returning
 * `fallback` if any segment along the way is missing or the input isn't
 * an object/array. Does not evaluate bracket-array syntax like `'a[0].b'`
 * — use `'a.0.b'` for array indices.
 */
export function deepGet(obj: unknown, path: string, fallback?: unknown): unknown {
  if (path === '') return fallback;

  const segments = path.split('.');
  let current: unknown = obj;

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return fallback;
    current = (current as Record<string, unknown>)[segment];
  }

  return current === undefined ? fallback : current;
}

/**
 * Returns a deep-cloned copy of `obj` with a nested value set via a
 * dot-notation path, creating intermediate plain objects as needed.
 * Does not mutate the input.
 */
export function deepSet<T extends object>(obj: T, path: string, value: unknown): T {
  if (path === '') {
    throw new Error('deepSet: path must not be empty');
  }

  const segments = path.split('.');
  const clone: Record<string, unknown> = structuredCloneShallowSafe(obj);
  let current: Record<string, unknown> = clone;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i] as string;
    const existing = current[segment];
    const next: Record<string, unknown> = isPlainObject(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
    current[segment] = next;
    current = next;
  }

  current[segments[segments.length - 1] as string] = value;
  return clone as T;
}

/** Returns a shallow copy of `obj` with the property at `path` removed (top-level key only for now). */
export function unsetPath<T extends object>(obj: T, path: string): T {
  const segments = path.split('.');
  if (segments.length === 1) {
    const clone = { ...(obj as Record<string, unknown>) };
    delete clone[segments[0] as string];
    return clone as T;
  }
  throw new Error('unsetPath: nested paths are not yet supported, only top-level keys');
}

import type { DeepPartial } from '../types/deep-partial.js';

/**
 * Recursively merges `sources` into a new object. Plain objects are merged
 * key-by-key; arrays and non-plain values are replaced wholesale (not
 * concatenated). Does not mutate any input.
 *
 * Sources are typed as `DeepPartial<T>` rather than `Partial<T>` — unlike
 * a shallow merge, a deep merge legitimately only needs to supply a
 * subset of *nested* properties too (e.g. `{ nested: { z: 1 } }` against
 * a target with `nested: { y: 1 }`), and `Partial<T>` cannot express that.
 */
export function deepMerge<T extends object>(target: T, ...sources: DeepPartial<T>[]): T {
  let result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const source of sources) {
    if (!isPlainObject(source)) continue;

    for (const key of Object.keys(source)) {
      const sourceValue = (source as Record<string, unknown>)[key];
      const targetValue = result[key];

      result[key] =
        isPlainObject(sourceValue) && isPlainObject(targetValue)
          ? deepMerge(targetValue as object, sourceValue as object)
          : sourceValue;
    }
  }

  return result as T;
}

/** Shallow merge of `sources` into a new object (like `Object.assign`, but never mutates `target`). */
export function merge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign({}, target, ...sources);
}

/** Returns a new object with the same keys, transforming each value with `fn`. */
export function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => R,
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;
  for (const key of keys(obj)) {
    result[key] = fn(obj[key], key);
  }
  return result;
}

/** Returns a new object with the same values, transforming each key with `fn`. Later keys overwrite earlier ones on collision. */
export function mapKeys<T extends object>(
  obj: T,
  fn: (key: keyof T, value: T[keyof T]) => PropertyKey,
): Record<PropertyKey, T[keyof T]> {
  const result: Record<PropertyKey, T[keyof T]> = {};
  for (const key of keys(obj)) {
    result[fn(key, obj[key])] = obj[key];
  }
  return result;
}

/** Swaps keys and values. If multiple keys share a value, the last one (in iteration order) wins. */
export function invert<T extends Record<PropertyKey, PropertyKey>>(
  obj: T,
): Record<T[keyof T], keyof T> {
  const result = {} as Record<T[keyof T], keyof T>;
  for (const key of keys(obj)) {
    result[obj[key]] = key;
  }
  return result;
}

/** Internal helper: shallow-copies an object without relying on `structuredClone` for non-cloneable values. */
function structuredCloneShallowSafe<T extends object>(obj: T): Record<string, unknown> {
  return { ...(obj as Record<string, unknown>) };
}
