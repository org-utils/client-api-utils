import { describe, expect, it } from 'vitest';
import { getRequestHost, getRequestProtocol, getRequestOrigin, getRequestMetadata } from '../../src/server/request.js';

describe('request metadata utilities', () => {
  const proxiedRequest = {
    headers: {
      host: 'example.com',
      'x-forwarded-host': 'proxied.example.com',
      'x-forwarded-proto': 'https',
    },
  };

  it('getRequestHost uses Host by default, X-Forwarded-Host only with trustProxy', () => {
    expect(getRequestHost(proxiedRequest)).toBe('example.com');
    expect(getRequestHost(proxiedRequest, { trustProxy: true })).toBe('proxied.example.com');
  });

  it('getRequestProtocol defaults to http, respects trustProxy/secure/socket signals', () => {
    expect(getRequestProtocol({ headers: {} })).toBe('http');
    expect(getRequestProtocol(proxiedRequest)).toBe('http'); // ignored without trustProxy
    expect(getRequestProtocol(proxiedRequest, { trustProxy: true })).toBe('https');
    expect(getRequestProtocol({ headers: {}, socket: { encrypted: true } })).toBe('https');
    expect(getRequestProtocol({ headers: {}, secure: true })).toBe('https');
  });

  it('getRequestOrigin combines protocol and host, undefined without a host', () => {
    expect(getRequestOrigin(proxiedRequest, { trustProxy: true })).toBe('https://proxied.example.com');
    expect(getRequestOrigin({ headers: {} })).toBeUndefined();
  });

  it('getRequestMetadata aggregates every field from a single request', () => {
    const metadata = getRequestMetadata({
      headers: {
        host: 'api.example.com',
        'user-agent': 'TestClient/1.0',
        referer: 'https://ref.example.com',
        'x-request-id': 'abc',
      },
      socket: { remoteAddress: '127.0.0.1' },
    });

    expect(metadata).toEqual({
      requestId: 'abc',
      ipAddress: '127.0.0.1',
      userAgent: 'TestClient/1.0',
      forwardedFor: undefined,
      protocol: 'http',
      host: 'api.example.com',
      origin: 'http://api.example.com',
      referer: 'https://ref.example.com',
    });
  });
});
