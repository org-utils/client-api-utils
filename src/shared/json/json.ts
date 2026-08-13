/** JSON utilities with explicit, documented error-handling behavior. */

export type JSONParseResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Parses JSON, returning `fallback` (default `undefined`) if parsing
 * fails instead of throwing. Errors are swallowed by design — use
 * `parseJSON` if you want parse failures to throw.
 */
export function safeJSONParse<T = unknown>(input: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

/**
 * Stringifies a value, returning `fallback` (default `undefined`) if
 * stringification fails (e.g. circular references, `BigInt`) instead of
 * throwing.
 */
export function safeJSONStringify(value: unknown, fallback?: string, space?: string | number): string | undefined {
  try {
    return JSON.stringify(value, undefined, space);
  } catch {
    return fallback;
  }
}

/** Parses JSON, throwing the original `SyntaxError` on failure. Thin, explicitly-named wrapper around `JSON.parse` for API symmetry with `safeJSONParse`. */
export function parseJSON<T = unknown>(input: string): T {
  return JSON.parse(input) as T;
}

/** Stringifies a value, throwing on failure. Thin wrapper around `JSON.stringify` for API symmetry with `safeJSONStringify`. */
export function stringifyJSON(value: unknown, space?: string | number): string {
  return JSON.stringify(value, undefined, space);
}

/**
 * Attempts to parse JSON, returning a discriminated `JSONParseResult`
 * rather than throwing or silently swallowing the error — use this when
 * you need to distinguish "invalid JSON" from "valid JSON that happens to
 * be `undefined`-like" and want to inspect the error.
 */
export function tryParseJSON<T = unknown>(input: string): JSONParseResult<T> {
  try {
    return { ok: true, value: JSON.parse(input) as T };
  } catch (error) {
    return { ok: false, error };
  }
}
