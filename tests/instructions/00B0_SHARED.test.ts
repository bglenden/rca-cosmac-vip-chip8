import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';
import { MockMultiplayer } from '../../src/backends/MockMultiplayer.js';

describe('00B0 - SHARED', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set activePlayer to 0 (shared mode)', () => {
    // First set a player
    h.state.activePlayer = 2;

    h.loadProgram([0x00, 0xB0]);
    h.step();

    h.assertActivePlayer(0);
    h.assertPC(0x202);
  });

  it('should restore input routing to default after PLAYER n', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // 00A1 — PLAYER 1
    // F10A — wait for key in V1 (reads from player 1 → key 9)
    // 00B0 — SHARED
    // F20A — wait for key in V2 (reads from default → key 4)
    h.loadProgram([0x00, 0xA1, 0xF1, 0x0A, 0x00, 0xB0, 0xF2, 0x0A]);

    h.step(); // PLAYER 1
    h.step(); // Fx0A enters waiting
    mp.getPlayerInput(1).pressKey(9);
    h.step(); // press detected
    mp.getPlayerInput(1).releaseKey(9);
    h.step(); // release detected, V1=9
    h.step(); // SHARED
    h.step(); // Fx0A enters waiting
    h.input.pressKey(4);
    h.step(); // press detected
    h.input.releaseKey(4);
    h.step(); // release detected, V2=4

    h.assertRegister(1, 9); // from player 1
    h.assertRegister(2, 4); // from shared/default
  });

  it('should be a no-op if already in shared mode', () => {
    h.loadProgram([0x00, 0xB0]);
    h.step();

    h.assertActivePlayer(0);
  });

  it('should work with any 00Bx where x is 0', () => {
    // Only 00B0 triggers SHARED; the plan specifies 00B0
    h.state.activePlayer = 3;
    h.loadProgram([0x00, 0xB0]);
    h.step();

    h.assertActivePlayer(0);
  });
});
