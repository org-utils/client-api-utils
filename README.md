# client-api-utils

Universal, dependency-light JavaScript/TypeScript utilities for browser, Node.js, and edge runtimes.

Built as an internal platform library, not a grab-bag of helpers: strict TypeScript, environment-isolated entry points, zero runtime dependencies, and every public export documented with TSDoc.

- ✅ Works in Node.js, browsers, Next.js, Express, Fastify, NestJS, serverless, Workers, CLIs
- ✅ Zero runtime dependencies — everything is hand-rolled on native Web/Node APIs
- ✅ Fully tree-shakeable (ESM + CJS builds, `sideEffects: false`)
- ✅ Environment isolation is enforced, not just documented — see [Package architecture](#package-architecture)
- ✅ Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and more)

---

## Installation

```bash
npm install client-api-utils
# or
pnpm add client-api-utils
# or
yarn add client-api-utils
```

## Quick start

```ts
import { clamp, retry, debounce, generateUUID } from 'client-api-utils';

import { getDeviceInfo, storage, copyToClipboard } from 'client-api-utils/client';

import { getClientIp, requireEnv, generateSecureToken } from 'client-api-utils/server';
```

---

## Package architecture

Three entry points, each with a different environment contract:

| Entry point | Safe in | Contains |
|---|---|---|
| `client-api-utils` | Browser **and** Node — anywhere | Everything environment-agnostic: arrays, objects, strings, numbers, functions, validation, async/concurrency, encoding, collections, `Result`, TS utility types, HTTP status helpers, cache primitives, user-agent parsing |
| `client-api-utils/client` | Browser (and SSR, safely) | Everything above, plus browser detection, device/viewport info, storage, clipboard, media/file helpers, network status |
| `client-api-utils/server` | Node.js only | Everything universal, plus `node:crypto`-backed security utilities, client IP/request metadata, environment variable helpers |

**This isn't just a naming convention.** The isolation is enforced two ways:

1. **Lint-time**: an ESLint rule (`no-restricted-imports`) hard-fails any `node:*` import anywhere under `src/client/**`.
2. **Test-time**: `tests/environment-isolation.test.ts` walks the *entire compiled dependency tree* of the root and client entry points (every file transitively imported, not just the entry file) and asserts none of them reference `node:*`, `Buffer`, `process`, or (for the root entry) browser-only globals like `window`/`document`/`localStorage`.

The `server` entry point is the *only* one permitted to import Node built-ins. Never import it from a browser bundle — bundlers that can't polyfill Node built-ins will fail the build outright, and the ones that can will silently bloat your client bundle for nothing.

### Why three entry points and not one

A single entry point that "just works everywhere" either has to lazily feature-detect every API (slower, harder to reason about, and it still ships browser-detection code to your Node server and vice versa) or silently no-ops half its exports depending on where it's imported. Splitting by entry point means:

- Your bundler's tree-shaking has a much easier job — `client-api-utils/server` is never even parsed by a browser bundler unless you explicitly import it.
- Every function's environment contract is visible from the import path alone.
- The "used a browser API on the server" or "used `node:fs` in client code" class of bug becomes a build-time error instead of a runtime surprise.

---

## Root utilities (`client-api-utils`)

Safe anywhere — no `window`/`document`/`navigator`/`localStorage`/`process`/`Buffer`/`node:*` required, ever.

```ts
import {
  // Arrays
  chunk, compact, unique, uniqueBy, groupBy, partition, difference, intersection, union,
  flatten, flattenDeep, first, last, take, takeRight, drop, dropRight, shuffle, sample,
  range, zip, zipWith, move, removeAt, insertAt,

  // Objects
  pick, omit, keys, values, entries, hasOwn, get, set, unset, deepGet, deepSet, deepMerge,
  merge, mapValues, mapKeys, invert, isPlainObject, isObject, isEmptyObject,

  // Strings
  capitalize, uncapitalize, camelCase, pascalCase, kebabCase, snakeCase, slugify,
  truncate, truncateMiddle, stripHtml, normalizeWhitespace, removeWhitespace,
  escapeHtml, unescapeHtml, mask, redact, isBlank, randomString,

  // Numbers
  clamp, inRange, round, floor, ceil, percentage, percentageOf, randomInt, randomFloat,
  formatNumber, formatCurrency, isInteger, isFiniteNumber, isNaNValue,

  // Functions
  noop, identity, once, memoize, debounce, throttle, compose, pipe, curry, partial, negate, wrap,

  // Validation
  isDefined, isNullish, isString, isNumber, isBoolean, isArray, isFunction, isPromise,
  isDate, isRegExp, isURL, isEmail, isUUID, isPositive, isNonEmptyString,
  assert, assertDefined, assertString, assertNumber,

  // Async
  sleep, deferred, timeout, withTimeout, retry, retryWithBackoff, poll, until,
  allSettled, concurrently, sequential, dedupePromise, memoizeAsync,

  // Concurrency
  Semaphore, Mutex, ConcurrencyLimiter, RateLimiter,

  // Cache
  LRUCache, TTLCache, memoizeWithTTL,

  // Encoding
  base64Encode, base64Decode, base64UrlEncode, base64UrlDecode,
  hexEncode, hexDecode, utf8Encode, utf8Decode, arrayBufferToBase64, base64ToArrayBuffer,

  // IDs
  generateUUID, generateRandomId, generateDeviceId,

  // JSON
  safeJSONParse, safeJSONStringify, parseJSON, stringifyJSON, tryParseJSON,

  // Errors
  AppError, createError, isError, getErrorMessage, getErrorStack, getErrorCode,
  toError, serializeError, normalizeError,

  // URLs
  joinURL, normalizeURL, getURLOrigin, getURLPath, getQueryParams, parseQuery,
  stringifyQuery, addQueryParams, removeQueryParams, getQueryParam,

  // HTTP
  isSuccessStatus, isRedirectStatus, isClientErrorStatus, isServerErrorStatus,
  isRetryableStatus, getStatusText, parseContentType, isJsonContentType,

  // Collections
  mapToObject, objectToMap, setToArray, arrayToSet, countBy, keyBy,

  // Result
  Ok, Err, isOk, isErr, mapResult, mapErr, unwrapOr, tryCatch, tryCatchAsync,

  // User agent (pure parsing — see also client/server wrappers below)
  parseBrowserFromUA, parseOSFromUA, deviceTypeFromUA, isBotUA,
} from 'client-api-utils';

// Plus pure TypeScript utility types (zero runtime cost):
import type {
  DeepPartial, DeepRequired, DeepReadonly, Mutable, Prettify, Merge, Exact,
  Nullable, Maybe, ValueOf, KeysOfUnion, ArrayElement, PromiseValue, Result,
} from 'client-api-utils';
```

194 exports in total. See inline TSDoc in your editor for full signatures — every public export is documented, including complexity/mutation notes where relevant.

### A few worth calling out

**`retry` supports real production retry semantics**, not just a loop:

```ts
const data = await retry(() => fetchData(), {
  maxAttempts: 5,
  initialDelay: 250,
  maxDelay: 5000,
  factor: 2,
  jitter: true,
  shouldRetry: (err) => isRetryableStatus(getErrorCode(err) as number),
  signal: controller.signal,
});
```

**`LRUCache`/`TTLCache` never leak.** `TTLCache` expires entries lazily (on read) rather than via a background `setInterval` — a timer-based sweep would keep a Node process alive indefinitely just because a cache exists. Call `.cleanup()` yourself on whatever schedule your app already manages if you want proactive reclamation.

**`Result<T, E>` is fully opt-in.** Nothing else in the package produces or requires `Result` values — use it at your own API boundaries where it helps, ignore it everywhere else.

---

## Client utilities (`client-api-utils/client`)

Includes everything from the root, plus 28 browser-only exports. Every function here is SSR-safe: it checks for browser globals internally and returns a documented fallback (`undefined`, `false`, or a no-op) rather than throwing when they're absent — you never need to guard calls yourself.

```ts
import {
  isBrowser, getBrowserInfo, getOSInfo, isMobileDevice, isTablet, isDesktop,
  getLanguage, getTimezone, getOnlineStatus, onOnlineStatusChange,

  getDeviceInfo, getViewport, getScreenInfo,

  storage, localStorageAdapter, sessionStorageAdapter, memoryStorage,
  createMemoryStorage, createWebStorageAdapter,

  copyToClipboard, readClipboard, isClipboardSupported,

  isImageFile, isVideoFile, isAudioFile, getFileExtension, getMimeType, formatFileSize,
} from 'client-api-utils/client';
```

### Storage that never throws

```ts
storage.set('user-prefs', { theme: 'dark' }); // -> boolean: did it actually persist?
storage.get<{ theme: string }>('user-prefs'); // -> value | undefined

const wasPersisted = storage.set('big-blob', hugeObject);
if (!wasPersisted) {
  // localStorage was full/unavailable/private-mode — the value is still
  // readable via an automatic in-memory fallback for this page session,
  // but it will NOT survive a reload. `set()`'s return value tells you
  // which case you're in.
}
```

`storage` defaults to `localStorage`-backed with automatic memory fallback. Use `sessionStorageAdapter` or a fresh `createMemoryStorage()` when you want a different backing store explicitly.

### SSR example (Next.js)

```ts
// This file can be imported in both server and client components —
// every call here degrades safely when rendered on the server.
import { getDeviceInfo, isBrowser } from 'client-api-utils/client';

export function DeviceBadge() {
  const info = getDeviceInfo(); // undefined during SSR, populated after hydration
  if (!info) return null;
  return <span>{info.browser} on {info.operatingSystem}</span>;
}
```

---

## Server utilities (`client-api-utils/server`)

Includes everything from the root, plus 23 Node-only exports. Never import this in a browser bundle.

```ts
import {
  generateSecureToken, generateSecureRandomString, generateNonce, generateCSRFToken,
  timingSafeEqual, hashData,

  getClientIp, getForwardedFor,
  getHeader, getUserAgent, getRequestId,
  parseUserAgent, parseRequestUserAgent,
  getRequestHost, getRequestProtocol, getRequestOrigin, getRequestMetadata,

  getEnv, getOptionalEnv, requireEnv, getBooleanEnv, getNumberEnv, getListEnv,
} from 'client-api-utils/server';
```

### Request utilities are framework-agnostic by design

Every function that takes a "request" accepts a minimal structural type, not Express's or Fastify's specific `Request` class:

```ts
interface RequestLike {
  headers: Record<string, string | string[] | undefined> | { get(name: string): string | null };
  socket?: { remoteAddress?: string; encrypted?: boolean };
  ip?: string;
  protocol?: string;
  secure?: boolean;
}
```

This means the same `getClientIp(req)` call works unmodified against an Express `req`, a Fastify `req`, a raw `http.IncomingMessage`, or a Fetch-API-based `Request` (Hono, etc.) — whatever object you pass just needs to structurally match.

### `getClientIp` is secure by default

```ts
getClientIp(req); // ALWAYS the direct TCP peer address — ignores X-Forwarded-For entirely
getClientIp(req, { trustProxy: true }); // trusts X-Forwarded-For/X-Real-IP
```

`X-Forwarded-For` is a request header — anyone who can reach your server can set it to whatever they want. `trustProxy` defaults to `false` specifically so a spoofed header can never silently become your app's idea of "the client's IP." Only opt in if you control the proxy/load balancer in front of your app and it overwrites this header before forwarding.

### Environment variables with real validation

```ts
const port = getNumberEnv('PORT', 3000);       // throws if PORT is set but not a valid number
const debug = getBooleanEnv('DEBUG', false);    // accepts true/false, 1/0, yes/no, on/off
const dbUrl = requireEnv('DATABASE_URL');       // throws a clear error if unset — fails fast at boot
const origins = getListEnv('CORS_ORIGINS');     // "a, b, c" -> ['a', 'b', 'c']
```

---

## Security notes

- **Never implement custom cryptography.** Every security primitive here (`generateSecureToken`, `generateSecureRandomString`, `generateNonce`, `generateCSRFToken`) is backed by Node's `crypto` module (`randomBytes`/`randomInt`, both OS-CSPRNG-backed) or, in the universal `generateUUID`/`generateRandomId`, the Web Crypto API (`crypto.randomUUID`/`crypto.getRandomValues`). Nothing here uses `Math.random()` for anything security-sensitive.
- **`hashData` is not a password hasher.** It's a general-purpose one-way hash (ETags, cache keys, integrity checks) using standard fast hash functions. Fast hashes are brute-forceable at scale — for passwords, use a dedicated slow/memory-hard algorithm (bcrypt, scrypt, Argon2) from a purpose-built library instead.
- **`timingSafeEqual` hides content, not length.** Mismatched-length inputs return `false` immediately (not constant-time with respect to length). This matches the standard trade-off in most languages' equivalents — length is rarely the sensitive part of a secret, only whether the content matches is.
- **UA-derived data is a hint, never a security signal.** `getBrowserInfo`, `parseUserAgent`, `isBotUA`, device-type detection, etc. are all regex heuristics over a freely-spoofable string. Fine for analytics/logging; never gate access control or trust decisions on them.
- **File-type helpers (`isImageFile`, `getMimeType`, etc.) check filenames, not content.** A file can be renamed to any extension. Never treat these as a content-safety check for uploaded files — inspect actual file bytes server-side for that.
- **This package never trusts proxy headers by default** — see `getClientIp` above.

---

## Framework examples

<details>
<summary><strong>Express</strong></summary>

```ts
import express from 'express';
import { getClientIp, getRequestMetadata, requireEnv } from 'client-api-utils/server';
import { retry } from 'client-api-utils';

const app = express();
const PORT = requireEnv('PORT');

app.get('/whoami', (req, res) => {
  res.json(getRequestMetadata(req, { trustProxy: true }));
});

app.listen(PORT);
```
</details>

<details>
<summary><strong>Fastify</strong></summary>

```ts
import Fastify from 'fastify';
import { getClientIp, generateSecureToken } from 'client-api-utils/server';

const app = Fastify();

app.get('/session', async (req) => {
  return { sessionId: generateSecureToken(), ip: getClientIp(req, { trustProxy: true }) };
});

app.listen({ port: 3000 });
```
</details>

<details>
<summary><strong>NestJS</strong></summary>

```ts
import { Injectable } from '@nestjs/common';
import { getRequestMetadata, type RequestLike } from 'client-api-utils/server';

@Injectable()
export class RequestContextService {
  extract(req: RequestLike) {
    return getRequestMetadata(req, { trustProxy: true });
  }
}
```
</details>

<details>
<summary><strong>Next.js (App Router)</strong></summary>

```ts
// app/api/whoami/route.ts
import { NextRequest } from 'next/server';
import { getClientIp } from 'client-api-utils/server';

export function GET(req: NextRequest) {
  const ip = getClientIp(
    { headers: req.headers, ip: req.ip },
    { trustProxy: true },
  );
  return Response.json({ ip });
}
```

```tsx
// app/components/device-badge.tsx ('use client')
'use client';
import { getDeviceInfo } from 'client-api-utils/client';

export function DeviceBadge() {
  const info = getDeviceInfo();
  return <span>{info?.deviceType ?? 'unknown'}</span>;
}
```
</details>

<details>
<summary><strong>React (browser-only component)</strong></summary>

```tsx
import { useState } from 'react';
import { copyToClipboard, formatFileSize } from 'client-api-utils/client';

export function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => setCopied(await copyToClipboard(text))}>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}
```
</details>

<details>
<summary><strong>CLI / Node script</strong></summary>

```ts
#!/usr/bin/env node
import { requireEnv, hashData } from 'client-api-utils/server';
import { formatFileSize } from 'client-api-utils'; // works fine outside a browser too if you only need the pure logic

const apiKey = requireEnv('API_KEY');
console.log('Config hash:', hashData(apiKey));
```
</details>

---

## Tree-shaking

The package ships `"sideEffects": false` and is bundled per-entry-point with `tsup`, so a bundler that supports tree-shaking (Webpack 5, Rollup, esbuild, Vite, Next.js) will only include the specific exports you actually import:

```ts
import { clamp } from 'client-api-utils'; // only clamp's code (plus nothing) ends up in your bundle
```

Because `client-api-utils/server` is a physically separate bundle from `client-api-utils/client`, a browser bundler that never sees an import of `client-api-utils/server` won't even parse it — you don't need tree-shaking to save you from accidentally shipping `node:crypto` to the browser; the entry-point split prevents it structurally.

## SSR considerations

Every function in `client-api-utils/client` is written to be import-safe and call-safe during server-side rendering:

- No browser global is ever accessed at **module load time** — only inside function bodies, at call time.
- Every function that needs a browser API (`getDeviceInfo`, `getViewport`, `storage`, `copyToClipboard`, etc.) checks for that API's availability first and returns a documented fallback (`undefined`, `false`, a no-op unsubscribe, etc.) instead of throwing.
- `storage` specifically: on the server, every `get()` returns `undefined` and every `set()` returns `false` (meaning "not persisted") but does **not** throw — write code the same way regardless of whether it might render server-side.

This is enforced by `tests/environment-isolation.test.ts`, not just documented — see [Package architecture](#package-architecture).

---

## TypeScript

Strict mode throughout, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. If you're consuming this package from a project with looser `tsconfig.json` settings, the types will still be accurate — you just won't get the same level of enforcement in your own code.

## Requirements

- Node.js >= 18.17 (for the `server` entry point and for running tests/build tooling)
- Any modern browser for the `client` entry point (uses `URL`, `URLSearchParams`, `TextEncoder`/`TextDecoder`, `crypto.randomUUID` — all broadly supported in evergreen browsers)

## License

MIT — see [LICENSE](./LICENSE).
