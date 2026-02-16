import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';
import { PROGRAM_START } from '../../src/core/types.js';

/**
 * Verify the bundled ROM matches the canonical Programmable Spacefighters image
 * tracked by chip8-database and the historic VIP archive filename:
 * "Programmable Spacefighters [Jef Winsor].ch8"
 */
describe('Spacefighters ROM integrity', () => {
  const romPath = resolve(__dirname, '../../roms/spacefighters.ch8');
  const EXPECTED_SHA1 = '726cb39afa7e17725af7fab37d153277d86bff77';
  const EXPECTED_SIZE = 1020;
  let rom: Uint8Array;

  function opcodeAt(addr: number): number {
    const offset = addr - PROGRAM_START;
    return (rom[offset] << 8) | rom[offset + 1];
  }

  it('should match canonical SHA1 and size', () => {
    rom = new Uint8Array(readFileSync(romPath));
    const sha1 = createHash('sha1').update(rom).digest('hex');
    expect(sha1).toBe(EXPECTED_SHA1);
    expect(rom.length).toBe(EXPECTED_SIZE);
  });

  it('should have canonical entry-point instructions', () => {
    rom = new Uint8Array(readFileSync(romPath));
    expect(opcodeAt(0x0200)).toBe(0x611E);
    expect(opcodeAt(0x0202)).toBe(0x620E);
    expect(opcodeAt(0x0204)).toBe(0xA5D5);
    expect(opcodeAt(0x0206)).toBe(0xD123);
  });

  it('should keep key-input opcodes at known addresses', () => {
    rom = new Uint8Array(readFileSync(romPath));
    expect(opcodeAt(0x02B2)).toBe(0xFE0A);
    expect(opcodeAt(0x02DA)).toBe(0xFA0A);
    expect(opcodeAt(0x02FE)).toBe(0xF70A);
    expect(opcodeAt(0x059E)).toBe(0xF30A);
    expect(opcodeAt(0x0500)).toBe(0xA628);
  });

  it('should keep canonical tail data bytes', () => {
    rom = new Uint8Array(readFileSync(romPath));
    expect(Buffer.from(rom.slice(-16)).toString('hex')).toBe(
      '0d0e0c0f0afdfd0003030300fdfdfdd4',
    );
  });
});
