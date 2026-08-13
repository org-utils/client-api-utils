/**
 * Compile-time-only checks for the pure type-level utilities in
 * src/shared/types. This file has no runtime assertions — it exists so
 * `tsc` fails the build if any of these types stop behaving as documented.
 * Included in tsconfig's "tests" glob so it's typechecked in CI without
 * needing a dedicated type-testing library.
 */
import type {
  Nullable, Maybe, OptionalValue, DeepRequired, DeepReadonly, Mutable,
  Prettify, Merge, Exact, ValueOf, KeysOfUnion, ArrayElement, PromiseValue,
} from '../../src/shared/types/utility-types.js';
import type { DeepPartial } from '../../src/shared/types/deep-partial.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// Nullable / Maybe / OptionalValue
type _1 = Expect<Equal<Nullable<string>, string | null>>;
type _2 = Expect<Equal<Maybe<string>, string | null | undefined>>;
type _3 = Expect<Equal<OptionalValue<string>, string | undefined>>;

// DeepPartial / DeepRequired
interface Nested {
  a: number;
  b: { c: number; d: { e: string } };
  arr: number[];
}
type _4 = Expect<Equal<DeepPartial<Nested>['b'], { c?: number; d?: { e?: string } } | undefined>>;
const partial: DeepPartial<Nested> = { b: { d: { e: 'x' } } }; // must compile: nested partial
void partial;

type _5 = Expect<Equal<DeepRequired<{ a?: { b?: number } }>['a']['b'], number>>;

// DeepReadonly
type _6 = DeepReadonly<Nested>;
const dr: _6 = { a: 1, b: { c: 1, d: { e: 'x' } }, arr: [1, 2] };
// @ts-expect-error - DeepReadonly must reject top-level mutation
dr.a = 2;
// @ts-expect-error - DeepReadonly must reject nested mutation
dr.b.c = 2;

// Mutable (shallow)
type ReadonlyPoint = { readonly x: number; readonly y: number };
type MutablePoint = Mutable<ReadonlyPoint>;
const mp: MutablePoint = { x: 1, y: 2 };
mp.x = 5; // must compile: Mutable removes readonly

// Prettify (structural equivalence, not literal identity)
type _7 = Expect<Equal<Prettify<{ a: number } & { b: string }>, { a: number; b: string }>>;

// Merge: U overrides T
type _8 = Expect<Equal<Merge<{ a: number; b: string }, { b: number }>, { a: number; b: number }>>;

// ValueOf
type _9 = Expect<Equal<ValueOf<{ a: number; b: string }>, number | string>>;

// KeysOfUnion: union of keys across union members (plain keyof would only give 'type')
type Shape = { type: 'circle'; radius: number } | { type: 'square'; side: number };
type _10 = Expect<Equal<KeysOfUnion<Shape>, 'type' | 'radius' | 'side'>>;

// ArrayElement
type _11 = Expect<Equal<ArrayElement<string[]>, string>>;
type _12 = Expect<Equal<ArrayElement<readonly number[]>, number>>;

// PromiseValue
type _13 = Expect<Equal<PromiseValue<Promise<number>>, number>>;
type _14 = Expect<Equal<PromiseValue<string>, string>>; // passthrough for non-Promise

// Exact: rejects excess properties
type ExactShape = { a: number; b: string };
type _15 = Expect<Equal<Exact<{ a: number; b: string }, ExactShape>, { a: number; b: string }>>;
type _16 = Expect<Equal<Exact<{ a: number; b: string; c: boolean }, ExactShape>, never>>;
