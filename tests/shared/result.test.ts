import { describe, expect, it } from 'vitest';
import { Ok, Err, isOk, isErr, mapResult, mapErr, unwrapOr, tryCatch, tryCatchAsync } from '../../src/shared/result/result.js';

describe('Result utilities', () => {
  it('isOk/isErr correctly discriminate', () => {
    expect(isOk(Ok(1))).toBe(true);
    expect(isErr(Ok(1))).toBe(false);
    expect(isOk(Err('x'))).toBe(false);
    expect(isErr(Err('x'))).toBe(true);
  });

  it('mapResult transforms the success value, passes through failures unchanged', () => {
    expect(mapResult(Ok(2), (n) => n * 2)).toEqual(Ok(4));
    expect(mapResult(Err('bad'), (n: number) => n * 2)).toEqual(Err('bad'));
  });

  it('mapErr transforms the error, passes through successes unchanged', () => {
    expect(mapErr(Err('bad'), (e) => `wrapped: ${e}`)).toEqual(Err('wrapped: bad'));
    expect(mapErr(Ok(1), (e: string) => `wrapped: ${e}`)).toEqual(Ok(1));
  });

  it('unwrapOr returns the value or the fallback', () => {
    expect(unwrapOr(Ok(5), 0)).toBe(5);
    expect(unwrapOr(Err('bad'), 0)).toBe(0);
  });

  it('tryCatch converts a throw into an Err without propagating', () => {
    const result = tryCatch(() => {
      throw new Error('boom');
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect((result.error as Error).message).toBe('boom');
  });

  it('tryCatch passes through a successful return as Ok', () => {
    expect(tryCatch(() => 42)).toEqual(Ok(42));
  });

  it('tryCatchAsync converts a rejection into an Err', async () => {
    const result = await tryCatchAsync(async () => {
      throw new Error('async boom');
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect((result.error as Error).message).toBe('async boom');
  });
});
