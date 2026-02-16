import { expect } from 'vitest';
import { CPU } from '../../src/core/CPU.js';
import { BufferDisplay } from '../../src/backends/BufferDisplay.js';
import { MockAudio } from '../../src/backends/MockAudio.js';
import { MockInput } from '../../src/backends/MockInput.js';
import { IOBus, PROGRAM_START } from '../../src/core/types.js';

/**
 * Pre-wired CPU + mock backends for instruction-level testing.
 */
export class TestHarness {
  cpu: CPU;
  display: BufferDisplay;
  audio: MockAudio;
  input: MockInput;
  io: IOBus;

  constructor(seed?: number) {
    this.cpu = new CPU(seed);
    this.display = new BufferDisplay();
    this.audio = new MockAudio();
    this.input = new MockInput();
    this.io = {
      display: this.display,
      audio: this.audio,
      input: this.input,
    };
  }

  /** Load raw instruction bytes starting at 0x200. */
  loadProgram(bytes: number[]): void {
    const mem = this.cpu.getState().memory;
    for (let i = 0; i < bytes.length; i++) {
      mem[PROGRAM_START + i] = bytes[i];
    }
  }

  /** Write sprite data at the given memory address. */
  writeSprite(addr: number, bytes: number[]): void {
    const mem = this.cpu.getState().memory;
    for (let i = 0; i < bytes.length; i++) {
      mem[addr + i] = bytes[i];
    }
  }

  /** Execute n CPU cycles. */
  run(n: number): void {
    for (let i = 0; i < n; i++) {
      this.cpu.cycle(this.io);
    }
  }

  /** Execute one cycle. */
  step(): void {
    this.run(1);
  }

  /** Tick timers once (as if 1/60th of a second passed). */
  timerTick(): void {
    this.cpu.updateTimers(this.io);
  }

  get state() {
    return this.cpu.getState();
  }

  // ---- Assertions ----

  assertRegister(reg: number, value: number): void {
    expect(this.state.v[reg]).toBe(value);
  }

  assertI(value: number): void {
    expect(this.state.i).toBe(value);
  }

  assertPC(addr: number): void {
    expect(this.state.pc).toBe(addr);
  }

  assertSP(value: number): void {
    expect(this.state.sp).toBe(value);
  }

  assertPixel(x: number, y: number, value: number): void {
    expect(this.display.getPixel(x, y)).toBe(value);
  }

  assertDelayTimer(value: number): void {
    expect(this.state.delayTimer).toBe(value);
  }

  assertSoundTimer(value: number): void {
    expect(this.state.soundTimer).toBe(value);
  }

  assertMemory(addr: number, value: number): void {
    expect(this.state.memory[addr]).toBe(value);
  }

  assertActivePlayer(value: number): void {
    expect(this.state.activePlayer).toBe(value);
  }

  assertSyncBarrier(value: boolean): void {
    expect(this.state.syncBarrier).toBe(value);
  }
}
