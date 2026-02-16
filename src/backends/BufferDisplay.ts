import { DISPLAY_WIDTH, DISPLAY_SIZE, DisplayBackend } from '../core/types.js';

export class BufferDisplay implements DisplayBackend {
  private buffer: Uint8Array;

  constructor() {
    this.buffer = new Uint8Array(DISPLAY_SIZE);
  }

  clear(): void {
    this.buffer.fill(0);
  }

  getBuffer(): Uint8Array {
    return this.buffer;
  }

  render(): void {
    // no-op for buffer display
  }

  getPixel(x: number, y: number): number {
    return this.buffer[y * DISPLAY_WIDTH + x];
  }

  setPixel(x: number, y: number, value: number): void {
    this.buffer[y * DISPLAY_WIDTH + x] = value;
  }
}
