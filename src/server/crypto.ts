import { randomBytes, randomInt, timingSafeEqual as nodeTimingSafeEqual, createHash } from 'node:crypto';

/**
 * Generates a cryptographically secure random token, suitable for session
 * identifiers, password-reset tokens, API keys, or CSRF tokens.
 *
 * Uses Node's `crypto.randomBytes` (backed by the OS CSPRNG) — never
 * `Math.random()`, which is not safe for security-sensitive values.
 *
 * @param byteLength - Number of random bytes to generate before encoding.
 *   Defaults to 32 (256 bits), a reasonable default for session/reset
 *   tokens. Use at least 16 for anything security-sensitive.
 * @returns A base64url-encoded token (URL-safe, no padding).
 *
 * @example
 * ```ts
 * const resetToken = generateSecureToken(); // 256-bit token
 * const shortNonce = generateSecureToken(16); // 128-bit token
 * ```
 */
export function generateSecureToken(byteLength = 32): string {
  if (!Number.isInteger(byteLength) || byteLength < 1) {
    throw new RangeError(`generateSecureToken: byteLength must be a positive integer, got ${byteLength}`);
  }

  return randomBytes(byteLength).toString('base64url');
}

/**
 * Generates a cryptographically secure random string drawn from
 * `charset`, using Node's CSPRNG via `crypto.randomInt` (which performs
 * unbiased rejection sampling internally — unlike a naive
 * `Math.random() * charset.length`, this doesn't skew toward earlier
 * characters when `charset.length` doesn't evenly divide the RNG's range).
 *
 * Prefer `generateSecureToken` for opaque tokens (it's more
 * entropy-dense per character); use this when you specifically need
 * output restricted to a certain alphabet (e.g. human-typeable codes,
 * numeric OTPs).
 */
export function generateSecureRandomString(
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError(`generateSecureRandomString: length must be a non-negative integer, got ${length}`);
  }
  if (charset.length < 2) {
    throw new RangeError('generateSecureRandomString: charset must contain at least 2 characters');
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomInt(0, charset.length)];
  }
  return result;
}

/**
 * Generates a cryptographic nonce (number used once), base64-encoded —
 * the format expected by e.g. Content-Security-Policy `nonce-` sources
 * and script/style tag `nonce` attributes. A fresh nonce must be
 * generated per request/response; never reuse one.
 */
export function generateNonce(byteLength = 16): string {
  if (!Number.isInteger(byteLength) || byteLength < 1) {
    throw new RangeError(`generateNonce: byteLength must be a positive integer, got ${byteLength}`);
  }
  return randomBytes(byteLength).toString('base64');
}

/**
 * Generates a CSRF token. This is `generateSecureToken` under a more
 * specific name for discoverability — 256 bits by default, base64url
 * encoded. Pairing this with the double-submit-cookie or
 * synchronizer-token pattern (and verifying with `timingSafeEqual`) is
 * the caller's responsibility; this function only produces the token.
 */
export function generateCSRFToken(byteLength = 32): string {
  return generateSecureToken(byteLength);
}

/**
 * Compares two strings in constant time with respect to their CONTENT,
 * to avoid leaking information via response-time side channels — use
 * this instead of `===` when comparing secrets (API keys, CSRF tokens,
 * HMAC signatures, etc.) against a user-supplied value.
 *
 * NOTE: this does NOT hide whether the two inputs have the same length
 * — mismatched lengths return `false` immediately. This is the standard
 * trade-off for this kind of utility (matching most other languages'
 * equivalents): length is usually not the sensitive part of a secret,
 * only whether the full content matches is. If your threat model
 * specifically requires hiding length too, pad both inputs to a fixed
 * length before comparing.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf-8');
  const bufferB = Buffer.from(b, 'utf-8');

  if (bufferA.length !== bufferB.length) return false;

  return nodeTimingSafeEqual(bufferA, bufferB);
}

/**
 * Computes a hex-encoded hash digest of `data` using Node's `crypto`
 * module.
 *
 * IMPORTANT: this is a general-purpose one-way hash (ETags, cache keys,
 * content-integrity checks, deduplication) — it is NOT suitable for
 * hashing passwords or other low-entropy secrets, because standard hash
 * functions (including SHA-256/SHA-512) are fast, which makes them
 * practical to brute-force. For password hashing, use a dedicated
 * slow/memory-hard algorithm (bcrypt, scrypt, or Argon2) instead — this
 * package intentionally does not implement one, since correct parameter
 * choices and upgrade paths matter a lot and are outside a general
 * utility library's scope.
 */
export function hashData(data: string | Buffer | Uint8Array, algorithm: 'sha256' | 'sha512' | 'md5' = 'sha256'): string {
  return createHash(algorithm).update(data).digest('hex');
}
