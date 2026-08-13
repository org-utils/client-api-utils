/**
 * A minimal, framework-independent "headers-like" shape. Accepts either:
 *  - Node-style plain objects (`http.IncomingMessage.headers`,
 *    Express/Fastify's `req.headers`): lowercase keys, values are
 *    `string | string[] | undefined` (arrays occur for headers sent
 *    multiple times, e.g. multiple `Set-Cookie` — rare on requests).
 *  - The Fetch API `Headers` class (used by Hono, and anything built on
 *    the Fetch standard): accessed via `.get(name)`.
 */
export type HeadersLike = Record<string, string | string[] | undefined> | { get(name: string): string | null };

/** Reads a single header value, case-insensitively, from either header shape. Returns the first value if the header was sent multiple times. */
export function getHeader(headers: HeadersLike, name: string): string | undefined {
  if ('get' in headers && typeof headers.get === 'function') {
    return headers.get(name) ?? undefined;
  }

  const value = (headers as Record<string, string | string[] | undefined>)[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

/** A generic request-like shape accepted by the functions in this module — deliberately NOT tied to Express/Fastify/etc.'s specific `Request` types. */
export interface RequestLike {
  headers: HeadersLike;
  socket?: { remoteAddress?: string; encrypted?: boolean };
  ip?: string;
  url?: string;
  method?: string;
  /** Set by some frameworks (e.g. Express's `req.protocol`) — used as a hint by `getRequestProtocol` when present. */
  protocol?: string;
  /** Set by some frameworks (e.g. Express's `req.secure`) — used as a hint by `getRequestProtocol` when present. */
  secure?: boolean;
}

/** Reads the `User-Agent` header, or `undefined` if absent. */
export function getUserAgent(request: RequestLike): string | undefined {
  return getHeader(request.headers, 'user-agent');
}

/**
 * Reads a request ID from common header conventions, checked in order:
 * `X-Request-Id`, `X-Correlation-Id`, `Request-Id`. Returns `undefined`
 * if none are present — this does NOT generate one; pair with
 * `generateUUID`/`generateRandomId` (shared module) if you need to
 * assign one when absent.
 */
export function getRequestId(request: RequestLike): string | undefined {
  return (
    getHeader(request.headers, 'x-request-id') ??
    getHeader(request.headers, 'x-correlation-id') ??
    getHeader(request.headers, 'request-id')
  );
}
