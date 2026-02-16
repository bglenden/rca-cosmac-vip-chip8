# rca-cosmac-vip-chip8

A TypeScript CHIP-8 interpreter for browser and headless testing, faithful to the RCA COSMAC VIP. **VIP Programmable Spacefighters** is pre-loaded and ready to play from the ROM dropdown.

**Play it now:** https://bglenden.github.io/rca-cosmac-vip-chip8/

## Current State

- Core CPU implementation is complete for classic CHIP-8 plus multiplayer extensions used by Spacefighters (`00An` player/sync family and `00B0` shared mode).
- COSMAC VIP instruction quirks are implemented (shift source = `Vy`, logic ops reset `VF`, `Fx55/Fx65` increment `I`, clipped drawing, `Fx0A` press-then-release).
- `roms/spacefighters.ch8` is bundled in canonical form (1020 bytes, SHA-1 `726cb39afa7e17725af7fab37d153277d86bff77`) and can be rebuilt with `npm run build:rom`.
- Browser UI has:
  - CRT-styled auto-scaling 64x32 canvas with phosphor glow and scanline overlay.
  - ROM dropdown with Programmable Spacefighters pre-loaded, plus a file chooser for custom ROMs.
  - Clickable/tappable on-screen CHIP-8 keypad with glow feedback.
  - Cycle-driven keypad tap state machine (deterministic `idle -> pressed -> gap`).
  - ROM sidecar documentation panel (see below).

## Quick Start

```bash
npm install
npm run dev
```

Open the URL shown in terminal. Programmable Spacefighters is available in the ROM dropdown. Click "Choose file..." to load any other `.ch8` ROM.

## Sidecar Documentation

A `.ch8` file is a raw binary ROM image — it contains only CHIP-8 machine code with no metadata or documentation. To provide contextual help for a ROM, the emulator supports an optional **sidecar** JSON file placed alongside it. For a ROM named `example.ch8`, the emulator looks for `example.ch8.json` in the same directory. If found, its contents are rendered in a sidebar panel alongside the display.

The sidecar format:

```json
{
  "title": "ROM Title",
  "author": "Author or source",
  "description": "Short description of the ROM.",
  "sidebar": [
    "## Section Heading",
    "Lines of help text.",
    "Use ## for headings, blank strings for spacing.",
    "",
    "## Another Section",
    "More content here."
  ]
}
```

The `title` field also sets the browser tab title. Lines starting with `## ` render as section headings; blank strings add vertical spacing; all other lines render as body text. See `roms/spacefighters.ch8.json` for a working example.

## Commands

```bash
npm run dev          # Vite browser dev server (also rebuilds spacefighters ROM)
npm run build        # TypeScript compile to dist/
npm run build:rom    # Rebuild canonical roms/spacefighters.ch8 and verify SHA-1
npm run lint         # ESLint (TypeScript recommended rules)
npm test             # Vitest (unit + integration, headless)
npm run test:watch   # Vitest watch mode
npm run test:browser # Playwright browser tests
```

## Controls

Keyboard mapping:

```
CHIP-8 Keypad    Keyboard
 1 2 3 C         1 2 3 4
 4 5 6 D         Q W E R
 7 8 9 E         A S D F
 A 0 B F         Z X C V
```

The on-screen keypad uses the same CHIP-8 layout and can be clicked/tapped directly.

## Spacefighters Notes

- Programmable Spacefighters is pre-loaded in the ROM dropdown and runs immediately on selection.
- Sidecar help for the game (how-to-play, programming commands, parameter meanings) appears automatically in the right sidebar.
- Recommended scripted setup for deterministic tests is 3-player with explicit prompt sequences (see `tests/helpers/spacefightersScenarios.ts`).
- The game expects discrete key taps across consecutive `Fx0A` prompts; the CPU uses two-phase press-then-release detection per the COSMAC VIP specification.

## Test Status

Current automated coverage includes:

- `npm run lint`: ESLint with TypeScript recommended rules, clean.
- `npm test`: 45 Vitest files, 338 tests (instruction + integration) passing.
- `npm run test:browser`: 8 Playwright tests passing, including:
  - layout fit checks across viewport sizes,
  - on-screen keypad click/tap behavior,
  - deterministic 3-player Spacefighters scripted scenarios.

Coverage command:

```bash
npm test -- --coverage
```

Notes:

- Core CPU coverage is high (`src/core/CPU.ts` ~99% lines/branches).
- Browser entry code (`browser/main.ts`) is validated via Playwright, but not instrumented by Vitest coverage.

## Project Structure

```
src/core/CPU.ts                    # CHIP-8 CPU execution + opcodes
src/core/types.ts                  # Constants, interfaces, state model
src/backends/                      # Canvas/WebAudio + mock backends
src/Interpreter.ts                 # Optional interval-based orchestrator
browser/index.html                 # Browser UI (canvas, keypad, sidebar, CRT effects)
browser/main.ts                    # Browser runtime + test driver hook
browser/vite.config.ts             # Vite config with ROM rebuild on change
roms/build_spacefighters.mjs       # Canonical ROM builder/verifier
roms/spacefighters.ch8.json        # Sidecar documentation for Spacefighters
tests/instructions/                # Per-opcode instruction tests
tests/integration/                 # Headless program/timer/display tests
tests/helpers/SpacefightersScriptRunner.ts
tests/browser/spacefighters.spec.ts
eslint.config.js                   # ESLint flat config
```
