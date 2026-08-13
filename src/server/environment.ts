/** Server-only environment variable helpers, reading from `process.env`. */

/** Reads an environment variable, returning `fallback` (default `undefined`) if unset or empty. */
export function getEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
}

/** Alias for {@link getEnv} — reads an optional environment variable, named for symmetry with {@link requireEnv}. */
export function getOptionalEnv(name: string, fallback?: string): string | undefined {
  return getEnv(name, fallback);
}

/**
 * Reads a required environment variable.
 * @throws {Error} With a clear, actionable message if `name` is unset or empty.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`requireEnv: required environment variable "${name}" is not set.`);
  }
  return value;
}

const TRUTHY_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSY_VALUES = new Set(['false', '0', 'no', 'off']);

/**
 * Reads a boolean environment variable. Accepts (case-insensitively)
 * `true/false`, `1/0`, `yes/no`, `on/off`.
 * @throws {Error} If the variable is set but doesn't match any recognized boolean value.
 */
export function getBooleanEnv(name: string, fallback?: boolean): boolean | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const normalized = raw.trim().toLowerCase();
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSY_VALUES.has(normalized)) return false;

  throw new Error(
    `getBooleanEnv: environment variable "${name}" has value "${raw}", which isn't a recognized boolean (expected one of: true/false, 1/0, yes/no, on/off).`,
  );
}

/**
 * Reads a numeric environment variable.
 * @throws {Error} If the variable is set but isn't a valid, finite number.
 */
export function getNumberEnv(name: string, fallback?: number): number | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`getNumberEnv: environment variable "${name}" has value "${raw}", which isn't a valid number.`);
  }
  return value;
}

/** Reads a delimiter-separated list environment variable (default delimiter: `,`), trimming whitespace and dropping empty entries. Returns `fallback` (default `undefined`) if unset. */
export function getListEnv(name: string, options: { delimiter?: string; fallback?: string[] } = {}): string[] | undefined {
  const { delimiter = ',', fallback } = options;
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  return raw
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
