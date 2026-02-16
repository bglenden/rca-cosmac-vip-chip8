import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx15 - LD DT, Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set delay timer from Vx', () => {
    h.state.v[0] = 30;
    // F015 - LD DT, V0
    h.loadProgram([0xF0, 0x15]);
    h.step();

    h.assertDelayTimer(30);
    h.assertPC(0x202);
  });

  it('should set delay timer to zero', () => {
    h.state.delayTimer = 100;
    h.state.v[0] = 0;
    h.loadProgram([0xF0, 0x15]);
    h.step();

    h.assertDelayTimer(0);
  });

  it('should set delay timer to max value (255)', () => {
    h.state.v[0] = 255;
    h.loadProgram([0xF0, 0x15]);
    h.step();

    h.assertDelayTimer(255);
  });

  it('should read from the correct register', () => {
    h.state.v[0xA] = 77;
    // FA15 - LD DT, VA
    h.loadProgram([0xFA, 0x15]);
    h.step();

    h.assertDelayTimer(77);
  });

  it('should not modify Vx', () => {
    h.state.v[3] = 50;
    // F315 - LD DT, V3
    h.loadProgram([0xF3, 0x15]);
    h.step();

    h.assertRegister(3, 50);
  });

  it('should overwrite existing delay timer value', () => {
    h.state.delayTimer = 200;
    h.state.v[0] = 10;
    h.loadProgram([0xF0, 0x15]);
    h.step();

    h.assertDelayTimer(10);
  });

  it('delay timer should decrement on timerTick', () => {
    h.state.v[0] = 5;
    h.loadProgram([0xF0, 0x15]);
    h.step();

    h.assertDelayTimer(5);
    h.timerTick();
    h.assertDelayTimer(4);
    h.timerTick();
    h.assertDelayTimer(3);
  });
});
