import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('9xy0 - SNE Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should skip next instruction when Vx != Vy', () => {
    h.loadProgram([
      0x60, 0x10, // LD V0, 0x10
      0x61, 0x20, // LD V1, 0x20
      0x90, 0x10, // SNE V0, V1
    ]);
    h.run(3);

    h.assertPC(0x208); // skipped: 0x206 + 2 = 0x208
  });

  it('should not skip when Vx == Vy', () => {
    h.loadProgram([
      0x60, 0x42,
      0x61, 0x42,
      0x90, 0x10,
    ]);
    h.run(3);

    h.assertPC(0x206); // no skip
  });

  it('should not skip when both are zero', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0x00,
      0x90, 0x10,
    ]);
    h.run(3);

    h.assertPC(0x206);
  });

  it('should skip when one is zero and the other is not', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0x01,
      0x90, 0x10,
    ]);
    h.run(3);

    h.assertPC(0x208);
  });

  it('should not skip when both are 0xFF', () => {
    h.loadProgram([
      0x60, 0xFF,
      0x61, 0xFF,
      0x90, 0x10,
    ]);
    h.run(3);

    h.assertPC(0x206);
  });

  it('should work with different register pairs', () => {
    h.loadProgram([
      0x65, 0xAA, // LD V5, 0xAA
      0x6B, 0xBB, // LD VB, 0xBB
      0x95, 0xB0, // SNE V5, VB
    ]);
    h.run(3);

    h.assertPC(0x208); // skipped
  });

  it('should compare register with itself (never skips)', () => {
    h.loadProgram([
      0x63, 0x77,
      0x93, 0x30, // SNE V3, V3
    ]);
    h.run(2);

    h.assertPC(0x204); // no skip, V3 always equals V3
  });

  it('should not modify registers', () => {
    h.loadProgram([
      0x60, 0xAA,
      0x61, 0xBB,
      0x90, 0x10,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xAA);
    h.assertRegister(0x1, 0xBB);
  });
});
