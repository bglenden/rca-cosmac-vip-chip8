import { CPU } from './core/CPU.js';
import { IOBus } from './core/types.js';

/**
 * Orchestrates the CPU with timing loops.
 * Uses a single interval that batches CPU cycles per timer tick,
 * keeping the cycle-to-timer ratio deterministic (matching the
 * browser rAF path: CYCLES_PER_TIMER_TICK cycles between 60Hz ticks).
 */
export class Interpreter {
  private cpu: CPU;
  private io: IOBus;
  private running = false;
  private tickTimer: ReturnType<typeof setInterval> | undefined;
  private cyclesPerTick: number = 12;

  constructor(io: IOBus, seed?: number) {
    this.cpu = new CPU(seed);
    this.io = io;
  }

  /** Load a ROM into the CPU. */
  loadROM(rom: Uint8Array): void {
    this.cpu.loadROM(rom);
  }

  /** Start the interpreter loop. */
  start(cyclesPerSecond = 700): void {
    if (this.running) return;
    this.running = true;

    this.cyclesPerTick = Math.max(1, Math.round(cyclesPerSecond / 60));
    const tickIntervalMs = 1000 / 60;

    this.tickTimer = setInterval(() => {
      for (let i = 0; i < this.cyclesPerTick; i++) {
        this.cpu.cycle(this.io);
      }
      this.cpu.updateTimers(this.io);
      this.io.display.render();
    }, tickIntervalMs);
  }

  /** Stop the interpreter loop. */
  stop(): void {
    this.running = false;
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = undefined;
  }

  /** Execute a single cycle (for testing / step-debugging). */
  step(): void {
    this.cpu.cycle(this.io);
  }

  /** Tick timers once (for testing). */
  timerTick(): void {
    this.cpu.updateTimers(this.io);
  }

  isRunning(): boolean {
    return this.running;
  }

  getCPU(): CPU {
    return this.cpu;
  }
}
