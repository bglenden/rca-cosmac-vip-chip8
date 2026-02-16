import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('5xy0 - SE Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should skip when Vx equals Vy', () => {
    h.state.v[0] = 0x42;
    h.state.v[1] = 0x42;
    // SE V0, V1
    h.loadProgram([0x50, 0x10]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not skip when Vx does not equal Vy', () => {
    h.state.v[0] = 0x42;
    h.state.v[1] = 0x10;
    // SE V0, V1
    h.loadProgram([0x50, 0x10]);
    h.step();

    h.assertPC(0x202);
  });

  it('should skip when both registers are zero', () => {
    h.state.v[3] = 0x00;
    h.state.v[4] = 0x00;
    // SE V3, V4
    h.loadProgram([0x53, 0x40]);
    h.step();

    h.assertPC(0x204);
  });

  it('should skip when comparing a register with itself', () => {
    h.state.v[5] = 0xAB;
    // SE V5, V5
    h.loadProgram([0x55, 0x50]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with VF as Vx', () => {
    h.state.v[0xF] = 0x10;
    h.state.v[0] = 0x10;
    // SE VF, V0
    h.loadProgram([0x5F, 0x00]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with VF as Vy', () => {
    h.state.v[0] = 0xFF;
    h.state.v[0xF] = 0xFF;
    // SE V0, VF
    h.loadProgram([0x50, 0xF0]);
    h.step();

    h.assertPC(0x204);
  });
});
