// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  isBrowser, getBrowserInfo, getOSInfo, isMobileDevice, isTablet, isDesktop,
  getLanguage, getTimezone, getOnlineStatus,
} from '../../src/client/browser.js';

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

describe('browser detection (jsdom)', () => {
  it('isBrowser is true under jsdom', () => {
    expect(isBrowser()).toBe(true);
  });

  it('getBrowserInfo detects Chrome from a realistic UA', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    expect(getBrowserInfo()).toEqual({ name: 'Chrome', version: '120.0.0.0' });
  });

  it('getBrowserInfo prefers Edge over Chrome when both markers are present', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    );
    expect(getBrowserInfo()?.name).toBe('Edge');
  });

  it('getOSInfo detects Windows/macOS/Android from UA', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(getOSInfo()?.name).toBe('Windows');

    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    expect(getOSInfo()?.name).toBe('macOS');

    setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7)');
    expect(getOSInfo()?.name).toBe('Android');
  });

  it('isMobileDevice/isTablet/isDesktop classify realistic UAs', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
    expect(isMobileDevice()).toBe(true);
    expect(isDesktop()).toBe(false);

    setUserAgent('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)');
    expect(isTablet()).toBe(true);

    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    expect(isDesktop()).toBe(true);
  });

  it('getLanguage/getTimezone/getOnlineStatus return real jsdom values', () => {
    expect(typeof getLanguage()).toBe('string');
    expect(typeof getTimezone()).toBe('string');
    expect(typeof getOnlineStatus()).toBe('boolean');
  });
});
