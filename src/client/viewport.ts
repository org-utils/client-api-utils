import { isBrowser } from './browser.js';

export interface Viewport {
  width: number;
  height: number;
}

/** Returns the current viewport (`window.innerWidth`/`innerHeight`), or `undefined` outside a browser context. Call this fresh whenever needed rather than caching — it changes on resize/rotation, and this function does not subscribe to changes itself. */
export function getViewport(): Viewport | undefined {
  if (!isBrowser()) return undefined;
  return { width: window.innerWidth, height: window.innerHeight };
}

export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
}

/** Returns physical screen metrics (`window.screen` + `devicePixelRatio`), or `undefined` outside a browser context. */
export function getScreenInfo(): ScreenInfo | undefined {
  if (!isBrowser()) return undefined;

  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
  };
}
