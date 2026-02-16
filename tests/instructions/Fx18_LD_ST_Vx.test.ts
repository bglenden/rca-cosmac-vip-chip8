import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Fx18 - LD ST, Vx', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set sound timer from Vx', () => {
    h.state.v[0] = 30;
    // F018 - LD ST, V0
    h.loadProgram([0xF0, 0x18]);
    h.step();

    h.assertSoundTimer(30);
    h.assertPC(0x202);
  });

  it('should start audio when sound timer is set to non-zero', () => {
    h.state.v[0] = 10;
    h.loadProgram([0xF0, 0x18]);
    h.step();

    expect(h.audio.isPlaying()).toBe(true);
  });

  it('should not start audio when sound timer is set to zero', () => {
    h.state.v[0] = 0;
    h.loadProgram([0xF0, 0x18]);
    h.step();

    expect(h.audio.isPlaying()).toBe(false);
    h.assertSoundTimer(0);
  });

  it('should set sound timer to max value (255)', () => {
    h.state.v[0] = 255;
    h.loadProgram([0xF0, 0x18]);
    h.step();

    h.assertSoundTimer(255);
    expect(h.audio.isPlaying()).toBe(true);
  });

  it('should read from the correct register', () => {
    h.state.v[0xB] = 60;
    // FB18 - LD ST, VB
    h.loadProgram([0xFB, 0x18]);
    h.step();

    h.assertSoundTimer(60);
    expect(h.audio.isPlaying()).toBe(true);
  });

  it('should not modify Vx', () => {
    h.state.v[5] = 20;
    // F518 - LD ST, V5
    h.loadProgram([0xF5, 0x18]);
    h.step();

    h.assertRegister(5, 20);
  });

  it('should stop audio when sound timer decrements to zero', () => {
    h.state.v[0] = 1;
    h.loadProgram([0xF0, 0x18]);
    h.step();

    expect(h.audio.isPlaying()).toBe(true);
    h.assertSoundTimer(1);

    h.timerTick();
    h.assertSoundTimer(0);
    expect(h.audio.isPlaying()).toBe(false);
  });

  it('should overwrite existing sound timer value', () => {
    h.state.soundTimer = 200;
    h.state.v[0] = 10;
    h.loadProgram([0xF0, 0x18]);
    h.step();

    h.assertSoundTimer(10);
  });
});
