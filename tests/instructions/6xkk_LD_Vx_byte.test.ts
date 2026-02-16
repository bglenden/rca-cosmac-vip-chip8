import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('6xkk - LD Vx, byte', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should load byte into register V0', () => {
    // LD V0, 0x42
    h.loadProgram([0x60, 0x42]);
    h.step();

    h.assertRegister(0, 0x42);
    h.assertPC(0x202);
  });

  it('should load zero into register', () => {
    h.state.v[3] = 0xFF; // pre-fill with non-zero
    // LD V3, 0x00
    h.loadProgram([0x63, 0x00]);
    h.step();

    h.assertRegister(3, 0x00);
  });

  it('should load max byte value 0xFF', () => {
    // LD V7, 0xFF
    h.loadProgram([0x67, 0xFF]);
    h.step();

    h.assertRegister(7, 0xFF);
  });

  it('should load into the last general register VE', () => {
    // LD VE, 0xAB
    h.loadProgram([0x6E, 0xAB]);
    h.step();

    h.assertRegister(0xE, 0xAB);
  });

  it('should load into VF', () => {
    // LD VF, 0x01
    h.loadProgram([0x6F, 0x01]);
    h.step();

    h.assertRegister(0xF, 0x01);
  });

  it('should not affect other registers', () => {
    h.state.v[0] = 0x11;
    h.state.v[2] = 0x22;
    // LD V1, 0x99
    h.loadProgram([0x61, 0x99]);
    h.step();

    h.assertRegister(0, 0x11);
    h.assertRegister(1, 0x99);
    h.assertRegister(2, 0x22);
  });
});
