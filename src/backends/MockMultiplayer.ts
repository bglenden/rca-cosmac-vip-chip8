import { MultiplayerProvider, InputProvider } from '../core/types.js';
import { MockInput } from './MockInput.js';

/**
 * Mock multiplayer backend for testing PLAYER/SYNC/SHARED opcodes.
 * Each player gets their own MockInput. Sync is tracked per-player.
 */
export class MockMultiplayer implements MultiplayerProvider {
  private playerCount: number;
  private localPlayer: number;
  private playerInputs: MockInput[];
  private syncedPlayers: Set<number> = new Set();

  constructor(playerCount: number, localPlayer: number = 1) {
    this.playerCount = playerCount;
    this.localPlayer = localPlayer;
    this.playerInputs = [];
    for (let i = 0; i <= playerCount; i++) {
      // index 0 unused, players are 1-based
      this.playerInputs.push(new MockInput());
    }
  }

  getPlayerCount(): number {
    return this.playerCount;
  }

  getLocalPlayer(): number {
    return this.localPlayer;
  }

  notifySync(): void {
    this.syncedPlayers.add(this.localPlayer);
  }

  isSyncComplete(): boolean {
    for (let p = 1; p <= this.playerCount; p++) {
      if (!this.syncedPlayers.has(p)) return false;
    }
    return true;
  }

  /** Simulate a remote player reaching the sync barrier. */
  playerReachedSync(player: number): void {
    this.syncedPlayers.add(player);
  }

  /** Reset sync state (call between phases). */
  resetSync(): void {
    this.syncedPlayers.clear();
  }

  getInputForPlayer(player: number): InputProvider {
    if (player < 1 || player > this.playerCount) {
      throw new Error(`Invalid player number: ${player}`);
    }
    return this.playerInputs[player];
  }

  /** Get the MockInput for a player (for test assertions). */
  getPlayerInput(player: number): MockInput {
    if (player < 1 || player > this.playerCount) {
      throw new Error(`Invalid player number: ${player}`);
    }
    return this.playerInputs[player];
  }
}
