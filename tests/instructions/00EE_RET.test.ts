import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('00EE - RET', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should pop the stack and restore PC', () => {
    // Simulate a prior CALL by pushing an address onto the stack
    h.state.stack[0] = 0x400;
    h.state.sp = 1;

    // 00EE - RET
    h.loadProgram([0x00, 0xEE]);
    h.step();

    h.assertPC(0x400);
    h.assertSP(0);
  });

  it('should handle nested calls (multiple returns)', () => {
    // Simulate two nested CALLs
    h.state.stack[0] = 0x300;
    h.state.stack[1] = 0x400;
    h.state.sp = 2;

    // First RET
    h.loadProgram([0x00, 0xEE]);
    h.step();

    h.assertPC(0x400);
    h.assertSP(1);
  });

  it('should work with CALL then RET round-trip', () => {
    // 2nnn CALL 0x300, then at 0x300 place 00EE RET
    h.loadProgram([0x23, 0x00]); // CALL 0x300
    // Write RET at 0x300
    h.state.memory[0x300] = 0x00;
    h.state.memory[0x301] = 0xEE;

    h.step(); // execute CALL 0x300
    h.assertPC(0x300);
    h.assertSP(1);
    // Stack should contain the return address (0x202, after the CALL instruction)
    expect(h.state.stack[0]).toBe(0x202);

    h.step(); // execute RET
    h.assertPC(0x202);
    h.assertSP(0);
  });
});
