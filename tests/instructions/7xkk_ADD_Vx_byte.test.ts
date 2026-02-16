import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('7xkk - ADD Vx, byte', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should add byte to register', () => {
    h.state.v[0] = 0x10;
    // ADD V0, 0x05
    h.loadProgram([0x70, 0x05]);
    h.step();

    h.assertRegister(0, 0x15);
    h.assertPC(0x202);
  });

  it('should add zero (no change)', () => {
    h.state.v[3] = 0x42;
    // ADD V3, 0x00
    h.loadProgram([0x73, 0x00]);
    h.step();

    h.assertRegister(3, 0x42);
  });

  it('should wrap around at 255 (no carry flag set)', () => {
    h.state.v[1] = 0xFF;
    // ADD V1, 0x01
    h.loadProgram([0x71, 0x01]);
    h.step();

    h.assertRegister(1, 0x00);
    // VF should NOT be affected by 7xkk (no carry flag)
  });

  it('should wrap with larger overflow', () => {
    h.state.v[2] = 0xFF;
    // ADD V2, 0xFF
    h.loadProgram([0x72, 0xFF]);
    h.step();

    // 0xFF + 0xFF = 0x1FE, masked to 0xFE
    h.assertRegister(2, 0xFE);
  });

  it('should not modify VF (no carry flag behavior)', () => {
    h.state.v[0xF] = 0x00;
    h.state.v[5] = 0xFF;
    // ADD V5, 0x02 (causes overflow)
    h.loadProgram([0x75, 0x02]);
    h.step();

    h.assertRegister(5, 0x01);
    // VF should remain unchanged
    h.assertRegister(0xF, 0x00);
  });

  it('should add to VF register directly', () => {
    h.state.v[0xF] = 0x10;
    // ADD VF, 0x05
    h.loadProgram([0x7F, 0x05]);
    h.step();

    h.assertRegister(0xF, 0x15);
  });

  it('should add from zero', () => {
    h.state.v[4] = 0x00;
    // ADD V4, 0xFF
    h.loadProgram([0x74, 0xFF]);
    h.step();

    h.assertRegister(4, 0xFF);
  });
});
