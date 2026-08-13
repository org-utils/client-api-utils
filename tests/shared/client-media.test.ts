// Pure logic, no browser globals needed - runs fine under default Node env.
import { describe, expect, it } from 'vitest';
import {
  getFileExtension, isImageFile, isVideoFile, isAudioFile, getMimeType, formatFileSize,
} from '../../src/client/media.js';

describe('media utilities', () => {
  it('getFileExtension lowercases and handles dotfiles/no-extension', () => {
    expect(getFileExtension('Photo.JPG')).toBe('jpg');
    expect(getFileExtension('.gitignore')).toBe('');
    expect(getFileExtension('noextension')).toBe('');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('isImageFile/isVideoFile/isAudioFile classify by extension only', () => {
    expect(isImageFile('a.png')).toBe(true);
    expect(isImageFile('a.mp3')).toBe(false);
    expect(isVideoFile('a.mp4')).toBe(true);
    expect(isAudioFile('a.mp3')).toBe(true);
  });

  it('getMimeType returns known types, undefined for unknown', () => {
    expect(getMimeType('a.pdf')).toBe('application/pdf');
    expect(getMimeType('a.unknownext')).toBeUndefined();
  });

  it('formatFileSize formats using binary units', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('formatFileSize throws for negative/invalid input', () => {
    expect(() => formatFileSize(-1)).toThrow(RangeError);
    expect(() => formatFileSize(NaN)).toThrow(RangeError);
  });
});
