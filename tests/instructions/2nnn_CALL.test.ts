import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('2nnn - CALL addr', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should push current PC onto the stack and jump to nnn', () => {
    // CALL 0x400
    h.loadProgram([0x24, 0x00]);
    h.step();

    // PC was 0x200, fetch advances it to 0x202, then CALL pushes 0x202
    expect(h.state.stack[0]).toBe(0x202);
    h.assertSP(1);
    h.assertPC(0x400);
  });

  it('should handle nested calls', () => {
    // CALL 0x300 at 0x200
    h.loadProgram([0x23, 0x00]);
    // CALL 0x400 at 0x300
    h.state.memory[0x300] = 0x24;
    h.state.memory[0x301] = 0x00;

    h.step(); // CALL 0x300
    h.assertSP(1);
    expect(h.state.stack[0]).toBe(0x202);

    h.step(); // CALL 0x400
    h.assertSP(2);
    expect(h.state.stack[1]).toBe(0x302);
    h.assertPC(0x400);
  });

  it('should be able to call address 0x200', () => {
    // CALL 0x200 (recursive call to program start)
    h.loadProgram([0x22, 0x00]);
    h.step();

    expect(h.state.stack[0]).toBe(0x202);
    h.assertSP(1);
    h.assertPC(0x200);
  });
});
