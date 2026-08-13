/**
 * @org-utils/utils/client — browser-safe entry point.
 *
 * Safe to import from browser bundles, React/Next.js client components,
 * and any SSR context. Nothing here imports `node:*` built-ins, `process`,
 * or `Buffer` — that guarantee is enforced both by the ESLint config
 * (no-restricted-imports on this directory) and by a build-time smoke
 * test (see tests/environment-isolation.test.ts).
 *
 * Browser globals (`window`, `document`, `navigator`, `localStorage`) are
 * only ever accessed inside function bodies at call time, never during
 * module initialization, so this entry point is also safe to import
 * during SSR — every function that needs a browser API returns a safe
 * fallback (`undefined`/`false`/a no-op) rather than throwing when one
 * isn't available.
 */

export * from './shared/index.js';
export * from './client/index.js';
