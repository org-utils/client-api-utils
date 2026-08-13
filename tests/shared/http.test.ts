import { describe, expect, it } from 'vitest';
import {
  isSuccessStatus, isRedirectStatus, isClientErrorStatus, isServerErrorStatus, isRetryableStatus,
  getStatusText, parseContentType, isJsonContentType,
} from '../../src/shared/http/http.js';

describe('HTTP status utilities', () => {
  it('classify status code ranges correctly, including boundaries', () => {
    expect(isSuccessStatus(200)).toBe(true);
    expect(isSuccessStatus(299)).toBe(true);
    expect(isSuccessStatus(300)).toBe(false);
    expect(isSuccessStatus(199)).toBe(false);

    expect(isRedirectStatus(301)).toBe(true);
    expect(isClientErrorStatus(404)).toBe(true);
    expect(isServerErrorStatus(503)).toBe(true);
  });

  it('isRetryableStatus matches the documented set only', () => {
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
  });

  it('getStatusText returns known reason phrases, undefined for unmapped codes', () => {
    expect(getStatusText(404)).toBe('Not Found');
    expect(getStatusText(499)).toBeUndefined();
  });
});

describe('content-type utilities', () => {
  it('parseContentType extracts the media type and parameters', () => {
    expect(parseContentType('application/json; charset=utf-8')).toEqual({
      type: 'application/json',
      parameters: { charset: 'utf-8' },
    });
  });

  it('parseContentType handles quoted parameter values and no parameters', () => {
    expect(parseContentType('multipart/form-data; boundary="abc123"').parameters.boundary).toBe('abc123');
    expect(parseContentType('text/plain')).toEqual({ type: 'text/plain', parameters: {} });
  });

  it('isJsonContentType matches application/json and +json suffixes, rejects others', () => {
    expect(isJsonContentType('application/json')).toBe(true);
    expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
    expect(isJsonContentType('application/vnd.api+json')).toBe(true);
    expect(isJsonContentType('text/html')).toBe(false);
  });
});
