/**
 * @org-utils/utils — root entry point.
 *
 * Everything exported here MUST be safe to run in any JavaScript
 * environment: browser, Node.js, Deno, Bun, or a Worker/edge runtime.
 *
 * Nothing in this file (or anything it imports) may reference `window`,
 * `document`, `navigator`, `localStorage`, `process`, `Buffer`, or any
 * `node:*` built-in. Environment-specific utilities live in the
 * `@org-utils/utils/client` and `@org-utils/utils/server` entry points
 * instead — see src/client.ts and src/server.ts.
 */

export * from './shared/index.js';

// Additional shared utilities (array, object, string, async, function,
// error, url, json, ids, types — see the project spec) land here in
// Phase 2 onward.
