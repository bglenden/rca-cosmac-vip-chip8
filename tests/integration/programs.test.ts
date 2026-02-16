import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';
import { DISPLAY_WIDTH } from '../../src/core/types.js';

describe('Program integration', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should run a counting loop', () => {
    // V0 = 0; while (V0 != 5) V0++
    h.loadProgram([
      0x60, 0x00, // 0x200: LD V0, 0
      0x70, 0x01, // 0x202: ADD V0, 1
      0x30, 0x05, // 0x204: SE V0, 5
      0x12, 0x02, // 0x206: JP 0x202
      // falls through here when V0 == 5
    ]);

    h.run(1 + 5 * 3 - 1); // 1 init + 5 iterations * 3 instrs - 1 (last iteration skips JP)
    h.assertRegister(0, 5);
  });

  it('should call and return from a subroutine', () => {
    h.loadProgram([
      0x60, 0x0A, // 0x200: LD V0, 10
      0x22, 0x08, // 0x202: CALL 0x208
      0x60, 0xFF, // 0x204: LD V0, 255 (executed after return)
      0x12, 0x06, // 0x206: JP 0x206 (halt loop)
      // Subroutine at 0x208:
      0x61, 0x14, // 0x208: LD V1, 20
      0x00, 0xEE, // 0x20A: RET
    ]);

    h.run(5); // LD V0 + CALL + LD V1 + RET + LD V0=255
    h.assertRegister(0, 255);
    h.assertRegister(1, 20);
    h.assertSP(0); // stack should be empty after return
  });

  it('should handle nested subroutine calls', () => {
    h.loadProgram([
      0x22, 0x06, // 0x200: CALL 0x206 (sub A)
      0x12, 0x04, // 0x202: JP 0x204 (halt)
      0x12, 0x04, // 0x204: JP 0x204 (halt loop)
      // Sub A at 0x206:
      0x60, 0x01, // 0x206: LD V0, 1
      0x22, 0x0E, // 0x208: CALL 0x20E (sub B)
      0x00, 0xEE, // 0x20A: RET
      0x00, 0x00, // 0x20C: padding
      // Sub B at 0x20E:
      0x61, 0x02, // 0x20E: LD V1, 2
      0x00, 0xEE, // 0x210: RET
    ]);

    h.run(7); // CALL A + LD V0 + CALL B + LD V1 + RET B + RET A + JP halt
    h.assertRegister(0, 1);
    h.assertRegister(1, 2);
    h.assertSP(0);
    h.assertPC(0x204);
  });

  it('should draw a sprite and check collision in a program', () => {
    // Draw a 1-pixel sprite at (5,5), then draw again to check collision
    h.loadProgram([
      0xA2, 0x10, // 0x200: LD I, 0x210 (sprite data)
      0x60, 0x05, // 0x202: LD V0, 5
      0x61, 0x05, // 0x204: LD V1, 5
      0xD0, 0x11, // 0x206: DRW V0, V1, 1 — first draw
      0x62, 0x00, // 0x208: LD V2, VF (save collision flag... wait, need to read VF)
      // Actually just check VF after second draw
      0xD0, 0x11, // 0x20A: DRW V0, V1, 1 — second draw (collision!)
      0x12, 0x0C, // 0x20C: JP 0x20C (halt)
      0x00, 0x00, // 0x20E: padding
      0x80, 0x00, // 0x210: sprite data: 10000000
    ]);

    h.run(4); // LD I + LD V0 + LD V1 + DRW
    expect(h.state.v[0xf]).toBe(0); // no collision first time

    h.run(2); // LD V2 + DRW again
    expect(h.state.v[0xf]).toBe(1); // collision second time
    // Pixel should be erased
    expect(h.state.display[5 * DISPLAY_WIDTH + 5]).toBe(0);
  });

  it('should use BCD to display a number', () => {
    // Store BCD of 234 at memory location 0x300
    h.loadProgram([
      0x60, 0xEA, // LD V0, 234
      0xA3, 0x00, // LD I, 0x300
      0xF0, 0x33, // LD B, V0
    ]);

    h.run(3);
    h.assertMemory(0x300, 2); // hundreds
    h.assertMemory(0x301, 3); // tens
    h.assertMemory(0x302, 4); // ones
  });

  it('should store and load registers via Fx55/Fx65', () => {
    h.loadProgram([
      0x60, 0x0A, // LD V0, 10
      0x61, 0x14, // LD V1, 20
      0x62, 0x1E, // LD V2, 30
      0xA4, 0x00, // LD I, 0x400
      0xF2, 0x55, // LD [I], V2 — store V0-V2
      // Now clear registers
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0x62, 0x00, // LD V2, 0
      // Reload from memory
      0xA4, 0x00, // LD I, 0x400
      0xF2, 0x65, // LD V2, [I] — load V0-V2
    ]);

    h.run(10);
    h.assertRegister(0, 10);
    h.assertRegister(1, 20);
    h.assertRegister(2, 30);
  });

  it('should handle key input in a program', () => {
    // Wait for key 5 to be pressed, store in V0
    h.loadProgram([
      0xF0, 0x0A, // 0x200: LD V0, K — wait for key
      0x12, 0x02, // 0x202: JP 0x202 (halt)
    ]);

    // Run a few cycles — should be waiting
    h.run(5);
    expect(h.state.waitingForKey).toBe(true);
    h.assertPC(0x202); // PC advanced past the instruction but CPU is waiting

    // Press key 5 (two-phase: press detected, then release stores value)
    h.input.pressKey(5);
    h.step(); // press detected, transitions to release phase
    expect(h.state.waitingForKey).toBe(true);
    h.input.releaseKey(5);
    h.step(); // release detected, stores value
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);
  });
});
