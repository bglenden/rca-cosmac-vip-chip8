import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx65 - LD Vx, [I]', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should load V0 from memory at I when x=0', () => {
    h.state.i = 0x300;
    h.state.memory[0x300] = 0xAB;
    // F065 - LD V0, [I]
    h.loadProgram([0xF0, 0x65]);
    h.step();

    h.assertRegister(0, 0xAB);
    h.assertPC(0x202);
  });

  it('should load V0-V3 from memory when x=3', () => {
    h.state.i = 0x300;
    h.state.memory[0x300] = 0x10;
    h.state.memory[0x301] = 0x20;
    h.state.memory[0x302] = 0x30;
    h.state.memory[0x303] = 0x40;
    // F365 - LD V3, [I]
    h.loadProgram([0xF3, 0x65]);
    h.step();

    h.assertRegister(0, 0x10);
    h.assertRegister(1, 0x20);
    h.assertRegister(2, 0x30);
    h.assertRegister(3, 0x40);
  });

  it('should load V0-VF when x=F', () => {
    h.state.i = 0x300;
    for (let r = 0; r <= 0xF; r++) {
      h.state.memory[0x300 + r] = r * 10;
    }
    // FF65 - LD VF, [I]
    h.loadProgram([0xFF, 0x65]);
    h.step();

    for (let r = 0; r <= 0xF; r++) {
      h.assertRegister(r, r * 10);
    }
  });

  it('should increment I after each load (COSMAC VIP quirk)', () => {
    h.state.i = 0x300;
    h.state.memory[0x300] = 0xAA;
    h.state.memory[0x301] = 0xBB;
    h.state.memory[0x302] = 0xCC;
    // F265 - LD V2, [I]
    h.loadProgram([0xF2, 0x65]);
    h.step();

    // I should be 0x300 + 3 = 0x303
    h.assertI(0x303);
  });

  it('should set I to original + x + 1 after load', () => {
    h.state.i = 0x400;
    h.state.memory[0x400] = 0x11;
    // F065 - LD V0, [I] -> I ends at 0x401
    h.loadProgram([0xF0, 0x65]);
    h.step();

    h.assertI(0x401);
  });

  it('should set I to original + 16 after loading all registers', () => {
    h.state.i = 0x300;
    // FF65 - LD VF, [I] -> loads 16 registers, I = 0x300 + 16 = 0x310
    h.loadProgram([0xFF, 0x65]);
    h.step();

    h.assertI(0x310);
  });

  it('should overwrite existing register values', () => {
    h.state.v[0] = 0xFF;
    h.state.v[1] = 0xFF;
    h.state.i = 0x300;
    h.state.memory[0x300] = 0x11;
    h.state.memory[0x301] = 0x22;
    // F165 - LD V1, [I]
    h.loadProgram([0xF1, 0x65]);
    h.step();

    h.assertRegister(0, 0x11);
    h.assertRegister(1, 0x22);
  });

  it('should load zero values from memory', () => {
    h.state.v[0] = 0xFF;
    h.state.i = 0x300;
    h.state.memory[0x300] = 0;
    // F065 - LD V0, [I]
    h.loadProgram([0xF0, 0x65]);
    h.step();

    h.assertRegister(0, 0);
  });

  it('should not modify memory', () => {
    h.state.i = 0x300;
    h.state.memory[0x300] = 0xAA;
    h.state.memory[0x301] = 0xBB;
    h.loadProgram([0xF1, 0x65]);
    h.step();

    h.assertMemory(0x300, 0xAA);
    h.assertMemory(0x301, 0xBB);
  });
});
