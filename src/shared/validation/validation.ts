/**
 * Framework-independent type guards and assertions.
 *
 * Guards (`isX`) return `boolean` and narrow the type. Assertions
 * (`assertX`) throw a `TypeError` and narrow the type in the following
 * code via TypeScript's assertion-function support.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** `true` if `value` is `null` or `undefined`. */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** `true` if `value` is a `string`. */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** `true` if `value` is a `number` (including `NaN` — use `isFiniteNumber` from the number module to exclude it). */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/** `true` if `value` is a `boolean`. */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/** Type-safe wrapper around `Array.isArray`. */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/** `true` for any non-null object, including arrays and class instances. For plain-object-only, use `isPlainObject` from the object module. */
export function isObjectValue(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

/** `true` if `value` is callable. */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/** `true` if `value` is a native `Promise`, or any thenable (duck-typed). */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObjectValue(value) && isFunction((value as { then?: unknown }).then))
  );
}

/** `true` if `value` is a `Date` instance representing a valid date (i.e. not `Invalid Date`). */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** `true` if `value` is a `RegExp`. */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * Checks whether a string parses as a valid URL via the native `URL`
 * constructor. See the string module's `isURLString` for the same
 * behavior — this re-export exists so URL validation is discoverable
 * from the validation module too.
 */
export function isURL(value: unknown, protocols?: readonly string[]): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    if (protocols && !protocols.includes(url.protocol.replace(':', ''))) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Pragmatic email format check (not RFC 5322-complete). See the string
 * module's `isEmail` docs for caveats.
 */
export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** `true` if `value` is a syntactically valid UUID (any version, including nil). */
export function isUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** `true` if `value` is an integer `number`. */
export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/** `true` if `value` is a `number` greater than `0`. */
export function isPositive(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

/** `true` if `value` is a `string` with length > 0 after trimming. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Asserts `condition` is truthy, narrowing accordingly. Throws
 * `TypeError` with `message` if not.
 */
export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) throw new TypeError(message);
}

/** Asserts `value` is not `null`/`undefined`, narrowing the type. */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new TypeError(message ?? 'Expected value to be defined, got null/undefined');
  }
}

/** Asserts `value` is a `string`, narrowing the type. */
export function assertString(value: unknown, message?: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(message ?? `Expected a string, got ${typeof value}`);
  }
}

/** Asserts `value` is a finite `number`, narrowing the type. */
export function assertNumber(value: unknown, message?: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(message ?? `Expected a number, got ${typeof value}`);
  }
}
