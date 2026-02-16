import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy4 - ADD Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should add two registers with no carry', () => {
    // V0 = 0x10, V1 = 0x20, ADD V0, V1
    h.loadProgram([
      0x60, 0x10, // LD V0, 0x10
      0x61, 0x20, // LD V1, 0x20
      0x80, 0x14, // ADD V0, V1
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x30);
    h.assertRegister(0xF, 0); // no carry
    h.assertPC(0x206);
  });

  it('should set VF = 1 when sum exceeds 255', () => {
    // V0 = 0xFF, V1 = 0x02
    h.loadProgram([
      0x60, 0xFF, // LD V0, 0xFF
      0x61, 0x02, // LD V1, 0x02
      0x80, 0x14, // ADD V0, V1
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x01); // (0xFF + 0x02) & 0xFF = 0x01
    h.assertRegister(0xF, 1);    // carry set
  });

  it('should set VF = 0 when sum is exactly 255', () => {
    // V0 = 0xFE, V1 = 0x01
    h.loadProgram([
      0x60, 0xFE,
      0x61, 0x01,
      0x80, 0x14,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xFF);
    h.assertRegister(0xF, 0); // no carry, sum = 255 not > 255
  });

  it('should set VF = 1 when sum is exactly 256', () => {
    // V0 = 0xFF, V1 = 0x01
    h.loadProgram([
      0x60, 0xFF,
      0x61, 0x01,
      0x80, 0x14,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 1);
  });

  it('should handle adding zero', () => {
    h.loadProgram([
      0x60, 0x42,
      0x61, 0x00,
      0x80, 0x14,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x42);
    h.assertRegister(0xF, 0);
  });

  it('should handle both operands being zero', () => {
    h.loadProgram([
      0x60, 0x00,
      0x61, 0x00,
      0x80, 0x14,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0x00);
    h.assertRegister(0xF, 0);
  });

  it('should handle both operands being 0xFF', () => {
    h.loadProgram([
      0x60, 0xFF,
      0x61, 0xFF,
      0x80, 0x14,
    ]);
    h.run(3);

    h.assertRegister(0x0, 0xFE); // (0xFF + 0xFF) & 0xFF = 0x1FE & 0xFF = 0xFE
    h.assertRegister(0xF, 1);
  });

  it('should work with different register pairs', () => {
    // ADD V5, VA
    h.loadProgram([
      0x65, 0x30, // LD V5, 0x30
      0x6A, 0x40, // LD VA, 0x40
      0x85, 0xA4, // ADD V5, VA
    ]);
    h.run(3);

    h.assertRegister(0x5, 0x70);
    h.assertRegister(0xA, 0x40); // Vy unchanged
    h.assertRegister(0xF, 0);
  });

  it('should overwrite VF when Vx is VF', () => {
    // ADD VF, V1 — result goes in VF, but then carry also goes in VF
    h.loadProgram([
      0x6F, 0x10, // LD VF, 0x10
      0x61, 0x05, // LD V1, 0x05
      0x8F, 0x14, // ADD VF, V1
    ]);
    h.run(3);

    // VF should be the carry flag (0), overwriting the sum
    h.assertRegister(0xF, 0);
  });

  it('should overwrite VF with carry when Vx is VF and overflow occurs', () => {
    h.loadProgram([
      0x6F, 0xFF, // LD VF, 0xFF
      0x61, 0x05, // LD V1, 0x05
      0x8F, 0x14, // ADD VF, V1
    ]);
    h.run(3);

    h.assertRegister(0xF, 1); // carry flag overwrites result
  });
});
