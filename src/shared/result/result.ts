/**
 * A lightweight `Result<T, E>` type for representing "this can fail"
 * without throwing — useful at boundaries where you want callers to
 * handle failure explicitly rather than relying on try/catch. This is
 * entirely opt-in: nothing else in this package requires or produces
 * `Result` values, use it where it helps and ignore it elsewhere.
 *
 * @example
 * ```ts
 * function safeParseInt(input: string): Result<number, string> {
 *   const n = Number(input);
 *   return Number.isNaN(n) ? Err(`"${input}" is not a number`) : Ok(n);
 * }
 *
 * const result = safeParseInt(input);
 * if (result.ok) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/** Constructs a successful {@link Result}. */
export function Ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

/** Constructs a failed {@link Result}. */
export function Err<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

/** `true` if `result` is a success, narrowing its type accordingly. */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/** `true` if `result` is a failure, narrowing its type accordingly. */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/** Transforms a successful value with `fn`, passing through failures unchanged. */
export function mapResult<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

/** Transforms a failure's error with `fn`, passing through successes unchanged. */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Err(fn(result.error));
}

/** Returns `result.value` if successful, otherwise `fallback`. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/**
 * Wraps a throwing function, converting a thrown error into an `Err`
 * instead of letting it propagate. The error is passed through as-is
 * (typed `unknown`) — use `toError`/`normalizeError` from the error
 * module first if you need it as a real `Error` instance.
 */
export function tryCatch<T>(fn: () => T): Result<T, unknown> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(error);
  }
}

/** Async counterpart to {@link tryCatch}. */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(error);
  }
}
