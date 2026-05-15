import type { Mood, SceneAnalysis } from './types';

type OscNode = { osc: OscillatorNode; gain: GainNode };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private layers: OscNode[] = [];
  private lfo: OscillatorNode | null = null;
  private running = false;

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(3.5, 2.5);
    const revGain = this.ctx.createGain();
    revGain.gain.value = 0.35;
    this.master.connect(this.reverb);
    this.reverb.connect(revGain);
    revGain.connect(this.ctx.destination);
    this.master.connect(this.ctx.destination);
  }

  private makeImpulse(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const len = rate * duration;
    const buf = this.ctx!.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  private moodFreq(mood: Mood): [number, number, number] {
    const map: Record<Mood, [number, number, number]> = {
      serene: [110, 164.81, 220],
      melancholic: [82.41, 123.47, 164.81],
      joyful: [130.81, 196, 261.63],
      mysterious: [73.42, 110, 146.83],
      dramatic: [98, 147, 196],
      ethereal: [87.31, 130.81, 174.61],
    };
    return map[mood];
  }

  start(analysis: SceneAnalysis): void {
    if (!this.ctx || !this.master) return;
    this.stop();
    this.running = true;
    const [f1, f2, f3] = this.moodFreq(analysis.mood);
    const types: OscillatorType[] = ['sine', 'triangle', 'sine'];
    const freqs = [f1, f2, f3];
    const detune = analysis.warmth * 12 - 6;

    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = types[i];
      osc.frequency.value = freq;
      osc.detune.value = detune + i * 3;
      gain.gain.value = 0.04 / (i + 1);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start();
      this.layers.push({ osc, gain });
    });

    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = 0.08 + analysis.saturation * 0.12;
    lfoGain.gain.value = 8;
    this.lfo.connect(lfoGain);
    this.layers[0]?.osc.frequency && lfoGain.connect(this.layers[0].osc.frequency);
    this.lfo.start();

    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(0.22, now + 4);
  }

  stop(): void {
    this.layers.forEach(({ osc, gain }) => {
      try {
        gain.gain.setValueAtTime(gain.gain.value, this.ctx?.currentTime ?? 0);
        gain.gain.linearRampToValueAtTime(0, (this.ctx?.currentTime ?? 0) + 1.5);
        osc.stop((this.ctx?.currentTime ?? 0) + 1.6);
      } catch {
        /* already stopped */
      }
    });
    this.layers = [];
    this.lfo?.stop();
    this.lfo = null;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    }
    this.running = false;
  }

  setVolume(v: number): void {
    if (!this.master || !this.ctx || !this.running) return;
    this.master.gain.linearRampToValueAtTime(v * 0.25, this.ctx.currentTime + 0.3);
  }

  playSpatialChime(x: number, y: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();
    osc.type = 'sine';
    osc.frequency.value = 440 + y * 220;
    pan.pan.value = x * 2 - 1;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.5);
  }

  isRunning(): boolean {
    return this.running;
  }

  async resume(): Promise<void> {
    await this.ctx?.resume();
  }
}

export const audioEngine = new AudioEngine();
