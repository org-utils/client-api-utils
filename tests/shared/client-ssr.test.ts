// Deliberately NOT jsdom - default Node environment, no window/document/navigator at all.
import { describe, expect, it } from 'vitest';
import * as client from '../../src/client.js';

describe('client entry point under SSR (no browser globals)', () => {
  it('detection functions degrade to safe fallbacks instead of throwing', () => {
    expect(client.isBrowser()).toBe(false);
    expect(client.getBrowserInfo()).toBeUndefined();
    expect(client.getOSInfo()).toBeUndefined();
    expect(client.isMobileDevice()).toBe(false);
    expect(client.isDesktop()).toBe(true); // documented SSR default
    expect(client.getLanguage()).toBeUndefined();
    expect(client.getOnlineStatus()).toBeUndefined();
    expect(client.getDeviceInfo()).toBeUndefined();
    expect(client.getViewport()).toBeUndefined();
    expect(client.getScreenInfo()).toBeUndefined();
    expect(client.isClipboardSupported()).toBe(false);
  });

  it('getTimezone works under SSR since it uses Intl, not a browser-only API', () => {
    expect(typeof client.getTimezone()).toBe('string');
  });

  it('storage never throws and falls back to memory under SSR', () => {
    expect(() => client.storage.set('k', 'v')).not.toThrow();
    expect(client.storage.set('k', 'v')).toBe(false); // false = not persisted, fell back to memory
    expect(client.storage.get('k')).toBe('v'); // still retrievable via the memory fallback
    expect(client.storage.has('k')).toBe(true);
  });

  it('copyToClipboard resolves false instead of throwing under SSR', async () => {
    await expect(client.copyToClipboard('x')).resolves.toBe(false);
  });

  it('onOnlineStatusChange no-ops safely under SSR', () => {
    const unsubscribe = client.onOnlineStatusChange(() => {
      throw new Error('should never be called under SSR');
    });
    expect(() => unsubscribe()).not.toThrow();
  });
});
