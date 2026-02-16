import { DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_SIZE, DisplayBackend } from '../core/types.js';

export class BufferDisplay implements DisplayBackend {
  private buffer: Uint8Array;

  constructor() {
    this.buffer = new Uint8Array(DISPLAY_SIZE);
  }

  clear(): void {
    this.buffer.fill(0);
  }

  drawSprite(x: number, y: number, sprite: Uint8Array): boolean {
    let collision = false;

    for (let row = 0; row < sprite.length; row++) {
      const yPos = (y + row) % DISPLAY_HEIGHT;
      for (let col = 0; col < 8; col++) {
        const xPos = (x + col) % DISPLAY_WIDTH;
        const pixel = (sprite[row] >> (7 - col)) & 1;
        if (pixel === 1) {
          const idx = yPos * DISPLAY_WIDTH + xPos;
          if (this.buffer[idx] === 1) {
            collision = true;
          }
          this.buffer[idx] ^= 1;
        }
      }
    }

    return collision;
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
