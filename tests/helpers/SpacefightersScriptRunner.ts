import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CPU } from '../../src/core/CPU.js';
import { BufferDisplay } from '../../src/backends/BufferDisplay.js';
import { MockAudio } from '../../src/backends/MockAudio.js';
import { MockInput } from '../../src/backends/MockInput.js';
import { IOBus } from '../../src/core/types.js';
import { framebufferHash, sampleRows } from '../../src/core/display-utils.js';
import {
  SCAN_ROUTINE_START, SCAN_ROUTINE_END, COMMAND_SCAN_CALLER, MAX_SCRIPT_CYCLES,
  type FxSource, type SpacefightersScript, type FxSnapshot,
  type ExecutionSnapshot, type SpacefightersScriptResult,
} from '../../src/spacefighters/script-types.js';

export type { FxSource, SpacefightersScript, FxSnapshot, ExecutionSnapshot, SpacefightersScriptResult };

const CYCLES_PER_TIMER_TICK = 30;

function readOpcode(cpu: CPU, pc: number): number {
  const memory = cpu.getState().memory;
  return (memory[pc] << 8) | memory[pc + 1];
}

function topReturnAddress(cpu: CPU): number {
  const state = cpu.getState();
  return state.sp > 0 ? state.stack[state.sp - 1] : -1;
}

export function runSpacefightersScript(script: SpacefightersScript): SpacefightersScriptResult {
  const romPath = resolve(__dirname, '../../roms/spacefighters.ch8');
  const rom = new Uint8Array(readFileSync(romPath));

  const cpu = new CPU(42);
  const display = new BufferDisplay();
  const audio = new MockAudio();
  const input = new MockInput();
  const io: IOBus = { display, audio, input };
  cpu.loadROM(rom);

  const initialFxQueue = [...script.initialFxKeys];
  const commandQueue = [...script.commandKeys];
  const tailFxQueue = [...(script.tailFxKeys ?? [])];
  const executionCheckpointCycles = [...(script.executionCheckpointCycles ?? [])];

  let cycles = 0;
  let scanActive = false;
  let holdingFx = false;
  let fxPressCycle: number | null = null;
  let pendingCommandFx: number | null = null;
  let currentFx:
    | {
        source: FxSource;
        key: number;
        startedAt: number;
        pc: number;
        returnAddress: number;
      }
    | null = null;
  let autoLoopPresses = 0;

  const fxSnapshots: FxSnapshot[] = [];
  const scanCommandTriggerCycles: number[] = [];

  function step(): void {
    cpu.cycle(io);
    cycles++;
    if (cycles % CYCLES_PER_TIMER_TICK === 0) {
      cpu.updateTimers(io);
    }
  }

  for (let i = 0; i < MAX_SCRIPT_CYCLES; i++) {
    const state = cpu.getState();
    const pc = state.pc;
    const opcode = readOpcode(cpu, pc);

    if (!scanActive && pc === SCAN_ROUTINE_START) {
      scanActive = true;
      let scanKey: number | null = null;
      if (topReturnAddress(cpu) === COMMAND_SCAN_CALLER && pendingCommandFx === null && commandQueue.length > 0) {
        pendingCommandFx = commandQueue.shift()!;
        scanKey = 0;
        scanCommandTriggerCycles.push(cycles);
      }
      input.releaseAll();
      if (scanKey !== null) {
        input.pressKey(scanKey);
      }
    }

    // Release Fx0A key 1 cycle after pressing (for release-based detection)
    if (holdingFx && fxPressCycle !== null && cycles > fxPressCycle && currentFx) {
      input.releaseKey(currentFx.key);
      fxPressCycle = null;
    }

    if (state.waitingForKey && !holdingFx) {
      let key = 0;
      let source: FxSource = 'fallback';

      if (initialFxQueue.length > 0) {
        key = initialFxQueue.shift()!;
        source = 'init';
      } else if (pendingCommandFx !== null) {
        key = pendingCommandFx;
        pendingCommandFx = null;
        source = 'command';
      } else if (tailFxQueue.length > 0) {
        key = tailFxQueue.shift()!;
        source = 'tail';
      }

      input.releaseAll();
      input.pressKey(key);
      holdingFx = true;
      fxPressCycle = cycles;
      currentFx = {
        source,
        key,
        startedAt: cycles,
        pc,
        returnAddress: topReturnAddress(cpu),
      };
    }

    if (!state.waitingForKey && holdingFx) {
      input.releaseAll();
      holdingFx = false;
      fxPressCycle = null;
      if (!currentFx) {
        throw new Error('Missing FX input state while collecting snapshot.');
      }
      fxSnapshots.push({
        index: fxSnapshots.length + 1,
        source: currentFx.source,
        key: currentFx.key,
        startedAt: currentFx.startedAt,
        consumedAt: cycles,
        pc: currentFx.pc,
        returnAddress: currentFx.returnAddress,
        hash: framebufferHash(display.getBuffer()),
        marker: sampleRows(display.getBuffer(), 56, 14, 8, 6),
      });
      currentFx = null;
    }

    if (!state.waitingForKey && !holdingFx && !scanActive) {
      const next = readOpcode(cpu, pc + 2);
      const selfJump = (next & 0xf000) === 0x1000 && (next & 0x0fff) === pc;

      if ((opcode & 0xf0ff) === 0xe09e && selfJump) {
        const x = (opcode >> 8) & 0x0f;
        input.releaseAll();
        input.pressKey(state.v[x]);
        autoLoopPresses++;
      } else if ((opcode & 0xf0ff) === 0xe0a1 && selfJump) {
        input.releaseAll();
      }
    }

    step();

    const nextPc = cpu.getState().pc;
    if (scanActive && !(nextPc >= SCAN_ROUTINE_START && nextPc <= SCAN_ROUTINE_END)) {
      input.releaseAll();
      scanActive = false;
    }

    if (
      initialFxQueue.length === 0 &&
      commandQueue.length === 0 &&
      tailFxQueue.length === 0 &&
      pendingCommandFx === null &&
      fxSnapshots.length > 0 &&
      cycles > 200_000
    ) {
      break;
    }
  }

  const executionSnapshots: ExecutionSnapshot[] = [];
  const checkpointStart = cycles;
  for (const inc of executionCheckpointCycles) {
    while (cycles < checkpointStart + inc) {
      step();
    }
    executionSnapshots.push({
      cycle: cycles,
      pc: cpu.getState().pc,
      hash: framebufferHash(display.getBuffer()),
      marker: sampleRows(display.getBuffer(), 56, 14, 8, 6),
    });
  }

  return {
    fxSnapshots,
    executionSnapshots,
    scanCommandTriggerCycles,
    autoLoopPresses,
  };
}
