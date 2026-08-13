/** Error utilities: normalization, serialization, and a generic application error type. */

/** `true` if `value` is an `Error` instance (including subclasses). */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/** Extracts a human-readable message from any thrown value, never throws itself. */
export function getErrorMessage(value: unknown): string {
  if (isError(value)) return value.message;
  if (typeof value === 'string') return value;
  if (isObjectWithMessage(value)) return String(value.message);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Extracts a stack trace if present, otherwise `undefined`. */
export function getErrorStack(value: unknown): string | undefined {
  return isError(value) ? value.stack : undefined;
}

/** Extracts a `.code` property if present (common on Node system errors and many custom error classes), otherwise `undefined`. */
export function getErrorCode(value: unknown): string | number | undefined {
  if (isObjectWithCode(value)) return value.code;
  return undefined;
}

/** Converts any thrown value into an `Error` instance. If it's already an `Error`, returns it unchanged; otherwise wraps it, preserving the original as `.cause`. */
export function toError(value: unknown): Error {
  if (isError(value)) return value;
  return new Error(getErrorMessage(value), { cause: value });
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  cause?: SerializedError | undefined;
}

/**
 * Converts an error into a plain, JSON-serializable object suitable for
 * logging. Deliberately does NOT include arbitrary own-enumerable
 * properties of the error (some error subclasses attach sensitive data,
 * e.g. request bodies or credentials) — only `name`, `message`, `stack`,
 * `code`, and a recursively-serialized `cause` are included. If you need
 * additional fields, extract them explicitly and add them to the result
 * yourself, so what gets logged is an intentional decision, not a default.
 */
export function serializeError(value: unknown): SerializedError {
  const err = toError(value);

  const result: SerializedError = {
    name: err.name,
    message: err.message,
  };

  if (err.stack) result.stack = err.stack;

  const code = getErrorCode(err);
  if (code !== undefined) result.code = code;

  if (err.cause !== undefined) {
    result.cause = serializeError(err.cause);
  }

  return result;
}

/** Alias for {@link toError} — normalizes any thrown value into a real `Error`. */
export function normalizeError(value: unknown): Error {
  return toError(value);
}

export interface AppErrorOptions {
  code: string;
  statusCode?: number;
  cause?: unknown;
  details?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Generic application error with a stable machine-readable `code`, an
 * optional HTTP `statusCode`, and free-form `details`/`metadata`. Prefer
 * this (or a subclass of it) over throwing plain strings or bare `Error`s
 * for anything an API boundary needs to branch on.
 */
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number | undefined;
  readonly details: unknown;
  readonly metadata: Record<string, unknown> | undefined;

  constructor(message: string, options: AppErrorOptions) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.metadata = options.metadata;

    // Restore prototype chain (needed when targeting ES2022 down-compiled
    // by some bundlers) so `instanceof AppError` keeps working.
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/** Convenience factory for {@link AppError}. */
export function createError(message: string, options: AppErrorOptions): AppError {
  return new AppError(message, options);
}

function isObjectWithMessage(value: unknown): value is { message: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function isObjectWithCode(value: unknown): value is { code: string | number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    (typeof (value as { code: unknown }).code === 'string' ||
      typeof (value as { code: unknown }).code === 'number')
  );
}
