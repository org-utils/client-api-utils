import { describe, expect, it } from 'vitest';
import {
  utf8Encode, utf8Decode, base64Encode, base64Decode, base64UrlEncode, base64UrlDecode,
  hexEncode, hexDecode, arrayBufferToBase64, base64ToArrayBuffer,
} from '../../src/shared/encoding/encoding.js';

describe('encoding utilities', () => {
  it('utf8Encode/utf8Decode round-trip ASCII and multi-byte text', () => {
    for (const s of ['hello', '日本語', '🎉 emoji 🎉', '']) {
      expect(utf8Decode(utf8Encode(s))).toBe(s);
    }
  });

  const vectors: [string, string][] = [
    ['', ''],
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foobar', 'Zm9vYmFy'],
  ];

  it('base64Encode matches known RFC 4648 test vectors', () => {
    for (const [plain, expected] of vectors) {
      expect(base64Encode(plain)).toBe(expected);
    }
  });

  it('base64Encode/base64Decode round-trip ASCII, multi-byte, and empty strings', () => {
    for (const s of ['', 'a', 'Hello, World!', '日本語', '🎉 emoji test 🎉']) {
      expect(base64Decode(base64Encode(s))).toBe(s);
    }
  });

  it('base64ToArrayBuffer rejects invalid characters', () => {
    expect(() => base64ToArrayBuffer('not!!valid')).toThrow();
  });

  it('arrayBufferToBase64/base64ToArrayBuffer round-trip raw binary data', () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255, 128, 127]);
    const encoded = arrayBufferToBase64(bytes);
    const decoded = base64ToArrayBuffer(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });

  it('base64UrlEncode produces no +, /, or = characters', () => {
    for (const s of ['a', 'ab', 'abc', 'Hello, World!']) {
      expect(base64UrlEncode(s)).not.toMatch(/[+/=]/);
    }
  });

  it('base64UrlEncode/base64UrlDecode round-trip', () => {
    for (const s of ['', 'a', 'ab', 'abc', 'Hello, World!', '日本語']) {
      expect(base64UrlDecode(base64UrlEncode(s))).toBe(s);
    }
  });

  it('hexEncode/hexDecode round-trip via utf8', () => {
    for (const s of ['', 'a', 'Hello, World!', '日本語']) {
      expect(utf8Decode(hexDecode(hexEncode(utf8Encode(s))))).toBe(s);
    }
  });

  it('hexDecode rejects odd-length input', () => {
    expect(() => hexDecode('abc')).toThrow();
  });

  it('hexDecode rejects non-hex characters', () => {
    expect(() => hexDecode('zz')).toThrow();
  });
});
