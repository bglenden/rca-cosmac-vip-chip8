import { InputProvider } from '../core/types.js';

export class MockInput implements InputProvider {
  private keys = new Uint8Array(16);

  isKeyPressed(key: number): boolean {
    return this.keys[key] === 1;
  }

  setKeyState(key: number, pressed: boolean): void {
    this.keys[key] = pressed ? 1 : 0;
  }

  pressKey(key: number): void {
    this.setKeyState(key, true);
  }

  releaseKey(key: number): void {
    this.setKeyState(key, false);
  }

  releaseAll(): void {
    this.keys.fill(0);
  }
}
