// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import {
  storage, localStorageAdapter, sessionStorageAdapter, memoryStorage, createMemoryStorage,
} from '../../src/client/storage.js';

describe('storage adapters (jsdom)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('storage (localStorage-backed) round-trips JSON values', () => {
    expect(storage.set('user', { id: 1, tags: ['a', 'b'] })).toBe(true);
    expect(storage.get('user')).toEqual({ id: 1, tags: ['a', 'b'] });
    expect(storage.has('user')).toBe(true);
    storage.remove('user');
    expect(storage.has('user')).toBe(false);
  });

  it('storage.get returns undefined for missing or invalid JSON', () => {
    expect(storage.get('nope')).toBeUndefined();
    window.localStorage.setItem('corrupt', 'not valid json{{{');
    expect(storage.get('corrupt')).toBeUndefined();
  });

  it('falls back to memory and returns false when localStorage.setItem throws', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    };

    expect(storage.set('big', 'value')).toBe(false); // reports it did NOT persist
    expect(storage.get('big')).toBe('value'); // but it's still retrievable via fallback

    window.localStorage.setItem = original;
  });

  it('sessionStorageAdapter and localStorageAdapter are independent', () => {
    sessionStorageAdapter.set('k', 'session-value');
    expect(window.sessionStorage.getItem('k')).not.toBeNull();
    expect(window.localStorage.getItem('k')).toBeNull();
  });

  it('memoryStorage never touches real browser storage', () => {
    const mem = createMemoryStorage();
    mem.set('mem-key', { anything: 'even non-JSON-friendly values work' });
    expect(window.localStorage.getItem('mem-key')).toBeNull();
    expect(mem.get('mem-key')).toEqual({ anything: 'even non-JSON-friendly values work' });
  });

  it('clear() empties the adapter', () => {
    storage.set('a', 1);
    storage.set('b', 2);
    storage.clear();
    expect(storage.has('a')).toBe(false);
    expect(storage.has('b')).toBe(false);
  });
});
