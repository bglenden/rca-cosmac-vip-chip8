# CHIP-8 Interpreter — Developer Guide

This document describes the current implementation state and where to make changes safely.

## Current Implementation Status

- CPU core is deterministic and complete for:
  - standard CHIP-8 instruction set,
  - multiplayer opcodes used by Spacefighters (`00An` for `SYNC`/`PLAYER n`, `00B0` for `SHARED`).
- `Fx0A` uses two-phase press-then-release detection (COSMAC VIP correct): waits for any key press, then waits for that key's release before storing the value. Fields: `waitingKeyPhase` (`'press'` | `'release'`), `waitingKeyValue`.
- Browser runtime drives CPU at `30` cycles per animation frame (`~1800 cycles/s @ 60fps`) and decrements timers every `30` cycles.
- Drawing flag optimization: `drawFlag` is set by `DRW`/`CLS` opcodes; the frame loop only calls `display.render()` when the flag is set.
- On-screen keypad taps are advanced by a cycle-driven state machine (`idle -> pressed -> gap`) in `browser/main.ts`.
- Display auto-fit scales `CanvasDisplay` dynamically and verifies all tracked UI blocks (`canvas`, controls, keypad, visible sidebar) stay within viewport bounds.
- ROM loading via dropdown selector (known ROMs) or file chooser (custom ROMs). Known ROMs automatically load sidecar help files.

## Architecture

### Core (`src/core/`)

- `types.ts`
  - Constants (`DISPLAY_WIDTH`, `PROGRAM_START`, etc.).
  - Serializable `CPUState` including `waitingKeyPhase`, `waitingKeyValue`, `drawFlag`.
  - I/O interfaces (`DisplayBackend`, `AudioBackend`, `InputProvider`, `MultiplayerProvider`) and `IOBus`.
- `CPU.ts`
  - Fetch/decode/execute loop.
  - Seeded deterministic RNG (`Cxkk`).
  - `cloneState()` deep copy for deterministic tests and future sync logic.
  - Two-phase `Fx0A` handling: press detection then release detection.

### Backends (`src/backends/`)

- Browser backends:
  - `CanvasDisplay` (runtime-resizable scale via `setScale/getScale`).
  - `WebAudio`.
  - `KeyboardInput` (QWERTY -> CHIP-8 map).
- Test backends:
  - `BufferDisplay`.
  - `MockAudio`.
  - `MockInput`.
  - `MockMultiplayer`.

### Browser Runtime (`browser/`)

- `browser/index.html`
  - Emulator canvas with CRT phosphor glow and scanline overlay, ROM dropdown + file chooser, clickable CHIP-8 keypad, optional side help panel.
- `browser/main.ts`
  - ROM loading (dropdown for known ROMs, file input for custom), frame loop, display auto-fit, keypad tap FSM, sidecar rendering.
  - Exposes `window.__CHIP8_TEST__` to browser tests for deterministic stepping and framebuffer assertions.

### Shared Utilities

- `src/core/display-utils.ts` — `framebufferHash()` (FNV-1a) and `sampleRows()` used by both browser and test runners.
- `src/spacefighters/script-types.ts` — Shared types and ROM-specific constants for Spacefighters scripted scenarios.

## COSMAC VIP Behavior

The implementation intentionally follows COSMAC VIP-style quirks:

- `8xy1/8xy2/8xy3`: `VF = 0`.
- `8xy6/8xyE`: shift source is `Vy`.
- `Fx55/Fx65`: `I` increments as registers are stored/loaded.
- `Dxyn`: clipping at display edges (no wrapping).
- `Fx0A`: two-phase press-then-release (not press-only).

## Spacefighters Integration

- Canonical ROM:
  - `roms/spacefighters.ch8`
  - size: `1020` bytes
  - SHA-1: `726cb39afa7e17725af7fab37d153277d86bff77`
- Rebuild script:
  - `roms/build_spacefighters.mjs` embeds canonical bytes and verifies hash.
- Sidecar documentation:
  - `.ch8` files are raw binary ROM images with no metadata. Documentation is provided via an optional `.ch8.json` sidecar file placed alongside the ROM.
  - `roms/spacefighters.ch8.json` drives the right-panel sidebar (how-to-play, programming commands, parameter meanings).
  - See the README for the sidecar JSON format.
- Deterministic scripted runner:
  - `tests/helpers/SpacefightersScriptRunner.ts` (headless).
  - Mirrors browser script logic and snapshots framebuffer hash/marker rows.

## Testing

### Headless (Vitest)

- Command: `npm test`
- Current status: 45 test files / 338 tests passing.
- Coverage focus:
  - Instruction-level tests (`tests/instructions/`).
  - Integration tests (`tests/integration/`) including scripted Spacefighters state snapshots.

### Browser (Playwright)

- Command: `npm run test:browser`
- Current status: 8 browser tests passing in `tests/browser/spacefighters.spec.ts`.
- Covers:
  - layout fit + dynamic resize,
  - on-screen keypad click/tap behavior,
  - periodic key-scan reliability,
  - deterministic 3-player scenario matching against expected hashes/markers.

### Linting

- Command: `npm run lint`
- ESLint with `@eslint/js` + `typescript-eslint` recommended configs.
- Config: `eslint.config.js`.

### Coverage Caveat

- `npm test -- --coverage` instruments Vitest targets only.
- Browser entry (`browser/main.ts`) is validated by Playwright tests, so total line coverage percentage appears lower than core coverage.
- Core CPU coverage is high (`src/core/CPU.ts` ~99% lines/branches).

## Change Notes for Input/Timing Work

When editing keypad or timing logic:

1. Keep input transitions cycle-driven (not wall-clock timeouts) to avoid race conditions between UI event timing and CPU key scans.
2. `Fx0A` uses two-phase press-then-release in the CPU. Script runners must press a key, then release it after 1 cycle, for the Fx0A to complete.
3. Re-run all three checks:
   - `npm run lint`
   - `npm test`
   - `npm run test:browser`
4. For Spacefighters changes, verify deterministic scenarios still match in:
   - `tests/integration/spacefighters_scripted.test.ts`
   - `tests/browser/spacefighters.spec.ts`
