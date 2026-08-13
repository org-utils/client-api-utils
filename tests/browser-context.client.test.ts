// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { isBrowser } from '../src/client.js';

describe('isBrowser (jsdom environment)', () => {
  it('returns true when window and document are defined', () => {
    expect(isBrowser()).toBe(true);
  });
});
