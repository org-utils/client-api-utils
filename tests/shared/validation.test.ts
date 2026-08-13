import { describe, expect, it } from 'vitest';
import {
  isNullish, isString, isNumber, isBoolean, isArray, isFunction, isPromise, isDate,
  isRegExp, isURL, isEmail, isUUID, isPositive, isNonEmptyString,
  assert, assertDefined, assertString, assertNumber,
} from '../../src/shared/validation/validation.js';
import { isDefined } from '../../src/shared/validation/is-defined.js';

describe('validation utilities', () => {
  it('isDefined/isNullish are complementary', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
    expect(isNullish(null)).toBe(true);
    expect(isNullish(0)).toBe(false);
  });

  it('primitive type guards do not coerce', () => {
    expect(isString('a')).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isNumber(1)).toBe(true);
    expect(isNumber('1')).toBe(false);
    expect(isBoolean(true)).toBe(true);
    expect(isArray([1, 2])).toBe(true);
    expect(isArray('12')).toBe(false);
  });

  it('isFunction/isPromise', () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction({})).toBe(false);
    expect(isPromise(Promise.resolve(1))).toBe(true);
    expect(isPromise({ then: () => {} })).toBe(true); // thenable
    expect(isPromise({})).toBe(false);
  });

  it('isDate rejects Invalid Date', () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date('not a date'))).toBe(false);
    expect(isDate('2024-01-01')).toBe(false);
  });

  it('isRegExp', () => {
    expect(isRegExp(/a/)).toBe(true);
    expect(isRegExp('a')).toBe(false);
  });

  it('isURL validates via the URL constructor', () => {
    expect(isURL('https://example.com')).toBe(true);
    expect(isURL('not a url')).toBe(false);
    expect(isURL('ftp://example.com', ['https'])).toBe(false);
  });

  it('isEmail is a pragmatic heuristic, not RFC-complete', () => {
    expect(isEmail('a@b.com')).toBe(true);
    expect(isEmail('not-an-email')).toBe(false);
  });

  it('isUUID validates format only', () => {
    expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isUUID('not-a-uuid')).toBe(false);
  });

  it('isPositive/isNonEmptyString', () => {
    expect(isPositive(1)).toBe(true);
    expect(isPositive(0)).toBe(false);
    expect(isPositive(-1)).toBe(false);
    expect(isNonEmptyString('a')).toBe(true);
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('assert throws TypeError with message on falsy condition', () => {
    expect(() => assert(false, 'nope')).toThrow(TypeError);
    expect(() => assert(true)).not.toThrow();
  });

  it('assertDefined/assertString/assertNumber narrow and throw appropriately', () => {
    expect(() => assertDefined(undefined)).toThrow(TypeError);
    expect(() => assertDefined(0)).not.toThrow();
    expect(() => assertString(5)).toThrow(TypeError);
    expect(() => assertNumber(NaN)).toThrow(TypeError);
    expect(() => assertNumber(5)).not.toThrow();
  });
});
