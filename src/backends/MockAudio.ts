import { AudioBackend } from '../core/types.js';

export class MockAudio implements AudioBackend {
  private playing = false;

  start(): void {
    this.playing = true;
  }

  stop(): void {
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }
}
