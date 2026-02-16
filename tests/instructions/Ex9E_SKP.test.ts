import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Ex9E - SKP Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should skip next instruction when key Vx is pressed', () => {
    // V0 = 5, key 5 pressed
    h.state.v[0] = 5;
    h.input.pressKey(5);
    // E09E - SKP V0
    h.loadProgram([0xE0, 0x9E]);
    h.step();

    // Skip: PC = 0x200 + 2 (fetch) + 2 (skip) = 0x204
    h.assertPC(0x204);
  });

  it('should not skip when key Vx is not pressed', () => {
    // V0 = 5, key 5 not pressed
    h.state.v[0] = 5;
    // E09E - SKP V0
    h.loadProgram([0xE0, 0x9E]);
    h.step();

    // No skip: PC = 0x200 + 2 = 0x202
    h.assertPC(0x202);
  });

  it('should check the key indicated by Vx, not x itself', () => {
    // V3 = 0xA, key 0xA pressed
    h.state.v[3] = 0xA;
    h.input.pressKey(0xA);
    // E39E - SKP V3
    h.loadProgram([0xE3, 0x9E]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not skip when a different key is pressed', () => {
    // V0 = 5, key 3 pressed (not 5)
    h.state.v[0] = 5;
    h.input.pressKey(3);
    // E09E - SKP V0
    h.loadProgram([0xE0, 0x9E]);
    h.step();

    h.assertPC(0x202);
  });

  it('should work with key 0', () => {
    h.state.v[0] = 0;
    h.input.pressKey(0);
    h.loadProgram([0xE0, 0x9E]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with key 0xF', () => {
    h.state.v[2] = 0xF;
    h.input.pressKey(0xF);
    // E29E - SKP V2
    h.loadProgram([0xE2, 0x9E]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not modify any registers', () => {
    h.state.v[0] = 5;
    h.input.pressKey(5);
    h.loadProgram([0xE0, 0x9E]);
    h.step();

    h.assertRegister(0, 5);
  });
});
