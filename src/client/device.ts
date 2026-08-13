import { isBrowser, getBrowserInfo, getOSInfo, isMobileDevice, isTablet, getLanguage, getTimezone } from './browser.js';

export interface DeviceInfo {
  userAgent: string;
  browser?: string | undefined;
  browserVersion?: string | undefined;
  operatingSystem?: string | undefined;
  osVersion?: string | undefined;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  platform?: string | undefined;
  language?: string | undefined;
  timezone?: string | undefined;
}

/**
 * Aggregates browser/OS/device-type detection into a single object.
 *
 * As with the individual detection functions this is built on, this is
 * heuristic, UA-based, and spoofable — treat it as a best-effort hint
 * for analytics or UX branching (e.g. "show the app-install banner on
 * mobile"), never as a security signal or a unique device identifier.
 * For an application-level persistent identifier, see `generateDeviceId`
 * instead — that's a generated value, not something derived from the UA.
 *
 * @returns `undefined` outside a browser context (e.g. during SSR).
 */
export function getDeviceInfo(): DeviceInfo | undefined {
  if (!isBrowser()) return undefined;

  const browser = getBrowserInfo();
  const os = getOSInfo();

  const deviceType: DeviceInfo['deviceType'] = isMobileDevice()
    ? 'mobile'
    : isTablet()
      ? 'tablet'
      : 'desktop';

  return {
    userAgent: navigator.userAgent,
    browser: browser?.name,
    browserVersion: browser?.version,
    operatingSystem: os?.name,
    osVersion: os?.version,
    deviceType,
    platform: navigator.platform,
    language: getLanguage(),
    timezone: getTimezone(),
  };
}
