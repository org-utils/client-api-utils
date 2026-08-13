import { getClientIp, getForwardedFor } from './ip.js';
import { getHeader, getUserAgent, getRequestId, type RequestLike } from './headers.js';

export interface RequestContextOptions {
  /** Same meaning as `getClientIp`'s `trustProxy`: whether to trust `X-Forwarded-*` headers at all. Default: `false`. See `getClientIp`'s docs for the security rationale. */
  trustProxy?: boolean;
}

/** Reads the `Host` header, preferring `X-Forwarded-Host` when `trustProxy` is enabled. */
export function getRequestHost(request: RequestLike, options: RequestContextOptions = {}): string | undefined {
  const { trustProxy = false } = options;

  if (trustProxy) {
    const forwardedHost = getHeader(request.headers, 'x-forwarded-host');
    if (forwardedHost) return forwardedHost;
  }

  return getHeader(request.headers, 'host');
}

/**
 * Determines the request protocol (`'http'` or `'https'`).
 *
 * Checks, in order: `X-Forwarded-Proto` (only if `trustProxy: true`),
 * then `request.protocol`/`request.secure` (set directly by some
 * frameworks, e.g. Express), then whether the underlying socket is TLS
 * (`socket.encrypted`), finally defaulting to `'http'`.
 */
export function getRequestProtocol(request: RequestLike, options: RequestContextOptions = {}): string {
  const { trustProxy = false } = options;

  if (trustProxy) {
    const forwardedProto = getHeader(request.headers, 'x-forwarded-proto');
    if (forwardedProto) return forwardedProto.split(',')[0]?.trim() ?? forwardedProto;
  }

  if (request.protocol) return request.protocol;
  if (request.secure === true) return 'https';
  if (request.socket?.encrypted) return 'https';

  return 'http';
}

/** Constructs the request's origin (`protocol://host`), or `undefined` if the host can't be determined. */
export function getRequestOrigin(request: RequestLike, options: RequestContextOptions = {}): string | undefined {
  const host = getRequestHost(request, options);
  if (!host) return undefined;
  return `${getRequestProtocol(request, options)}://${host}`;
}

export interface RequestMetadata {
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  forwardedFor?: string[] | undefined;
  protocol?: string | undefined;
  host?: string | undefined;
  origin?: string | undefined;
  referer?: string | undefined;
}

/**
 * Aggregates the common request-context fields (request ID, client IP,
 * user agent, protocol, host, origin, referer) into a single object,
 * built entirely from the generic `RequestLike` shape — no
 * framework-specific request type required.
 */
export function getRequestMetadata(request: RequestLike, options: RequestContextOptions = {}): RequestMetadata {
  return {
    requestId: getRequestId(request),
    ipAddress: getClientIp(request, options),
    userAgent: getUserAgent(request),
    forwardedFor: getForwardedFor(request),
    protocol: getRequestProtocol(request, options),
    host: getRequestHost(request, options),
    origin: getRequestOrigin(request, options),
    referer: getHeader(request.headers, 'referer'),
  };
}
