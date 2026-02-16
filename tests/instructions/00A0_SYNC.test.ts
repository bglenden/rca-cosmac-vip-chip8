import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';
import { MockMultiplayer } from '../../src/backends/MockMultiplayer.js';

describe('00A0 - SYNC', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should set syncBarrier to true', () => {
    h.loadProgram([0x00, 0xA0]);
    h.step();

    expect(h.state.syncBarrier).toBe(true);
    h.assertPC(0x202);
  });

  it('should block execution while sync is incomplete (multiplayer)', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // 00A0 — SYNC
    // 6105 — LD V1, 0x05 (should not execute while blocked)
    h.loadProgram([0x00, 0xA0, 0x61, 0x05]);
    h.step(); // execute SYNC — sets barrier, notifies local player

    // CPU is now blocked — cycling should not advance PC
    const pcAfterSync = h.state.pc;
    h.step(); // blocked
    h.assertPC(pcAfterSync);
    h.assertRegister(1, 0); // V1 not yet set

    // Player 2 reaches sync
    mp.playerReachedSync(2);
    h.step(); // barrier clears, then executes LD V1, 0x05

    h.assertRegister(1, 0x05);
  });

  it('should immediately clear in single-player (no multiplayer provider)', () => {
    // 00A0 — SYNC
    // 6105 — LD V1, 0x05
    h.loadProgram([0x00, 0xA0, 0x61, 0x05]);
    h.step(); // SYNC — sets syncBarrier
    h.step(); // barrier clears (no provider), executes LD V1, 0x05

    h.assertRegister(1, 0x05);
  });

  it('should call notifySync on the multiplayer provider', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    h.loadProgram([0x00, 0xA0]);
    h.step();

    // Local player (1) should be in the synced set
    // Verify by making player 2 also sync — then isSyncComplete should be true
    mp.playerReachedSync(2);
    expect(mp.isSyncComplete()).toBe(true);
  });

  it('should not block if all players already synced', () => {
    const mp = new MockMultiplayer(2);
    h.io.multiplayer = mp;

    // Pre-sync player 2
    mp.playerReachedSync(2);

    // 00A0 — SYNC
    // 6105 — LD V1, 0x05
    h.loadProgram([0x00, 0xA0, 0x61, 0x05]);
    h.step(); // SYNC — notifies local, all synced
    h.step(); // barrier clears immediately, LD V1, 0x05

    h.assertRegister(1, 0x05);
  });

  it('should block across multiple cycles until sync completes', () => {
    const mp = new MockMultiplayer(3); // 3 players
    h.io.multiplayer = mp;

    // 00A0 — SYNC
    // 6105 — LD V1, 0x05
    h.loadProgram([0x00, 0xA0, 0x61, 0x05]);
    h.step(); // SYNC

    // Still blocked — only player 1 synced
    h.step();
    h.assertRegister(1, 0);

    // Player 2 syncs
    mp.playerReachedSync(2);
    h.step();
    h.assertRegister(1, 0); // still blocked — player 3 hasn't synced

    // Player 3 syncs
    mp.playerReachedSync(3);
    h.step(); // now all synced — executes LD V1, 0x05

    h.assertRegister(1, 0x05);
  });
});
