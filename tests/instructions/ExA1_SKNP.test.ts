import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('ExA1 - SKNP Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should skip next instruction when key Vx is NOT pressed', () => {
    // V0 = 5, key 5 not pressed
    h.state.v[0] = 5;
    // E0A1 - SKNP V0
    h.loadProgram([0xE0, 0xA1]);
    h.step();

    // Skip: PC = 0x200 + 2 (fetch) + 2 (skip) = 0x204
    h.assertPC(0x204);
  });

  it('should not skip when key Vx IS pressed', () => {
    // V0 = 5, key 5 pressed
    h.state.v[0] = 5;
    h.input.pressKey(5);
    // E0A1 - SKNP V0
    h.loadProgram([0xE0, 0xA1]);
    h.step();

    // No skip: PC = 0x200 + 2 = 0x202
    h.assertPC(0x202);
  });

  it('should check the key indicated by Vx, not x itself', () => {
    // V4 = 0xB, key 0xB not pressed
    h.state.v[4] = 0xB;
    // E4A1 - SKNP V4
    h.loadProgram([0xE4, 0xA1]);
    h.step();

    h.assertPC(0x204);
  });

  it('should skip when a different key is pressed but not the one in Vx', () => {
    h.state.v[0] = 5;
    h.input.pressKey(3); // key 3 pressed, not key 5
    h.loadProgram([0xE0, 0xA1]);
    h.step();

    h.assertPC(0x204);
  });

  it('should work with key 0 not pressed', () => {
    h.state.v[0] = 0;
    h.loadProgram([0xE0, 0xA1]);
    h.step();

    h.assertPC(0x204);
  });

  it('should not skip when key 0 is pressed', () => {
    h.state.v[0] = 0;
    h.input.pressKey(0);
    h.loadProgram([0xE0, 0xA1]);
    h.step();

    h.assertPC(0x202);
  });

  it('should work with key 0xF', () => {
    h.state.v[1] = 0xF;
    h.input.pressKey(0xF);
    // E1A1 - SKNP V1
    h.loadProgram([0xE1, 0xA1]);
    h.step();

    h.assertPC(0x202);
  });

  it('should not modify any registers', () => {
    h.state.v[0] = 5;
    h.loadProgram([0xE0, 0xA1]);
    h.step();

    h.assertRegister(0, 5);
  });
});
