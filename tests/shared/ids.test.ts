// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateUUID, generateRandomId, generateDeviceId } from '../../src/shared/ids/ids.js';

describe('id utilities (Web Crypto-backed)', () => {
  it('generateUUID produces valid, unique v4 UUIDs', () => {
    const a = generateUUID();
    const b = generateUUID();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(a).not.toBe(b);
  });

  it('generateRandomId produces hex strings of the requested byte length', () => {
    expect(generateRandomId(16)).toMatch(/^[0-9a-f]{32}$/);
    expect(generateRandomId(8)).toMatch(/^[0-9a-f]{16}$/);
  });

  it('generateRandomId throws on invalid byteLength', () => {
    expect(() => generateRandomId(0)).toThrow(RangeError);
    expect(() => generateRandomId(-1)).toThrow(RangeError);
  });

  it('generateDeviceId returns a UUID-shaped string', () => {
    expect(generateDeviceId()).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
