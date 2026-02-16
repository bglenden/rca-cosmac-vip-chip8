import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('1nnn - JP addr', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set PC to nnn', () => {
    // 1nnn: JP 0x400
    h.loadProgram([0x14, 0x00]);
    h.step();

    h.assertPC(0x400);
  });

  it('should jump to the start of program memory', () => {
    // JP 0x200
    h.loadProgram([0x12, 0x00]);
    h.step();

    h.assertPC(0x200);
  });

  it('should jump to the maximum address (0xFFF)', () => {
    // JP 0xFFF
    h.loadProgram([0x1F, 0xFF]);
    h.step();

    h.assertPC(0xFFF);
  });

  it('should not modify the stack pointer', () => {
    h.loadProgram([0x14, 0x00]);
    h.step();

    h.assertSP(0);
  });
});
