import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Timer integration', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should count delay timer down to zero', () => {
    // Set delay timer to 3
    h.loadProgram([
      0x60, 0x03, // LD V0, 3
      0xF0, 0x15, // LD DT, V0
    ]);
    h.run(2);
    h.assertDelayTimer(3);

    h.timerTick();
    h.assertDelayTimer(2);

    h.timerTick();
    h.assertDelayTimer(1);

    h.timerTick();
    h.assertDelayTimer(0);

    // Should stay at 0
    h.timerTick();
    h.assertDelayTimer(0);
  });

  it('should count sound timer down and stop audio at zero', () => {
    h.loadProgram([
      0x60, 0x03, // LD V0, 3
      0xF0, 0x18, // LD ST, V0
    ]);
    h.run(2);
    expect(h.audio.isPlaying()).toBe(true);
    h.assertSoundTimer(3);

    h.timerTick();
    h.assertSoundTimer(2);
    expect(h.audio.isPlaying()).toBe(true);

    h.timerTick();
    h.assertSoundTimer(1);
    expect(h.audio.isPlaying()).toBe(true);

    h.timerTick();
    h.assertSoundTimer(0);
    expect(h.audio.isPlaying()).toBe(false);
  });

  it('should read delay timer value into register', () => {
    h.loadProgram([
      0x60, 0x0A, // LD V0, 10
      0xF0, 0x15, // LD DT, V0
    ]);
    h.run(2);

    // Tick a few times
    h.timerTick();
    h.timerTick();
    h.timerTick();

    // Now read DT into V1
    // PC is at 0x204, write next instruction there
    h.state.memory[0x204] = 0xF1;
    h.state.memory[0x205] = 0x07; // LD V1, DT
    h.step();

    h.assertRegister(1, 7); // 10 - 3 ticks = 7
  });

  it('should not trigger audio when sound timer is set to 0', () => {
    h.loadProgram([
      0x60, 0x00, // LD V0, 0
      0xF0, 0x18, // LD ST, V0
    ]);
    h.run(2);
    expect(h.audio.isPlaying()).toBe(false);
  });
});
