// PNG export for Neon Shore: renders the cover off-screen at the real post
// size and downloads it. No upload, no server — the PNG is made in the
// browser from the photos on the machine.
import { drawCover } from './cover.js';

export const EXPORT_SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080, file: 'neon-shore-1080x1080.png' },
  portrait: { label: 'Portrait 1080 x 1350', width: 1080, height: 1350, file: 'neon-shore-1080x1350.png' },
  wide: { label: 'Wide 1920 x 1080', width: 1920, height: 1080, file: 'neon-shore-1920x1080.png' },
};

export const EXPORT_SIZE_IDS = Object.keys(EXPORT_SIZES);

/** Renders the cover at `width` x `height` and resolves to a PNG blob. */
export function renderCoverBlob(state, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    drawCover(canvas.getContext('2d'), width, height, state);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('the browser could not make a PNG'));
    }, 'image/png');
  });
}

/** Downloads a blob as a file. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Exports one size and downloads it; resolves to the filename. */
export async function exportCover(state, sizeId) {
  const size = EXPORT_SIZES[sizeId] ?? EXPORT_SIZES.square;
  const blob = await renderCoverBlob(state, size.width, size.height);
  downloadBlob(blob, size.file);
  return size.file;
}

/** Exports all three post sizes, one after another. */
export async function exportAllSizes(state, onEach) {
  const names = [];
  for (const sizeId of EXPORT_SIZE_IDS) {
    const name = await exportCover(state, sizeId);
    names.push(name);
    if (onEach) onEach(name);
  }
  return names;
}
