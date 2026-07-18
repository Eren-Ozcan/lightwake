import type { RayHit } from './map';

const SPEED = 5; // grid cells per second of echo travel time
const BASE_DELAY = 0.06; // seconds before the first echo can return, so it reads as separate from the dry click
const REVERB_DURATION = 0.9; // seconds
const REVERB_DECAY = 3.2; // higher = shorter, tighter tail

/**
 * Synthesizes the tongue-click and its echoes on a shared AudioContext.
 * No samples: a click is just filtered noise with a fast envelope, and an
 * echo is the same click, delayed, panned, and softened by distance. A
 * shared convolver reverb gives every sound a faint sense of enclosed space
 * without smearing the directional information carried by panning — the
 * reverb send is tapped pre-pan, so the tail itself stays diffuse/centered
 * while the dry, panned signal still carries the direction.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverbSend: GainNode | null = null;

  /** Must be called from a user gesture (tap) before any sound will play. */
  ensureStarted(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx);
    const reverbOutput = ctx.createGain();
    reverbOutput.gain.value = 0.22;

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1;
    this.reverbSend.connect(convolver).connect(reverbOutput).connect(ctx.destination);
  }

  private playClick(time: number, pan: number, volume: number, muffle: number, sendToReverb: boolean): void {
    const ctx = this.ctx!;
    const master = this.master!;

    const duration = 0.05;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 6);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (Math.random() * 0.14 - 0.07); // ±7%, so repeated clicks don't sound identical

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600 * muffle;
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));

    source.connect(filter).connect(gain);
    gain.connect(panner).connect(master);
    if (sendToReverb && this.reverbSend) gain.connect(this.reverbSend);

    source.start(time);
  }

  /** Plays the dry click at t=0 (centered) and schedules panned echoes for each ray hit. */
  emitClick(rayHits: RayHit[]): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;

    this.playClick(now, 0, 1, 1, true);

    for (const hit of rayHits) {
      if (hit.openEnded) continue; // no wall in range = silence in that direction, which is itself information
      const delay = BASE_DELAY + hit.distance / SPEED;
      const pan = hit.relativeAngle / 60;
      const volume = Math.min(0.85, 0.9 / (1 + hit.distance * 0.35));
      const muffle = Math.max(0.25, 1 - hit.distance / 12); // farther walls come back duller
      this.playClick(now + delay, pan, volume, muffle, true);
    }
  }

  /** Low, dull thud for walking into a wall — the one cue that must not depend on haptics. Kept dry and punchy, no reverb. */
  playBump(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Distinct rising chime for checkpoints. */
  playCheckpoint(): void {
    this.playTone([523.25, 659.25, 783.99], 0.09);
  }

  /** Warmer, longer chime for level completion. */
  playComplete(): void {
    this.playTone([392, 523.25, 659.25, 783.99], 0.16);
  }

  private playTone(freqs: number[], gap: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * gap;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.connect(gain).connect(this.master!);
      if (this.reverbSend) gain.connect(this.reverbSend);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }
}

/** A synthetic impulse response: exponentially decaying, decorrelated stereo noise — a cheap, sample-free room tail. */
function createImpulseResponse(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * REVERB_DURATION);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, REVERB_DECAY);
    }
  }
  return impulse;
}
