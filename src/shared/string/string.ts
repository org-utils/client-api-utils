/**
 * String utilities. Unicode-aware where it matters (word-boundary case
 * conversions use a Unicode-friendly regex rather than assuming ASCII).
 */

/** Capitalizes the first character; leaves the rest untouched. */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str[0]!.toUpperCase() + str.slice(1);
}

/** Lower-cases the first character; leaves the rest untouched. */
export function uncapitalize(str: string): string {
  if (str.length === 0) return str;
  return str[0]!.toLowerCase() + str.slice(1);
}

/** Splits a string into lowercase words on case boundaries, whitespace, and common separators (`-`, `_`, `.`, `/`). */
function toWords(str: string): string[] {
  return (
    str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[\s\-_./]+/)
      .filter((w) => w.length > 0)
      .map((w) => w.toLowerCase())
  );
}

/** Converts a string to `camelCase`. @example camelCase('hello world') // 'helloWorld' */
export function camelCase(str: string): string {
  const words = toWords(str);
  if (words.length === 0) return '';
  return words[0] + words.slice(1).map(capitalize).join('');
}

/** Converts a string to `PascalCase`. @example pascalCase('hello world') // 'HelloWorld' */
export function pascalCase(str: string): string {
  return toWords(str).map(capitalize).join('');
}

/** Converts a string to `kebab-case`. @example kebabCase('Hello World') // 'hello-world' */
export function kebabCase(str: string): string {
  return toWords(str).join('-');
}

/** Converts a string to `snake_case`. @example snakeCase('Hello World') // 'hello_world' */
export function snakeCase(str: string): string {
  return toWords(str).join('_');
}

/**
 * Converts a string into a URL-safe slug: lowercase, ASCII-transliterated
 * where possible via Unicode normalization, non-alphanumeric runs
 * collapsed to a single `-`, leading/trailing `-` trimmed.
 *
 * Not a full transliteration library — characters with no ASCII
 * decomposition (e.g. CJK) are dropped rather than approximated.
 */
export function slugify(str: string): string {
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncates a string to `maxLength`, appending `suffix` (default `'…'`)
 * if truncation occurred. `maxLength` includes the suffix length.
 */
export function truncate(str: string, maxLength: number, suffix = '…'): string {
  if (str.length <= maxLength) return str;
  const keep = Math.max(0, maxLength - suffix.length);
  return str.slice(0, keep) + suffix;
}

/**
 * Truncates a string in the middle, keeping the start and end, useful for
 * long identifiers/hashes/paths where the middle is least informative.
 *
 * @example truncateMiddle('abcdefghijklmnop', 10) // 'abcd…mnop'
 */
export function truncateMiddle(str: string, maxLength: number, separator = '…'): string {
  if (str.length <= maxLength) return str;

  const charsToShow = maxLength - separator.length;
  const front = Math.ceil(charsToShow / 2);
  const back = Math.floor(charsToShow / 2);

  if (charsToShow <= 0) return separator.slice(0, maxLength);

  return str.slice(0, front) + separator + str.slice(str.length - back);
}

/**
 * Strips HTML tags from a string via regex.
 *
 * This is NOT a security sanitizer — it does not protect against XSS and
 * must never be used to sanitize untrusted HTML for safe rendering. Use a
 * proper sanitizer (e.g. DOMPurify) for that. This is only for display
 * purposes like generating plain-text previews/excerpts.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/** Collapses runs of whitespace into a single space and trims the ends. */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/** Removes all whitespace characters. */
export function removeWhitespace(str: string): string {
  return str.replace(/\s+/g, '');
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes `& < > " '` for safe inclusion inside HTML text content or attribute values. */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] as string);
}

const HTML_UNESCAPE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/** Reverses {@link escapeHtml}. Only handles the five entities escapeHtml produces, not the full HTML entity set. */
export function unescapeHtml(str: string): string {
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => HTML_UNESCAPE_MAP[entity] as string);
}

/**
 * Masks all but the last `visibleChars` characters with `maskChar`.
 * Useful for displaying partial credit-card numbers, phone numbers, etc.
 *
 * @example mask('4111111111111111', 4) // '************1111'
 */
export function mask(str: string, visibleChars = 4, maskChar = '*'): string {
  if (str.length <= visibleChars) return str;
  return maskChar.repeat(str.length - visibleChars) + str.slice(str.length - visibleChars);
}

/**
 * Redacts a string entirely, or partially if `visibleChars` is given —
 * unlike {@link mask}, defaults to full redaction (0 visible characters),
 * making it a safer default for logging sensitive values.
 */
export function redact(str: string, visibleChars = 0, maskChar = '*'): string {
  if (visibleChars <= 0) return maskChar.repeat(str.length);
  return mask(str, visibleChars, maskChar);
}

/** Returns `true` if the string is empty or contains only whitespace. */
export function isBlank(str: string): boolean {
  return str.trim().length === 0;
}

/**
 * Lightweight email format check. This is a pragmatic heuristic, NOT a
 * standards-compliant RFC 5322 validator — it will accept some invalid
 * addresses and reject some technically-valid ones. Always verify real
 * addresses via a confirmation email, never rely on format-checking alone.
 */
export function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Checks whether a string parses as a valid URL via the native `URL`
 * constructor. Accepts any scheme by default (`mailto:`, `data:`, etc.)
 * — pass `protocols` to restrict to specific schemes.
 */
export function isURLString(str: string, protocols?: readonly string[]): boolean {
  try {
    const url = new URL(str);
    if (protocols && !protocols.includes(url.protocol.replace(':', ''))) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a random string from `charset` using `Math.random()`.
 *
 * NOT suitable for tokens, session IDs, passwords, or any
 * security-sensitive value — use `generateSecureToken` (server) or
 * `generateUUID`/`generateRandomId` (shared, Web Crypto-backed) instead.
 * This is only for things like generating test fixtures or non-sensitive
 * display placeholders.
 */
export function randomString(
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError(`randomString: length must be a non-negative integer, got ${length}`);
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}
