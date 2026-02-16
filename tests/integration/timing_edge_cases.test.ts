import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';


describe('Fx0A two-phase press-then-release edge cases', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should only complete when the tracked key is released, ignoring other keys', () => {
    // F00A - wait/store in V0
    h.loadProgram([0xF0, 0x0A]);

    h.step(); // Fx0A enters waiting, phase='press'
    expect(h.state.waitingForKey).toBe(true);

    h.input.pressKey(5);
    h.step(); // press detected, transitions to release phase, tracking key 5
    expect(h.state.waitingKeyPhase).toBe('release');
    expect(h.state.waitingKeyValue).toBe(5);

    // Press another key while key 5 is still held
    h.input.pressKey(3);
    h.step(); // still waiting for key 5 release
    expect(h.state.waitingForKey).toBe(true);

    // Release key 3 but keep 5 held
    h.input.releaseKey(3);
    h.step();
    expect(h.state.waitingForKey).toBe(true);

    // Release key 5 — should complete
    h.input.releaseKey(5);
    h.step();
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);
  });

  it('should handle consecutive Fx0A with different keys', () => {
    // F00A - wait/store in V0
    // F10A - wait/store in V1
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A]);

    h.step(); // first Fx0A, phase='press'

    h.input.pressKey(5);
    h.step(); // phase='release', tracking key 5
    h.input.releaseKey(5);
    h.step(); // release detected, V0=5, waitingForKey=false
    h.assertRegister(0, 5);

    h.step(); // second Fx0A, phase='press'
    expect(h.state.waitingForKey).toBe(true);

    h.input.pressKey(3);
    h.step(); // phase='release', tracking key 3
    h.input.releaseKey(3);
    h.step(); // release detected, V1=3
    h.assertRegister(1, 3);
  });

  it('should handle key pressed on the exact cycle Fx0A starts waiting', () => {
    // Key 7 is already pressed before Fx0A executes
    h.input.pressKey(7);
    h.loadProgram([0xF0, 0x0A]);
    h.step(); // Fx0A: enters waiting, phase='press'
    // waitingForKey was just SET by execute(), the press check happens next cycle
    expect(h.state.waitingForKey).toBe(true);

    h.step(); // press phase: detects key 7, transitions to release phase
    expect(h.state.waitingKeyPhase).toBe('release');

    h.input.releaseKey(7);
    h.step(); // release detected
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 7);
  });

  it('should handle rapid press-release-press of the same key across two Fx0A instructions', () => {
    // F00A, F10A
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A]);

    h.step(); // first Fx0A
    h.input.pressKey(5);
    h.step(); // press detected, release phase
    h.input.releaseKey(5);
    h.step(); // release detected, V0=5
    h.assertRegister(0, 5);

    h.step(); // second Fx0A, press phase
    h.input.pressKey(5);
    h.step(); // press detected, release phase
    h.input.releaseKey(5);
    h.step(); // release detected, V1=5
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(1, 5);
  });

  it('should complete when tracked key released even if other keys still held', () => {
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A]);

    h.step(); // first Fx0A
    h.input.pressKey(5);
    h.input.pressKey(0xA);
    h.step(); // press phase: scans from 0, finds key 5 first
    expect(h.state.waitingKeyValue).toBe(5);

    // Release key 5 but keep 0xA held
    h.input.releaseKey(5);
    h.step(); // key 5 released → V0=5, waitingForKey=false
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);

    h.step(); // second Fx0A, press phase — key 0xA still held, detected immediately
    h.step(); // press detected for 0xA, release phase
    expect(h.state.waitingKeyPhase).toBe('release');
    expect(h.state.waitingKeyValue).toBe(0xA);

    h.input.releaseKey(0xA);
    h.step(); // release detected
    h.assertRegister(1, 0xA);
  });

  it('should handle Fx0A with no keys ever pressed (stays waiting indefinitely)', () => {
    h.loadProgram([0xF0, 0x0A]);
    h.step();

    // Run many cycles with no key input
    h.run(1000);

    expect(h.state.waitingForKey).toBe(true);
    expect(h.state.waitingKeyPhase).toBe('press');
    h.assertPC(0x202); // PC didn't advance
  });

  it('should correctly handle key 0 across consecutive Fx0A instructions', () => {
    // Key 0 is a valid key that might be treated as falsy if not careful
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A]);

    h.step(); // first Fx0A
    h.input.pressKey(0);
    h.step(); // press detected
    h.input.releaseKey(0);
    h.step(); // release detected
    h.assertRegister(0, 0);

    h.step(); // second Fx0A
    h.input.pressKey(0);
    h.step(); // press detected
    h.input.releaseKey(0);
    h.step(); // release detected
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(1, 0);
  });

  it('should not complete release phase if wrong key is released', () => {
    h.loadProgram([0xF0, 0x0A]);

    h.step(); // Fx0A, press phase
    h.input.pressKey(5);
    h.input.pressKey(8);
    h.step(); // press detected: key 5 (lowest), release phase

    // Release key 8 (not the tracked key)
    h.input.releaseKey(8);
    h.step();
    expect(h.state.waitingForKey).toBe(true); // still waiting for key 5

    // Release key 5
    h.input.releaseKey(5);
    h.step();
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);
  });
});

describe('SKP/SKNP timing edge cases', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should detect key pressed on the same cycle as SKP instruction', () => {
    // V0 = 5, press key 5 before stepping
    h.state.v[0] = 5;
    h.input.pressKey(5);
    h.loadProgram([0xE0, 0x9E, 0x00, 0x00, 0x61, 0x01]);
    h.step(); // SKP V0: key 5 pressed → skip

    h.assertPC(0x204); // skipped over 0x202
  });

  it('should not detect key released between setup and SKP execution', () => {
    // The key state is synced at the start of cpu.cycle(), so pressing
    // and then releasing before step() means the cycle sees released state.
    h.state.v[0] = 5;
    h.input.pressKey(5);
    h.input.releaseKey(5); // released before cycle runs
    h.loadProgram([0xE0, 0x9E]);
    h.step();

    h.assertPC(0x202); // no skip — key was released before the cycle
  });

  it('should handle SKP in a tight poll loop catching a brief key press', () => {
    // ROM: poll loop that checks key 5, then latches V1=1
    // E09E SKP V0   (if key pressed, skip the jump)
    // 1200 JP 0x200 (loop back)
    // 6101 LD V1, 1 (latch)
    h.state.v[0] = 5;
    h.loadProgram([0xE0, 0x9E, 0x12, 0x00, 0x61, 0x01]);

    // Run a few iterations with no key
    h.run(10);
    h.assertRegister(1, 0); // not latched

    // Press key briefly
    h.input.pressKey(5);
    h.step(); // SKP detects the key
    h.input.releaseKey(5);
    h.step(); // executes LD V1, 1

    h.assertRegister(1, 1);
  });

  it('should handle SKNP transitioning to SKP within same batch', () => {
    // Test that key state changes between instructions in a batch are seen
    // correctly. Each instruction gets fresh key state via cpu.cycle().
    h.state.v[0] = 5;
    h.loadProgram([
      0xE0, 0xA1, // SKNP V0 (key 5 not pressed → skip)
      0x00, 0x00, // skipped
      0x61, 0x01, // LD V1, 1
    ]);

    h.run(2); // SKNP skips, then executes LD V1, 1
    h.assertRegister(1, 1);
  });
});

describe('Display buffer sync edge cases', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should sync display buffer after each DRW instruction', () => {
    h.writeSprite(0x300, [0b10000000]); // single pixel

    h.loadProgram([
      0xA3, 0x00, // LD I, 0x300
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0xD0, 0x11, // DRW V0, V1, 1  — draw at (0,0)
    ]);

    h.run(4);

    // CPU internal display should have the pixel
    expect(h.state.display[0]).toBe(1);
    // Backend buffer should also be synced
    expect(h.display.getBuffer()[0]).toBe(1);
    // drawFlag should be set
    expect(h.state.drawFlag).toBe(true);
  });

  it('should keep backend buffer consistent after multiple DRW in one batch', () => {
    h.writeSprite(0x300, [0b10000000]); // single pixel

    h.loadProgram([
      0xA3, 0x00, // LD I, 0x300
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0xD0, 0x11, // DRW V0, V1, 1  — pixel at (0,0)
      0x60, 0x08, // LD V0, 8
      0xD0, 0x11, // DRW V0, V1, 1  — pixel at (8,0)
      0x60, 0x10, // LD V0, 16
      0xD0, 0x11, // DRW V0, V1, 1  — pixel at (16,0)
    ]);

    h.run(8);

    // All three pixels should be set in both CPU and backend
    expect(h.state.display[0]).toBe(1);
    expect(h.state.display[8]).toBe(1);
    expect(h.state.display[16]).toBe(1);
    expect(h.display.getBuffer()[0]).toBe(1);
    expect(h.display.getBuffer()[8]).toBe(1);
    expect(h.display.getBuffer()[16]).toBe(1);
  });

  it('should clear backend buffer on CLS and keep it clear until next DRW', () => {
    h.writeSprite(0x300, [0b10000000]);

    h.loadProgram([
      0xA3, 0x00, // LD I, 0x300
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0xD0, 0x11, // DRW V0, V1, 1  — pixel at (0,0)
      0x00, 0xE0, // CLS
    ]);

    h.run(4); // draw pixel
    expect(h.display.getBuffer()[0]).toBe(1);

    h.step(); // CLS
    // Both CPU and backend should be cleared
    expect(h.state.display[0]).toBe(0);
    expect(h.display.getBuffer()[0]).toBe(0);
    expect(h.state.drawFlag).toBe(true);
  });

  it('should handle CLS followed by DRW in same batch correctly', () => {
    h.writeSprite(0x300, [0b11000000]); // two pixels

    h.loadProgram([
      0xA3, 0x00, // LD I, 0x300
      0x60, 0x00, // LD V0, 0
      0x61, 0x00, // LD V1, 0
      0xD0, 0x11, // DRW V0, V1, 1  — draw at (0,0)
      0x00, 0xE0, // CLS
      0x60, 0x04, // LD V0, 4
      0xD0, 0x11, // DRW V0, V1, 1  — draw at (4,0) after clear
    ]);

    h.run(7);

    // Pixel (0,0) and (1,0) should be OFF (cleared by CLS)
    expect(h.state.display[0]).toBe(0);
    expect(h.state.display[1]).toBe(0);
    // Pixel (4,0) and (5,0) should be ON (drawn after CLS)
    expect(h.state.display[4]).toBe(1);
    expect(h.state.display[5]).toBe(1);
    // Backend should match
    expect(h.display.getBuffer()[4]).toBe(1);
    expect(h.display.getBuffer()[5]).toBe(1);
  });
});

describe('Timer and key interaction edge cases', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should read correct delay timer value on the same cycle a key is pressed', () => {
    // Set delay timer, then wait in a loop, pressing key to break out
    h.loadProgram([
      0x60, 0x05, // LD V0, 5
      0xF0, 0x15, // LD DT, V0
      0xF2, 0x0A, // LD V2, K  (wait for key)
      0xF1, 0x07, // LD V1, DT (read delay timer after key)
    ]);

    h.run(2); // LD V0, LD DT
    h.step();  // Fx0A enters waiting
    h.assertDelayTimer(5);

    // Tick timer 3 times
    h.timerTick();
    h.timerTick();
    h.timerTick();
    h.assertDelayTimer(2);

    // Press key to resume
    h.input.pressKey(1);
    h.step(); // press detected, transitions to release phase
    h.input.releaseKey(1);
    h.step(); // release detected, stores key, resumes
    h.step(); // LD V1, DT
    h.assertRegister(1, 2);
  });

  it('should decrement timer even while CPU is waiting for key', () => {
    h.loadProgram([
      0x60, 0x0A, // LD V0, 10
      0xF0, 0x15, // LD DT, V0
      0xF1, 0x0A, // LD V1, K
    ]);

    h.run(3); // set timer and enter waiting
    h.assertDelayTimer(10);

    // Timer should still count down while waiting for key
    for (let i = 0; i < 5; i++) {
      h.timerTick();
    }
    h.assertDelayTimer(5);

    expect(h.state.waitingForKey).toBe(true); // still waiting
  });
});

describe('Key press/release within single batch of cycles', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should handle a complete press-release-press sequence across cycles for two Fx0A', () => {
    // Simulates what the virtual tap FSM does: press for N cycles, release, then press again
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A, 0x12, 0x04]); // Fx0A, Fx0A, self-loop

    h.step(); // first Fx0A enters waiting (press phase)

    // Simulate virtual tap: press key
    h.input.pressKey(5);
    h.step(); // press detected, transitions to release phase

    // Hold the key for several cycles (simulating pressed phase)
    h.run(10);
    expect(h.state.waitingForKey).toBe(true); // still in release phase, key 5 held

    // Release key (simulating gap phase start)
    h.input.releaseKey(5);
    h.step(); // release detected, V0=5, waitingForKey=false
    h.assertRegister(0, 5);

    h.step(); // second Fx0A enters waiting (press phase)
    expect(h.state.waitingForKey).toBe(true);

    // Gap: no key pressed for a few cycles
    h.run(5);
    expect(h.state.waitingForKey).toBe(true);

    // Press key again (simulating second tap start)
    h.input.pressKey(5);
    h.step(); // press detected, release phase
    h.input.releaseKey(5);
    h.step(); // release detected, V1=5
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(1, 5);
  });

  it('should not miss a 1-cycle key pulse in a tight scan loop', () => {
    // ROM: tight loop checking key 5 via SKP
    // E09E SKP V0
    // 1200 JP 0x200
    // 6101 LD V1, 1
    h.state.v[0] = 5;
    h.loadProgram([0xE0, 0x9E, 0x12, 0x00, 0x61, 0x01]);

    // Press key for exactly 1 cycle
    h.input.pressKey(5);
    h.step(); // SKP detects key → skip
    h.input.releaseKey(5);

    h.step(); // executes LD V1, 1
    h.assertRegister(1, 1);
  });

  it('should miss a key pulse if it occurs between poll iterations in a sparse loop', () => {
    // ROM: loop with delay between key checks
    // 7001 ADD V0, 1   (0x200)
    // 3005 SE V0, 5    (0x202) — skip jump if V0 == 5
    // 1200 JP 0x200    (0x204)
    // E59E SKP V5      (0x206) — check key 5
    // 1200 JP 0x200    (0x208) — loop back if not pressed
    // 6101 LD V1, 1    (0x20A) — latch success
    h.state.v[5] = 5;
    h.loadProgram([
      0x70, 0x01,
      0x30, 0x05,
      0x12, 0x00,
      0xE5, 0x9E,
      0x12, 0x00,
      0x61, 0x01,
    ]);

    // Press and release key during the delay loop (before the SKP)
    h.run(2); // V0=1, check V0==5 → no
    h.input.pressKey(5);
    h.step(); // JP 0x200
    h.input.releaseKey(5); // key released before reaching SKP
    h.run(10); // loop continues

    // The key pulse was missed because it was released before SKP ran
    // Eventually the loop will reach SKP with no key → jump back
    h.assertRegister(1, 0); // not latched
  });
});

describe('Interpreter timing consistency', () => {
  it('should have deterministic cycle-to-timer ratio via step/timerTick', () => {
    const h = new TestHarness(42);

    // Set delay timer to 60 (1 second at 60Hz)
    h.loadProgram([
      0x60, 0x3C, // LD V0, 60
      0xF0, 0x15, // LD DT, V0
    ]);
    h.run(2);
    h.assertDelayTimer(60);

    // Simulate 1 second: 60 timer ticks, 12 cycles between each tick
    for (let tick = 0; tick < 60; tick++) {
      h.run(12); // 12 cycles per timer tick
      h.timerTick();
    }

    h.assertDelayTimer(0);
  });

  it('should handle timer reaching 0 during batch execution', () => {
    const h = new TestHarness(42);

    h.loadProgram([
      0x60, 0x01, // LD V0, 1
      0xF0, 0x15, // LD DT, V0
      // Delay-timer polling loop:
      0xF1, 0x07, // LD V1, DT    (0x204)
      0x31, 0x00, // SE V1, 0     (0x206) — skip next if V1 == 0
      0x12, 0x04, // JP 0x204     (0x208) — loop back
      0x62, 0x01, // LD V2, 1     (0x20A) — exit marker
    ]);

    h.run(2); // set timer
    h.assertDelayTimer(1);

    // Run cycles interleaved with timer ticks
    h.run(12);
    h.timerTick(); // timer 1 → 0

    // Continue running — the loop should eventually detect timer == 0
    h.run(100);

    h.assertRegister(2, 1); // exit marker reached
  });
});

describe('Fx0A two-phase FSM gap simulation', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should detect release within a 1-cycle gap between taps', () => {
    // Simulates the minimum gap the virtual tap FSM could produce
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A, 0x12, 0x04]);

    h.step(); // first Fx0A (press phase)
    h.input.pressKey(5);
    h.step(); // press detected, release phase
    h.input.releaseKey(5);
    h.step(); // release detected, V0=5

    h.step(); // second Fx0A (press phase)
    h.input.pressKey(5);
    h.step(); // press detected, release phase
    h.input.releaseKey(5);
    h.step(); // release detected, V1=5

    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);
    h.assertRegister(1, 5);
  });

  it('should handle release and re-press on consecutive cycles correctly', () => {
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A, 0x12, 0x04]);

    h.step(); // first Fx0A (press phase)
    h.input.pressKey(3);
    h.step(); // press detected
    h.input.releaseKey(3);
    h.step(); // release detected, V0=3

    h.step(); // second Fx0A (press phase)
    h.input.pressKey(7);
    h.step(); // press detected
    h.input.releaseKey(7);
    h.step(); // release detected, V1=7

    h.assertRegister(0, 3);
    h.assertRegister(1, 7);
  });

  it('should handle simultaneous release-of-tracked-key and press-of-new-key', () => {
    // Edge case: tracked key released and a different key pressed in the same cycle
    h.loadProgram([0xF0, 0x0A, 0xF1, 0x0A, 0x12, 0x04]);

    h.step(); // first Fx0A (press phase)
    h.input.pressKey(5);
    h.step(); // press detected, release phase, tracking key 5

    // Simultaneously release 5 and press 3
    h.input.releaseKey(5);
    h.input.pressKey(3);
    h.step(); // key 5 released → V0=5, waitingForKey=false
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(0, 5);

    h.step(); // second Fx0A (press phase)
    expect(h.state.waitingForKey).toBe(true);

    // Key 3 is still pressed — will be detected immediately
    h.step(); // press detected for key 3, release phase
    expect(h.state.waitingKeyValue).toBe(3);

    h.input.releaseKey(3);
    h.step(); // release detected, V1=3
    expect(h.state.waitingForKey).toBe(false);
    h.assertRegister(1, 3);
  });
});
