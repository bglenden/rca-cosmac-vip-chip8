import { DISPLAY_WIDTH } from './types.js';

/** FNV-1a hash of a framebuffer for deterministic snapshot comparison. */
export function framebufferHash(buffer: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const byte of buffer) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Extract a rectangular region of the display as ASCII rows (# = on, . = off). */
export function sampleRows(
  buffer: Uint8Array,
  xStart: number,
  yStart: number,
  width: number,
  height: number,
): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += buffer[(yStart + y) * DISPLAY_WIDTH + (xStart + x)] ? '#' : '.';
    }
    rows.push(row);
  }
  return rows;
}
