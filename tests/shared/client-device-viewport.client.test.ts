// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getDeviceInfo } from '../../src/client/device.js';
import { getViewport, getScreenInfo } from '../../src/client/viewport.js';

describe('device and viewport (jsdom)', () => {
  it('getDeviceInfo aggregates browser/OS/device-type/language/timezone', () => {
    const info = getDeviceInfo();
    expect(info).toBeDefined();
    expect(['mobile', 'tablet', 'desktop', 'unknown']).toContain(info?.deviceType);
    expect(typeof info?.userAgent).toBe('string');
    expect(typeof info?.language).toBe('string');
    expect(typeof info?.timezone).toBe('string');
  });

  it('getViewport reads window dimensions', () => {
    const viewport = getViewport();
    expect(viewport).toEqual({ width: window.innerWidth, height: window.innerHeight });
  });

  it('getScreenInfo reads screen metrics and devicePixelRatio', () => {
    const info = getScreenInfo();
    expect(info).toBeDefined();
    expect(typeof info?.width).toBe('number');
    expect(typeof info?.pixelRatio).toBe('number');
  });
});
