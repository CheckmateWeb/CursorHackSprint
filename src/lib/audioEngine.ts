import type { Mood, SceneAnalysis } from './types';

type OscNode = { osc: OscillatorNode; gain: GainNode };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private layers: OscNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfo2: OscillatorNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private envGain: GainNode | null = null;
  private running = false;
  private currentAnalysis: SceneAnalysis | null = null;

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

  private startNoiseTexture(analysis: SceneAnalysis): void {
    if (!this.ctx || !this.master) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = noiseBuffer;
    this.noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400 + analysis.brightness * 800;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0.012 + analysis.saturation * 0.01;

    this.noise.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(this.master);
    this.noise.start();
  }

  private startEnvironmentalLoop(analysis: SceneAnalysis): void {
    if (!this.ctx || !this.master) return;
    this.envGain = this.ctx.createGain();
    this.envGain.gain.value = 0;
    this.envGain.connect(this.master);

    const { weather, mood } = analysis;
    let target = 0;
    let freq = 55;

    if (weather === 'rain') {
      target = 0.04;
      freq = 48;
    } else if (mood === 'mysterious') {
      target = 0.03;
      freq = 42;
    } else if (weather === 'dream') {
      target = 0.02;
      freq = 38;
    }

    if (target <= 0) return;

    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = freq;
    droneGain.gain.value = target;
    drone.connect(droneGain);
    droneGain.connect(this.envGain!);
    drone.start();

    const now = this.ctx.currentTime;
    this.envGain.gain.setValueAtTime(0, now);
    this.envGain.gain.linearRampToValueAtTime(1, now + 3);

    this.layers.push({
      osc: drone,
      gain: droneGain,
    });
  }

  start(analysis: SceneAnalysis): void {
    if (!this.ctx || !this.master) return;
    this.stop();
    this.running = true;
    this.currentAnalysis = analysis;

    const [f1, f2, f3] = this.moodFreq(analysis.mood);
    const types: OscillatorType[] = ['sine', 'triangle', 'sine'];
    const freqs = [f1, f2, f3];
    const detune = analysis.warmth * 14 - 7;

    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = types[i];
      osc.frequency.value = freq;
      osc.detune.value = detune + i * 4;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start();
      const now = this.ctx!.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.045 / (i + 1), now + 3.5);
      this.layers.push({ osc, gain });
    });

    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = 0.06 + analysis.saturation * 0.14;
    lfoGain.gain.value = 6;
    this.lfo.connect(lfoGain);
    if (this.layers[0]) lfoGain.connect(this.layers[0].osc.frequency);
    this.lfo.start();

    this.lfo2 = this.ctx.createOscillator();
    const lfo2Gain = this.ctx.createGain();
    this.lfo2.frequency.value = 0.03;
    lfo2Gain.gain.value = 0.015;
    this.lfo2.connect(lfo2Gain);
    lfo2Gain.connect(this.master.gain);
    this.lfo2.start();

    this.startNoiseTexture(analysis);
    this.startEnvironmentalLoop(analysis);

    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(0.24, now + 4);
  }

  stop(): void {
    const end = (this.ctx?.currentTime ?? 0) + 1.8;
    this.layers.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(this.ctx?.currentTime ?? 0);
        gain.gain.setValueAtTime(gain.gain.value, this.ctx?.currentTime ?? 0);
        gain.gain.linearRampToValueAtTime(0, end);
        osc.stop(end + 0.05);
      } catch {
        /* already stopped */
      }
    });
    this.layers = [];

    try {
      this.noiseGain?.gain.linearRampToValueAtTime(0, (this.ctx?.currentTime ?? 0) + 1.5);
      this.noise?.stop(end);
    } catch {
      /* noop */
    }
    this.noise = null;
    this.noiseGain = null;

    try {
      this.lfo?.stop();
      this.lfo2?.stop();
    } catch {
      /* noop */
    }
    this.lfo = null;
    this.lfo2 = null;

    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, end);
    }
    this.running = false;
    this.currentAnalysis = null;
  }

  setVolume(v: number): void {
    if (!this.master || !this.ctx || !this.running) return;
    this.master.gain.linearRampToValueAtTime(v * 0.25, this.ctx.currentTime + 0.3);
  }

  playSpatialChime(x: number, y: number, depth = 0.5, colorHue = 0.5): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();
    osc.type = 'sine';
    const baseFreq = 380 + (1 - depth) * 180 + colorHue * 120;
    osc.frequency.value = baseFreq + y * 80;
    pan.pan.value = x * 2 - 1;
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.master);
    osc.start(now);
    osc.stop(now + 2.3);
  }

  isRunning(): boolean {
    return this.running;
  }

  async resume(): Promise<void> {
    await this.ctx?.resume();
  }

  getAnalysis(): SceneAnalysis | null {
    return this.currentAnalysis;
  }
}

export const audioEngine = new AudioEngine();
