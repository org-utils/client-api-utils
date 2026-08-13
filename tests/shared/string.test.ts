import { describe, expect, it } from 'vitest';
import {
  capitalize, uncapitalize, camelCase, pascalCase, kebabCase, snakeCase, slugify,
  truncate, truncateMiddle, stripHtml, normalizeWhitespace, removeWhitespace,
  escapeHtml, unescapeHtml, mask, redact, isBlank, randomString,
} from '../../src/shared/string/string.js';

describe('string utilities', () => {
  it('capitalize/uncapitalize handle empty strings', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('')).toBe('');
    expect(uncapitalize('Hello')).toBe('hello');
  });

  it('case conversions handle spaced, kebab, snake, and camel input', () => {
    expect(camelCase('hello world')).toBe('helloWorld');
    expect(camelCase('hello-world_again')).toBe('helloWorldAgain');
    expect(pascalCase('hello world')).toBe('HelloWorld');
    expect(kebabCase('Hello World')).toBe('hello-world');
    expect(kebabCase('helloWorld')).toBe('hello-world');
    expect(snakeCase('Hello World')).toBe('hello_world');
  });

  it('slugify strips diacritics and collapses non-alphanumerics', () => {
    expect(slugify('Café Déjà Vu!')).toBe('cafe-deja-vu');
    expect(slugify('  Hello   World  ')).toBe('hello-world');
  });

  it('truncate appends a suffix within maxLength', () => {
    expect(truncate('Hello World', 8)).toBe('Hello W…');
    expect(truncate('Hi', 8)).toBe('Hi');
  });

  it('truncateMiddle keeps start and end and respects maxLength', () => {
    const result = truncateMiddle('abcdefghijklmnop', 10);
    expect(result).toBe('abcde…mnop');
    expect(result.length).toBe(10);
    expect(truncateMiddle('short', 10)).toBe('short');
  });

  it('stripHtml removes tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('normalizeWhitespace/removeWhitespace', () => {
    expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
    expect(removeWhitespace('a b\tc\nd')).toBe('abcd');
  });

  it('escapeHtml/unescapeHtml round-trip', () => {
    const raw = `<script>alert('x & y')</script>`;
    const escaped = escapeHtml(raw);
    expect(escaped).not.toContain('<script>');
    expect(unescapeHtml(escaped)).toBe(raw);
  });

  it('mask keeps only the last N characters visible', () => {
    expect(mask('4111111111111111', 4)).toBe('************1111');
    expect(mask('abc', 4)).toBe('abc'); // shorter than visibleChars, unchanged
  });

  it('redact fully redacts by default', () => {
    expect(redact('secret')).toBe('******');
    expect(redact('secret', 2)).toBe('****et');
  });

  it('isBlank', () => {
    expect(isBlank('   ')).toBe(true);
    expect(isBlank('')).toBe(true);
    expect(isBlank('a')).toBe(false);
  });

  it('randomString generates the requested length from the charset', () => {
    const s = randomString(12, 'ab');
    expect(s).toHaveLength(12);
    expect(s).toMatch(/^[ab]+$/);
  });

  it('randomString throws on invalid length', () => {
    expect(() => randomString(-1)).toThrow(RangeError);
  });
});
