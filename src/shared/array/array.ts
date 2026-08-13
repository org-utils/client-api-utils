/**
 * Array utilities.
 *
 * None of these mutate their input unless explicitly documented as doing
 * so (only `move`, `removeAt`, and `insertAt` have non-mutating and
 * mutating variants noted below — all default to non-mutating, returning
 * a new array).
 */

/**
 * Splits an array into chunks of a fixed size. The final chunk may be
 * smaller than `size` if the array doesn't divide evenly.
 *
 * @throws {RangeError} If `size` is not a positive integer.
 * @example chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk: size must be a positive integer, got ${size}`);
  }

  const result: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

/**
 * Removes all falsy values (`false`, `0`, `''`, `null`, `undefined`, `NaN`)
 * from an array, narrowing the type to exclude `null | undefined`.
 *
 * @example compact([0, 1, false, 2, '', 3, null, undefined]) // [1, 2, 3]
 */
export function compact<T>(array: readonly (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

/**
 * Returns the array with duplicate values removed, preserving first-seen
 * order. Uses `SameValueZero` equality (like `Set`).
 *
 * @example unique([1, 2, 2, 3, 1]) // [1, 2, 3]
 */
export function unique<T>(array: readonly T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Like {@link unique}, but de-duplicates based on the value returned by
 * `iteratee` rather than the element itself. The first element for each
 * key is kept.
 *
 * @example uniqueBy([{id: 1}, {id: 2}, {id: 1}], (x) => x.id) // [{id: 1}, {id: 2}]
 */
export function uniqueBy<T, K>(array: readonly T[], iteratee: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of array) {
    const key = iteratee(item);

    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Groups array elements into a `Record` keyed by the result of `iteratee`.
 *
 * @example groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? 'even' : 'odd'))
 * // { odd: [1, 3], even: [2, 4] }
 */
export function groupBy<T, K extends PropertyKey>(
  array: readonly T[],
  iteratee: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const item of array) {
    const key = iteratee(item);
    (result[key] ??= []).push(item);
  }

  return result;
}

/**
 * Splits an array into two groups: elements for which `predicate` returns
 * `true`, and everything else.
 *
 * @returns A `[matching, nonMatching]` tuple.
 * @example partition([1, 2, 3, 4], (n) => n % 2 === 0) // [[2, 4], [1, 3]]
 */
export function partition<T>(array: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (const item of array) {
    (predicate(item) ? matching : nonMatching).push(item);
  }

  return [matching, nonMatching];
}

/**
 * Returns elements in `array` that are not present in any of `others`.
 * Uses `SameValueZero` equality.
 *
 * @example difference([1, 2, 3], [2, 3]) // [1]
 */
export function difference<T>(array: readonly T[], ...others: (readonly T[])[]): T[] {
  const exclude = new Set(others.flat());
  return array.filter((item) => !exclude.has(item));
}

/**
 * Returns elements present in `array` AND every array in `others`.
 *
 * @example intersection([1, 2, 3], [2, 3, 4]) // [2, 3]
 */
export function intersection<T>(array: readonly T[], ...others: (readonly T[])[]): T[] {
  if (others.length === 0) return unique(array);

  const otherSets = others.map((o) => new Set(o));
  return unique(array).filter((item) => otherSets.every((set) => set.has(item)));
}

/**
 * Returns the unique union of `array` and all `others`, preserving
 * first-seen order.
 *
 * @example union([1, 2], [2, 3], [3, 4]) // [1, 2, 3, 4]
 */
export function union<T>(...arrays: (readonly T[])[]): T[] {
  return unique(arrays.flat());
}

/**
 * Flattens an array by one level.
 *
 * @example flatten([1, [2, 3], [4]]) // [1, 2, 3, 4]
 */
export function flatten<T>(array: readonly (T | readonly T[])[]): T[] {
  return array.flat() as T[];
}

/**
 * Recursively flattens a nested array of arbitrary depth.
 *
 * @example flattenDeep([1, [2, [3, [4]]]]) // [1, 2, 3, 4]
 */
export function flattenDeep<T>(array: readonly unknown[]): T[] {
  return array.flat(Infinity) as T[];
}

/** Returns the first element, or `undefined` if the array is empty. */
export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

/** Returns the last element, or `undefined` if the array is empty. */
export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Returns the first `count` elements. `count < 0` and non-integers are
 * clamped to `0`.
 */
export function take<T>(array: readonly T[], count: number): T[] {
  return array.slice(0, Math.max(0, Math.trunc(count)));
}

/** Returns the last `count` elements. */
export function takeRight<T>(array: readonly T[], count: number): T[] {
  const n = Math.max(0, Math.trunc(count));
  return n === 0 ? [] : array.slice(-n);
}

/** Returns the array with the first `count` elements removed. */
export function drop<T>(array: readonly T[], count: number): T[] {
  return array.slice(Math.max(0, Math.trunc(count)));
}

/** Returns the array with the last `count` elements removed. */
export function dropRight<T>(array: readonly T[], count: number): T[] {
  const n = Math.max(0, Math.trunc(count));
  return n === 0 ? array.slice() : array.slice(0, -n);
}

/**
 * Returns a new array with elements in random order (Fisher-Yates).
 *
 * Not suitable for security-sensitive shuffling (e.g. cryptographic
 * card shuffling) — uses `Math.random()`. For that, generate indices
 * with a CSPRNG instead.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = array.slice();

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }

  return result;
}

/**
 * Returns one random element from the array, or `undefined` if empty.
 * Uses `Math.random()` — not suitable for security-sensitive selection.
 */
export function sample<T>(array: readonly T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates an array of numbers from `start` (inclusive) to `end`
 * (exclusive), stepping by `step`.
 *
 * @throws {RangeError} If `step` is `0`.
 * @example range(0, 5) // [0, 1, 2, 3, 4]
 * @example range(0, 10, 2) // [0, 2, 4, 6, 8]
 * @example range(5, 0, -1) // [5, 4, 3, 2, 1]
 */
export function range(start: number, end: number, step = 1): number[] {
  if (step === 0) {
    throw new RangeError('range: step must not be 0');
  }

  const result: number[] = [];

  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i);
  } else {
    for (let i = start; i > end; i += step) result.push(i);
  }

  return result;
}

/**
 * Zips multiple arrays into an array of tuples, pairing elements by index.
 * The result length equals the longest input array; missing values become
 * `undefined`.
 *
 * @example zip([1, 2], ['a', 'b']) // [[1, 'a'], [2, 'b']]
 */
export function zip<T extends readonly unknown[][]>(
  ...arrays: T
): { [K in keyof T]: T[K] extends readonly (infer U)[] ? U : never }[] {
  const length = Math.max(0, ...arrays.map((a) => a.length));
  const result: unknown[] = [];

  for (let i = 0; i < length; i++) {
    result.push(arrays.map((a) => a[i]));
  }

  return result as never;
}

/**
 * Like {@link zip}, but applies `combiner` to each tuple instead of
 * returning raw tuples.
 *
 * @example zipWith([1, 2], [10, 20], (a, b) => a + b) // [11, 22]
 */
export function zipWith<A, B, R>(
  arrayA: readonly A[],
  arrayB: readonly B[],
  combiner: (a: A, b: B) => R,
): R[] {
  const length = Math.max(arrayA.length, arrayB.length);
  const result: R[] = [];

  for (let i = 0; i < length; i++) {
    result.push(combiner(arrayA[i] as A, arrayB[i] as B));
  }

  return result;
}

/**
 * Returns a new array with the element at `from` moved to index `to`.
 * Out-of-range indices are clamped. Does not mutate the input.
 *
 * @example move(['a', 'b', 'c'], 0, 2) // ['b', 'c', 'a']
 */
export function move<T>(array: readonly T[], from: number, to: number): T[] {
  const result = array.slice();
  const len = result.length;
  if (len === 0) return result;

  const fromIdx = Math.min(Math.max(from, 0), len - 1);
  const toIdx = Math.min(Math.max(to, 0), len - 1);

  const [item] = result.splice(fromIdx, 1);
  result.splice(toIdx, 0, item as T);

  return result;
}

/**
 * Returns a new array with the element at `index` removed. Does not
 * mutate the input. Out-of-range indices return a shallow copy unchanged.
 */
export function removeAt<T>(array: readonly T[], index: number): T[] {
  if (index < 0 || index >= array.length) return array.slice();
  const result = array.slice();
  result.splice(index, 1);
  return result;
}

/**
 * Returns a new array with `item` inserted at `index`. Does not mutate
 * the input. `index` is clamped into `[0, array.length]`.
 */
export function insertAt<T>(array: readonly T[], index: number, item: T): T[] {
  const result = array.slice();
  const idx = Math.min(Math.max(index, 0), result.length);
  result.splice(idx, 0, item);
  return result;
}
