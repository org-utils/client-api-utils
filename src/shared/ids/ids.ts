/**
 * ID generation, backed by the Web Crypto API (`globalThis.crypto`),
 * which is available natively in browsers and in Node.js 19+ without any
 * import — keeping this module usable from the universal root entry
 * point rather than requiring `node:crypto`.
 *
 * These are appropriate for: random IDs, request IDs, correlation IDs,
 * non-sensitive device IDs. For session IDs, password-reset tokens, API
 * keys, or anything else genuinely security-sensitive, prefer the
 * `generateSecureToken` server utility, which uses Node's CSPRNG and
 * gives you explicit control over byte length/entropy.
 */

function getWebCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error(
      'ids: Web Crypto API (globalThis.crypto) is not available in this environment. ' +
        'On Node.js, this requires Node 19+, or Node 18 run with --experimental-global-webcrypto. ' +
        'For server-side ID/token generation on older Node versions, use generateSecureToken from "@org-utils/utils/server" instead.',
    );
  }
  return c;
}

/**
 * Generates a random UUID v4 (RFC 4122) using the platform CSPRNG via
 * `crypto.randomUUID()`.
 */
export function generateUUID(): string {
  return getWebCrypto().randomUUID();
}

/**
 * Generates a random hex string of `byteLength` random bytes (i.e. the
 * output string is `byteLength * 2` characters long), using the platform
 * CSPRNG.
 *
 * @example generateRandomId(16) // 32-char hex string, 128 bits of entropy
 */
export function generateRandomId(byteLength = 16): string {
  if (!Number.isInteger(byteLength) || byteLength < 1) {
    throw new RangeError(`generateRandomId: byteLength must be a positive integer, got ${byteLength}`);
  }

  const bytes = new Uint8Array(byteLength);
  getWebCrypto().getRandomValues(bytes);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates an application-level device identifier (a random UUID),
 * intended to be persisted (e.g. in storage) and reused across sessions
 * on the same device/browser install.
 *
 * This is NOT a hardware or physical-device identifier: it's an
 * app-generated value that resets whenever storage is cleared, the app
 * is reinstalled, or a different browser/profile is used. Do not present
 * it to users or downstream systems as a permanent device fingerprint.
 */
export function generateDeviceId(): string {
  return generateUUID();
}
