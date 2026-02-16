import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy6 - SHR Vx, Vy (COSMAC VIP)', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should shift Vy right by 1 and store in Vx, VF = 0 when LSB is 0', () => {
    h.loadProgram([
      0x61, 0x04, // LD V1, 0x04 (0000_0100)
      0x80, 0x16, // SHR V0, V1 — shifts V1, stores in V0
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x02); // 0x04 >> 1 = 0x02
    h.assertRegister(0xF, 0);    // LSB of 0x04 is 0
  });

  it('should set VF = 1 when LSB of Vy is 1', () => {
    h.loadProgram([
      0x61, 0x05, // LD V1, 0x05 (0000_0101)
      0x80, 0x16, // SHR V0, V1
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x02); // 0x05 >> 1 = 0x02
    h.assertRegister(0xF, 1);    // LSB of 0x05 is 1
  });

  it('should use Vy as source (COSMAC VIP quirk), not Vx', () => {
    h.loadProgram([
      0x60, 0xFF, // LD V0, 0xFF (this value should be ignored)
      0x61, 0x08, // LD V1, 0x08
      0x80, 0x16, // SHR V0, V1 — source is V1, not V0
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x04); // 0x08 >> 1 = 0x04, NOT 0xFF >> 1
    h.assertRegister(0xF, 0);
  });

  it('should handle shifting 0x01', () => {
    h.loadProgram([
      0x61, 0x01, // LD V1, 0x01
      0x80, 0x16, // SHR V0, V1
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x00); // 0x01 >> 1 = 0x00
    h.assertRegister(0xF, 1);    // LSB is 1
  });

  it('should handle shifting zero', () => {
    h.loadProgram([
      0x61, 0x00,
      0x80, 0x16,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 0);
  });

  it('should handle shifting 0xFF', () => {
    h.loadProgram([
      0x61, 0xFF,
      0x80, 0x16,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x7F); // 0xFF >> 1 = 0x7F
    h.assertRegister(0xF, 1);    // LSB of 0xFF is 1
  });

  it('should handle shifting 0x80', () => {
    h.loadProgram([
      0x61, 0x80, // 1000_0000
      0x80, 0x16,
    ]);
    h.run(2);

    h.assertRegister(0x0, 0x40); // 0x80 >> 1 = 0x40
    h.assertRegister(0xF, 0);    // LSB is 0
  });

  it('should not modify Vy', () => {
    h.loadProgram([
      0x62, 0xAB, // LD V2, 0xAB
      0x83, 0x26, // SHR V3, V2
    ]);
    h.run(2);

    h.assertRegister(0x2, 0xAB); // V2 unchanged
    h.assertRegister(0x3, 0x55); // 0xAB >> 1 = 0x55
    h.assertRegister(0xF, 1);    // LSB of 0xAB is 1
  });

  it('should work when x == y (shift Vx by itself)', () => {
    h.loadProgram([
      0x62, 0x06, // LD V2, 0x06
      0x82, 0x26, // SHR V2, V2
    ]);
    h.run(2);

    h.assertRegister(0x2, 0x03); // 0x06 >> 1 = 0x03
    h.assertRegister(0xF, 0);
  });
});
