import { isBrowser, getOnlineStatus } from './browser.js';

export { getOnlineStatus };

/**
 * Subscribes to browser online/offline transitions. Returns an unsubscribe
 * function; calling it removes the listeners. No-ops (and returns a
 * no-op unsubscribe) outside a browser context.
 */
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (!isBrowser()) return () => {};

  const onOnline = () => callback(true);
  const onOffline = () => callback(false);

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
