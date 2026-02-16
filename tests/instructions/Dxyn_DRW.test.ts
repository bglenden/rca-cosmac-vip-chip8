import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Dxyn - DRW Vx, Vy, nibble', () => {
  let h: TestHarness;

  // Sprite data address — use a safe location after program area
  const SPRITE_ADDR = 0x300;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  describe('basic drawing', () => {
    it('should draw a single-row sprite at (0, 0)', () => {
      // Sprite: 0b10000000 = 0x80 (one pixel at x=0)
      h.writeSprite(SPRITE_ADDR, [0x80]);
      h.loadProgram([
        0x60, 0x00, // LD V0, 0 (x)
        0x61, 0x00, // LD V1, 0 (y)
        0xA3, 0x00, // LD I, SPRITE_ADDR
        0xD0, 0x11, // DRW V0, V1, 1
      ]);
      h.run(4);

      h.assertPixel(0, 0, 1);
      h.assertPixel(1, 0, 0);
      h.assertRegister(0xF, 0); // no collision
    });

    it('should draw a full 8-pixel wide sprite row', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF]); // all 8 bits set
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      for (let x = 0; x < 8; x++) {
        h.assertPixel(x, 0, 1);
      }
      h.assertPixel(8, 0, 0); // pixel 8 not drawn
    });

    it('should draw a multi-row sprite', () => {
      // 2-row sprite: a simple pattern
      h.writeSprite(SPRITE_ADDR, [0xF0, 0x0F]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x12, // height 2
      ]);
      h.run(4);

      // Row 0: 0xF0 = 1111_0000
      h.assertPixel(0, 0, 1);
      h.assertPixel(3, 0, 1);
      h.assertPixel(4, 0, 0);

      // Row 1: 0x0F = 0000_1111
      h.assertPixel(0, 1, 0);
      h.assertPixel(4, 1, 1);
      h.assertPixel(7, 1, 1);
    });

    it('should draw at a non-zero position', () => {
      h.writeSprite(SPRITE_ADDR, [0x80]); // single pixel at col 0 of sprite
      h.loadProgram([
        0x60, 0x0A, // LD V0, 10 (x)
        0x61, 0x05, // LD V1, 5  (y)
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPixel(10, 5, 1);
      h.assertPixel(9, 5, 0);
      h.assertPixel(11, 5, 0);
    });

    it('should draw at position (0, 0) explicitly', () => {
      h.writeSprite(SPRITE_ADDR, [0xAA]); // 1010_1010
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPixel(0, 0, 1);
      h.assertPixel(1, 0, 0);
      h.assertPixel(2, 0, 1);
      h.assertPixel(3, 0, 0);
      h.assertPixel(4, 0, 1);
      h.assertPixel(5, 0, 0);
      h.assertPixel(6, 0, 1);
      h.assertPixel(7, 0, 0);
    });
  });

  describe('collision detection', () => {
    it('should set VF = 1 when drawing over existing pixels (collision)', () => {
      h.writeSprite(SPRITE_ADDR, [0x80]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11, // first draw: pixel ON
        0xD0, 0x11, // second draw: collision, pixel OFF
      ]);
      h.run(5);

      h.assertPixel(0, 0, 0); // XOR toggled back off
      h.assertRegister(0xF, 1); // collision
    });

    it('should set VF = 0 when no collision (drawing on empty area)', () => {
      h.writeSprite(SPRITE_ADDR, [0x80]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertRegister(0xF, 0);
    });

    it('should detect collision even for multi-row sprites', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF, 0xFF]);

      // Draw at (0,0)
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x12, // first draw
        0xD0, 0x12, // second draw — full collision
      ]);
      h.run(5);

      h.assertRegister(0xF, 1);
    });

    it('should set VF = 0 when sprites do not overlap', () => {
      h.writeSprite(SPRITE_ADDR, [0x80]); // single pixel at sprite col 0

      h.loadProgram([
        0x60, 0x00, // x=0
        0x61, 0x00, // y=0
        0xA3, 0x00,
        0xD0, 0x11, // draw at (0,0)
        0x60, 0x08, // x=8 (no overlap with 0-7)
        0xD0, 0x11, // draw at (8,0)
      ]);
      h.run(6);

      h.assertRegister(0xF, 0); // no collision
      h.assertPixel(0, 0, 1);
      h.assertPixel(8, 0, 1);
    });
  });

  describe('XOR behavior', () => {
    it('should XOR pixels — drawing same sprite twice clears it', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11, // draw
        0xD0, 0x11, // draw again — XOR clears
      ]);
      h.run(5);

      for (let x = 0; x < 8; x++) {
        h.assertPixel(x, 0, 0);
      }
    });

    it('should XOR individual bits, not overwrite', () => {
      // First sprite: 0xF0 = 1111_0000
      // Second sprite: 0x0F = 0000_1111 (at same position, different I)
      h.writeSprite(SPRITE_ADDR, [0xF0]);
      h.writeSprite(SPRITE_ADDR + 1, [0x0F]);

      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00, // I = SPRITE_ADDR (0xF0)
        0xD0, 0x11, // draw 0xF0
        0xA3, 0x01, // I = SPRITE_ADDR + 1 (0x0F)
        0xD0, 0x11, // draw 0x0F — no overlap, so VF = 0
      ]);
      h.run(6);

      // All 8 pixels should be on (1111_0000 XOR 0000_1111 = 1111_1111)
      for (let x = 0; x < 8; x++) {
        h.assertPixel(x, 0, 1);
      }
      h.assertRegister(0xF, 0); // no collision (no overlapping ON bits)
    });

    it('should XOR — partially overlapping sprites cause partial collision', () => {
      // First sprite: 0xFF (all on)
      // Second sprite: 0xF0 (left half on)
      h.writeSprite(SPRITE_ADDR, [0xFF]);
      h.writeSprite(SPRITE_ADDR + 1, [0xF0]);

      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11, // draw 0xFF — all on
        0xA3, 0x01,
        0xD0, 0x11, // draw 0xF0 — left 4 collide, right 4 unaffected
      ]);
      h.run(6);

      // Left 4 pixels toggled off, right 4 remain on
      h.assertPixel(0, 0, 0);
      h.assertPixel(3, 0, 0);
      h.assertPixel(4, 0, 1);
      h.assertPixel(7, 0, 1);
      h.assertRegister(0xF, 1); // collision
    });
  });

  describe('clipping', () => {
    it('should clip at right edge — pixels beyond x=63 are NOT drawn', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF]); // 8 pixels wide
      h.loadProgram([
        0x60, 0x3C, // LD V0, 60 (x=60)
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      // Pixels at x=60,61,62,63 should be drawn
      h.assertPixel(60, 0, 1);
      h.assertPixel(61, 0, 1);
      h.assertPixel(62, 0, 1);
      h.assertPixel(63, 0, 1);

      // Pixels should NOT wrap to x=0,1,2,3
      h.assertPixel(0, 0, 0);
      h.assertPixel(1, 0, 0);
      h.assertPixel(2, 0, 0);
      h.assertPixel(3, 0, 0);

      h.assertRegister(0xF, 0);
    });

    it('should clip at bottom edge — rows beyond y=31 are NOT drawn', () => {
      h.writeSprite(SPRITE_ADDR, [0x80, 0x80, 0x80, 0x80]); // 4 rows
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x1E, // LD V1, 30 (y=30)
        0xA3, 0x00,
        0xD0, 0x14, // height 4
      ]);
      h.run(4);

      // Rows 30, 31 should be drawn
      h.assertPixel(0, 30, 1);
      h.assertPixel(0, 31, 1);

      // Rows 0, 1 should NOT have wrapped pixels
      h.assertPixel(0, 0, 0);
      h.assertPixel(0, 1, 0);

      h.assertRegister(0xF, 0);
    });

    it('should not draw anything when starting at x=64 (wraps to 0 via modulo, then clips)', () => {
      // x=64 % 64 = 0, so it actually draws at x=0
      h.writeSprite(SPRITE_ADDR, [0xFF]);
      h.loadProgram([
        0x60, 0x40, // LD V0, 64
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      // x=64 % 64 = 0, so sprite draws starting at x=0
      h.assertPixel(0, 0, 1);
      h.assertPixel(7, 0, 1);
    });

    it('should handle coordinates > display size via modulo before clipping', () => {
      // x=65 % 64 = 1
      h.writeSprite(SPRITE_ADDR, [0x80]);
      h.loadProgram([
        0x60, 0x41, // LD V0, 65
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPixel(1, 0, 1); // drawn at x=1 (65 % 64)
      h.assertPixel(0, 0, 0);
    });

    it('should clip right edge after modulo wrapping', () => {
      // x=63 % 64 = 63; sprite is 8 wide, only 1 pixel fits
      h.writeSprite(SPRITE_ADDR, [0xFF]);
      h.loadProgram([
        0x60, 0x3F, // LD V0, 63
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPixel(63, 0, 1); // only this pixel drawn
      h.assertPixel(0, 0, 0);  // NOT wrapped
    });
  });

  describe('sprite heights', () => {
    it('should draw height-1 sprite', () => {
      h.writeSprite(SPRITE_ADDR, [0xAA]); // 1010_1010
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPixel(0, 0, 1);
      h.assertPixel(1, 0, 0);
      h.assertPixel(2, 0, 1);
    });

    it('should draw height-5 sprite', () => {
      h.writeSprite(SPRITE_ADDR, [0x80, 0x80, 0x80, 0x80, 0x80]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x15, // height 5
      ]);
      h.run(4);

      for (let y = 0; y < 5; y++) {
        h.assertPixel(0, y, 1);
      }
      h.assertPixel(0, 5, 0); // row 5 not drawn
    });

    it('should draw height-15 sprite (maximum)', () => {
      const sprite = new Array(15).fill(0x80);
      h.writeSprite(SPRITE_ADDR, sprite);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x1F, // height 15
      ]);
      h.run(4);

      for (let y = 0; y < 15; y++) {
        h.assertPixel(0, y, 1);
      }
      h.assertPixel(0, 15, 0);
    });

    it('should draw height-0 sprite (no pixels drawn)', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x10, // height 0
      ]);
      h.run(4);

      h.assertPixel(0, 0, 0); // nothing drawn
      h.assertRegister(0xF, 0);
    });
  });

  describe('edge cases', () => {
    it('should use I register to read sprite data', () => {
      // Write sprite at a different address
      const addr = 0x400;
      h.writeSprite(addr, [0xC0]); // 1100_0000
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA4, 0x00, // LD I, 0x400
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPixel(0, 0, 1);
      h.assertPixel(1, 0, 1);
      h.assertPixel(2, 0, 0);
    });

    it('should advance PC by 2 after draw', () => {
      h.writeSprite(SPRITE_ADDR, [0x80]);
      h.loadProgram([
        0x60, 0x00,
        0x61, 0x00,
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertPC(0x208); // 0x200 + 4 instructions * 2 bytes
    });

    it('should not modify Vx or Vy', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF]);
      h.loadProgram([
        0x60, 0x0A, // LD V0, 10
        0x61, 0x05, // LD V1, 5
        0xA3, 0x00,
        0xD0, 0x11,
      ]);
      h.run(4);

      h.assertRegister(0x0, 0x0A);
      h.assertRegister(0x1, 0x05);
    });

    it('should draw correctly in bottom-right corner with clipping', () => {
      h.writeSprite(SPRITE_ADDR, [0xFF, 0xFF]); // 2 rows, 8 pixels wide
      h.loadProgram([
        0x60, 0x3C, // x=60
        0x61, 0x1F, // y=31
        0xA3, 0x00,
        0xD0, 0x12, // height 2
      ]);
      h.run(4);

      // Only row 0 drawn (row 1 clipped at y=32), only 4 pixels (x=60-63)
      h.assertPixel(60, 31, 1);
      h.assertPixel(63, 31, 1);
      h.assertPixel(0, 31, 0);  // no wrap
      h.assertPixel(60, 0, 0);  // no wrap
    });
  });
});
