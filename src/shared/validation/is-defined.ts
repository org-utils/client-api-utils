/**
 * Type guard checking that a value is neither `null` nor `undefined`.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is not nullish; narrows the type accordingly.
 *
 * @example
 * ```ts
 * const items: (string | undefined)[] = ['a', undefined, 'b'];
 * const defined = items.filter(isDefined); // string[]
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
