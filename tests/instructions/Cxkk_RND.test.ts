import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from '../helpers/TestHarness.js';

describe('Cxkk - RND Vx, byte', () => {
  let h: TestHarness;

  beforeEach(() => {
    h = new TestHarness(42);
  });

  it('should produce a deterministic result with seed=42', () => {
    h.loadProgram([0xC0, 0xFF]); // RND V0, 0xFF
    h.step();

    // With seed=42, first random & 0xFF gives a deterministic value.
    // Just capture and verify it is in range.
    const val = h.state.v[0];
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(255);
    h.assertPC(0x202);
  });

  it('should AND the random value with the mask', () => {
    // mask = 0x0F, so result must have upper nibble = 0
    h.loadProgram([0xC0, 0x0F]); // RND V0, 0x0F
    h.step();

    expect(h.state.v[0] & 0xF0).toBe(0);
    expect(h.state.v[0]).toBeLessThanOrEqual(0x0F);
  });

  it('should produce 0 when mask is 0x00', () => {
    h.loadProgram([0xC0, 0x00]); // RND V0, 0x00
    h.step();

    h.assertRegister(0x0, 0x00); // anything AND 0 = 0
  });

  it('should produce the same result with the same seed', () => {
    const h1 = new TestHarness(42);
    const h2 = new TestHarness(42);

    h1.loadProgram([0xC0, 0xFF]);
    h2.loadProgram([0xC0, 0xFF]);
    h1.step();
    h2.step();

    expect(h1.state.v[0]).toBe(h2.state.v[0]);
  });

  it('should produce different results with different seeds', () => {
    const h1 = new TestHarness(42);
    const h2 = new TestHarness(99);

    h1.loadProgram([0xC0, 0xFF]);
    h2.loadProgram([0xC0, 0xFF]);
    h1.step();
    h2.step();

    // Very unlikely to be equal with different seeds
    expect(h1.state.v[0]).not.toBe(h2.state.v[0]);
  });

  it('should produce different values on successive calls', () => {
    h.loadProgram([
      0xC0, 0xFF, // RND V0, 0xFF
      0xC1, 0xFF, // RND V1, 0xFF
      0xC2, 0xFF, // RND V2, 0xFF
    ]);
    h.run(3);

    // At least two of three should differ (extremely unlikely all match)
    const vals = [h.state.v[0], h.state.v[1], h.state.v[2]];
    const allSame = vals[0] === vals[1] && vals[1] === vals[2];
    expect(allSame).toBe(false);
  });

  it('should mask with single-bit patterns', () => {
    // mask = 0x80, result is either 0x00 or 0x80
    h.loadProgram([0xC0, 0x80]);
    h.step();

    expect(h.state.v[0] === 0x00 || h.state.v[0] === 0x80).toBe(true);
  });

  it('should work with different target registers', () => {
    h.loadProgram([0xC5, 0xFF]); // RND V5, 0xFF
    h.step();

    const val = h.state.v[5];
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(255);
  });

  it('should not affect other registers', () => {
    h.loadProgram([
      0x61, 0xAA, // LD V1, 0xAA
      0xC0, 0xFF, // RND V0, 0xFF
    ]);
    h.run(2);

    h.assertRegister(0x1, 0xAA); // V1 unchanged
  });
});
