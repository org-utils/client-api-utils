import { describe, expect, it } from 'vitest';
import {
  safeJSONParse, safeJSONStringify, parseJSON, stringifyJSON, tryParseJSON,
} from '../../src/shared/json/json.js';

describe('json utilities', () => {
  it('safeJSONParse returns fallback on invalid input instead of throwing', () => {
    expect(safeJSONParse('{"a":1}')).toEqual({ a: 1 });
    expect(safeJSONParse('not json', 'fallback')).toBe('fallback');
    expect(safeJSONParse('not json')).toBeUndefined();
  });

  it('safeJSONStringify returns fallback on circular references', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(safeJSONStringify(circular, 'fallback')).toBe('fallback');
    expect(safeJSONStringify({ a: 1 })).toBe('{"a":1}');
  });

  it('parseJSON/stringifyJSON throw on failure, unlike the safe variants', () => {
    expect(() => parseJSON('not json')).toThrow(SyntaxError);
    expect(parseJSON('{"a":1}')).toEqual({ a: 1 });
    expect(stringifyJSON({ a: 1 })).toBe('{"a":1}');
  });

  it('tryParseJSON returns a discriminated result instead of throwing or swallowing', () => {
    const ok = tryParseJSON('{"a":1}');
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value).toEqual({ a: 1 });

    const fail = tryParseJSON('not json');
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.error).toBeInstanceOf(SyntaxError);
  });
});
