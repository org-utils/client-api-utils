import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC_ROOT = resolve(__dirname, '../src');

/** Recursively collects every .ts file under `dir` (relative to src/). */
function collectSourceFiles(dir: string): string[] {
  const abs = join(SRC_ROOT, dir);
  const entries = readdirSync(abs, { withFileTypes: true });

  const files: string[] = [];
  for (const entry of entries) {
    const relPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(relPath));
    } else if (entry.name.endsWith('.ts')) {
      files.push(relPath);
    }
  }
  return files;
}

/** Strips block comments so pattern checks only match real code, not doc-comments that merely *mention* a forbidden global while documenting the constraint. */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readCode(relPath: string): string {
  return codeOnly(readFileSync(join(SRC_ROOT, relPath), 'utf-8'));
}

const NODE_ONLY_PATTERN = /from ['"]node:|(?<!\w)Buffer\.|process\.env|process\.platform|process\.version/;
const BROWSER_ONLY_PATTERN = /(?<!\w)(window|document|navigator|localStorage|sessionStorage)\b/;

describe('root entry point (@org-utils/utils) - every file in shared/', () => {
  // The root entry (src/index.ts) only ever imports from src/shared/**,
  // so that's the complete transitive dependency set to check.
  const files = ['index.ts', ...collectSourceFiles('shared')];

  it('has a non-trivial number of files to check (sanity check the test itself)', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it.each(files)('%s does not reference Node-only APIs', (file) => {
    expect(readCode(file)).not.toMatch(NODE_ONLY_PATTERN);
  });

  it.each(files)('%s does not reference browser-only globals', (file) => {
    expect(readCode(file)).not.toMatch(BROWSER_ONLY_PATTERN);
  });

  it('imports and runs correctly with real values (not just a static check)', async () => {
    const root = await import('../src/index.js');
    expect(root.clamp(15, 0, 10)).toBe(10);
    expect(root.isDefined(undefined)).toBe(false);
    expect(root.base64Decode(root.base64Encode('hello'))).toBe('hello');
    const cache = new root.LRUCache<string, number>({ maxSize: 1 });
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });
});

describe('client entry point (@org-utils/utils/client) - every file in shared/ + client/', () => {
  // client.ts imports from src/shared/** and src/client/** only (never
  // src/server/**), so that's the complete transitive dependency set.
  const files = ['client.ts', ...collectSourceFiles('shared'), ...collectSourceFiles('client')];

  it('has a non-trivial number of files to check (sanity check the test itself)', () => {
    expect(files.length).toBeGreaterThan(35);
  });

  it.each(files)('%s does not import any node:* built-in or use Buffer/process', (file) => {
    expect(readCode(file)).not.toMatch(NODE_ONLY_PATTERN);
  });

  it('imports correctly under plain Node (no browser globals) and every function degrades safely', async () => {
    const client = await import('../src/client.js');

    expect(client.isBrowser()).toBe(false);
    expect(client.getDeviceInfo()).toBeUndefined();
    expect(client.getViewport()).toBeUndefined();
    expect(() => client.storage.set('k', 'v')).not.toThrow();
    await expect(client.copyToClipboard('x')).resolves.toBe(false);

    // Shared utilities are still available from the client entry point.
    expect(client.clamp(5, 0, 10)).toBe(5);
  });
});

describe('server entry point (@org-utils/utils/server)', () => {
  it('DOES use node:crypto (sanity check: confirms the isolation tests above are not vacuous)', () => {
    const cryptoSource = readCode('server/crypto.ts');
    expect(cryptoSource).toMatch(/from ['"]node:crypto['"]/);
  });

  it('works in Node and produces a secure, URL-safe token', async () => {
    const { generateSecureToken } = await import('../src/server.js');

    const token = generateSecureToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet only
    expect(generateSecureToken()).not.toBe(token); // two calls never collide in practice
  });

  it('rejects invalid byteLength instead of silently producing a weak token', async () => {
    const { generateSecureToken } = await import('../src/server.js');

    expect(() => generateSecureToken(0)).toThrow(RangeError);
    expect(() => generateSecureToken(-1)).toThrow(RangeError);
    expect(() => generateSecureToken(1.5)).toThrow(RangeError);
  });

  it('also re-exports every shared/universal utility', async () => {
    const server = await import('../src/server.js');
    expect(server.clamp(15, 0, 10)).toBe(10);
    expect(typeof server.LRUCache).toBe('function');
    expect(typeof server.isRetryableStatus).toBe('function');
  });
});
