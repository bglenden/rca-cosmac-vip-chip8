import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx29 - LD F, Vx', () => {
  let h: TestHarness;

  const FONT_START = 0x050;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set I to font sprite for digit 0', () => {
    h.state.v[0] = 0;
    // F029 - LD F, V0
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertI(FONT_START + 0 * 5);
    h.assertPC(0x202);
  });

  it('should set I to font sprite for digit 1', () => {
    h.state.v[0] = 1;
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertI(FONT_START + 1 * 5);
  });

  it('should set I to font sprite for digit 9', () => {
    h.state.v[0] = 9;
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertI(FONT_START + 9 * 5);
  });

  it('should set I to font sprite for digit 0xF', () => {
    h.state.v[0] = 0xF;
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertI(FONT_START + 0xF * 5);
  });

  it('should use correct register', () => {
    h.state.v[0xA] = 5;
    // FA29 - LD F, VA
    h.loadProgram([0xFA, 0x29]);
    h.step();

    h.assertI(FONT_START + 5 * 5);
  });

  it('should mask Vx to low nibble for values > 0xF', () => {
    // Vx = 0x1A -> only low nibble 0xA is used
    h.state.v[0] = 0x1A;
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertI(FONT_START + 0xA * 5);
  });

  it('should handle Vx = 0xFF (masked to 0xF)', () => {
    h.state.v[0] = 0xFF;
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertI(FONT_START + 0xF * 5);
  });

  it('should set correct address for each hex digit', () => {
    for (let digit = 0; digit <= 0xF; digit++) {
      const th = new TestHarness(42);
      th.state.v[0] = digit;
      th.loadProgram([0xF0, 0x29]);
      th.step();
      th.assertI(FONT_START + digit * 5);
    }
  });

  it('should not modify Vx', () => {
    h.state.v[0] = 7;
    h.loadProgram([0xF0, 0x29]);
    h.step();

    h.assertRegister(0, 7);
  });
});
