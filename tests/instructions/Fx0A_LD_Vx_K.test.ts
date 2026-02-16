import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx0A - LD Vx, K', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should enter waiting state after execution', () => {
    // F00A - LD V0, K
    h.loadProgram([0xF0, 0x0A]);
    h.step();

    expect(h.state.waitingForKey).toBe(true);
    expect(h.state.waitingKeyPhase).toBe('press');
    expect(h.state.waitingRegister).toBe(0);
    h.assertPC(0x202);
  });

  it('should set correct waiting register', () => {
    // F50A - LD V5, K
    h.loadProgram([0xF5, 0x0A]);
    h.step();

    expect(h.state.waitingForKey).toBe(true);
    expect(h.state.waitingKeyPhase).toBe('press');
    expect(h.state.waitingRegister).toBe(5);
  });

  it('should transition to release phase on key press, then store on release', () => {
    // F20A - LD V2, K
    h.loadProgram([0xF2, 0x0A]);
    h.step();

    expect(h.state.waitingForKey).toBe(true);

    // Press key 7
    h.input.pressKey(7);
    h.step(); // detects press, transitions to release phase

    expect(h.state.waitingForKey).toBe(true);
    expect(h.state.waitingKeyPhase).toBe('release');
    expect(h.state.waitingKeyValue).toBe(7);

    // Release key 7
    h.input.releaseKey(7);
    h.step(); // detects release, stores value

    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(2, 7);
  });

  it('should not execute instructions while waiting', () => {
    // F00A - LD V0, K
    // 6105 - LD V1, 0x05 (should not execute while waiting)
    h.loadProgram([0xF0, 0x0A, 0x61, 0x05]);
    h.step(); // executes LD V0, K -> enters waiting

    // PC advanced past the LD V0,K instruction
    h.assertPC(0x202);

    // Run another cycle with no key pressed
    h.step();

    // PC should NOT have advanced (still waiting)
    h.assertPC(0x202);
    // V1 should still be 0
    h.assertRegister(1, 0);
  });

  it('should remain waiting across multiple cycles with no key', () => {
    h.loadProgram([0xF0, 0x0A]);
    h.step();

    // Run several cycles without pressing a key
    h.step();
    h.step();
    h.step();

    expect(h.state.waitingForKey).toBe(true);
    h.assertPC(0x202);
  });

  it('should resume and continue executing after key press and release', () => {
    // F00A - LD V0, K
    // 6105 - LD V1, 0x05
    h.loadProgram([0xF0, 0x0A, 0x61, 0x05]);
    h.step(); // enters waiting

    h.input.pressKey(3);
    h.step(); // detects press, transitions to release phase
    expect(h.state.waitingForKey).toBe(true);

    h.input.releaseKey(3);
    h.step(); // detects release, stores key, resumes

    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 3);
    // PC still at 0x202 because the key-detect cycle returns early
    h.assertPC(0x202);

    // Now the next cycle should execute the next instruction
    h.step();
    h.assertRegister(1, 0x05);
    h.assertPC(0x204);
  });

  it('should store key 0 when key 0 is pressed and released', () => {
    h.loadProgram([0xF0, 0x0A]);
    h.step();

    h.input.pressKey(0);
    h.step(); // press detected
    h.input.releaseKey(0);
    h.step(); // release detected

    h.assertRegister(0, 0);
    expect(h.state.waitingForKey).toBe(false);
  });

  it('should store key 0xF when key 0xF is pressed and released', () => {
    h.loadProgram([0xF0, 0x0A]);
    h.step();

    h.input.pressKey(0xF);
    h.step(); // press detected
    h.input.releaseKey(0xF);
    h.step(); // release detected

    h.assertRegister(0, 0xF);
    expect(h.state.waitingForKey).toBe(false);
  });

  it('should track the lowest numbered key when multiple keys pressed simultaneously', () => {
    h.loadProgram([0xF0, 0x0A]);
    h.step();

    h.input.pressKey(5);
    h.input.pressKey(3);
    h.input.pressKey(9);
    h.step(); // press phase: scans from 0 upward, finds key 3 first

    expect(h.state.waitingKeyPhase).toBe('release');
    expect(h.state.waitingKeyValue).toBe(3);

    // Release key 3 (the tracked key)
    h.input.releaseKey(3);
    h.step(); // release detected for key 3

    h.assertRegister(0, 3);
    expect(h.state.waitingForKey).toBe(false);

    h.input.releaseKey(5);
    h.input.releaseKey(9);
  });

  it('should naturally handle consecutive Fx0A via press-then-release requirement', () => {
    // F00A - wait/store in V0
    // F10A - wait/store in V1
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A]);

    h.step(); // first Fx0A enters waiting (press phase)

    h.input.pressKey(5);
    h.step(); // press detected, transitions to release phase
    expect(h.state.waitingForKey).toBe(true);

    // Key 5 still held — Fx0A won't complete until it's released
    h.step();
    expect(h.state.waitingForKey).toBe(true);

    h.input.releaseKey(5);
    h.step(); // release detected, stores V0=5, waitingForKey=false
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);

    h.step(); // second Fx0A enters waiting (press phase)
    expect(h.state.waitingForKey).toBe(true);

    // Must do a fresh press for second Fx0A
    h.input.pressKey(5);
    h.step(); // press detected
    h.input.releaseKey(5);
    h.step(); // release detected, stores V1=5
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(1, 5);
  });
});
