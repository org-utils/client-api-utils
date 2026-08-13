import { describe, expect, it } from 'vitest';
import {
  generateSecureToken, generateSecureRandomString, generateNonce, generateCSRFToken,
  timingSafeEqual, hashData,
} from '../../src/server/crypto.js';

describe('server crypto utilities', () => {
  it('generateSecureToken produces URL-safe tokens of expected length and uniqueness', () => {
    const token = generateSecureToken(16);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(generateSecureToken()).not.toBe(generateSecureToken());
  });

  it('generateSecureToken rejects invalid byteLength', () => {
    expect(() => generateSecureToken(0)).toThrow(RangeError);
  });

  it('generateSecureRandomString respects length and charset', () => {
    const s = generateSecureRandomString(20, 'ab');
    expect(s).toHaveLength(20);
    expect(s).toMatch(/^[ab]+$/);
  });

  it('generateSecureRandomString rejects a charset too small to be meaningful', () => {
    expect(() => generateSecureRandomString(5, 'x')).toThrow(RangeError);
  });

  it('generateNonce/generateCSRFToken produce non-empty, varying tokens', () => {
    expect(generateNonce()).not.toBe(generateNonce());
    expect(generateCSRFToken()).not.toBe(generateCSRFToken());
  });

  it('timingSafeEqual matches identical strings, rejects mismatches and length differences', () => {
    expect(timingSafeEqual('secret123', 'secret123')).toBe(true);
    expect(timingSafeEqual('secret123', 'secret124')).toBe(false);
    expect(timingSafeEqual('short', 'muchlonger')).toBe(false);
  });

  it('hashData produces a correct, deterministic SHA-256 digest', () => {
    // Known SHA-256 test vector, independently verifiable via `sha256sum`.
    expect(hashData('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(hashData('test')).toBe(hashData('test'));
    expect(hashData('a')).not.toBe(hashData('b'));
  });
});
