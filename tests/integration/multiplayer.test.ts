import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';
import { MockMultiplayer } from '../../src/backends/MockMultiplayer.js';

describe('Multiplayer integration', () => {
  let h: TestHarness;
  let mp: MockMultiplayer;

  beforeEach(() => {
    h = new TestHarness(42);
    mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;
  });

  it('should simulate a two-player programming phase with sync barrier', () => {
    // Simulate Spacefighters-like flow:
    // PLAYER 1 → wait for key → SYNC → PLAYER 2 → wait for key → SYNC → SHARED → LD V5, 0xFF

    h.loadProgram([
      0x00, 0xA1, // 0x200: PLAYER 1
      0xF1, 0x0A, // 0x202: LD V1, K (wait for key, store in V1)
      0x00, 0xA0, // 0x204: SYNC
      0x00, 0xA2, // 0x206: PLAYER 2
      0xF2, 0x0A, // 0x208: LD V2, K (wait for key, store in V2)
      0x00, 0xA0, // 0x20A: SYNC
      0x00, 0xB0, // 0x20C: SHARED
      0x65, 0xFF, // 0x20E: LD V5, 0xFF
    ]);

    // Step through PLAYER 1
    h.step(); // PLAYER 1
    h.assertActivePlayer(1);

    // CPU waits for key from player 1
    h.step(); // Fx0A — sets waitingForKey
    expect(h.state.waitingForKey).toBe(true);

    // Player 1 presses key 3 (two-phase: press then release)
    mp.getPlayerInput(1).pressKey(3);
    h.step(); // press detected, transitions to release phase
    mp.getPlayerInput(1).releaseKey(3);
    h.step(); // release detected, stores value
    h.assertRegister(1, 3);
    expect(h.state.waitingForKey).toBe(false);

    // SYNC — player 1 reaches barrier
    h.step(); // SYNC
    expect(h.state.syncBarrier).toBe(true);

    // CPU is blocked until player 2 syncs
    h.step(); // blocked
    h.assertPC(0x206); // hasn't advanced past SYNC

    // Player 2 reaches sync
    mp.playerReachedSync(2);

    h.step(); // barrier clears, executes PLAYER 2
    h.assertActivePlayer(2);
    mp.resetSync(); // prepare for next sync phase

    // CPU waits for key from player 2
    h.step(); // Fx0A — sets waitingForKey
    expect(h.state.waitingForKey).toBe(true);

    // Player 2 presses key 7 (two-phase: press then release)
    mp.getPlayerInput(2).pressKey(7);
    h.step(); // press detected, transitions to release phase
    mp.getPlayerInput(2).releaseKey(7);
    h.step(); // release detected, stores value
    h.assertRegister(2, 7);

    // SYNC — both players need to sync again
    h.step(); // SYNC
    expect(h.state.syncBarrier).toBe(true);

    // Simulate both players reaching sync for second barrier
    mp.playerReachedSync(1);
    mp.playerReachedSync(2);

    h.step(); // barrier clears, executes SHARED
    h.assertActivePlayer(0);

    // Battle phase — LD V5, 0xFF
    h.step();
    h.assertRegister(5, 0xFF);
  });

  it('should isolate input between players', () => {
    h.loadProgram([
      0x00, 0xA1, // PLAYER 1
      0xF1, 0x0A, // LD V1, K
      0x00, 0xA2, // PLAYER 2
      0xF2, 0x0A, // LD V2, K
    ]);

    h.step(); // PLAYER 1
    h.step(); // Fx0A enters waiting
    mp.getPlayerInput(1).pressKey(2);
    h.step(); // press detected
    mp.getPlayerInput(1).releaseKey(2);
    h.step(); // release detected, V1=2

    h.step(); // PLAYER 2
    h.step(); // Fx0A enters waiting
    mp.getPlayerInput(2).pressKey(8);
    h.step(); // press detected
    mp.getPlayerInput(2).releaseKey(8);
    h.step(); // release detected, V2=8

    h.assertRegister(1, 2); // player 1's key
    h.assertRegister(2, 8); // player 2's key
  });

  it('should use default input in shared mode even with multiplayer provider', () => {
    // No PLAYER opcode — shared mode by default
    h.loadProgram([0xF3, 0x0A]); // LD V3, K
    h.step(); // Fx0A — sets waitingForKey

    h.input.pressKey(0xA);
    h.step(); // press detected from shared input
    h.input.releaseKey(0xA);
    h.step(); // release detected, stores value

    h.assertRegister(3, 0xA);
  });

  it('should handle PLAYER → SHARED → PLAYER transitions', () => {
    h.loadProgram([
      0x00, 0xA1, // PLAYER 1
      0xF1, 0x0A, // LD V1, K (from player 1)
      0x00, 0xB0, // SHARED
      0xF2, 0x0A, // LD V2, K (from default/shared)
      0x00, 0xA2, // PLAYER 2
      0xF3, 0x0A, // LD V3, K (from player 2)
    ]);

    h.step(); // PLAYER 1
    h.step(); // Fx0A enters waiting
    mp.getPlayerInput(1).pressKey(1);
    h.step(); // press detected
    mp.getPlayerInput(1).releaseKey(1);
    h.step(); // release detected, V1=1

    h.step(); // SHARED
    h.step(); // Fx0A enters waiting
    h.input.pressKey(5);
    h.step(); // press detected
    h.input.releaseKey(5);
    h.step(); // release detected, V2=5

    h.step(); // PLAYER 2
    h.step(); // Fx0A enters waiting
    mp.getPlayerInput(2).pressKey(9);
    h.step(); // press detected
    mp.getPlayerInput(2).releaseKey(9);
    h.step(); // release detected, V3=9

    h.assertRegister(1, 1); // player 1
    h.assertRegister(2, 5); // shared
    h.assertRegister(3, 9); // player 2
  });

  it('should serialize and restore multiplayer state via cloneState', () => {
    h.loadProgram([0x00, 0xA2]); // PLAYER 2
    h.step();

    const cloned = h.cpu.cloneState();
    expect(cloned.activePlayer).toBe(2);
    expect(cloned.syncBarrier).toBe(false);

    // Modify original
    h.state.activePlayer = 0;
    expect(cloned.activePlayer).toBe(2); // clone not affected
  });

  it('should work without multiplayer provider (standard CHIP-8 compatibility)', () => {
    // Remove multiplayer
    delete h.io.multiplayer;

    // Standard CHIP-8 programs never emit 00Ax/00Bx, but if they did:
    h.loadProgram([
      0x00, 0xA1, // would set activePlayer but no routing effect
      0x00, 0xA0, // SYNC — barrier set, clears next cycle (no provider)
      0x61, 0x42, // LD V1, 0x42
    ]);

    h.step(); // PLAYER 1 — sets state, no provider
    h.step(); // SYNC — sets barrier
    h.step(); // barrier clears (no provider), LD V1, 0x42

    h.assertRegister(1, 0x42);
  });
});
