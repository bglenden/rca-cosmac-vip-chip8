import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx1E - ADD I, Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should add Vx to I', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0x10;
    // F01E - ADD I, V0
    h.loadProgram([0xF0, 0x1E]);
    h.step();

    h.assertI(0x310);
    h.assertPC(0x202);
  });

  it('should add zero', () => {
    h.state.i = 0x400;
    h.state.v[0] = 0;
    h.loadProgram([0xF0, 0x1E]);
    h.step();

    h.assertI(0x400);
  });

  it('should add max register value (255)', () => {
    h.state.i = 0x100;
    h.state.v[0] = 0xFF;
    h.loadProgram([0xF0, 0x1E]);
    h.step();

    h.assertI(0x1FF);
  });

  it('should use correct register', () => {
    h.state.i = 0x200;
    h.state.v[7] = 0x50;
    // F71E - ADD I, V7
    h.loadProgram([0xF7, 0x1E]);
    h.step();

    h.assertI(0x250);
  });

  it('should wrap at 12 bits (0xFFF)', () => {
    h.state.i = 0xFF0;
    h.state.v[0] = 0x20;
    h.loadProgram([0xF0, 0x1E]);
    h.step();

    // 0xFF0 + 0x20 = 0x1010, masked to 0x010
    h.assertI(0x010);
  });

  it('should not modify Vx', () => {
    h.state.i = 0x300;
    h.state.v[0] = 0x10;
    h.loadProgram([0xF0, 0x1E]);
    h.step();

    h.assertRegister(0, 0x10);
  });

  it('should handle I at zero', () => {
    h.state.i = 0;
    h.state.v[0] = 0x42;
    h.loadProgram([0xF0, 0x1E]);
    h.step();

    h.assertI(0x42);
  });
});
