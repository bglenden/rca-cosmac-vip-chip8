import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('3xkk - SE Vx, byte', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should skip next instruction when Vx equals kk', () => {
    h.state.v[0] = 0x42;
    // SE V0, 0x42
    h.loadProgram([0x30, 0x42]);
    h.step();

    // Skip: PC = 0x200 + 2 (fetch) + 2 (skip) = 0x204
    h.assertPC(0x204);
  });

  it('should not skip when Vx does not equal kk', () => {
    h.state.v[0] = 0x10;
    // SE V0, 0x42
    h.loadProgram([0x30, 0x42]);
    h.step();

    // No skip: PC = 0x200 + 2 (fetch) = 0x202
    h.assertPC(0x202);
  });

  it('should work with zero value', () => {
    h.state.v[5] = 0x00;
    // SE V5, 0x00
    h.loadProgram([0x35, 0x00]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with max byte value 0xFF', () => {
    h.state.v[3] = 0xFF;
    // SE V3, 0xFF
    h.loadProgram([0x33, 0xFF]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with register VF', () => {
    h.state.v[0xF] = 0xAB;
    // SE VF, 0xAB
    h.loadProgram([0x3F, 0xAB]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not skip when VF does not match', () => {
    h.state.v[0xF] = 0x01;
    // SE VF, 0x00
    h.loadProgram([0x3F, 0x00]);
    h.step();

    h.assertPC(0x202);
  });
});
