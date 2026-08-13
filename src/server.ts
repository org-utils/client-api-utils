/**
 * @org-utils/utils/server — Node.js-only entry point.
 *
 * This is the ONLY entry point permitted to import `node:*` built-ins.
 * Never import this file from browser/client bundles — bundlers that
 * can't polyfill Node built-ins will fail the build, and even those that
 * can will bloat the client bundle for nothing.
 */

export * from './shared/index.js';
export * from './server/index.js';
