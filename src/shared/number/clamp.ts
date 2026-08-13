/**
 * Restricts a number to an inclusive range.
 *
 * @param value - The input value.
 * @param min - Minimum allowed value (inclusive).
 * @param max - Maximum allowed value (inclusive).
 * @returns `value` clamped so that `min <= result <= max`.
 *
 * @example
 * ```ts
 * clamp(15, 0, 10); // 10
 * clamp(-5, 0, 10); // 0
 * clamp(5, 0, 10);  // 5
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: min (${min}) must be <= max (${max})`);
  }

  return Math.min(Math.max(value, min), max);
}
