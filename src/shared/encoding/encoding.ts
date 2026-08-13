/**
 * Encoding utilities, built entirely on universal Web APIs
 * (`TextEncoder`/`TextDecoder`, `Uint8Array`) — no `Buffer` dependency,
 * so these work identically in browsers, Node.js, and edge runtimes.
 *
 * Base64 encode/decode is implemented manually (rather than relying on
 * `btoa`/`atob`) because `btoa`/`atob` operate on "binary strings" (one
 * UTF-16 code unit per byte) and throw on non-Latin1 characters — using
 * them correctly for arbitrary Unicode text requires exactly the manual
 * byte-array approach used here anyway, so we skip the indirection.
 */

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encodes a UTF-8 string into a `Uint8Array`. */
export function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Decodes a `Uint8Array` (or `ArrayBuffer`) of UTF-8 bytes into a string. */
export function utf8Decode(bytes: Uint8Array | ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(bytes);
}

/** Looks up a base64 alphabet character. `index` is always the result of `& 0x3f`, i.e. always in `[0, 63]`, so the lookup can never actually miss — this helper just gives `noUncheckedIndexedAccess` a single, documented place to be told that. */
function alphabetChar(index: number): string {
  return BASE64_ALPHABET[index] as string;
}

/** Encodes raw bytes as a standard (RFC 4648) base64 string, with `=` padding. */
export function arrayBufferToBase64(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  let result = '';
  let i = 0;

  for (; i + 2 < view.length; i += 3) {
    const chunk = ((view[i] as number) << 16) | ((view[i + 1] as number) << 8) | (view[i + 2] as number);
    result +=
      alphabetChar((chunk >> 18) & 0x3f) +
      alphabetChar((chunk >> 12) & 0x3f) +
      alphabetChar((chunk >> 6) & 0x3f) +
      alphabetChar(chunk & 0x3f);
  }

  const remaining = view.length - i;

  if (remaining === 1) {
    const chunk = (view[i] as number) << 16;
    result += alphabetChar((chunk >> 18) & 0x3f) + alphabetChar((chunk >> 12) & 0x3f) + '==';
  } else if (remaining === 2) {
    const chunk = ((view[i] as number) << 16) | ((view[i + 1] as number) << 8);
    result +=
      alphabetChar((chunk >> 18) & 0x3f) +
      alphabetChar((chunk >> 12) & 0x3f) +
      alphabetChar((chunk >> 6) & 0x3f) +
      '=';
  }

  return result;
}

/**
 * Decodes a standard base64 string (padded or not) into a `Uint8Array`.
 * @throws {Error} If the input contains characters outside the base64 alphabet.
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const byteLength = Math.floor((clean.length * 6) / 8);
  const bytes = new Uint8Array(byteLength);

  let bitBuffer = 0;
  let bitCount = 0;
  let byteIndex = 0;

  for (const char of clean) {
    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`base64ToArrayBuffer: invalid base64 character "${char}"`);
    }

    bitBuffer = (bitBuffer << 6) | value;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bitBuffer >> bitCount) & 0xff;
    }
  }

  return bytes;
}

/** Encodes a UTF-8 string as base64. */
export function base64Encode(str: string): string {
  return arrayBufferToBase64(utf8Encode(str));
}

/** Decodes a base64 string back into a UTF-8 string. */
export function base64Decode(base64: string): string {
  return utf8Decode(base64ToArrayBuffer(base64));
}

/** Converts standard base64 to URL-safe base64 (`+`→`-`, `/`→`_`, padding stripped). */
function toBase64Url(standard: string): string {
  return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Converts URL-safe base64 back to standard base64, restoring `=` padding. */
function fromBase64Url(urlSafe: string): string {
  const standard = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (standard.length % 4)) % 4;
  return standard + '='.repeat(paddingNeeded);
}

/** Encodes a UTF-8 string as URL-safe base64 (RFC 4648 §5) — no `+`, `/`, or padding. */
export function base64UrlEncode(str: string): string {
  return toBase64Url(base64Encode(str));
}

/** Decodes a URL-safe base64 string back into a UTF-8 string. */
export function base64UrlDecode(urlSafe: string): string {
  return base64Decode(fromBase64Url(urlSafe));
}

/** Encodes raw bytes as a lowercase hex string. */
export function hexEncode(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decodes a hex string into a `Uint8Array`.
 * @throws {Error} If the input has odd length or contains non-hex characters.
 */
export function hexDecode(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`hexDecode: hex string must have even length, got ${hex.length}`);
  }
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('hexDecode: input contains non-hexadecimal characters');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
