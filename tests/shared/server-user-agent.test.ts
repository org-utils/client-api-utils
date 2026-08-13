import { describe, expect, it } from 'vitest';
import { parseUserAgent, parseRequestUserAgent } from '../../src/server/user-agent.js';

describe('server parseUserAgent', () => {
  it('extracts browser, OS, device type from a realistic desktop UA', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    expect(parsed.browser?.name).toBe('Chrome');
    expect(parsed.os?.name).toBe('Windows');
    expect(parsed.deviceType).toBe('desktop');
    expect(parsed.isBot).toBe(false);
  });

  it('flags known bot/crawler user agents', () => {
    expect(parseUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)').isBot).toBe(true);
    expect(parseUserAgent('curl/8.0.1').isBot).toBe(true);
  });

  it('parseRequestUserAgent reads from request headers, undefined if absent', () => {
    expect(parseRequestUserAgent({ headers: { 'user-agent': 'curl/8.0' } })?.isBot).toBe(true);
    expect(parseRequestUserAgent({ headers: {} })).toBeUndefined();
  });
});
