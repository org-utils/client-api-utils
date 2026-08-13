// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { onOnlineStatusChange } from '../../src/client/network.js';

describe('network utilities (jsdom)', () => {
  it('onOnlineStatusChange fires the callback on real online/offline events', () => {
    const callback = vi.fn();
    const unsubscribe = onOnlineStatusChange(callback);

    window.dispatchEvent(new Event('offline'));
    expect(callback).toHaveBeenCalledWith(false);

    window.dispatchEvent(new Event('online'));
    expect(callback).toHaveBeenCalledWith(true);

    unsubscribe();
    callback.mockClear();
    window.dispatchEvent(new Event('offline'));
    expect(callback).not.toHaveBeenCalled();
  });
});
