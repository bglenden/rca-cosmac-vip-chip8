import { CPU } from '../src/core/CPU.js';
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, IOBus } from '../src/core/types.js';
import { framebufferHash, sampleRows } from '../src/core/display-utils.js';
import {
  SCAN_ROUTINE_START, SCAN_ROUTINE_END, COMMAND_SCAN_CALLER, MAX_SCRIPT_CYCLES,
  type FxSource, type SpacefightersScript, type FxSnapshot,
  type ExecutionSnapshot, type SpacefightersScriptResult,
} from '../src/spacefighters/script-types.js';
import { CanvasDisplay } from '../src/backends/CanvasDisplay.js';
import { WebAudio } from '../src/backends/WebAudio.js';
import { KeyboardInput } from '../src/backends/KeyboardInput.js';

const CYCLES_PER_FRAME = 30; // ~1800 cycles/sec at 60fps
const CYCLES_PER_TIMER_TICK = 30;
const VIRTUAL_TAP_PRESS_FRAMES = 6;
const VIRTUAL_TAP_GAP_FRAMES = 2;
const VIRTUAL_TAP_PRESS_CYCLES = Math.max(1, VIRTUAL_TAP_PRESS_FRAMES * CYCLES_PER_FRAME);
const VIRTUAL_TAP_GAP_CYCLES = Math.max(1, VIRTUAL_TAP_GAP_FRAMES * CYCLES_PER_FRAME);

const canvas = document.getElementById('display') as HTMLCanvasElement;
const romSelect = document.getElementById('rom-select') as HTMLSelectElement;
const fileInput = document.getElementById('rom-file') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLElement;
const sidebarEl = document.getElementById('sidebar') as HTMLElement;
const controlsEl = document.querySelector('.controls') as HTMLElement;
const keymapEl = document.querySelector('.keymap') as HTMLElement;
const virtualKeyButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.keymap .key[data-chip-key]'),
);

const display = new CanvasDisplay(canvas);
const audio = new WebAudio();
const input = new KeyboardInput();
const io: IOBus = { display, audio, input };

let cpu = new CPU();
let running = false;
let executedCycles = 0;
let fitScheduled = false;

type VirtualTapPhase = 'idle' | 'pressed' | 'gap';
type VirtualTapState = {
  button: HTMLButtonElement;
  key: number;
  queued: number;
  phase: VirtualTapPhase;
  cyclesRemaining: number;
};

const virtualTapStates = new Map<HTMLButtonElement, VirtualTapState>();

interface Chip8TestDriver {
  reset(seed?: number): void;
  setRunning(enabled: boolean): void;
  step(cycles?: number): void;
  pressKey(key: number): void;
  releaseKey(key: number): void;
  releaseAllKeys(): void;
  loadROM(rom: number[] | Uint8Array, name?: string, seed?: number, autoRun?: boolean): void;
  loadROMFromUrl(url: string, seed?: number, autoRun?: boolean): Promise<void>;
  getCPUState(): {
    pc: number;
    sp: number;
    waitingForKey: boolean;
    waitingKeyPhase: 'press' | 'release';
    waitingRegister: number;
    activePlayer: number;
    syncBarrier: boolean;
    v: number[];
  };
  getFramebuffer(): number[];
  framebufferHash(): string;
  sampleRows(xStart: number, yStart: number, width: number, height: number): string[];
  runSpacefightersScript(script: SpacefightersScript): Promise<SpacefightersScriptResult>;
  getDisplayScale(): number;
}

declare global {
  interface Window {
    __CHIP8_TEST__?: Chip8TestDriver;
  }
}

function releaseAllKeys(): void {
  for (const state of virtualTapStates.values()) {
    state.queued = 0;
    state.phase = 'idle';
    state.cyclesRemaining = 0;
  }

  input.releaseAll();
  for (const button of virtualKeyButtons) {
    button.classList.remove('active');
  }
}

function setVirtualKeyState(button: HTMLButtonElement, key: number, pressed: boolean): void {
  input.setKeyState(key, pressed);
  button.classList.toggle('active', pressed);
}

function beginPressedVirtualTap(state: VirtualTapState): void {
  setVirtualKeyState(state.button, state.key, true);
  state.phase = 'pressed';
  state.cyclesRemaining = VIRTUAL_TAP_PRESS_CYCLES;
}

function beginVirtualTapGap(state: VirtualTapState): void {
  setVirtualKeyState(state.button, state.key, false);
  state.phase = 'gap';
  state.cyclesRemaining = VIRTUAL_TAP_GAP_CYCLES;
}

function startQueuedVirtualTap(state: VirtualTapState): void {
  if (state.queued === 0) {
    return;
  }
  state.queued--;
  beginPressedVirtualTap(state);
}

function enqueueVirtualTap(state: VirtualTapState): void {
  state.queued++;
  if (state.phase === 'idle') {
    startQueuedVirtualTap(state);
  }
}

function advanceVirtualTapState(state: VirtualTapState, cycles: number): void {
  let remainingCycles = cycles;

  while (remainingCycles > 0) {
    if (state.phase === 'idle') {
      if (state.queued === 0) {
        return;
      }
      startQueuedVirtualTap(state);
    }

    const elapsed = Math.min(remainingCycles, state.cyclesRemaining);
    state.cyclesRemaining -= elapsed;
    remainingCycles -= elapsed;

    if (state.cyclesRemaining > 0) {
      continue;
    }

    if (state.phase === 'pressed') {
      beginVirtualTapGap(state);
      continue;
    }

    state.phase = 'idle';
    state.cyclesRemaining = 0;
  }
}

function advanceVirtualTapQueues(cycles: number): void {
  if (cycles <= 0) {
    return;
  }
  for (const state of virtualTapStates.values()) {
    advanceVirtualTapState(state, cycles);
  }
}

function bindVirtualKeypad(): void {
  // Drive virtual key taps by emulator cycles to avoid wall-clock/input race
  // conditions between browser timers, rendering, and CPU key scans.
  virtualTapStates.clear();

  for (const button of virtualKeyButtons) {
    const chipKey = button.dataset.chipKey;
    if (!chipKey) continue;

    const key = Number.parseInt(chipKey, 16);
    if (Number.isNaN(key) || key < 0 || key > 0xf) continue;

    const tapState: VirtualTapState = {
      button,
      key,
      queued: 0,
      phase: 'idle',
      cyclesRemaining: 0,
    };
    virtualTapStates.set(button, tapState);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      enqueueVirtualTap(tapState);
    });
  }
}

function resetMachine(seed?: number): void {
  running = false;
  executedCycles = 0;
  releaseAllKeys();
  audio.stop();
  cpu = new CPU(seed);
  display.clear();
  display.render();
}

function stepCycles(cycles: number): void {
  for (let i = 0; i < cycles; i++) {
    advanceVirtualTapQueues(1);
    cpu.cycle(io);
    executedCycles++;
    if (executedCycles % CYCLES_PER_TIMER_TICK === 0) {
      cpu.updateTimers(io);
    }
  }
  const state = cpu.getState();
  if (state.drawFlag) {
    display.render();
    state.drawFlag = false;
  }
}

function topReturnAddress(): number {
  const state = cpu.getState();
  return state.sp > 0 ? state.stack[state.sp - 1] : -1;
}

function frame() {
  if (!running) return;

  stepCycles(CYCLES_PER_FRAME);

  requestAnimationFrame(frame);
}

function getVisibleViewport(): { width: number; height: number } {
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;
  const vv = window.visualViewport;
  if (!vv) {
    return { width: innerWidth, height: innerHeight };
  }

  // Some browser/tooling combinations can report anomalously small visualViewport
  // dimensions. If values are too far from the layout viewport, prefer inner*.
  const minTrustedRatio = 0.75;
  const widthLooksTrusted = vv.width > 0 && vv.width >= innerWidth * minTrustedRatio;
  const heightLooksTrusted = vv.height > 0 && vv.height >= innerHeight * minTrustedRatio;

  if (!widthLooksTrusted || !heightLooksTrusted) {
    return { width: innerWidth, height: innerHeight };
  }

  return {
    width: Math.min(innerWidth, vv.width),
    height: Math.min(innerHeight, vv.height),
  };
}

function layoutFitsViewport(): boolean {
  const maxOverflowPx = 1;
  const trackedElements: (Element | null)[] = [
    canvas,
    controlsEl,
    keymapEl,
    sidebarEl.classList.contains('visible') ? sidebarEl : null,
  ];

  let maxRight = 0;
  let maxBottom = 0;
  for (const element of trackedElements) {
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    maxRight = Math.max(maxRight, rect.right);
    maxBottom = Math.max(maxBottom, rect.bottom);
  }

  const viewport = getVisibleViewport();
  return (
    maxRight <= viewport.width + maxOverflowPx &&
    maxBottom <= viewport.height + maxOverflowPx
  );
}

function fitDisplayToViewport(): void {
  const viewport = getVisibleViewport();
  const safetyMarginPx = 8;
  const maxScale = Math.max(
    1,
    Math.floor(
      Math.min(
        (viewport.width - safetyMarginPx) / DISPLAY_WIDTH,
        (viewport.height - safetyMarginPx) / DISPLAY_HEIGHT,
      ),
    ),
  );

  for (let scale = maxScale; scale >= 1; scale--) {
    display.setScale(scale);
    if (layoutFitsViewport()) {
      display.render();
      return;
    }
  }

  display.setScale(1);
  display.render();
}

function scheduleDisplayFit(): void {
  if (fitScheduled) return;
  fitScheduled = true;
  requestAnimationFrame(() => {
    fitScheduled = false;
    fitDisplayToViewport();
    requestAnimationFrame(() => {
      fitDisplayToViewport();
    });
  });
}

function bindLayoutFitObservers(): void {
  const fitObserver = new ResizeObserver(() => {
    scheduleDisplayFit();
  });

  const observedElements: Element[] = [
    document.body,
    controlsEl,
    keymapEl,
    sidebarEl,
  ];
  for (const element of observedElements) {
    fitObserver.observe(element);
  }

  window.addEventListener('load', scheduleDisplayFit);
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      scheduleDisplayFit();
    });
  }
}

interface SidecarData {
  title?: string;
  author?: string;
  description?: string;
  sidebar?: string[];
}

function renderSidebar(data: SidecarData): void {
  sidebarEl.innerHTML = '';

  if (data.sidebar && data.sidebar.length > 0) {
    for (const line of data.sidebar) {
      if (line.startsWith('## ')) {
        const h2 = document.createElement('h2');
        h2.textContent = line.slice(3);
        sidebarEl.appendChild(h2);
      } else if (line === '') {
        const spacer = document.createElement('div');
        spacer.style.height = '0.4rem';
        sidebarEl.appendChild(spacer);
      } else {
        const p = document.createElement('p');
        p.textContent = line;
        sidebarEl.appendChild(p);
      }
    }
  }

  const hasContent = sidebarEl.children.length > 0;
  sidebarEl.classList.toggle('visible', hasContent);
  scheduleDisplayFit();
}

async function loadSidecar(baseName: string): Promise<void> {
  const base = import.meta.env.BASE_URL ?? '/';
  const sidecarUrl = `${base}roms/${baseName}.ch8.json`;

  try {
    const resp = await fetch(sidecarUrl);
    if (resp.ok) {
      const data: SidecarData = await resp.json();
      renderSidebar(data);
      if (data.title) {
        document.title = `CHIP-8 — ${data.title}`;
      }
      return;
    }
    console.log(`No sidecar file at ${sidecarUrl} (${resp.status})`);
  } catch (e) {
    console.log(`Sidecar fetch failed for ${sidecarUrl}:`, e);
  }

  sidebarEl.classList.remove('visible');
  sidebarEl.innerHTML = '';
  document.title = 'CHIP-8';
  scheduleDisplayFit();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setRunning(enabled: boolean): void {
  if (enabled && !running) {
    running = true;
    requestAnimationFrame(frame);
    return;
  }
  if (!enabled) {
    running = false;
  }
}

function loadROMToMachine(
  rom: Uint8Array,
  name: string,
  lastModified: Date,
  seed?: number,
  autoRun = true,
): void {
  resetMachine(seed);
  cpu.loadROM(rom);
  statusEl.textContent = `${autoRun ? 'Running' : 'Loaded'} ${name} (${rom.length} bytes, modified ${formatTime(lastModified)})`;
  scheduleDisplayFit();
  if (autoRun) {
    setRunning(true);
  }
}

function normalizeRomData(rom: number[] | Uint8Array): Uint8Array {
  return rom instanceof Uint8Array ? rom : Uint8Array.from(rom);
}

async function loadROMFromUrl(url: string, seed?: number, autoRun = false): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ROM from ${url} (${response.status})`);
  }

  const rom = new Uint8Array(await response.arrayBuffer());
  const parts = url.split('/');
  const name = parts[parts.length - 1] || 'rom.ch8';
  loadROMToMachine(rom, name, new Date(), seed, autoRun);
}

function readOpcode(pc: number): number {
  const memory = cpu.getState().memory;
  return (memory[pc] << 8) | memory[pc + 1];
}

async function runSpacefightersScript(script: SpacefightersScript): Promise<SpacefightersScriptResult> {
  const base = import.meta.env.BASE_URL ?? '/';
  const romUrl = script.romUrl ?? `${base}roms/spacefighters.ch8`;
  await loadROMFromUrl(romUrl, script.seed ?? 42, false);

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
    advanceVirtualTapQueues(1);
    cpu.cycle(io);
    cycles++;
    if (cycles % CYCLES_PER_TIMER_TICK === 0) {
      cpu.updateTimers(io);
    }
  }

  for (let i = 0; i < MAX_SCRIPT_CYCLES; i++) {
    const state = cpu.getState();
    const pc = state.pc;
    const opcode = readOpcode(pc);

    if (!scanActive && pc === SCAN_ROUTINE_START) {
      scanActive = true;
      let scanKey: number | null = null;
      if (topReturnAddress() === COMMAND_SCAN_CALLER && pendingCommandFx === null && commandQueue.length > 0) {
        pendingCommandFx = commandQueue.shift()!;
        scanKey = 0;
        scanCommandTriggerCycles.push(cycles);
      }
      releaseAllKeys();
      if (scanKey !== null) {
        input.setKeyState(scanKey, true);
      }
    }

    // Release Fx0A key 1 cycle after pressing (for release-based detection)
    if (holdingFx && fxPressCycle !== null && cycles > fxPressCycle && currentFx) {
      input.setKeyState(currentFx.key, false);
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

      releaseAllKeys();
      input.setKeyState(key, true);
      holdingFx = true;
      fxPressCycle = cycles;
      currentFx = {
        source,
        key,
        startedAt: cycles,
        pc,
        returnAddress: topReturnAddress(),
      };
    }

    if (!state.waitingForKey && holdingFx) {
      releaseAllKeys();
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
      const next = readOpcode(pc + 2);
      const selfJump = (next & 0xf000) === 0x1000 && (next & 0x0fff) === pc;

      if ((opcode & 0xf0ff) === 0xe09e && selfJump) {
        const x = (opcode >> 8) & 0x0f;
        releaseAllKeys();
        input.setKeyState(state.v[x], true);
        autoLoopPresses++;
      } else if ((opcode & 0xf0ff) === 0xe0a1 && selfJump) {
        releaseAllKeys();
      }
    }

    step();

    const nextPc = cpu.getState().pc;
    if (scanActive && !(nextPc >= SCAN_ROUTINE_START && nextPc <= SCAN_ROUTINE_END)) {
      releaseAllKeys();
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

  releaseAllKeys();
  display.render();

  return {
    fxSnapshots,
    executionSnapshots,
    scanCommandTriggerCycles,
    autoLoopPresses,
  };
}

const KNOWN_ROMS = new Set(['spacefighters']);

romSelect.addEventListener('change', async () => {
  const value = romSelect.value;
  if (!value) return;

  if (value === '__file__') {
    fileInput.click();
    romSelect.value = '';
    return;
  }

  if (!KNOWN_ROMS.has(value)) return;

  const base = import.meta.env.BASE_URL ?? '/';
  const url = `${base}roms/${value}.ch8`;
  const response = await fetch(url);
  if (!response.ok) {
    statusEl.textContent = `Failed to load ROM (${response.status})`;
    return;
  }

  const rom = new Uint8Array(await response.arrayBuffer());
  loadROMToMachine(rom, `${value}.ch8`, new Date());
  await loadSidecar(value);
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  romSelect.value = '';
  const buffer = await file.arrayBuffer();
  const baseName = file.name.replace(/\.(ch8|rom|bin)$/i, '');
  loadROMToMachine(new Uint8Array(buffer), file.name, new Date(file.lastModified));
  await loadSidecar(baseName);
});

bindVirtualKeypad();
bindLayoutFitObservers();
window.addEventListener('blur', releaseAllKeys);
window.addEventListener('resize', scheduleDisplayFit);
window.visualViewport?.addEventListener('resize', scheduleDisplayFit);
window.visualViewport?.addEventListener('scroll', scheduleDisplayFit);

window.__CHIP8_TEST__ = {
  reset(seed?: number): void {
    resetMachine(seed);
    statusEl.textContent = 'Machine reset';
  },
  setRunning,
  step(cycles = 1): void {
    setRunning(false);
    stepCycles(cycles);
  },
  pressKey(key: number): void {
    input.setKeyState(key, true);
  },
  releaseKey(key: number): void {
    input.setKeyState(key, false);
  },
  releaseAllKeys,
  loadROM(rom: number[] | Uint8Array, name = 'rom.ch8', seed?: number, autoRun = false): void {
    const bytes = normalizeRomData(rom);
    loadROMToMachine(bytes, name, new Date(), seed, autoRun);
  },
  loadROMFromUrl,
  getCPUState() {
    const state = cpu.getState();
    return {
      pc: state.pc,
      sp: state.sp,
      waitingForKey: state.waitingForKey,
      waitingKeyPhase: state.waitingKeyPhase,
      waitingRegister: state.waitingRegister,
      activePlayer: state.activePlayer,
      syncBarrier: state.syncBarrier,
      v: Array.from(state.v),
    };
  },
  getFramebuffer(): number[] {
    return Array.from(display.getBuffer());
  },
  framebufferHash(): string {
    return framebufferHash(display.getBuffer());
  },
  sampleRows(xStart: number, yStart: number, width: number, height: number): string[] {
    return sampleRows(display.getBuffer(), xStart, yStart, width, height);
  },
  runSpacefightersScript,
  getDisplayScale(): number {
    return display.getScale();
  },
};

statusEl.textContent = 'Load a ROM to start';
scheduleDisplayFit();
