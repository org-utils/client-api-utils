/** URL utilities, built on the native `URL`/`URLSearchParams` APIs — no manual query-string parsing. */

export { isURLString as isURL } from '../string/string.js';

/**
 * Joins URL/path segments with exactly one `/` between them, regardless
 * of whether individual segments have leading/trailing slashes.
 *
 * @example joinURL('https://api.example.com/', '/v1/', '/users') // 'https://api.example.com/v1/users'
 */
export function joinURL(...segments: string[]): string {
  return segments
    .filter((s) => s.length > 0)
    .map((s, i) => {
      let seg = s;
      if (i > 0) seg = seg.replace(/^\/+/, '');
      if (i < segments.length - 1) seg = seg.replace(/\/+$/, '');
      return seg;
    })
    .join('/');
}

/** Parses and re-serializes a URL via the native `URL` class, normalizing things like default ports and path resolution (`.`/`..`). Throws if `url` is invalid. */
export function normalizeURL(url: string, base?: string): string {
  return new URL(url, base).toString();
}

/** Returns the origin (`scheme://host:port`) of a URL, or `undefined` if invalid. */
export function getURLOrigin(url: string, base?: string): string | undefined {
  try {
    return new URL(url, base).origin;
  } catch {
    return undefined;
  }
}

/** Returns the pathname of a URL, or `undefined` if invalid. */
export function getURLPath(url: string, base?: string): string | undefined {
  try {
    return new URL(url, base).pathname;
  } catch {
    return undefined;
  }
}

/** Returns all query parameters as a plain object. Repeated keys keep only the last value — use `parseQuery` for multi-value support. */
export function getQueryParams(url: string, base?: string): Record<string, string> {
  const params = new URL(url, base).searchParams;
  return Object.fromEntries(params.entries());
}

/** Returns all query parameters as a `Record<string, string[]>`, preserving repeated keys. */
export function parseQuery(queryString: string): Record<string, string[]> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string[]> = {};

  for (const [key, value] of params.entries()) {
    (result[key] ??= []).push(value);
  }

  return result;
}

/** Serializes a `Record<string, string | number | boolean | (string|number|boolean)[]>` into a query string (no leading `?`). */
export function stringifyQuery(
  params: Record<string, string | number | boolean | (string | number | boolean)[]>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, String(v));
    } else {
      search.append(key, String(value));
    }
  }

  return search.toString();
}

/** Returns a new URL string with the given query parameters added/overwritten. */
export function addQueryParams(url: string, params: Record<string, string | number | boolean>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, String(value));
  }
  return parsed.toString();
}

/** Returns a new URL string with the given query parameter keys removed. */
export function removeQueryParams(url: string, keys: readonly string[]): string {
  const parsed = new URL(url);
  for (const key of keys) parsed.searchParams.delete(key);
  return parsed.toString();
}

/** Returns a single query parameter's value, or `undefined` if absent or the URL is invalid. */
export function getQueryParam(url: string, key: string): string | undefined {
  try {
    return new URL(url).searchParams.get(key) ?? undefined;
  } catch {
    return undefined;
  }
}
