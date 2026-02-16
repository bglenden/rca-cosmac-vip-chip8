// Display
export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;
export const DISPLAY_SIZE = DISPLAY_WIDTH * DISPLAY_HEIGHT;

// Memory
export const MEMORY_SIZE = 4096;
export const PROGRAM_START = 0x200;
export const FONT_START = 0x050;

// Stack
export const STACK_SIZE = 16;

// Registers
export const NUM_REGISTERS = 16;
export const NUM_KEYS = 16;

// Timing
export const TIMER_HZ = 60;

// The built-in 4x5 font sprites for hex digits 0-F (80 bytes total)
export const FONT_DATA = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80, // F
]);

/** Fully serializable CPU state for snapshots and network sync. */
export interface CPUState {
  v: Uint8Array;           // 16 general-purpose 8-bit registers
  i: number;               // 16-bit index register
  pc: number;              // 16-bit program counter
  sp: number;              // stack pointer
  stack: Uint16Array;      // 16-level call stack
  delayTimer: number;
  soundTimer: number;
  memory: Uint8Array;      // 4KB RAM
  display: Uint8Array;     // 64x32 pixel buffer (0 or 1 per pixel)
  keyState: Uint8Array;    // 16-key state
  waitingForKey: boolean;
  waitingKeyPhase: 'press' | 'release'; // Fx0A two-phase: wait for press, then wait for release
  waitingKeyValue: number; // key being tracked during release phase
  waitingRegister: number; // which register to store key into
  drawFlag: boolean; // set by DRW/CLS, cleared after render
  halted: boolean;
  activePlayer: number;    // 0 = shared mode, 1-15 = specific player
  syncBarrier: boolean;    // true = CPU is blocked at a SYNC point
}

/** Decoded fields from a 2-byte CHIP-8 opcode. */
export interface DecodedInstruction {
  opcode: number;  // full 16-bit opcode
  nnn: number;     // lowest 12 bits (address)
  kk: number;      // lowest 8 bits (byte constant)
  n: number;       // lowest 4 bits (nibble)
  x: number;       // bits 11-8 (register index)
  y: number;       // bits 7-4 (register index)
}

/** I/O bus combining all backends. */
export interface IOBus {
  display: DisplayBackend;
  audio: AudioBackend;
  input: InputProvider;
  multiplayer?: MultiplayerProvider;
}

/** Abstract display — implemented as memory buffer (tests) or Canvas (browser). */
export interface DisplayBackend {
  clear(): void;
  /** Draw sprite rows at (x,y). Returns true if any pixel was erased (collision). */
  drawSprite(x: number, y: number, sprite: Uint8Array): boolean;
  getBuffer(): Uint8Array;
  render(): void;
}

/** Abstract audio — tracks buzzer on/off. */
export interface AudioBackend {
  start(): void;
  stop(): void;
  isPlaying(): boolean;
}

/** Abstract input — provides key state. */
export interface InputProvider {
  isKeyPressed(key: number): boolean;
  setKeyState(key: number, pressed: boolean): void;
  releaseAll(): void;
}

/** Multiplayer provider for PLAYER/SYNC/SHARED opcodes. */
export interface MultiplayerProvider {
  getPlayerCount(): number;
  getLocalPlayer(): number;
  notifySync(): void;
  isSyncComplete(): boolean;
  getInputForPlayer(player: number): InputProvider;
}
