import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Annn - LD I, addr', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set I to the given address', () => {
    h.loadProgram([0xA3, 0x00]); // LD I, 0x300
    h.step();

    h.assertI(0x300);
    h.assertPC(0x202);
  });

  it('should set I to 0x000', () => {
    h.loadProgram([0xA0, 0x00]); // LD I, 0x000
    h.step();

    h.assertI(0x000);
  });

  it('should set I to 0xFFF', () => {
    h.loadProgram([0xAF, 0xFF]); // LD I, 0xFFF
    h.step();

    h.assertI(0xFFF);
  });

  it('should set I to 0x200 (program start)', () => {
    h.loadProgram([0xA2, 0x00]); // LD I, 0x200
    h.step();

    h.assertI(0x200);
  });

  it('should overwrite previous I value', () => {
    h.loadProgram([
      0xA1, 0x23, // LD I, 0x123
      0xA4, 0x56, // LD I, 0x456
    ]);
    h.run(2);

    h.assertI(0x456);
  });

  it('should not affect any general-purpose registers', () => {
    h.loadProgram([
      0x60, 0xAA, // LD V0, 0xAA
      0xA5, 0x00, // LD I, 0x500
    ]);
    h.run(2);

    h.assertRegister(0x0, 0xAA);
    h.assertI(0x500);
  });
});
