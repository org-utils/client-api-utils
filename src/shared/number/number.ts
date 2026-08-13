/**
 * Number utilities.
 *
 * JavaScript numbers are IEEE-754 doubles: arithmetic on non-integer
 * values (e.g. `0.1 + 0.2`) can produce results with tiny floating-point
 * error. `round`/`floor`/`ceil` below mitigate the common "round to N
 * decimal places" case, but no rounding scheme eliminates IEEE-754 error
 * for all inputs — for exact decimal arithmetic (money, etc.) use integer
 * cents/minor-units or a decimal library instead of floats.
 */

/** Checks whether `value` falls within `[min, max]` inclusive. */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/** Rounds to `precision` decimal places (default 0). Mitigates, but does not eliminate, float error — see module docs. */
export function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Rounds down to `precision` decimal places. */
export function floor(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.floor(value * factor) / factor;
}

/** Rounds up to `precision` decimal places. */
export function ceil(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.ceil(value * factor) / factor;
}

/** Expresses `value` as a percentage of `total` (0-100 scale, not 0-1). Returns `0` if `total` is `0`. */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/** Computes `percent`% of `value`. @example percentageOf(20, 150) // 30 */
export function percentageOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

/** Returns a random integer in `[min, max]` inclusive, using `Math.random()` — not cryptographically secure. */
export function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (lo > hi) throw new RangeError(`randomInt: min (${min}) must be <= max (${max})`);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/** Returns a random float in `[min, max)`, using `Math.random()` — not cryptographically secure. */
export function randomFloat(min: number, max: number): number {
  if (min > max) throw new RangeError(`randomFloat: min (${min}) must be <= max (${max})`);
  return Math.random() * (max - min) + min;
}

/** Formats a number using `Intl.NumberFormat` with the given locale/options (thin, typed wrapper). */
export function formatNumber(value: number, locale?: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** Formats a number as currency using `Intl.NumberFormat`. */
export function formatCurrency(value: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/** Type-safe wrapper around `Number.isInteger`. */
export function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

/** Type-safe wrapper around `Number.isFinite` (does not coerce strings, unlike the global `isFinite`). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Returns `true` if `value` is the number `NaN`. Unlike the global `isNaN`, does not coerce non-numbers. */
export function isNaNValue(value: unknown): boolean {
  return typeof value === 'number' && Number.isNaN(value);
}
