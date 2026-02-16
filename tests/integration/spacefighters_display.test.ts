import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CPU } from '../../src/core/CPU.js';
import { BufferDisplay } from '../../src/backends/BufferDisplay.js';
import { MockAudio } from '../../src/backends/MockAudio.js';
import { MockInput } from '../../src/backends/MockInput.js';
import { IOBus } from '../../src/core/types.js';
import { framebufferHash, sampleRows } from '../../src/core/display-utils.js';

const CYCLES_PER_TIMER_TICK = 30;
const PROMPT_TIMEOUT_CYCLES = 300_000;

function setupGame() {
  const romPath = resolve(__dirname, '../../roms/spacefighters.ch8');
  const rom = new Uint8Array(readFileSync(romPath));

  const cpu = new CPU(42);
  const display = new BufferDisplay();
  const audio = new MockAudio();
  const input = new MockInput();
  const io: IOBus = { display, audio, input };
  let cycles = 0;

  function step(): void {
    cpu.cycle(io);
    cycles++;
    if (cycles % CYCLES_PER_TIMER_TICK === 0) {
      cpu.updateTimers(io);
    }
  }

  function runCycles(count: number): void {
    for (let i = 0; i < count; i++) {
      step();
    }
  }

  cpu.loadROM(rom);
  return { cpu, display, input, step, runCycles };
}

function waitForPrompt(cpu: CPU, step: () => void, maxCycles = PROMPT_TIMEOUT_CYCLES): void {
  for (let i = 0; i < maxCycles; i++) {
    if (cpu.getState().waitingForKey) return;
    step();
  }
  throw new Error('Prompt loop was not reached in time.');
}

function submitPromptKey(
  cpu: CPU,
  step: () => void,
  input: MockInput,
  key: number,
  maxCycles = PROMPT_TIMEOUT_CYCLES,
): void {
  input.releaseAll();
  input.pressKey(key);
  step(); // CPU detects press, transitions to release phase
  input.releaseKey(key);

  for (let i = 0; i < maxCycles; i++) {
    if (!cpu.getState().waitingForKey) return;
    step();
  }

  throw new Error(`Key ${key} was not consumed by the game.`);
}

function runPromptSequence(cpu: CPU, step: () => void, input: MockInput, keys: number[]): void {
  for (const key of keys) {
    waitForPrompt(cpu, step);
    submitPromptKey(cpu, step, input, key);
  }
}

describe('Spacefighters display', () => {
  it('should enter deterministic alternating execution phases after setup', () => {
    const { cpu, display, input, step, runCycles } = setupGame();

    // S=2, D=3, E=4, C=0, F=2, A=0, then 0,0 to pass into execution.
    runPromptSequence(cpu, step, input, [2, 3, 4, 0, 2, 0, 0, 0]);
    expect(framebufferHash(display.getBuffer())).toBe('84a9f94e');

    runCycles(50_000);
    expect(framebufferHash(display.getBuffer())).toBe('7e39a571');

    runCycles(50_000);
    expect(framebufferHash(display.getBuffer())).toBe('88f1ce5c');
    expect(sampleRows(display.getBuffer(), 60, 15, 2, 3)).toEqual(['.#', '#.', '.#']);

    runCycles(50_000);
    expect(framebufferHash(display.getBuffer())).toBe('7e39a571');
    expect(sampleRows(display.getBuffer(), 60, 15, 2, 3)).toEqual(['..', '..', '..']);

    runCycles(50_000);
    expect(framebufferHash(display.getBuffer())).toBe('88f1ce5c');
    expect(sampleRows(display.getBuffer(), 0, 0, 64, 5)).toEqual([
      '................................................................',
      '####...#.......................................................#',
      '#..#..##........................................................',
      '#..#...#........................................................',
      '#..#...#.......................................................#',
    ]);
    expect(sampleRows(display.getBuffer(), 7, 23, 4, 1)).toEqual(['...#']);
  });

  it('should produce a different deterministic screen for a different command-entry setup', () => {
    const { cpu, display, input, step, runCycles } = setupGame();

    // Only E differs from the previous test (E=3 instead of E=4).
    runPromptSequence(cpu, step, input, [2, 3, 3, 0, 2, 0, 0, 0]);
    runCycles(100_000);
    expect(framebufferHash(display.getBuffer())).toBe('1e675ed6');
    expect(framebufferHash(display.getBuffer())).not.toBe('88f1ce5c');
    expect(sampleRows(display.getBuffer(), 7, 23, 4, 1)).toEqual(['#...']);

    runCycles(50_000);
    expect(framebufferHash(display.getBuffer())).toBe('e8c414f7');
    expect(sampleRows(display.getBuffer(), 60, 15, 2, 3)).toEqual(['..', '..', '..']);
  });
});
