import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';
import { MockMultiplayer } from '../../src/backends/MockMultiplayer.js';

describe('00An - PLAYER n', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set activePlayer to 1 with 00A1', () => {
    h.loadProgram([0x00, 0xA1]);
    h.step();

    h.assertPC(0x202);
    h.assertActivePlayer(1);
  });

  it('should set activePlayer to 2 with 00A2', () => {
    h.loadProgram([0x00, 0xA2]);
    h.step();

    h.assertActivePlayer(2);
  });

  it('should set activePlayer to 0xF with 00AF', () => {
    h.loadProgram([0x00, 0xAF]);
    h.step();

    h.assertActivePlayer(0xF);
  });

  it('should route input from player-specific InputProvider when multiplayer is active', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // 00A2 — PLAYER 2
    // F30A — wait for key, store in V3
    h.loadProgram([0x00, 0xA2, 0xF3, 0x0A]);
    h.step(); // execute PLAYER 2
    h.step(); // execute Fx0A — sets waitingForKey

    // Player 2 presses key 5
    mp.getPlayerInput(2).pressKey(5);
    h.step(); // press detected
    mp.getPlayerInput(2).releaseKey(5);
    h.step(); // release detected

    h.assertRegister(3, 5);
  });

  it('should use default input when activePlayer is 0 (shared mode)', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // F20A — wait for key, store in V2
    h.loadProgram([0xF2, 0x0A]);
    h.step(); // Fx0A — sets waitingForKey

    // Press key 3 on the shared/default input
    h.input.pressKey(3);
    h.step(); // press detected
    h.input.releaseKey(3);
    h.step(); // release detected

    h.assertRegister(2, 3);
  });

  it('should route Ex9E (skip if pressed) through player input', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // V0 = 5 (key to check)
    h.state.v[0] = 5;

    // Player 1 presses key 5
    mp.getPlayerInput(1).pressKey(5);

    // 00A1 — PLAYER 1
    // E09E — skip if key V0 pressed
    // 6100 — LD V1, 0x00 (skipped)
    // 6101 — LD V1, 0x01
    h.loadProgram([0x00, 0xA1, 0xE0, 0x9E, 0x61, 0x00, 0x61, 0x01]);
    h.run(3); // PLAYER 1, SKP, LD V1

    h.assertRegister(1, 0x01); // skipped the 0x00 load
  });

  it('should route ExA1 (skip if not pressed) through player input', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // V0 = 3 (key to check)
    h.state.v[0] = 3;

    // Player 1 does NOT press key 3

    // 00A1 — PLAYER 1
    // E0A1 — skip if key V0 NOT pressed
    // 6100 — LD V1, 0x00 (skipped)
    // 6101 — LD V1, 0x01
    h.loadProgram([0x00, 0xA1, 0xE0, 0xA1, 0x61, 0x00, 0x61, 0x01]);
    h.run(3); // PLAYER 1, SKNP, LD V1

    h.assertRegister(1, 0x01); // skipped
  });

  it('should be a no-op for activePlayer without multiplayer provider', () => {
    // No multiplayer provider on io
    h.loadProgram([0x00, 0xA1, 0xF2, 0x0A]);

    h.step(); // PLAYER 1 — sets activePlayer but no multiplayer provider
    h.step(); // Fx0A — sets waitingForKey, falls back to default input

    h.input.pressKey(7);
    h.step(); // press detected
    h.input.releaseKey(7);
    h.step(); // release detected

    h.assertRegister(2, 7);
    h.assertActivePlayer(1); // state is set even without provider
  });
});
