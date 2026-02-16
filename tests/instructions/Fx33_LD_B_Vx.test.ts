import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx33 - LD B, Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should store BCD of 123 at I, I+1, I+2', () => {
    h.state.i = 0x300;
    h.state.v[0] = 123;
    // F033 - LD B, V0
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertMemory(0x300, 1); // hundreds
    h.assertMemory(0x301, 2); // tens
    h.assertMemory(0x302, 3); // ones
    h.assertPC(0x202);
  });

  it('should store BCD of 0', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertMemory(0x300, 0);
    h.assertMemory(0x301, 0);
    h.assertMemory(0x302, 0);
  });

  it('should store BCD of 255 (max value)', () => {
    h.state.i = 0x300;
    h.state.v[0] = 255;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertMemory(0x300, 2);
    h.assertMemory(0x301, 5);
    h.assertMemory(0x302, 5);
  });

  it('should store BCD of 100', () => {
    h.state.i = 0x300;
    h.state.v[0] = 100;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertMemory(0x300, 1);
    h.assertMemory(0x301, 0);
    h.assertMemory(0x302, 0);
  });

  it('should store BCD of 9 (single digit)', () => {
    h.state.i = 0x300;
    h.state.v[0] = 9;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertMemory(0x300, 0);
    h.assertMemory(0x301, 0);
    h.assertMemory(0x302, 9);
  });

  it('should store BCD of 99', () => {
    h.state.i = 0x300;
    h.state.v[0] = 99;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertMemory(0x300, 0);
    h.assertMemory(0x301, 9);
    h.assertMemory(0x302, 9);
  });

  it('should use the correct register', () => {
    h.state.i = 0x400;
    h.state.v[5] = 247;
    // F533 - LD B, V5
    h.loadProgram([0xF5, 0x33]);
    h.step();

    h.assertMemory(0x400, 2);
    h.assertMemory(0x401, 4);
    h.assertMemory(0x402, 7);
  });

  it('should not modify I', () => {
    h.state.i = 0x300;
    h.state.v[0] = 123;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertI(0x300);
  });

  it('should not modify Vx', () => {
    h.state.i = 0x300;
    h.state.v[0] = 123;
    h.loadProgram([0xF0, 0x33]);
    h.step();

    h.assertRegister(0, 123);
  });
});
