import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SPACEFIGHTERS_3P_SCENARIOS, SpacefightersScenarioExpectation } from '../helpers/spacefightersScenarios';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const SPACEFIGHTERS_ROM_PATH = resolve(THIS_DIR, '../../roms/spacefighters.ch8');

interface BrowserFxSnapshot {
  source: string;
  key: number;
  hash: string;
  marker: string[];
}

interface BrowserExecutionSnapshot {
  cycle: number;
  pc: number;
  hash: string;
  marker: string[];
}

interface BrowserScriptResult {
  fxSnapshots: BrowserFxSnapshot[];
  executionSnapshots: BrowserExecutionSnapshot[];
  scanCommandTriggerCycles: number[];
  autoLoopPresses: number;
}

interface LayoutMetrics {
  fits: boolean;
  scale: number;
}

async function runBrowserScenario(
  scenario: SpacefightersScenarioExpectation,
  evaluate: <R, A>(pageFunction: (arg: A) => R | Promise<R>, arg: A) => Promise<R>,
): Promise<BrowserScriptResult> {
  return evaluate(async (script) => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | {
          runSpacefightersScript: (input: {
            initialFxKeys: number[];
            commandKeys: number[];
            tailFxKeys: number[];
            executionCheckpointCycles: number[];
            romUrl: string;
            seed: number;
          }) => Promise<BrowserScriptResult>;
        }
      | undefined;

    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }

    return testApi.runSpacefightersScript({
      ...script,
      romUrl: '/roms/spacefighters.ch8',
      seed: 42,
    });
  }, scenario.script);
}

async function readLayoutMetrics(
  evaluate: <R>(pageFunction: () => R | Promise<R>) => Promise<R>,
): Promise<LayoutMetrics> {
  return evaluate(() => {
    const canvas = document.querySelector('#display')?.getBoundingClientRect();
    const controls = document.querySelector('.controls')?.getBoundingClientRect();
    const keymap = document.querySelector('.keymap')?.getBoundingClientRect();
    const sidebar = document.querySelector('#sidebar') as HTMLElement | null;
    const sidebarRect =
      sidebar && getComputedStyle(sidebar).display !== 'none' ? sidebar.getBoundingClientRect() : null;

    const maxBottom = Math.max(
      canvas?.bottom ?? 0,
      controls?.bottom ?? 0,
      keymap?.bottom ?? 0,
      sidebarRect?.bottom ?? 0,
    );
    const maxRight = Math.max(
      canvas?.right ?? 0,
      controls?.right ?? 0,
      keymap?.right ?? 0,
      sidebarRect?.right ?? 0,
    );

    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getDisplayScale: () => number }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }

    return {
      fits: maxRight <= window.innerWidth + 1 && maxBottom <= window.innerHeight + 1,
      scale: testApi.getDisplayScale(),
    };
  });
}

test('Display should auto-fit viewport and stay fully visible', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('#rom-file', SPACEFIGHTERS_ROM_PATH);
  await page.waitForSelector('#sidebar.visible');
  let settled = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    const metrics = await readLayoutMetrics(page.evaluate.bind(page));
    if (metrics.fits && metrics.scale > 1) {
      settled = true;
      break;
    }
    await page.waitForTimeout(50);
  }
  expect(settled).toBe(true);

  const initial = await readLayoutMetrics(page.evaluate.bind(page));

  expect(initial.fits).toBe(true);
  expect(initial.scale).toBeGreaterThan(1);

  await page.setViewportSize({ width: 1040, height: 760 });
  let shrunkSettled = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    const metrics = await readLayoutMetrics(page.evaluate.bind(page));
    if (metrics.fits) {
      shrunkSettled = true;
      break;
    }
    await page.waitForTimeout(50);
  }
  expect(shrunkSettled).toBe(true);

  const shrunk = await readLayoutMetrics(page.evaluate.bind(page));

  expect(shrunk.fits).toBe(true);

  await page.setViewportSize({ width: 1400, height: 900 });
  let expandedSettled = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    const metrics = await readLayoutMetrics(page.evaluate.bind(page));
    if (metrics.fits && metrics.scale >= shrunk.scale) {
      expandedSettled = true;
      break;
    }
    await page.waitForTimeout(50);
  }
  expect(expandedSettled).toBe(true);

  const expanded = await readLayoutMetrics(page.evaluate.bind(page));

  expect(expanded.fits).toBe(true);
  expect(expanded.scale).toBeGreaterThanOrEqual(shrunk.scale);
});

test('Initial layout should keep controls and keypad on-screen', async ({ page }) => {
  await page.setViewportSize({ width: 1228, height: 768 });
  await page.goto('/');

  await page.waitForFunction(() => {
    const keymap = document.querySelector('.keymap')?.getBoundingClientRect();
    const controls = document.querySelector('.controls')?.getBoundingClientRect();
    const canvas = document.querySelector('#display')?.getBoundingClientRect();
    if (!keymap || !controls || !canvas) {
      return false;
    }
    return Math.max(keymap.bottom, controls.bottom, canvas.bottom) <= window.innerHeight + 1;
  });

  const metrics = await page.evaluate(() => {
    const keymap = document.querySelector('.keymap')?.getBoundingClientRect();
    const controls = document.querySelector('.controls')?.getBoundingClientRect();
    const canvas = document.querySelector('#display')?.getBoundingClientRect();
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getDisplayScale: () => number }
      | undefined;
    if (!keymap || !controls || !canvas || !testApi) {
      throw new Error('Layout or test API not available.');
    }
    return {
      maxBottom: Math.max(keymap.bottom, controls.bottom, canvas.bottom),
      innerHeight: window.innerHeight,
      scale: testApi.getDisplayScale(),
    };
  });

  expect(metrics.maxBottom).toBeLessThanOrEqual(metrics.innerHeight + 1);
  expect(metrics.scale).toBeGreaterThanOrEqual(8);
});

test('On-screen keypad click should submit a CHIP-8 key at prompt', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { loadROMFromUrl: (url: string, seed?: number, autoRun?: boolean) => Promise<void> }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }
    await testApi.loadROMFromUrl('/roms/spacefighters.ch8', 42, true);
  });

  await page.waitForFunction(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean } }
      | undefined;
    return Boolean(testApi?.getCPUState().waitingForKey);
  });

  const promptRegister = await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingRegister: number } }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }
    return testApi.getCPUState().waitingRegister;
  });

  await page.locator('button.key[data-chip-key="5"]').click();

  await page.waitForFunction((registerIndex: number) => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean; v: number[] } }
      | undefined;
    if (!testApi) {
      return false;
    }
    const state = testApi.getCPUState();
    return !state.waitingForKey && state.v[registerIndex] === 0x5;
  }, promptRegister);

  await expect(page.locator('button.key[data-chip-key="5"]')).not.toHaveClass(/active/);
});

test('Rapid repeated taps on same on-screen key should be consumed as separate presses', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | {
          reset: (seed?: number) => void;
          loadROM: (rom: number[], name?: string, seed?: number, autoRun?: boolean) => void;
        }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }

    // Fx0A into V1, then Fx0A into V2, then self-loop.
    testApi.reset(42);
    testApi.loadROM([0xF1, 0x0A, 0xF2, 0x0A, 0x12, 0x04], 'double_tap.ch8', 42, true);
  });

  await page.waitForFunction(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean; waitingRegister: number } }
      | undefined;
    if (!testApi) {
      return false;
    }
    const state = testApi.getCPUState();
    return state.waitingForKey && state.waitingRegister === 0x1;
  });

  const keyButton = page.locator('button.key[data-chip-key="5"]');
  await keyButton.click();
  await keyButton.click();

  await page.waitForFunction(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean; pc: number; v: number[] } }
      | undefined;
    if (!testApi) {
      return false;
    }
    const state = testApi.getCPUState();
    return !state.waitingForKey && state.pc === 0x204 && state.v[1] === 0x5 && state.v[2] === 0x5;
  });
});

test('On-screen keypad taps should be deterministic when stepping emulator cycles manually', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | {
          reset: (seed?: number) => void;
          loadROM: (rom: number[], name?: string, seed?: number, autoRun?: boolean) => void;
          step: (cycles?: number) => void;
        }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }

    // Fx0A into V1, then Fx0A into V2, then self-loop.
    testApi.reset(42);
    testApi.loadROM([0xF1, 0x0A, 0xF2, 0x0A, 0x12, 0x04], 'double_tap_step.ch8', 42, false);
    testApi.step(1);
  });

  await page.waitForFunction(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean; waitingRegister: number } }
      | undefined;
    if (!testApi) {
      return false;
    }
    const state = testApi.getCPUState();
    return state.waitingForKey && state.waitingRegister === 0x1;
  });

  const keyButton = page.locator('button.key[data-chip-key="5"]');
  await keyButton.click();
  await keyButton.click();

  const beforeStepping = await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean; v: number[]; pc: number } }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }
    const state = testApi.getCPUState();
    return {
      waitingForKey: state.waitingForKey,
      v1: state.v[1],
      v2: state.v[2],
      pc: state.pc,
    };
  });

  expect(beforeStepping.waitingForKey).toBe(true);
  expect(beforeStepping.v1).toBe(0);
  expect(beforeStepping.v2).toBe(0);
  expect(beforeStepping.pc).toBe(0x202);

  await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { step: (cycles?: number) => void }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }
    testApi.step(500);
  });

  const afterStepping = await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { waitingForKey: boolean; v: number[]; pc: number } }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }
    const state = testApi.getCPUState();
    return {
      waitingForKey: state.waitingForKey,
      v1: state.v[1],
      v2: state.v[2],
      pc: state.pc,
    };
  });

  expect(afterStepping.waitingForKey).toBe(false);
  expect(afterStepping.v1).toBe(0x5);
  expect(afterStepping.v2).toBe(0x5);
  expect(afterStepping.pc).toBe(0x204);
  await expect(keyButton).not.toHaveClass(/active/);
});

test('On-screen keypad tap should be reliable for periodic key-scan loops', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | {
          reset: (seed?: number) => void;
          loadROM: (rom: number[], name?: string, seed?: number, autoRun?: boolean) => void;
        }
      | undefined;
    if (!testApi) {
      throw new Error('window.__CHIP8_TEST__ was not found.');
    }

    // Poll key 5 intermittently (not every cycle), then latch success into V1.
    // The counter resets each pass (JP 0x200) so SKP fires every ~11 instructions,
    // ensuring the virtual tap window (180 cycles) reliably overlaps.
    testApi.reset(42);
    testApi.loadROM(
      [
        0x60, 0x00, // V0 = 0
        0x70, 0x01, // V0 += 1
        0x30, 0x03, // if V0 == 3 skip jump
        0x12, 0x02, // jump back to poll delay loop
        0x65, 0x05, // V5 = 0x5
        0xe5, 0x9e, // SKP V5
        0x12, 0x00, // keep looping (reset counter) until key is detected
        0x61, 0x01, // V1 = 1 (latch success)
        0x12, 0x10, // hold
      ],
      'scan_tap.ch8',
      42,
      true,
    );
  });

  await page.locator('button.key[data-chip-key="5"]').click();

  await page.waitForFunction(() => {
    const testApi = (window as Window & { __CHIP8_TEST__?: unknown }).__CHIP8_TEST__ as
      | { getCPUState: () => { v: number[] } }
      | undefined;
    if (!testApi) {
      return false;
    }
    return testApi.getCPUState().v[1] === 0x1;
  });
});

for (const scenario of SPACEFIGHTERS_3P_SCENARIOS) {
  test(`Spacefighters 3-player browser script should match ${scenario.name}`, async ({ page }) => {
    await page.goto('/');

    const result = await runBrowserScenario(scenario, page.evaluate.bind(page));

    expect(
      result.fxSnapshots.map((snapshot) => ({
        source: snapshot.source,
        key: snapshot.key,
        hash: snapshot.hash,
        marker: snapshot.marker,
      })),
    ).toEqual(scenario.fxSnapshots);

    expect(result.scanCommandTriggerCycles.length).toBe(scenario.scanCommandTriggerCount);
    expect(result.autoLoopPresses).toBe(scenario.autoLoopPresses);
    expect(result.executionSnapshots).toEqual(scenario.executionSnapshots);
  });
}
