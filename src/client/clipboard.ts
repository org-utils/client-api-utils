import { isBrowser } from './browser.js';

/** `true` if the async Clipboard API (`navigator.clipboard`) is available. Does NOT guarantee permission has been granted — a call can still fail/be denied even when this returns `true`. */
export function isClipboardSupported(): boolean {
  return isBrowser() && typeof navigator.clipboard !== 'undefined';
}

/**
 * Copies `text` to the clipboard. Tries the async Clipboard API first;
 * falls back to the legacy `document.execCommand('copy')` technique
 * (via a temporary, invisible, off-screen textarea) for older browsers
 * or insecure (non-HTTPS) contexts where the Clipboard API is
 * unavailable.
 *
 * Never throws — returns `false` on any failure (permission denied, no
 * browser context, no supported technique available, etc.) so callers
 * can show a "copy failed, please copy manually" fallback UI instead of
 * needing a try/catch.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy technique below - some contexts
      // expose the API but reject the call (e.g. missing permission,
      // document not focused).
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const succeeded = document.execCommand('copy');
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
}

/**
 * Reads text from the clipboard via the async Clipboard API. There is no
 * reliable legacy fallback for reading (unlike writing) — this simply
 * returns `undefined` if the API is unavailable or permission is denied.
 */
export async function readClipboard(): Promise<string | undefined> {
  if (!isClipboardSupported()) return undefined;

  try {
    return await navigator.clipboard.readText();
  } catch {
    return undefined;
  }
}
