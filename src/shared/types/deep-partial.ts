/**
 * Recursively makes all properties of `T` optional. Arrays are preserved
 * as-is (not turned into partial-element arrays) since callers generally
 * want to replace an array wholesale, not merge it element-by-element —
 * this matches how `deepMerge` treats arrays.
 */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
