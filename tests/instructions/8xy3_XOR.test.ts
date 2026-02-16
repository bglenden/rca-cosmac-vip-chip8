import { describe, it, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('8xy3 - XOR Vx, Vy', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should XOR Vx with Vy and store in Vx', () => {
    h.state.v[0] = 0xFF;
    h.state.v[1] = 0x0F;
    // XOR V0, V1
    h.loadProgram([0x80, 0x13]);
    h.step();

    h.assertRegister(0, 0xF0);
    h.assertPC(0x202);
  });

  it('should reset VF to 0 (COSMAC VIP quirk)', () => {
    h.state.v[0] = 0xFF;
    h.state.v[1] = 0x0F;
    h.state.v[0xF] = 0x01;
    // XOR V0, V1
    h.loadProgram([0x80, 0x13]);
    h.step();

    h.assertRegister(0xF, 0);
  });

  it('should XOR with zero (identity)', () => {
    h.state.v[2] = 0xAB;
    h.state.v[3] = 0x00;
    // XOR V2, V3
    h.loadProgram([0x82, 0x33]);
    h.step();

    h.assertRegister(2, 0xAB);
    h.assertRegister(0xF, 0);
  });

  it('should XOR with same value (result is zero)', () => {
    h.state.v[4] = 0x55;
    h.state.v[5] = 0x55;
    // XOR V4, V5
    h.loadProgram([0x84, 0x53]);
    h.step();

    h.assertRegister(4, 0x00);
    h.assertRegister(0xF, 0);
  });

  it('should XOR with 0xFF (bitwise NOT)', () => {
    h.state.v[0] = 0xAA;
    h.state.v[1] = 0xFF;
    // XOR V0, V1
    h.loadProgram([0x80, 0x13]);
    h.step();

    h.assertRegister(0, 0x55);
  });

  it('should reset VF even when VF is Vx', () => {
    h.state.v[0xF] = 0xFF;
    h.state.v[1] = 0x0F;
    // XOR VF, V1
    h.loadProgram([0x8F, 0x13]);
    h.step();

    // VF gets XOR result first, then reset to 0
    h.assertRegister(0xF, 0);
  });

  it('should XOR non-overlapping bits', () => {
    h.state.v[0] = 0xAA; // 10101010
    h.state.v[1] = 0x55; // 01010101
    // XOR V0, V1
    h.loadProgram([0x80, 0x13]);
    h.step();

    h.assertRegister(0, 0xFF);
  });

  it('should XOR both zero values', () => {
    h.state.v[0] = 0x00;
    h.state.v[1] = 0x00;
    // XOR V0, V1
    h.loadProgram([0x80, 0x13]);
    h.step();

    h.assertRegister(0, 0x00);
    h.assertRegister(0xF, 0);
  });
});
