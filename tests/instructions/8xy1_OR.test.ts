import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy1 - OR Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should OR Vx with Vy and store in Vx', () => {
    h.state.v[0] = 0x0F;
    h.state.v[1] = 0xF0;
    // OR V0, V1
    h.loadProgram([0x80, 0x11]);
    h.step();

    h.assertRegister(0, 0xFF);
    h.assertPC(0x202);
  });

  it('should reset VF to 0 (COSMAC VIP quirk)', () => {
    h.state.v[0] = 0x0F;
    h.state.v[1] = 0xF0;
    h.state.v[0xF] = 0x01; // pre-set VF
    // OR V0, V1
    h.loadProgram([0x80, 0x11]);
    h.step();

    h.assertRegister(0xF, 0);
  });

  it('should OR with zero (identity)', () => {
    h.state.v[2] = 0xAB;
    h.state.v[3] = 0x00;
    // OR V2, V3
    h.loadProgram([0x82, 0x31]);
    h.step();

    h.assertRegister(2, 0xAB);
    h.assertRegister(0xF, 0);
  });

  it('should OR with 0xFF (all bits set)', () => {
    h.state.v[0] = 0x42;
    h.state.v[1] = 0xFF;
    // OR V0, V1
    h.loadProgram([0x80, 0x11]);
    h.step();

    h.assertRegister(0, 0xFF);
  });

  it('should OR with same value (idempotent)', () => {
    h.state.v[4] = 0x55;
    h.state.v[5] = 0x55;
    // OR V4, V5
    h.loadProgram([0x84, 0x51]);
    h.step();

    h.assertRegister(4, 0x55);
    h.assertRegister(0xF, 0);
  });

  it('should reset VF even when VF is Vx', () => {
    h.state.v[0xF] = 0x0F;
    h.state.v[1] = 0xF0;
    // OR VF, V1
    h.loadProgram([0x8F, 0x11]);
    h.step();

    // VF gets the OR result first, then gets reset to 0
    h.assertRegister(0xF, 0);
  });

  it('should OR both zero values', () => {
    h.state.v[0] = 0x00;
    h.state.v[1] = 0x00;
    // OR V0, V1
    h.loadProgram([0x80, 0x11]);
    h.step();

    h.assertRegister(0, 0x00);
    h.assertRegister(0xF, 0);
  });
});
