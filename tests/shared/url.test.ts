import { describe, expect, it } from 'vitest';
import {
  joinURL, normalizeURL, getURLOrigin, getURLPath, getQueryParams, parseQuery,
  stringifyQuery, addQueryParams, removeQueryParams, getQueryParam,
} from '../../src/shared/url/url.js';

describe('url utilities', () => {
  it('joinURL joins segments with exactly one slash', () => {
    expect(joinURL('https://api.example.com/', '/v1/', '/users')).toBe(
      'https://api.example.com/v1/users',
    );
    expect(joinURL('a', 'b', 'c')).toBe('a/b/c');
  });

  it('normalizeURL resolves relative paths and default formatting', () => {
    expect(normalizeURL('/path', 'https://example.com')).toBe('https://example.com/path');
  });

  it('getURLOrigin/getURLPath return undefined for invalid URLs instead of throwing', () => {
    expect(getURLOrigin('https://example.com:8080/a/b')).toBe('https://example.com:8080');
    expect(getURLOrigin('not a url')).toBeUndefined();
    expect(getURLPath('https://example.com/a/b?x=1')).toBe('/a/b');
    expect(getURLPath('not a url')).toBeUndefined();
  });

  it('getQueryParams keeps only the last value per key', () => {
    expect(getQueryParams('https://example.com?a=1&a=2&b=3')).toEqual({ a: '2', b: '3' });
  });

  it('parseQuery preserves repeated keys as arrays', () => {
    expect(parseQuery('a=1&a=2&b=3')).toEqual({ a: ['1', '2'], b: ['3'] });
  });

  it('stringifyQuery serializes arrays as repeated keys', () => {
    expect(stringifyQuery({ a: [1, 2], b: 'x' })).toBe('a=1&a=2&b=x');
  });

  it('addQueryParams/removeQueryParams/getQueryParam', () => {
    const withParams = addQueryParams('https://example.com', { a: 1, b: 'x' });
    expect(getQueryParam(withParams, 'a')).toBe('1');

    const removed = removeQueryParams(withParams, ['a']);
    expect(getQueryParam(removed, 'a')).toBeUndefined();
    expect(getQueryParam(removed, 'b')).toBe('x');
  });
});
