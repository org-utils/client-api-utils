// Number
export { clamp } from './number/clamp.js';
export {
  inRange,
  round,
  floor,
  ceil,
  percentage,
  percentageOf,
  randomInt,
  randomFloat,
  formatNumber,
  formatCurrency,
  isInteger,
  isFiniteNumber,
  isNaNValue,
} from './number/number.js';

// Validation
export { isDefined } from './validation/is-defined.js';
export {
  isNullish,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isFunction,
  isPromise,
  isDate,
  isRegExp,
  isURL,
  isEmail,
  isUUID,
  isPositive,
  isNonEmptyString,
  assert,
  assertDefined,
  assertString,
  assertNumber,
} from './validation/validation.js';

// Array
export {
  chunk,
  compact,
  unique,
  uniqueBy,
  groupBy,
  partition,
  difference,
  intersection,
  union,
  flatten,
  flattenDeep,
  first,
  last,
  take,
  takeRight,
  drop,
  dropRight,
  shuffle,
  sample,
  range,
  zip,
  zipWith,
  move,
  removeAt,
  insertAt,
} from './array/array.js';

// Object
export {
  isPlainObject,
  isObject,
  isEmptyObject,
  hasOwn,
  pick,
  omit,
  keys,
  values,
  entries,
  get,
  set,
  unset,
  deepGet,
  deepSet,
  deepMerge,
  merge,
  mapValues,
  mapKeys,
  invert,
} from './object/object.js';

// String
export {
  capitalize,
  uncapitalize,
  camelCase,
  pascalCase,
  kebabCase,
  snakeCase,
  slugify,
  truncate,
  truncateMiddle,
  stripHtml,
  normalizeWhitespace,
  removeWhitespace,
  escapeHtml,
  unescapeHtml,
  mask,
  redact,
  isBlank,
  randomString,
} from './string/string.js';

// Function
export {
  noop,
  identity,
  once,
  memoize,
  debounce,
  throttle,
  compose,
  pipe,
  curry,
  partial,
  negate,
  wrap,
  type Cancelable,
} from './function/function.js';

// JSON
export {
  safeJSONParse,
  safeJSONStringify,
  parseJSON,
  stringifyJSON,
  tryParseJSON,
  type JSONParseResult,
} from './json/json.js';

// Error
export {
  isError,
  getErrorMessage,
  getErrorStack,
  getErrorCode,
  toError,
  serializeError,
  normalizeError,
  createError,
  AppError,
  type AppErrorOptions,
  type SerializedError,
} from './error/error.js';

// URL
export {
  joinURL,
  normalizeURL,
  getURLOrigin,
  getURLPath,
  getQueryParams,
  parseQuery,
  stringifyQuery,
  addQueryParams,
  removeQueryParams,
  getQueryParam,
} from './url/url.js';

// IDs
export { generateUUID, generateRandomId, generateDeviceId } from './ids/ids.js';

// Types
export type { DeepPartial } from './types/deep-partial.js';
export type {
  Nullable,
  Maybe,
  OptionalValue,
  DeepRequired,
  DeepReadonly,
  Mutable,
  Prettify,
  Merge,
  Exact,
  ValueOf,
  KeysOfUnion,
  ArrayElement,
  PromiseValue,
} from './types/utility-types.js';

// Encoding
export {
  utf8Encode,
  utf8Decode,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64Encode,
  base64Decode,
  base64UrlEncode,
  base64UrlDecode,
  hexEncode,
  hexDecode,
} from './encoding/encoding.js';

// Collection
export { mapToObject, objectToMap, setToArray, arrayToSet, countBy, keyBy } from './collection/collection.js';

// Result
export {
  Ok,
  Err,
  isOk,
  isErr,
  mapResult,
  mapErr,
  unwrapOr,
  tryCatch,
  tryCatchAsync,
  type Result,
} from './result/result.js';

// User agent
export {
  parseBrowserFromUA,
  parseOSFromUA,
  isMobileUA,
  isTabletUA,
  deviceTypeFromUA,
  isBotUA,
  type UABrowserInfo,
  type UAOSInfo,
} from './user-agent/user-agent.js';

// HTTP
export {
  isSuccessStatus,
  isRedirectStatus,
  isClientErrorStatus,
  isServerErrorStatus,
  isRetryableStatus,
  getStatusText,
  parseContentType,
  isJsonContentType,
  type ParsedContentType,
} from './http/http.js';

// Cache
export { LRUCache } from './cache/lru-cache.js';
export { TTLCache, type TTLCacheOptions } from './cache/ttl-cache.js';
export { memoizeWithTTL, type MemoizeWithTTLOptions } from './cache/memoize-with-ttl.js';

// Async
export { sleep } from './async/sleep.js';
export { deferred, type Deferred } from './async/deferred.js';
export { timeout, withTimeout, TimeoutError } from './async/timeout.js';
export { retry, retryWithBackoff, type RetryOptions } from './async/retry.js';
export { poll, until, type PollOptions } from './async/poll.js';
export {
  allSettled,
  concurrently,
  sequential,
  type SettledResults,
} from './async/combinators.js';
export { dedupePromise, memoizeAsync, type MemoizeAsyncOptions } from './async/memoize-async.js';

// Concurrency
export { Semaphore } from './concurrency/semaphore.js';
export { Mutex } from './concurrency/mutex.js';
export { ConcurrencyLimiter } from './concurrency/concurrency-limiter.js';
export { RateLimiter, type RateLimiterOptions } from './concurrency/rate-limiter.js';
