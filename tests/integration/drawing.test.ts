import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../../src/core/types.js';

describe('Drawing integration', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should draw and then clear the screen', () => {
    // Set I to font sprite for "0", draw at (0,0) height 5, then CLS
    h.loadProgram([
      0xF0, 0x29, // LD F, V0 (V0=0, so font sprite for "0")
      0xD0, 0x15, // DRW V0, V1, 5 (draw at V0=0, V1=0)
      0x00, 0xE0, // CLS
    ]);

    // Draw font "0"
    h.run(2);
    // Some pixels should be on
    let anyOn = false;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 4; x++) {
        if (h.state.display[y * DISPLAY_WIDTH + x] === 1) anyOn = true;
      }
    }
    expect(anyOn).toBe(true);

    // Clear
    h.step();
    for (let i = 0; i < DISPLAY_WIDTH * DISPLAY_HEIGHT; i++) {
      expect(h.state.display[i]).toBe(0);
    }
  });

  it('should XOR-draw: drawing same sprite twice clears it', () => {
    h.writeSprite(0x300, [0b11110000]);
    h.state.i = 0x300;
    h.state.v[0] = 0;
    h.state.v[1] = 0;

    // Draw once
    h.loadProgram([
      0xA3, 0x00, // LD I, 0x300
      0xD0, 0x11, // DRW V0, V1, 1
      0xA3, 0x00, // LD I, 0x300
      0xD0, 0x11, // DRW V0, V1, 1
    ]);

    h.run(2); // LD I + DRW
    expect(h.state.display[0]).toBe(1);
    expect(h.state.display[1]).toBe(1);
    expect(h.state.display[2]).toBe(1);
    expect(h.state.display[3]).toBe(1);
    expect(h.state.v[0xf]).toBe(0); // no collision on first draw

    h.run(2); // LD I + DRW again
    expect(h.state.display[0]).toBe(0);
    expect(h.state.display[1]).toBe(0);
    expect(h.state.display[2]).toBe(0);
    expect(h.state.display[3]).toBe(0);
    expect(h.state.v[0xf]).toBe(1); // collision on second draw
  });

  it('should draw multiple non-overlapping sprites without collision', () => {
    h.writeSprite(0x300, [0b10000000]); // single pixel

    h.loadProgram([
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0xA3, 0x00, // LD I, 0x300
      0xD0, 0x11, // DRW V0, V1, 1 — pixel at (0,0)
      0x60, 0x0A, // LD V0, 10
      0xD0, 0x11, // DRW V0, V1, 1 — pixel at (10,0)
    ]);

    h.run(6);
    expect(h.state.display[0]).toBe(1);                 // (0,0)
    expect(h.state.display[10]).toBe(1);                // (10,0)
    expect(h.state.v[0xf]).toBe(0);                     // no collision
  });

  it('should detect collision when sprites overlap', () => {
    h.writeSprite(0x300, [0b11000000]); // 2 pixels wide

    h.loadProgram([
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0xA3, 0x00, // LD I, 0x300
      0xD0, 0x11, // DRW V0, V1, 1 — pixels at (0,0) and (1,0)
      0x60, 0x01, // LD V0, 1
      0xD0, 0x11, // DRW V0, V1, 1 — pixels at (1,0) and (2,0) - overlaps at (1,0)
    ]);

    h.run(6);
    expect(h.state.v[0xf]).toBe(1); // collision detected
    expect(h.state.display[0]).toBe(1);  // (0,0) still on
    expect(h.state.display[1]).toBe(0);  // (1,0) XORed off
    expect(h.state.display[2]).toBe(1);  // (2,0) newly on
  });

  it('should render font sprites correctly', () => {
    // Draw digit "1" (font: 0x20,0x60,0x20,0x20,0x70)
    h.loadProgram([
      0x60, 0x01, // LD V0, 1
      0xF0, 0x29, // LD F, V0 — I = font sprite for "1"
      0x61, 0x00, // LD V1, 0
      0x62, 0x00, // LD V2, 0
      0xD1, 0x25, // DRW V1, V2, 5 — draw at (0,0)
    ]);

    h.run(5);

    // Font "1" = 0x20,0x60,0x20,0x20,0x70
    // Row 0: 00100000 -> pixel at x=2
    expect(h.state.display[0 * DISPLAY_WIDTH + 2]).toBe(1);
    // Row 1: 01100000 -> pixels at x=1,2
    expect(h.state.display[1 * DISPLAY_WIDTH + 1]).toBe(1);
    expect(h.state.display[1 * DISPLAY_WIDTH + 2]).toBe(1);
    // Row 4: 01110000 -> pixels at x=1,2,3
    expect(h.state.display[4 * DISPLAY_WIDTH + 1]).toBe(1);
    expect(h.state.display[4 * DISPLAY_WIDTH + 2]).toBe(1);
    expect(h.state.display[4 * DISPLAY_WIDTH + 3]).toBe(1);
  });

  it('should clip sprites at right screen edge', () => {
    h.writeSprite(0x300, [0b11111111]); // 8 pixels wide

    h.loadProgram([
      0x60, 0x3C, // LD V0, 60
      0x61, 0x00, // LD V1, 0
      0xA3, 0x00, // LD I, 0x300
      0xD0, 0x11, // DRW V0, V1, 1
    ]);

    h.run(4);

    // Pixels at x=60,61,62,63 should be on
    expect(h.state.display[60]).toBe(1);
    expect(h.state.display[61]).toBe(1);
    expect(h.state.display[62]).toBe(1);
    expect(h.state.display[63]).toBe(1);
    // Pixel at x=0 should NOT be on (clipping, not wrapping)
    expect(h.state.display[0]).toBe(0);
  });

  it('should clip sprites at bottom screen edge', () => {
    h.writeSprite(0x300, [0x80, 0x80, 0x80, 0x80, 0x80]); // 5 rows, single pixel

    h.loadProgram([
      0x60, 0x00, // LD V0, 0
      0x61, 0x1E, // LD V1, 30
      0xA3, 0x00, // LD I, 0x300
      0xD0, 0x15, // DRW V0, V1, 5
    ]);

    h.run(4);

    // Rows 30 and 31 should be drawn
    expect(h.state.display[30 * DISPLAY_WIDTH]).toBe(1);
    expect(h.state.display[31 * DISPLAY_WIDTH]).toBe(1);
    // Row 0 should NOT have wrapped pixels
    expect(h.state.display[0]).toBe(0);
  });
});
