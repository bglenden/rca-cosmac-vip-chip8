import {
  CPUState,
  DecodedInstruction,
  IOBus,
  MEMORY_SIZE,
  PROGRAM_START,
  FONT_START,
  FONT_DATA,
  STACK_SIZE,
  NUM_REGISTERS,
  NUM_KEYS,
  DISPLAY_SIZE,
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
} from './types.js';

/** Simple seeded LCG for deterministic random numbers. */
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = ((this.seed * 1103515245 + 12345) & 0x7fffffff) >>> 0;
    return (this.seed >> 16) & 0xff;
  }
}

export class CPU {
  private state: CPUState;
  private rng: SeededRNG;

  constructor(seed?: number) {
    this.rng = new SeededRNG(seed ?? Date.now());
    this.state = this.createInitialState();
  }

  private createInitialState(): CPUState {
    const memory = new Uint8Array(MEMORY_SIZE);
    memory.set(FONT_DATA, FONT_START);

    return {
      v: new Uint8Array(NUM_REGISTERS),
      i: 0,
      pc: PROGRAM_START,
      sp: 0,
      stack: new Uint16Array(STACK_SIZE),
      delayTimer: 0,
      soundTimer: 0,
      memory,
      display: new Uint8Array(DISPLAY_SIZE),
      keyState: new Uint8Array(NUM_KEYS),
      waitingForKey: false,
      waitingKeyPhase: 'press' as const,
      waitingKeyValue: 0,
      waitingRegister: 0,
      drawFlag: false,
      halted: false,
      activePlayer: 0,
      syncBarrier: false,
    };
  }

  /** Load ROM bytes into memory starting at PROGRAM_START. */
  loadROM(rom: Uint8Array): void {
    if (rom.length > MEMORY_SIZE - PROGRAM_START) {
      throw new Error(`ROM too large: ${rom.length} bytes (max ${MEMORY_SIZE - PROGRAM_START})`);
    }
    this.state.memory.set(rom, PROGRAM_START);
    this.state.pc = PROGRAM_START;
  }

  /** Execute one fetch-decode-execute cycle. */
  cycle(io: IOBus): void {
    if (this.state.halted) return;

    // Check sync barrier before doing anything
    if (this.state.syncBarrier) {
      if (!io.multiplayer || io.multiplayer.isSyncComplete()) {
        this.state.syncBarrier = false;
      } else {
        return; // blocked — wait for all players
      }
    }

    // Resolve input source based on active player
    const inputSource = (this.state.activePlayer > 0 && io.multiplayer)
      ? io.multiplayer.getInputForPlayer(this.state.activePlayer)
      : io.input;

    // Sync key state from input provider
    for (let k = 0; k < NUM_KEYS; k++) {
      this.state.keyState[k] = inputSource.isKeyPressed(k) ? 1 : 0;
    }

    // Handle waiting for key (Fx0A): two-phase press-then-release detection
    if (this.state.waitingForKey) {
      if (this.state.waitingKeyPhase === 'press') {
        for (let k = 0; k < NUM_KEYS; k++) {
          if (this.state.keyState[k] === 1) {
            this.state.waitingKeyValue = k;
            this.state.waitingKeyPhase = 'release';
            break;
          }
        }
      } else {
        // Release phase: wait for the tracked key to be released
        if (this.state.keyState[this.state.waitingKeyValue] === 0) {
          this.state.v[this.state.waitingRegister] = this.state.waitingKeyValue;
          this.state.waitingForKey = false;
        }
      }
      return; // Don't execute any instruction while waiting
    }

    const opcode = this.fetch();
    const instr = this.decode(opcode);
    this.execute(instr, io);
  }

  /** Update delay and sound timers. Call at 60Hz. */
  updateTimers(io: IOBus): void {
    if (this.state.delayTimer > 0) {
      this.state.delayTimer--;
    }

    if (this.state.soundTimer > 0) {
      this.state.soundTimer--;
      if (this.state.soundTimer === 0) {
        io.audio.stop();
      }
    }
  }

  getState(): CPUState {
    return this.state;
  }

  cloneState(): CPUState {
    return {
      v: new Uint8Array(this.state.v),
      i: this.state.i,
      pc: this.state.pc,
      sp: this.state.sp,
      stack: new Uint16Array(this.state.stack),
      delayTimer: this.state.delayTimer,
      soundTimer: this.state.soundTimer,
      memory: new Uint8Array(this.state.memory),
      display: new Uint8Array(this.state.display),
      keyState: new Uint8Array(this.state.keyState),
      waitingForKey: this.state.waitingForKey,
      waitingKeyPhase: this.state.waitingKeyPhase,
      waitingKeyValue: this.state.waitingKeyValue,
      waitingRegister: this.state.waitingRegister,
      drawFlag: this.state.drawFlag,
      halted: this.state.halted,
      activePlayer: this.state.activePlayer,
      syncBarrier: this.state.syncBarrier,
    };
  }

  // ---- Fetch / Decode ----

  private fetch(): number {
    const hi = this.state.memory[this.state.pc];
    const lo = this.state.memory[this.state.pc + 1];
    this.state.pc += 2;
    return (hi << 8) | lo;
  }

  private decode(opcode: number): DecodedInstruction {
    return {
      opcode,
      nnn: opcode & 0x0fff,
      kk: opcode & 0x00ff,
      n: opcode & 0x000f,
      x: (opcode >> 8) & 0x0f,
      y: (opcode >> 4) & 0x0f,
    };
  }

  // ---- Execute ----

  private execute(d: DecodedInstruction, io: IOBus): void {
    const top = (d.opcode >> 12) & 0xf;

    switch (top) {
      case 0x0:
        if (d.opcode === 0x00e0) this.op_CLS(io);
        else if (d.opcode === 0x00ee) this.op_RET();
        else if ((d.opcode & 0xfff0) === 0x00a0) this.op_MULTI_A(d.opcode & 0xf, io);
        else if ((d.opcode & 0xfff0) === 0x00b0) this.op_SHARED();
        // else: 0nnn (SYS) — ignored on modern interpreters
        break;
      case 0x1: this.op_JP(d.nnn); break;
      case 0x2: this.op_CALL(d.nnn); break;
      case 0x3: this.op_SE_Vx_byte(d.x, d.kk); break;
      case 0x4: this.op_SNE_Vx_byte(d.x, d.kk); break;
      case 0x5: this.op_SE_Vx_Vy(d.x, d.y); break;
      case 0x6: this.op_LD_Vx_byte(d.x, d.kk); break;
      case 0x7: this.op_ADD_Vx_byte(d.x, d.kk); break;
      case 0x8: this.execute8(d); break;
      case 0x9: this.op_SNE_Vx_Vy(d.x, d.y); break;
      case 0xa: this.op_LD_I(d.nnn); break;
      case 0xb: this.op_JP_V0(d.nnn); break;
      case 0xc: this.op_RND(d.x, d.kk); break;
      case 0xd: this.op_DRW(d.x, d.y, d.n, io); break;
      case 0xe: this.executeE(d); break;
      case 0xf: this.executeF(d, io); break;
    }
  }

  private execute8(d: DecodedInstruction): void {
    switch (d.n) {
      case 0x0: this.op_LD_Vx_Vy(d.x, d.y); break;
      case 0x1: this.op_OR(d.x, d.y); break;
      case 0x2: this.op_AND(d.x, d.y); break;
      case 0x3: this.op_XOR(d.x, d.y); break;
      case 0x4: this.op_ADD_Vx_Vy(d.x, d.y); break;
      case 0x5: this.op_SUB(d.x, d.y); break;
      case 0x6: this.op_SHR(d.x, d.y); break;
      case 0x7: this.op_SUBN(d.x, d.y); break;
      case 0xe: this.op_SHL(d.x, d.y); break;
    }
  }

  private executeE(d: DecodedInstruction): void {
    switch (d.kk) {
      case 0x9e: this.op_SKP(d.x); break;
      case 0xa1: this.op_SKNP(d.x); break;
    }
  }

  private executeF(d: DecodedInstruction, io: IOBus): void {
    switch (d.kk) {
      case 0x07: this.op_LD_Vx_DT(d.x); break;
      case 0x0a: this.op_LD_Vx_K(d.x); break;
      case 0x15: this.op_LD_DT_Vx(d.x); break;
      case 0x18: this.op_LD_ST_Vx(d.x, io); break;
      case 0x1e: this.op_ADD_I_Vx(d.x); break;
      case 0x29: this.op_LD_F_Vx(d.x); break;
      case 0x33: this.op_LD_B_Vx(d.x); break;
      case 0x55: this.op_LD_I_Vx(d.x); break;
      case 0x65: this.op_LD_Vx_I(d.x); break;
    }
  }

  // ---- Instruction implementations ----

  /** 00E0 - Clear the display. */
  private op_CLS(io: IOBus): void {
    this.state.display.fill(0);
    io.display.clear();
    this.state.drawFlag = true;
  }

  /** 00EE - Return from subroutine. */
  private op_RET(): void {
    if (this.state.sp === 0) { this.state.halted = true; return; }
    this.state.sp--;
    this.state.pc = this.state.stack[this.state.sp];
  }

  /** 00Ax - SYNC (n=0) or PLAYER n (n=1-F). */
  private op_MULTI_A(n: number, io: IOBus): void {
    if (n === 0) {
      // SYNC barrier
      this.state.syncBarrier = true;
      if (io.multiplayer) {
        io.multiplayer.notifySync();
      }
      // In single-player (no multiplayer provider), syncBarrier clears next cycle
    } else {
      // PLAYER n
      this.state.activePlayer = n;
    }
  }

  /** 00B0 - Return to shared mode. */
  private op_SHARED(): void {
    this.state.activePlayer = 0;
  }

  /** 1nnn - Jump to address nnn. */
  private op_JP(addr: number): void {
    this.state.pc = addr;
  }

  /** 2nnn - Call subroutine at nnn. */
  private op_CALL(addr: number): void {
    if (this.state.sp >= STACK_SIZE) { this.state.halted = true; return; }
    this.state.stack[this.state.sp] = this.state.pc;
    this.state.sp++;
    this.state.pc = addr;
  }

  /** 3xkk - Skip next instruction if Vx == kk. */
  private op_SE_Vx_byte(x: number, kk: number): void {
    if (this.state.v[x] === kk) {
      this.state.pc += 2;
    }
  }

  /** 4xkk - Skip next instruction if Vx != kk. */
  private op_SNE_Vx_byte(x: number, kk: number): void {
    if (this.state.v[x] !== kk) {
      this.state.pc += 2;
    }
  }

  /** 5xy0 - Skip next instruction if Vx == Vy. */
  private op_SE_Vx_Vy(x: number, y: number): void {
    if (this.state.v[x] === this.state.v[y]) {
      this.state.pc += 2;
    }
  }

  /** 6xkk - Set Vx = kk. */
  private op_LD_Vx_byte(x: number, kk: number): void {
    this.state.v[x] = kk;
  }

  /** 7xkk - Set Vx = Vx + kk (no carry flag). */
  private op_ADD_Vx_byte(x: number, kk: number): void {
    this.state.v[x] = (this.state.v[x] + kk) & 0xff;
  }

  /** 8xy0 - Set Vx = Vy. */
  private op_LD_Vx_Vy(x: number, y: number): void {
    this.state.v[x] = this.state.v[y];
  }

  /** 8xy1 - Set Vx = Vx OR Vy. VF is reset (COSMAC VIP behavior). */
  private op_OR(x: number, y: number): void {
    this.state.v[x] |= this.state.v[y];
    this.state.v[0xf] = 0;
  }

  /** 8xy2 - Set Vx = Vx AND Vy. VF is reset (COSMAC VIP behavior). */
  private op_AND(x: number, y: number): void {
    this.state.v[x] &= this.state.v[y];
    this.state.v[0xf] = 0;
  }

  /** 8xy3 - Set Vx = Vx XOR Vy. VF is reset (COSMAC VIP behavior). */
  private op_XOR(x: number, y: number): void {
    this.state.v[x] ^= this.state.v[y];
    this.state.v[0xf] = 0;
  }

  /** 8xy4 - Set Vx = Vx + Vy, VF = carry. */
  private op_ADD_Vx_Vy(x: number, y: number): void {
    const sum = this.state.v[x] + this.state.v[y];
    this.state.v[x] = sum & 0xff;
    this.state.v[0xf] = sum > 0xff ? 1 : 0;
  }

  /** 8xy5 - Set Vx = Vx - Vy, VF = NOT borrow. */
  private op_SUB(x: number, y: number): void {
    const vx = this.state.v[x];
    const vy = this.state.v[y];
    this.state.v[x] = (vx - vy) & 0xff;
    this.state.v[0xf] = vx >= vy ? 1 : 0;
  }

  /** 8xy6 - Shift Vx right. VF = bit shifted out. Uses Vy (COSMAC VIP behavior). */
  private op_SHR(x: number, y: number): void {
    const val = this.state.v[y];
    this.state.v[x] = val >> 1;
    this.state.v[0xf] = val & 1;
  }

  /** 8xy7 - Set Vx = Vy - Vx, VF = NOT borrow. */
  private op_SUBN(x: number, y: number): void {
    const vx = this.state.v[x];
    const vy = this.state.v[y];
    this.state.v[x] = (vy - vx) & 0xff;
    this.state.v[0xf] = vy >= vx ? 1 : 0;
  }

  /** 8xyE - Shift Vx left. VF = bit shifted out. Uses Vy (COSMAC VIP behavior). */
  private op_SHL(x: number, y: number): void {
    const val = this.state.v[y];
    this.state.v[x] = (val << 1) & 0xff;
    this.state.v[0xf] = (val >> 7) & 1;
  }

  /** 9xy0 - Skip next instruction if Vx != Vy. */
  private op_SNE_Vx_Vy(x: number, y: number): void {
    if (this.state.v[x] !== this.state.v[y]) {
      this.state.pc += 2;
    }
  }

  /** Annn - Set I = nnn. */
  private op_LD_I(addr: number): void {
    this.state.i = addr;
  }

  /** Bnnn - Jump to nnn + V0. */
  private op_JP_V0(addr: number): void {
    this.state.pc = (addr + this.state.v[0]) & 0xfff;
  }

  /** Cxkk - Set Vx = random byte AND kk. */
  private op_RND(x: number, kk: number): void {
    this.state.v[x] = this.rng.next() & kk;
  }

  /** Dxyn - Draw sprite at (Vx, Vy) with height n. VF = collision. */
  private op_DRW(x: number, y: number, n: number, io: IOBus): void {
    const xPos = this.state.v[x] % DISPLAY_WIDTH;
    const yPos = this.state.v[y] % DISPLAY_HEIGHT;
    this.state.v[0xf] = 0;

    for (let row = 0; row < n; row++) {
      const py = yPos + row;
      if (py >= DISPLAY_HEIGHT) break; // clip at bottom (COSMAC VIP behavior)

      const spriteByte = this.state.memory[this.state.i + row];

      for (let col = 0; col < 8; col++) {
        const px = xPos + col;
        if (px >= DISPLAY_WIDTH) break; // clip at right

        const spritePixel = (spriteByte >> (7 - col)) & 1;
        if (spritePixel === 1) {
          const idx = py * DISPLAY_WIDTH + px;
          if (this.state.display[idx] === 1) {
            this.state.v[0xf] = 1;
          }
          this.state.display[idx] ^= 1;
        }
      }
    }

    // Sync CPU display to backend buffer (rendering deferred to caller)
    io.display.getBuffer().set(this.state.display);
    this.state.drawFlag = true;
  }

  /** Ex9E - Skip if key Vx is pressed. */
  private op_SKP(x: number): void {
    if (this.state.keyState[this.state.v[x]] === 1) {
      this.state.pc += 2;
    }
  }

  /** ExA1 - Skip if key Vx is NOT pressed. */
  private op_SKNP(x: number): void {
    if (this.state.keyState[this.state.v[x]] !== 1) {
      this.state.pc += 2;
    }
  }

  /** Fx07 - Set Vx = delay timer. */
  private op_LD_Vx_DT(x: number): void {
    this.state.v[x] = this.state.delayTimer;
  }

  /** Fx0A - Wait for key press then release, store in Vx (COSMAC VIP behavior). */
  private op_LD_Vx_K(x: number): void {
    this.state.waitingForKey = true;
    this.state.waitingKeyPhase = 'press';
    this.state.waitingRegister = x;
  }

  /** Fx15 - Set delay timer = Vx. */
  private op_LD_DT_Vx(x: number): void {
    this.state.delayTimer = this.state.v[x];
  }

  /** Fx18 - Set sound timer = Vx. */
  private op_LD_ST_Vx(x: number, io: IOBus): void {
    this.state.soundTimer = this.state.v[x];
    if (this.state.soundTimer > 0) {
      io.audio.start();
    }
  }

  /** Fx1E - Set I = I + Vx. */
  private op_ADD_I_Vx(x: number): void {
    this.state.i = (this.state.i + this.state.v[x]) & 0xfff;
  }

  /** Fx29 - Set I = location of font sprite for digit Vx. */
  private op_LD_F_Vx(x: number): void {
    this.state.i = FONT_START + (this.state.v[x] & 0xf) * 5;
  }

  /** Fx33 - Store BCD representation of Vx at I, I+1, I+2. */
  private op_LD_B_Vx(x: number): void {
    const val = this.state.v[x];
    this.state.memory[this.state.i] = Math.floor(val / 100);
    this.state.memory[this.state.i + 1] = Math.floor((val % 100) / 10);
    this.state.memory[this.state.i + 2] = val % 10;
  }

  /** Fx55 - Store V0 through Vx in memory starting at I. I is incremented (COSMAC VIP). */
  private op_LD_I_Vx(x: number): void {
    for (let r = 0; r <= x; r++) {
      this.state.memory[this.state.i] = this.state.v[r];
      this.state.i++;
    }
  }

  /** Fx65 - Load V0 through Vx from memory starting at I. I is incremented (COSMAC VIP). */
  private op_LD_Vx_I(x: number): void {
    for (let r = 0; r <= x; r++) {
      this.state.v[r] = this.state.memory[this.state.i];
      this.state.i++;
    }
  }
}
