import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getEnv, requireEnv, getBooleanEnv, getNumberEnv, getListEnv } from '../../src/server/environment.js';

describe('environment utilities', () => {
  const KEY = 'ORG_UTILS_TEST_VAR';

  beforeEach(() => {
    delete process.env[KEY];
  });

  afterEach(() => {
    delete process.env[KEY];
  });

  it('getEnv reads a set variable and returns fallback when unset', () => {
    process.env[KEY] = 'hello';
    expect(getEnv(KEY)).toBe('hello');
    delete process.env[KEY];
    expect(getEnv(KEY, 'fallback')).toBe('fallback');
  });

  it('requireEnv throws with an actionable message when unset', () => {
    expect(() => requireEnv(KEY)).toThrow(/ORG_UTILS_TEST_VAR/);
    process.env[KEY] = 'value';
    expect(requireEnv(KEY)).toBe('value');
  });

  it('getBooleanEnv parses common truthy/falsy spellings case-insensitively', () => {
    process.env[KEY] = 'YES';
    expect(getBooleanEnv(KEY)).toBe(true);
    process.env[KEY] = '0';
    expect(getBooleanEnv(KEY)).toBe(false);
    delete process.env[KEY];
    expect(getBooleanEnv(KEY, true)).toBe(true);
  });

  it('getBooleanEnv throws on an unrecognized value instead of guessing', () => {
    process.env[KEY] = 'maybe';
    expect(() => getBooleanEnv(KEY)).toThrow();
  });

  it('getNumberEnv parses numbers and throws on invalid input', () => {
    process.env[KEY] = '42.5';
    expect(getNumberEnv(KEY)).toBe(42.5);
    process.env[KEY] = 'not-a-number';
    expect(() => getNumberEnv(KEY)).toThrow();
  });

  it('getListEnv splits, trims, and drops empty entries', () => {
    process.env[KEY] = ' a, b ,, c ';
    expect(getListEnv(KEY)).toEqual(['a', 'b', 'c']);
    delete process.env[KEY];
    expect(getListEnv(KEY, { fallback: ['x'] })).toEqual(['x']);
  });
});
