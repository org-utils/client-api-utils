/**
 * General-purpose TypeScript utility types. Pure type-level constructs —
 * no runtime code, so importing these has zero bundle-size cost.
 */

/** `T`, or `null`. */
export type Nullable<T> = T | null;

/** `T`, `null`, or `undefined`. */
export type Maybe<T> = T | null | undefined;

/** `T`, or `undefined`. */
export type OptionalValue<T> = T | undefined;

/** Recursively makes all properties of `T` required (the inverse of {@link DeepPartial}). Arrays are left as-is, matching `DeepPartial`'s treatment. */
export type DeepRequired<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;

/** Recursively makes all properties of `T` readonly, including nested objects and array elements. */
export type DeepReadonly<T> = T extends readonly (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/** Strips `readonly` from every top-level property of `T` (shallow — use with `DeepReadonly`'s inverse pattern for nested cases). */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Flattens an intersection type (e.g. `A & B`) into a single object type
 * for more readable editor tooltips/error messages. Purely cosmetic —
 * does not change type-checking behavior.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/** Merges two object types, with `U`'s properties overriding `T`'s on key collision. */
export type Merge<T, U> = Prettify<Omit<T, keyof U> & U>;

/**
 * Restricts `T` to exactly the shape of `Shape` — rejects `T` (resolving
 * to `never`) if it has any extra properties beyond what `Shape` defines.
 * Useful for generic functions that should reject excess properties,
 * which plain structural typing normally allows.
 */
export type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

/** The union of all value types in an object type — like `keyof` but for values. */
export type ValueOf<T> = T[keyof T];

/**
 * The union of all keys across every member of a union of object types
 * (plain `keyof` on a union only returns keys common to ALL members).
 */
export type KeysOfUnion<T> = T extends T ? keyof T : never;

/** Extracts the element type of an array (or readonly array) type. */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/** Unwraps a `Promise<T>` to `T`; passes non-Promise types through unchanged. */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;
