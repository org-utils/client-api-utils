/**
 * Pure, environment-agnostic user-agent string parsing — no `navigator`
 * or Node dependency, just string analysis. This is what both the client
 * module's `getBrowserInfo`/`getOSInfo` (which read `navigator.userAgent`)
 * and the server module's `parseUserAgent` (which reads the `User-Agent`
 * request header) call under the hood, so the two never drift apart.
 *
 * IMPORTANT: user-agent strings are inherently heuristic to parse —
 * freely spoofable, inconsistently formatted across vendors, and prone
 * to false positives (e.g. many browsers include "like Gecko" or other
 * vendors' names for compatibility). Treat this as a best-effort hint
 * for analytics/logging, never as a security or identity signal.
 */

export interface UABrowserInfo {
  name: string;
  version: string;
}

export interface UAOSInfo {
  name: string;
  version: string | undefined;
}

/** Parses a browser name/version from a user-agent string. Patterns are checked most-specific-first (Edge/Opera before Chrome, since both embed "Chrome" in their UA for compatibility). */
export function parseBrowserFromUA(ua: string): UABrowserInfo | undefined {
  const patterns: [string, RegExp][] = [
    ['Edge', /Edg\/([\d.]+)/],
    ['Opera', /OPR\/([\d.]+)/],
    ['Chrome', /Chrome\/([\d.]+)/],
    ['Firefox', /Firefox\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari/],
    ['Internet Explorer', /(?:MSIE |rv:)([\d.]+)/],
  ];

  for (const [name, pattern] of patterns) {
    const match = ua.match(pattern);
    if (match) return { name, version: match[1] as string };
  }

  return undefined;
}

/** Parses an OS name/version from a user-agent string. */
export function parseOSFromUA(ua: string): UAOSInfo | undefined {
  const patterns: [string, RegExp][] = [
    ['Windows', /Windows NT ([\d.]+)/],
    ['macOS', /Mac OS X ([\d_.]+)/],
    ['iOS', /OS ([\d_]+) like Mac OS X/],
    ['Android', /Android ([\d.]+)/],
    ['Linux', /Linux/],
  ];

  for (const [name, pattern] of patterns) {
    const match = ua.match(pattern);
    if (match) return { name, version: match[1]?.replace(/_/g, '.') };
  }

  return undefined;
}

/** Heuristic phone-sized-touch-device check (see module docs re: reliability). */
export function isMobileUA(ua: string): boolean {
  return /Android(?!.*Tablet)|iPhone|iPod|Windows Phone|BlackBerry/i.test(ua);
}

/** Heuristic tablet check (see module docs re: reliability). */
export function isTabletUA(ua: string): boolean {
  return /iPad|Android(?=.*Tablet)|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
}

/** Derives a coarse device-type classification from a user-agent string. */
export function deviceTypeFromUA(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (isMobileUA(ua)) return 'mobile';
  if (isTabletUA(ua)) return 'tablet';
  return 'desktop';
}

/**
 * Heuristic check for known bot/crawler/monitoring user-agents (search
 * engine crawlers, uptime monitors, social-media link-preview fetchers,
 * common HTTP client library defaults, etc.). Not exhaustive, and
 * trivially bypassable by a bot that sets a browser-like UA on purpose —
 * do not rely on this for anything security-sensitive (e.g. blocking
 * scraping or abuse). It's meant for analytics filtering, not enforcement.
 */
export function isBotUA(ua: string): boolean {
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|curl|wget|python-requests|axios\/|node-fetch/i.test(
    ua,
  );
}
