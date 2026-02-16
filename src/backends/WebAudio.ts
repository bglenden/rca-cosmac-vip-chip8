import { AudioBackend } from '../core/types.js';

export class WebAudio implements AudioBackend {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private playing = false;

  private ensureContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
      this.gain = this.audioCtx.createGain();
      this.gain.gain.value = 0.1;
      this.gain.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }

  start(): void {
    if (this.playing) return;
    const ctx = this.ensureContext();
    this.oscillator = ctx.createOscillator();
    this.oscillator.type = 'square';
    this.oscillator.frequency.value = 440;
    this.oscillator.connect(this.gain!);
    this.oscillator.start();
    this.playing = true;
  }

  stop(): void {
    if (!this.playing || !this.oscillator) return;
    this.oscillator.stop();
    this.oscillator.disconnect();
    this.oscillator = null;
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }
}
