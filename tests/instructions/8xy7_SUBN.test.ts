import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy7 - SUBN Vx, Vy (Vx = Vy - Vx)', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should compute Vy - Vx with no borrow (Vy >= Vx)', () => {
    h.loadProgram([
      0x60, 0x10, // LD V0, 0x10
      0x61, 0x30, // LD V1, 0x30
      0x80, 0x17, // SUBN V0, V1 => V0 = V1 - V0
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x20);
    h.assertRegister(0xF, 1); // NOT borrow (Vy >= Vx)
  });

  it('should set VF = 0 when borrow occurs (Vy < Vx)', () => {
    h.loadProgram([
      0x60, 0x30, // LD V0, 0x30
      0x61, 0x10, // LD V1, 0x10
      0x80, 0x17, // SUBN V0, V1 => V0 = V1 - V0
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xE0); // (0x10 - 0x30) & 0xFF = 0xE0
    h.assertRegister(0xF, 0);    // borrow
  });

  it('should set VF = 1 when Vy equals Vx (no borrow)', () => {
    h.loadProgram([
      0x60, 0x42,
      0x61, 0x42,
      0x80, 0x17,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1);
  });

  it('should handle Vy = 0, Vx = 0', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0x00,
      0x80, 0x17,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1); // 0 >= 0
  });

  it('should handle Vy = 0, Vx > 0', () => {
    h.loadProgram([
      0x60, 0x01,
      0x61, 0x00,
      0x80, 0x17,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xFF); // (0 - 1) & 0xFF
    h.assertRegister(0xF, 0);    // borrow
  });

  it('should handle Vy = 0xFF, Vx = 0', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0xFF,
      0x80, 0x17,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xFF);
    h.assertRegister(0xF, 1);
  });

  it('should handle Vy = 0xFF, Vx = 0xFF', () => {
    h.loadProgram([
      0x60, 0xFF,
      0x61, 0xFF,
      0x80, 0x17,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1);
  });

  it('should work with different register pairs', () => {
    h.loadProgram([
      0x65, 0x20, // LD V5, 0x20
      0x6A, 0x50, // LD VA, 0x50
      0x85, 0xA7, // SUBN V5, VA => V5 = VA - V5
    ]);
    h.run(3);

    h.assertRegister(0x5, 0x30);
    h.assertRegister(0xA, 0x50); // Vy unchanged
    h.assertRegister(0xF, 1);
  });

  it('should overwrite VF when Vx is VF', () => {
    h.loadProgram([
      0x6F, 0x05, // LD VF, 0x05
      0x61, 0x10, // LD V1, 0x10
      0x8F, 0x17, // SUBN VF, V1 => VF = V1 - VF
    ]);
    h.run(3);

    // VF should be the NOT borrow flag, overwriting the result
    h.assertRegister(0xF, 1); // V1(0x10) >= VF(0x05)
  });
});
