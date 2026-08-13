/**
 * Lightweight file/media helpers based on filename extensions.
 *
 * IMPORTANT: extension-based checks are NOT a security control. A file
 * can be renamed to any extension regardless of its actual content —
 * never use `isImageFile`/`getMimeType`/etc. as the basis for deciding
 * whether uploaded content is safe to process, store, or serve. For
 * anything security-sensitive, inspect the actual file content (magic
 * bytes) server-side instead.
 */

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'm4v']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'opus']);

/** Extracts a lowercase file extension (without the dot), or `''` if there isn't one. @example getFileExtension('Photo.JPG') // 'jpg' */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/** Extension-based image-file heuristic. See module docs — not a security control. */
export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(filename));
}

/** Extension-based video-file heuristic. See module docs — not a security control. */
export function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(getFileExtension(filename));
}

/** Extension-based audio-file heuristic. See module docs — not a security control. */
export function isAudioFile(filename: string): boolean {
  return AUDIO_EXTENSIONS.has(getFileExtension(filename));
}

const MIME_TYPES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', avif: 'image/avif', ico: 'image/x-icon',
  mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4',
  pdf: 'application/pdf', json: 'application/json', xml: 'application/xml',
  txt: 'text/plain', csv: 'text/csv', html: 'text/html', css: 'text/css', js: 'text/javascript',
  zip: 'application/zip', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** Maps a filename's extension to a MIME type via a small built-in lookup table (not exhaustive — covers common web/office/media formats). Returns `undefined` for unrecognized extensions; does NOT inspect file content. */
export function getMimeType(filename: string): string | undefined {
  return MIME_TYPES[getFileExtension(filename)];
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/**
 * Formats a byte count as a human-readable string using binary (1024-based)
 * units, e.g. `1536` → `'1.5 KB'`.
 *
 * @param decimals - Number of decimal places to show. Default: 1.
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError(`formatFileSize: bytes must be a non-negative finite number, got ${bytes}`);
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(decimals)} ${SIZE_UNITS[exponent]}`;
}
