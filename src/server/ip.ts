import { getHeader, type RequestLike } from './headers.js';

export interface GetClientIpOptions {
  /**
   * Whether to trust `X-Forwarded-For`/`X-Real-IP` at all. Defaults to
   * `false` — with the default, `getClientIp` ALWAYS returns the direct
   * TCP peer address (`request.socket.remoteAddress`) and ignores any
   * forwarded headers entirely, since those headers are trivially
   * spoofable by anyone who can reach your server directly (they're
   * request headers, not something a proxy layer inherently protects).
   *
   * Only set this to `true` if your application sits behind a proxy/load
   * balancer that YOU control and that overwrites/strips these headers
   * from client-supplied values before forwarding — otherwise a client
   * can simply set `X-Forwarded-For: 1.2.3.4` themselves and this
   * function will report that fabricated address as the "client IP."
   */
  trustProxy?: boolean;
}

/**
 * Splits and trims an `X-Forwarded-For` header into its individual hop
 * addresses (leftmost = original client, by convention — but see the
 * trust caveats on {@link getClientIp}). Returns `undefined` if the
 * header is absent.
 */
export function getForwardedFor(request: RequestLike): string[] | undefined {
  const header = getHeader(request.headers, 'x-forwarded-for');
  if (!header) return undefined;

  const hops = header
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return hops.length > 0 ? hops : undefined;
}

/**
 * Resolves the client's IP address.
 *
 * With `trustProxy: false` (the default), always returns the direct TCP
 * peer address and ignores `X-Forwarded-For`/`X-Real-IP` entirely — the
 * secure default, per the module's documented trust model.
 *
 * With `trustProxy: true`, prefers the leftmost `X-Forwarded-For` entry
 * (falling back to `X-Real-IP`, then the direct peer address). This is a
 * simplified trust model: it trusts the ENTIRE forwarded chain, not a
 * specific number of hops — appropriate when your edge infrastructure
 * guarantees these headers are proxy-set and client-supplied values are
 * stripped/overwritten upstream. If you need finer-grained N-hop trust
 * (e.g. "trust the last 2 proxies, but not further back"), inspect
 * `getForwardedFor()`'s result yourself and pick the appropriate hop.
 */
export function getClientIp(request: RequestLike, options: GetClientIpOptions = {}): string | undefined {
  const { trustProxy = false } = options;

  if (trustProxy) {
    const forwarded = getForwardedFor(request);
    if (forwarded && forwarded.length > 0) return forwarded[0];

    const realIp = getHeader(request.headers, 'x-real-ip');
    if (realIp) return realIp;
  }

  return request.socket?.remoteAddress ?? request.ip ?? undefined;
}
