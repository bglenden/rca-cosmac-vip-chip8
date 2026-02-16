import { DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_SIZE, DisplayBackend } from '../core/types.js';

export class CanvasDisplay implements DisplayBackend {
  private buffer: Uint8Array;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private fgColor: string;
  private bgColor: string;

  constructor(
    canvas: HTMLCanvasElement,
    scale = 10,
    fgColor = '#33ff66',
    bgColor = '#0a0a0a',
  ) {
    this.buffer = new Uint8Array(DISPLAY_SIZE);
    this.canvas = canvas;
    this.scale = Math.max(1, Math.floor(scale));
    this.fgColor = fgColor;
    this.bgColor = bgColor;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.setScale(this.scale);
    this.clear();
    this.render();
  }

  clear(): void {
    this.buffer.fill(0);
  }

  getBuffer(): Uint8Array {
    return this.buffer;
  }

  getScale(): number {
    return this.scale;
  }

  setScale(scale: number): void {
    const nextScale = Math.max(1, Math.floor(scale));
    if (nextScale === this.scale && this.canvas.width === DISPLAY_WIDTH * nextScale) {
      return;
    }

    this.scale = nextScale;
    this.canvas.width = DISPLAY_WIDTH * nextScale;
    this.canvas.height = DISPLAY_HEIGHT * nextScale;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(): void {
    const { ctx, scale } = this;
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, DISPLAY_WIDTH * scale, DISPLAY_HEIGHT * scale);

    ctx.fillStyle = this.fgColor;
    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
      for (let x = 0; x < DISPLAY_WIDTH; x++) {
        if (this.buffer[y * DISPLAY_WIDTH + x] === 1) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }
}
