export {
  isBrowser,
  getBrowserInfo,
  getOSInfo,
  isMobileDevice,
  isTablet,
  isDesktop,
  getLanguage,
  getTimezone,
  getOnlineStatus,
  type BrowserInfo,
  type OSInfo,
} from './browser.js';

export { getDeviceInfo, type DeviceInfo } from './device.js';

export { getViewport, getScreenInfo, type Viewport, type ScreenInfo } from './viewport.js';

export {
  storage,
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorage,
  createMemoryStorage,
  createWebStorageAdapter,
  type StorageAdapter,
} from './storage.js';

export { copyToClipboard, readClipboard, isClipboardSupported } from './clipboard.js';

export {
  isImageFile,
  isVideoFile,
  isAudioFile,
  getFileExtension,
  getMimeType,
  formatFileSize,
} from './media.js';

export { onOnlineStatusChange } from './network.js';
