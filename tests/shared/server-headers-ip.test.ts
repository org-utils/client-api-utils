import { describe, expect, it } from 'vitest';
import { getHeader, getUserAgent, getRequestId } from '../../src/server/headers.js';
import { getClientIp, getForwardedFor } from '../../src/server/ip.js';

describe('headers utilities', () => {
  it('getHeader reads plain-object (Node/Express/Fastify-style) headers case-insensitively', () => {
    const headers = { 'user-agent': 'TestUA/1.0', 'x-request-id': 'req-123' };
    expect(getHeader(headers, 'User-Agent')).toBe('TestUA/1.0');
    expect(getHeader(headers, 'x-nope')).toBeUndefined();
  });

  it('getHeader works with the Fetch API Headers class (Hono-style)', () => {
    const headers = new Headers({ 'user-agent': 'TestUA/1.0' });
    expect(getHeader(headers, 'user-agent')).toBe('TestUA/1.0');
  });

  it('getHeader takes the first value for array-valued headers', () => {
    expect(getHeader({ 'x-foo': ['a', 'b'] }, 'x-foo')).toBe('a');
  });

  it('getUserAgent/getRequestId read from request.headers', () => {
    const req = { headers: { 'user-agent': 'UA', 'x-request-id': 'id-1' } };
    expect(getUserAgent(req)).toBe('UA');
    expect(getRequestId(req)).toBe('id-1');
  });

  it('getRequestId checks fallback header names in order', () => {
    expect(getRequestId({ headers: { 'x-correlation-id': 'corr-1' } })).toBe('corr-1');
    expect(getRequestId({ headers: {} })).toBeUndefined();
  });
});

describe('getClientIp / getForwardedFor', () => {
  const spoofableRequest = {
    headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    socket: { remoteAddress: '10.0.0.1' },
  };

  it('ignores X-Forwarded-For by default (secure default)', () => {
    expect(getClientIp(spoofableRequest)).toBe('10.0.0.1');
  });

  it('trusts the leftmost X-Forwarded-For entry only when trustProxy is explicitly true', () => {
    expect(getClientIp(spoofableRequest, { trustProxy: true })).toBe('1.2.3.4');
  });

  it('falls back to X-Real-IP when trustProxy is set and X-Forwarded-For is absent', () => {
    const req = { headers: { 'x-real-ip': '9.9.9.9' }, socket: { remoteAddress: '10.0.0.1' } };
    expect(getClientIp(req, { trustProxy: true })).toBe('9.9.9.9');
  });

  it('falls back to the direct socket address with no proxy headers at all', () => {
    expect(getClientIp({ headers: {}, socket: { remoteAddress: '10.0.0.1' } })).toBe('10.0.0.1');
  });

  it('getForwardedFor splits and trims hops, returns undefined if absent', () => {
    expect(getForwardedFor(spoofableRequest)).toEqual(['1.2.3.4', '5.6.7.8']);
    expect(getForwardedFor({ headers: {} })).toBeUndefined();
  });
});
