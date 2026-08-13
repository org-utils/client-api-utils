/** Conversion helpers between `Map`, `Set`, `Record`, and arrays. */

/** Converts a `Map` into a plain object. Non-string/number/symbol keys are coerced via `String()`. */
export function mapToObject<V>(map: ReadonlyMap<PropertyKey, V>): Record<PropertyKey, V> {
  const result: Record<PropertyKey, V> = {};
  for (const [key, value] of map) {
    result[key] = value;
  }
  return result;
}

/** Converts a plain object into a `Map`. */
export function objectToMap<T extends object>(obj: T): Map<keyof T, T[keyof T]> {
  return new Map(Object.entries(obj) as [keyof T, T[keyof T]][]);
}

/** Converts a `Set` into an array, preserving iteration order. */
export function setToArray<T>(set: ReadonlySet<T>): T[] {
  return Array.from(set);
}

/** Converts an array into a `Set`, de-duplicating elements. */
export function arrayToSet<T>(array: readonly T[]): Set<T> {
  return new Set(array);
}

/** Counts elements by the key returned from `iteratee`. @example countBy([1,2,2,3], String) // { '1': 1, '2': 2, '3': 1 } */
export function countBy<T, K extends PropertyKey>(array: readonly T[], iteratee: (item: T) => K): Record<K, number> {
  const result = {} as Record<K, number>;
  for (const item of array) {
    const key = iteratee(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

/**
 * Indexes an array into a `Record` keyed by `iteratee`. Unlike `groupBy`,
 * keeps only a single element per key — the LAST one encountered wins on
 * collision, since `keyBy` is meant for keys expected to be unique (e.g.
 * indexing entities by ID).
 */
export function keyBy<T, K extends PropertyKey>(array: readonly T[], iteratee: (item: T) => K): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of array) {
    result[iteratee(item)] = item;
  }
  return result;
}
