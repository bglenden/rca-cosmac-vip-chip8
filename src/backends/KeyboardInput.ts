import { InputProvider } from '../core/types.js';

/**
 * Maps QWERTY keyboard keys to CHIP-8 hex keypad.
 *
 * CHIP-8 keypad:     Keyboard mapping:
 *  1 2 3 C            1 2 3 4
 *  4 5 6 D            Q W E R
 *  7 8 9 E            A S D F
 *  A 0 B F            Z X C V
 */
const KEY_MAP: Record<string, number> = {
  '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
  'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
  'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
  'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF,
};

export class KeyboardInput implements InputProvider {
  private physicalKeys = new Uint8Array(16);
  private virtualKeys = new Uint8Array(16);

  constructor() {
    document.addEventListener('keydown', (e) => {
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key !== undefined) {
        this.physicalKeys[key] = 1;
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key !== undefined) {
        this.physicalKeys[key] = 0;
        e.preventDefault();
      }
    });
  }

  isKeyPressed(key: number): boolean {
    return this.physicalKeys[key] === 1 || this.virtualKeys[key] === 1;
  }

  setKeyState(key: number, pressed: boolean): void {
    this.virtualKeys[key] = pressed ? 1 : 0;
  }

  releaseAll(): void {
    this.physicalKeys.fill(0);
    this.virtualKeys.fill(0);
  }
}
