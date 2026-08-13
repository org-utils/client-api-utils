import {
  parseBrowserFromUA,
  parseOSFromUA,
  isMobileUA,
  isTabletUA,
  type UABrowserInfo,
  type UAOSInfo,
} from '../shared/user-agent/user-agent.js';

/**
 * Browser environment detection. UA-based parsing (browser/OS name,
 * device type) is delegated to the shared, environment-agnostic
 * `user-agent` module, which the server module's `parseUserAgent` also
 * uses — see that module's docs for the reliability caveats that apply
 * to everything UA-derived here.
 */

/**
 * Detects whether the code is currently running in a browser-like
 * environment (i.e. `window` and `document` are both defined).
 *
 * Safe to call at any time, including during SSR — it never throws and
 * never accesses browser globals unless they already exist.
 *
 * @returns `true` when running in a browser context, `false` otherwise
 * (Node.js, SSR, workers without a DOM, etc.).
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export type BrowserInfo = UABrowserInfo;
export type OSInfo = UAOSInfo;

/** Best-effort parse of `navigator.userAgent` into a browser name/version. `undefined` outside a browser context or if the UA doesn't match a known pattern. */
export function getBrowserInfo(): BrowserInfo | undefined {
  if (!isBrowser()) return undefined;
  return parseBrowserFromUA(navigator.userAgent);
}

/** Best-effort parse of `navigator.userAgent` into an OS name/version. */
export function getOSInfo(): OSInfo | undefined {
  if (!isBrowser()) return undefined;
  return parseOSFromUA(navigator.userAgent);
}

/** Best-effort check for whether the current device is a phone-sized touch device (heuristic — see module docs). */
export function isMobileDevice(): boolean {
  if (!isBrowser()) return false;
  return isMobileUA(navigator.userAgent);
}

/** Best-effort check for whether the current device is a tablet (heuristic — see module docs). */
export function isTablet(): boolean {
  if (!isBrowser()) return false;
  return isTabletUA(navigator.userAgent);
}

/** `true` if neither {@link isMobileDevice} nor {@link isTablet} match. Falls back to `true` outside a browser context (SSR default assumption). */
export function isDesktop(): boolean {
  if (!isBrowser()) return true;
  return !isMobileDevice() && !isTablet();
}

/** Returns the browser's preferred language tag (e.g. `'en-US'`), or `undefined` outside a browser context. */
export function getLanguage(): string | undefined {
  if (!isBrowser()) return undefined;
  return navigator.language;
}

/** Returns the runtime's IANA timezone (e.g. `'America/New_York'`). Works in both browser and Node via `Intl`, so it doesn't strictly require a browser context. */
export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Returns the browser's current online status, or `undefined` outside a browser context (SSR). */
export function getOnlineStatus(): boolean | undefined {
  if (!isBrowser()) return undefined;
  return navigator.onLine;
}
