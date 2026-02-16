import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy0 - LD Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should copy Vy into Vx', () => {
    h.state.v[1] = 0x42;
    // LD V0, V1
    h.loadProgram([0x80, 0x10]);
    h.step();

    h.assertRegister(0, 0x42);
    h.assertRegister(1, 0x42); // Vy unchanged
    h.assertPC(0x202);
  });

  it('should copy zero value', () => {
    h.state.v[0] = 0xFF;
    h.state.v[1] = 0x00;
    // LD V0, V1
    h.loadProgram([0x80, 0x10]);
    h.step();

    h.assertRegister(0, 0x00);
  });

  it('should copy max value 0xFF', () => {
    h.state.v[5] = 0xFF;
    // LD V3, V5
    h.loadProgram([0x83, 0x50]);
    h.step();

    h.assertRegister(3, 0xFF);
  });

  it('should copy from VF', () => {
    h.state.v[0xF] = 0xAB;
    // LD V0, VF
    h.loadProgram([0x80, 0xF0]);
    h.step();

    h.assertRegister(0, 0xAB);
  });

  it('should copy to VF', () => {
    h.state.v[3] = 0x55;
    // LD VF, V3
    h.loadProgram([0x8F, 0x30]);
    h.step();

    h.assertRegister(0xF, 0x55);
  });

  it('should work when Vx and Vy are the same register', () => {
    h.state.v[5] = 0x42;
    // LD V5, V5
    h.loadProgram([0x85, 0x50]);
    h.step();

    h.assertRegister(5, 0x42);
  });

  it('should not affect other registers', () => {
    h.state.v[0] = 0x11;
    h.state.v[1] = 0x22;
    h.state.v[2] = 0x33;
    // LD V0, V1
    h.loadProgram([0x80, 0x10]);
    h.step();

    h.assertRegister(0, 0x22);
    h.assertRegister(1, 0x22);
    h.assertRegister(2, 0x33);
  });
});
