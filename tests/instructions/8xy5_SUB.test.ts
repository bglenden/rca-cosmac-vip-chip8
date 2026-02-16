import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy5 - SUB Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should subtract Vy from Vx with no borrow (Vx >= Vy)', () => {
    h.loadProgram([
      0x60, 0x30, // LD V0, 0x30
      0x61, 0x10, // LD V1, 0x10
      0x80, 0x15, // SUB V0, V1
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x20);
    h.assertRegister(0xF, 1); // NOT borrow (Vx >= Vy)
  });

  it('should set VF = 0 when borrow occurs (Vx < Vy)', () => {
    h.loadProgram([
      0x60, 0x10, // LD V0, 0x10
      0x61, 0x30, // LD V1, 0x30
      0x80, 0x15, // SUB V0, V1
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xE0); // (0x10 - 0x30) & 0xFF = 0xE0
    h.assertRegister(0xF, 0);    // borrow occurred
  });

  it('should set VF = 1 when Vx equals Vy (result is zero, no borrow)', () => {
    h.loadProgram([
      0x60, 0x42,
      0x61, 0x42,
      0x80, 0x15,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1); // Vx >= Vy, no borrow
  });

  it('should handle subtracting zero', () => {
    h.loadProgram([
      0x60, 0x55,
      0x61, 0x00,
      0x80, 0x15,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x55);
    h.assertRegister(0xF, 1);
  });

  it('should handle subtracting from zero', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0x01,
      0x80, 0x15,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xFF); // (0 - 1) & 0xFF = 0xFF
    h.assertRegister(0xF, 0);    // borrow
  });

  it('should handle both operands zero', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0x00,
      0x80, 0x15,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1); // 0 >= 0, no borrow
  });

  it('should handle 0xFF - 0xFF', () => {
    h.loadProgram([
      0x60, 0xFF,
      0x61, 0xFF,
      0x80, 0x15,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1);
  });

  it('should work with different register pairs', () => {
    h.loadProgram([
      0x63, 0x50, // LD V3, 0x50
      0x67, 0x20, // LD V7, 0x20
      0x83, 0x75, // SUB V3, V7
    ]);
    h.run(3);

    h.assertRegister(0x3, 0x30);
    h.assertRegister(0x7, 0x20); // Vy unchanged
    h.assertRegister(0xF, 1);
  });

  it('should overwrite VF when Vx is VF', () => {
    h.loadProgram([
      0x6F, 0x20, // LD VF, 0x20
      0x61, 0x10, // LD V1, 0x10
      0x8F, 0x15, // SUB VF, V1
    ]);
    h.run(3);

    // VF gets the NOT borrow flag, overwriting the subtraction result
    h.assertRegister(0xF, 1);
  });
});
