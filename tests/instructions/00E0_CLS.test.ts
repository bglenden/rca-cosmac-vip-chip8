import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('00E0 - CLS', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should clear the display buffer', () => {
    // Set some pixels on the display
    h.display.setPixel(0, 0, 1);
    h.display.setPixel(10, 5, 1);
    h.display.setPixel(63, 31, 1);
    // Also set them in the CPU's internal display state
    h.state.display[0 * 64 + 0] = 1;
    h.state.display[5 * 64 + 10] = 1;
    h.state.display[31 * 64 + 63] = 1;

    // 00E0 - CLS
    h.loadProgram([0x00, 0xE0]);
    h.step();

    h.assertPixel(0, 0, 0);
    h.assertPixel(10, 5, 0);
    h.assertPixel(63, 31, 0);
    h.assertPC(0x202);
  });

  it('should work when display is already clear', () => {
    h.loadProgram([0x00, 0xE0]);
    h.step();

    h.assertPixel(0, 0, 0);
    h.assertPixel(32, 16, 0);
    h.assertPC(0x202);
  });

  it('should clear the entire internal display buffer', () => {
    // Fill every pixel
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        h.state.display[y * 64 + x] = 1;
      }
    }

    h.loadProgram([0x00, 0xE0]);
    h.step();

    for (let i = 0; i < 64 * 32; i++) {
      expect(h.state.display[i]).toBe(0);
    }
  });
});
