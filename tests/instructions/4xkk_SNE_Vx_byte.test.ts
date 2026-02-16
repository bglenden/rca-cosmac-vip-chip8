import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('4xkk - SNE Vx, byte', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should skip next instruction when Vx does not equal kk', () => {
    h.state.v[0] = 0x10;
    // SNE V0, 0x42
    h.loadProgram([0x40, 0x42]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not skip when Vx equals kk', () => {
    h.state.v[0] = 0x42;
    // SNE V0, 0x42
    h.loadProgram([0x40, 0x42]);
    h.step();

    h.assertPC(0x202);
  });

  it('should skip when comparing zero register to non-zero byte', () => {
    h.state.v[2] = 0x00;
    // SNE V2, 0x01
    h.loadProgram([0x42, 0x01]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not skip when both are zero', () => {
    h.state.v[2] = 0x00;
    // SNE V2, 0x00
    h.loadProgram([0x42, 0x00]);
    h.step();

    h.assertPC(0x202);
  });

  it('should work with max byte value 0xFF', () => {
    h.state.v[7] = 0xFE;
    // SNE V7, 0xFF
    h.loadProgram([0x47, 0xFF]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with register VF', () => {
    h.state.v[0xF] = 0x00;
    // SNE VF, 0x01
    h.loadProgram([0x4F, 0x01]);
    h.step();

    h.assertPC(0x204);
  });
});
