import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Bnnn - JP V0, addr', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should jump to addr + V0', () => {
    h.loadProgram([
      0x60, 0x10, // LD V0, 0x10
      0xB3, 0x00, // JP V0, 0x300 => PC = 0x300 + 0x10 = 0x310
    ]);
    h.run(2);

    h.assertPC(0x310);
  });

  it('should jump to addr when V0 is zero', () => {
    h.loadProgram([
      0x60, 0x00, // LD V0, 0x00
      0xB4, 0x00, // JP V0, 0x400
    ]);
    h.run(2);

    h.assertPC(0x400);
  });

  it('should handle V0 = 0xFF', () => {
    h.loadProgram([
      0x60, 0xFF, // LD V0, 0xFF
      0xB2, 0x00, // JP V0, 0x200 => PC = 0x200 + 0xFF = 0x2FF
    ]);
    h.run(2);

    h.assertPC(0x2FF);
  });

  it('should wrap to 12-bit address space', () => {
    // 0xFFF + 0x01 = 0x1000, masked to 0x000
    h.loadProgram([
      0x60, 0x01, // LD V0, 0x01
      0xBF, 0xFF, // JP V0, 0xFFF => (0xFFF + 0x01) & 0xFFF = 0x000
    ]);
    h.run(2);

    h.assertPC(0x000);
  });

  it('should only use V0, not other registers', () => {
    h.loadProgram([
      0x60, 0x05, // LD V0, 0x05
      0x61, 0xFF, // LD V1, 0xFF (should be ignored)
      0xB3, 0x00, // JP V0, 0x300
    ]);
    h.run(3);

    h.assertPC(0x305); // 0x300 + V0(0x05), V1 is not used
  });

  it('should not modify V0', () => {
    h.loadProgram([
      0x60, 0x10,
      0xB3, 0x00,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x10);
  });
});
