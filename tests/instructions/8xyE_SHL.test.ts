import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xyE - SHL Vx, Vy (COSMAC VIP)', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should shift Vy left by 1 and store in Vx, VF = 0 when MSB is 0', () => {
    h.loadProgram([
      0x61, 0x04, // LD V1, 0x04 (0000_0100)
      0x80, 0x1E, // SHL V0, V1
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x08); // 0x04 << 1 = 0x08
    h.assertRegister(0xF, 0);    // MSB of 0x04 is 0
  });

  it('should set VF = 1 when MSB of Vy is 1', () => {
    h.loadProgram([
      0x61, 0x80, // LD V1, 0x80 (1000_0000)
      0x80, 0x1E, // SHL V0, V1
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x00); // 0x80 << 1 = 0x100 & 0xFF = 0x00
    h.assertRegister(0xF, 1);    // MSB of 0x80 is 1
  });

  it('should use Vy as source (COSMAC VIP quirk), not Vx', () => {
    h.loadProgram([
      0x60, 0x80, // LD V0, 0x80 (this should be ignored as source)
      0x61, 0x04, // LD V1, 0x04
      0x80, 0x1E, // SHL V0, V1 — source is V1
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x08); // 0x04 << 1, NOT 0x80 << 1
    h.assertRegister(0xF, 0);
  });

  it('should handle shifting 0xFF', () => {
    h.loadProgram([
      0x61, 0xFF,
      0x80, 0x1E,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0xFE); // 0xFF << 1 = 0x1FE & 0xFF = 0xFE
    h.assertRegister(0xF, 1);    // MSB of 0xFF is 1
  });

  it('should handle shifting zero', () => {
    h.loadProgram([
      0x61, 0x00,
      0x80, 0x1E,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 0);
  });

  it('should handle shifting 0x01', () => {
    h.loadProgram([
      0x61, 0x01,
      0x80, 0x1E,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x02);
    h.assertRegister(0xF, 0);
  });

  it('should handle shifting 0x40 (MSB is 0)', () => {
    h.loadProgram([
      0x61, 0x40, // 0100_0000
      0x80, 0x1E,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x80);
    h.assertRegister(0xF, 0);
  });

  it('should handle shifting 0xC0 (MSB is 1)', () => {
    h.loadProgram([
      0x61, 0xC0, // 1100_0000
      0x80, 0x1E,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x80); // 0xC0 << 1 = 0x180 & 0xFF = 0x80
    h.assertRegister(0xF, 1);
  });

  it('should not modify Vy', () => {
    h.loadProgram([
      0x62, 0x55, // LD V2, 0x55
      0x83, 0x2E, // SHL V3, V2
    ]);
    h.run(2);

    h.assertRegister(0x2, 0x55); // V2 unchanged
    h.assertRegister(0x3, 0xAA); // 0x55 << 1 = 0xAA
    h.assertRegister(0xF, 0);
  });

  it('should work when x == y (shift Vx by itself)', () => {
    h.loadProgram([
      0x62, 0x03, // LD V2, 0x03
      0x82, 0x2E, // SHL V2, V2
    ]);
    h.run(2);

    h.assertRegister(0x2, 0x06);
    h.assertRegister(0xF, 0);
  });
});
