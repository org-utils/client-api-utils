/** HTTP status-code and content-type helpers. Pure logic — no HTTP client here, just classification of codes/headers you already have. */

/** `true` for 2xx status codes. */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/** `true` for 3xx status codes. */
export function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

/** `true` for 4xx status codes. */
export function isClientErrorStatus(status: number): boolean {
  return status >= 400 && status < 500;
}

/** `true` for 5xx status codes. */
export function isServerErrorStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * `true` for status codes generally safe to retry: request timeout (408),
 * rate limiting (429), and common transient server errors (500, 502,
 * 503, 504). This is a reasonable default, NOT a universal rule — retrying
 * 500 is only safe if the underlying operation is idempotent, and some
 * APIs use 429/503 with meanings that warrant a longer backoff than a
 * generic retry loop provides (check for a `Retry-After` header). Pass
 * a custom `shouldRetry` to `retry()` (async module) if you need
 * different behavior.
 */
export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(status);
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
  301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed',
  408: 'Request Timeout', 409: 'Conflict', 410: 'Gone', 422: 'Unprocessable Entity', 429: 'Too Many Requests',
  500: 'Internal Server Error', 501: 'Not Implemented', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout',
};

/** Returns the standard reason phrase for a status code (e.g. `404` → `'Not Found'`), or `undefined` for codes not in the built-in table (covers common codes, not the full IANA registry). */
export function getStatusText(status: number): string | undefined {
  return STATUS_TEXT[status];
}

export interface ParsedContentType {
  type: string;
  parameters: Record<string, string>;
}

/**
 * Parses a `Content-Type` header value into its media type and
 * parameters (e.g. `charset`, `boundary`).
 *
 * @example parseContentType('application/json; charset=utf-8')
 * // { type: 'application/json', parameters: { charset: 'utf-8' } }
 */
export function parseContentType(headerValue: string): ParsedContentType {
  const [typePart, ...paramParts] = headerValue.split(';').map((s) => s.trim());

  const parameters: Record<string, string> = {};
  for (const part of paramParts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    let value = part.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    parameters[key] = value;
  }

  return { type: (typePart ?? '').toLowerCase(), parameters };
}

/** `true` if a `Content-Type` header value indicates JSON (`application/json`, or any `+json` structured suffix like `application/vnd.api+json`). */
export function isJsonContentType(headerValue: string): boolean {
  const { type } = parseContentType(headerValue);
  return type === 'application/json' || type.endsWith('+json');
}
