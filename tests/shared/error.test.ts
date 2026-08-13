import { describe, expect, it } from 'vitest';
import {
  isError, getErrorMessage, getErrorStack, getErrorCode, toError, serializeError,
  AppError, createError,
} from '../../src/shared/error/error.js';

describe('error utilities', () => {
  it('isError only matches real Error instances', () => {
    expect(isError(new Error('x'))).toBe(true);
    expect(isError('x')).toBe(false);
    expect(isError({ message: 'x' })).toBe(false);
  });

  it('getErrorMessage extracts a message from any thrown value without throwing', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('plain string')).toBe('plain string');
    expect(getErrorMessage({ message: 'obj message' })).toBe('obj message');
    expect(getErrorMessage(42)).toBe('42');
  });

  it('getErrorStack/getErrorCode', () => {
    const err = new Error('x');
    expect(getErrorStack(err)).toContain('Error: x');
    expect(getErrorStack('not an error')).toBeUndefined();

    const withCode = Object.assign(new Error('x'), { code: 'ECONNRESET' });
    expect(getErrorCode(withCode)).toBe('ECONNRESET');
    expect(getErrorCode(new Error('x'))).toBeUndefined();
  });

  it('toError wraps non-Error values, preserving them as cause', () => {
    const original = new Error('original');
    expect(toError(original)).toBe(original);

    const wrapped = toError('just a string');
    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped.cause).toBe('just a string');
  });

  it('serializeError only includes name/message/stack/code/cause, not arbitrary properties', () => {
    const sensitive = Object.assign(new Error('failed'), {
      code: 'E_FAIL',
      password: 'should-not-leak',
    });

    const serialized = serializeError(sensitive);
    expect(serialized.name).toBe('Error');
    expect(serialized.message).toBe('failed');
    expect(serialized.code).toBe('E_FAIL');
    expect(serialized).not.toHaveProperty('password');
  });

  it('serializeError recurses through cause chains', () => {
    const root = new Error('root cause');
    const wrapped = new Error('wrapper', { cause: root });
    const serialized = serializeError(wrapped);
    expect(serialized.cause?.message).toBe('root cause');
  });

  it('AppError carries code/statusCode/details/metadata and preserves instanceof', () => {
    const err = createError('Something failed', {
      code: 'SOMETHING_FAILED',
      statusCode: 500,
      details: { field: 'email' },
    });

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('SOMETHING_FAILED');
    expect(err.statusCode).toBe(500);
    expect(err.details).toEqual({ field: 'email' });
  });
});
