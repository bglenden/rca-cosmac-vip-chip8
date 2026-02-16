import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx07 - LD Vx, DT', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should load delay timer value into Vx', () => {
    h.state.delayTimer = 42;
    // F007 - LD V0, DT
    h.loadProgram([0xF0, 0x07]);
    h.step();

    h.assertRegister(0, 42);
    h.assertPC(0x202);
  });

  it('should load zero when delay timer is zero', () => {
    h.state.delayTimer = 0;
    h.state.v[0] = 0xFF; // pre-set to non-zero
    h.loadProgram([0xF0, 0x07]);
    h.step();

    h.assertRegister(0, 0);
  });

  it('should load into the correct register', () => {
    h.state.delayTimer = 100;
    // FA07 - LD VA, DT
    h.loadProgram([0xFA, 0x07]);
    h.step();

    h.assertRegister(0xA, 100);
  });

  it('should load max timer value (255)', () => {
    h.state.delayTimer = 255;
    h.loadProgram([0xF0, 0x07]);
    h.step();

    h.assertRegister(0, 255);
  });

  it('should not modify the delay timer', () => {
    h.state.delayTimer = 50;
    h.loadProgram([0xF0, 0x07]);
    h.step();

    h.assertDelayTimer(50);
  });

  it('should overwrite previous register value', () => {
    h.state.v[3] = 0xAB;
    h.state.delayTimer = 0x12;
    // F307 - LD V3, DT
    h.loadProgram([0xF3, 0x07]);
    h.step();

    h.assertRegister(3, 0x12);
  });
});
