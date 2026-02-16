import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy2 - AND Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should AND Vx with Vy and store in Vx', () => {
    h.state.v[0] = 0xFF;
    h.state.v[1] = 0x0F;
    // AND V0, V1
    h.loadProgram([0x80, 0x12]);
    h.step();

    h.assertRegister(0, 0x0F);
    h.assertPC(0x202);
  });

  it('should reset VF to 0 (COSMAC VIP quirk)', () => {
    h.state.v[0] = 0xFF;
    h.state.v[1] = 0x0F;
    h.state.v[0xF] = 0x01;
    // AND V0, V1
    h.loadProgram([0x80, 0x12]);
    h.step();

    h.assertRegister(0xF, 0);
  });

  it('should AND with zero (result is zero)', () => {
    h.state.v[2] = 0xAB;
    h.state.v[3] = 0x00;
    // AND V2, V3
    h.loadProgram([0x82, 0x32]);
    h.step();

    h.assertRegister(2, 0x00);
    h.assertRegister(0xF, 0);
  });

  it('should AND with 0xFF (identity)', () => {
    h.state.v[0] = 0x42;
    h.state.v[1] = 0xFF;
    // AND V0, V1
    h.loadProgram([0x80, 0x12]);
    h.step();

    h.assertRegister(0, 0x42);
  });

  it('should AND with same value (idempotent)', () => {
    h.state.v[4] = 0xAA;
    h.state.v[5] = 0xAA;
    // AND V4, V5
    h.loadProgram([0x84, 0x52]);
    h.step();

    h.assertRegister(4, 0xAA);
    h.assertRegister(0xF, 0);
  });

  it('should AND non-overlapping bits (result is zero)', () => {
    h.state.v[0] = 0xAA; // 10101010
    h.state.v[1] = 0x55; // 01010101
    // AND V0, V1
    h.loadProgram([0x80, 0x12]);
    h.step();

    h.assertRegister(0, 0x00);
  });

  it('should reset VF even when VF is Vx', () => {
    h.state.v[0xF] = 0xFF;
    h.state.v[1] = 0x0F;
    // AND VF, V1
    h.loadProgram([0x8F, 0x12]);
    h.step();

    // VF gets AND result first, then reset to 0
    h.assertRegister(0xF, 0);
  });
});
