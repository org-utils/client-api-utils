import {
  parseBrowserFromUA,
  parseOSFromUA,
  deviceTypeFromUA,
  isBotUA,
  type UABrowserInfo,
  type UAOSInfo,
} from '../shared/user-agent/user-agent.js';
import { getUserAgent, type RequestLike } from './headers.js';

export interface ParsedUserAgent {
  raw: string;
  browser?: UABrowserInfo | undefined;
  os?: UAOSInfo | undefined;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isBot: boolean;
}

/**
 * Parses a `User-Agent` header string into structured browser/OS/device
 * info. Uses the same heuristic parser as the client module's
 * `getBrowserInfo`/`getOSInfo` — see that module's docs (or the shared
 * `user-agent` module) for the reliability caveats: this is spoofable
 * and not exhaustive, suitable for analytics/logging, not for security
 * decisions.
 */
export function parseUserAgent(ua: string): ParsedUserAgent {
  return {
    raw: ua,
    browser: parseBrowserFromUA(ua),
    os: parseOSFromUA(ua),
    deviceType: deviceTypeFromUA(ua),
    isBot: isBotUA(ua),
  };
}

/** Convenience wrapper: reads the `User-Agent` header from a request and parses it. Returns `undefined` if the header is absent. */
export function parseRequestUserAgent(request: RequestLike): ParsedUserAgent | undefined {
  const ua = getUserAgent(request);
  return ua ? parseUserAgent(ua) : undefined;
}
