import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx55 - LD [I], Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should store V0 at I when x=0', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0xAB;
    // F055 - LD [I], V0
    h.loadProgram([0xF0, 0x55]);
    h.step();

    h.assertMemory(0x300, 0xAB);
    h.assertPC(0x202);
  });

  it('should store V0-V3 at I through I+3 when x=3', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0x10;
    h.state.v[1] = 0x20;
    h.state.v[2] = 0x30;
    h.state.v[3] = 0x40;
    // F355 - LD [I], V3
    h.loadProgram([0xF3, 0x55]);
    h.step();

    h.assertMemory(0x300, 0x10);
    h.assertMemory(0x301, 0x20);
    h.assertMemory(0x302, 0x30);
    h.assertMemory(0x303, 0x40);
  });

  it('should store V0-VF when x=F', () => {
    h.state.i = 0x300;
    for (let r = 0; r <= 0xF; r++) {
      h.state.v[r] = r * 10;
    }
    // FF55 - LD [I], VF
    h.loadProgram([0xFF, 0x55]);
    h.step();

    for (let r = 0; r <= 0xF; r++) {
      h.assertMemory(0x300 + r, (r * 10) & 0xFF);
    }
  });

  it('should increment I after each store (COSMAC VIP quirk)', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0xAA;
    h.state.v[1] = 0xBB;
    h.state.v[2] = 0xCC;
    // F255 - LD [I], V2
    h.loadProgram([0xF2, 0x55]);
    h.step();

    // I should be 0x300 + 3 = 0x303 (incremented once per register stored)
    h.assertI(0x303);
  });

  it('should set I to original + x + 1 after store', () => {
    h.state.i = 0x400;
    // F055 - LD [I], V0 -> I ends at 0x401
    h.loadProgram([0xF0, 0x55]);
    h.step();

    h.assertI(0x401);
  });

  it('should set I to original + 16 after storing all registers', () => {
    h.state.i = 0x300;
    // FF55 - LD [I], VF -> stores 16 registers, I = 0x300 + 16 = 0x310
    h.loadProgram([0xFF, 0x55]);
    h.step();

    h.assertI(0x310);
  });

  it('should not modify registers', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0x11;
    h.state.v[1] = 0x22;
    h.loadProgram([0xF1, 0x55]);
    h.step();

    h.assertRegister(0, 0x11);
    h.assertRegister(1, 0x22);
  });

  it('should store zero-valued registers', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0;
    h.state.v[1] = 0;
    // Write something at memory first to confirm overwrite
    h.state.memory[0x300] = 0xFF;
    h.state.memory[0x301] = 0xFF;
    // F155 - LD [I], V1
    h.loadProgram([0xF1, 0x55]);
    h.step();

    h.assertMemory(0x300, 0);
    h.assertMemory(0x301, 0);
  });
});
