import type { SceneAnalysis, SpatialSoundSource } from './types';

interface SpatialNode {
  osc?: OscillatorNode;
  noise?: AudioBufferSourceNode;
  gain: GainNode;
  panner: PannerNode;
}

export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private master: GainNode | null = null;
  private nodes: SpatialNode[] = [];
  private running = false;

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.listener = this.ctx.listener;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  start(analysis: SceneAnalysis): void {
    if (!this.ctx || !this.master) return;
    this.stop();
    this.running = true;

    analysis.spatialSounds.forEach((src) => this.attachSource(src, analysis));

    const [drone] = this.moodDrone(analysis);
    drone.connect(this.master);

    const now = this.ctx.currentTime;
    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(0.35, now + 3);
  }

  private attachSource(src: SpatialSoundSource, analysis: SceneAnalysis): void {
    if (!this.ctx || !this.master) return;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 24;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;

    const x = src.pan * 6;
    const z = -4 - src.depth * 8;
    panner.positionX.value = x;
    panner.positionY.value = 0;
    panner.positionZ.value = z;

    const gain = this.ctx.createGain();
    gain.gain.value = src.type === 'water' ? 0.12 : 0.06;

    if (src.type === 'water') {
      const buffer = this.noiseBuffer(2);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400 + analysis.warmth * 300;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      gain.connect(panner);
      panner.connect(this.master);
      this.nodes.push({ noise, gain, panner });
      return;
    }

    const osc = this.ctx.createOscillator();
    osc.type = src.type === 'pulse' ? 'triangle' : 'sine';
    osc.frequency.value = src.type === 'wind' ? 90 : 220 + src.depth * 80;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    osc.start();
    this.nodes.push({ osc, gain, panner });
  }

  private moodDrone(analysis: SceneAnalysis): [GainNode] {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    const freqs: Record<string, number> = {
      serene: 110,
      melancholic: 73.42,
      joyful: 130.81,
      mysterious: 82.41,
      dramatic: 98,
      ethereal: 87.31,
    };
    osc.type = analysis.mood === 'joyful' ? 'triangle' : 'sine';
    osc.frequency.value = freqs[analysis.mood] ?? 110;
    gain.gain.value = 0.05;
    osc.connect(gain);
    osc.start();
    this.nodes.push({ osc, gain, panner: this.ctx!.createPanner() });
    return [gain];
  }

  private noiseBuffer(seconds: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const len = rate * seconds;
    const buf = this.ctx!.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  updateListener(yawDeg: number, pitchDeg: number): void {
    if (!this.listener || !this.ctx) return;
    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;
    const x = Math.sin(yaw) * Math.cos(pitch);
    const y = Math.sin(pitch);
    const z = -Math.cos(yaw) * Math.cos(pitch);
    if ('forwardX' in this.listener) {
      (this.listener as AudioListener & { forwardX: AudioParam }).forwardX.value = x;
      (this.listener as AudioListener & { forwardY: AudioParam }).forwardY.value = y;
      (this.listener as AudioListener & { forwardZ: AudioParam }).forwardZ.value = z;
      (this.listener as AudioListener & { upX: AudioParam }).upX.value = 0;
      (this.listener as AudioListener & { upY: AudioParam }).upY.value = 1;
      (this.listener as AudioListener & { upZ: AudioParam }).upZ.value = 0;
    }
  }

  stop(): void {
    this.nodes.forEach(({ osc, noise, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, this.ctx?.currentTime ?? 0);
        osc?.stop((this.ctx?.currentTime ?? 0) + 1);
        noise?.stop((this.ctx?.currentTime ?? 0) + 1);
      } catch {
        /* noop */
      }
    });
    this.nodes = [];
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }
    this.running = false;
  }

  playSpatialChime(x: number, y: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.positionX.value = (x - 0.5) * 6;
    panner.positionY.value = (0.5 - y) * 3;
    panner.positionZ.value = -4;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 + y * 220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880 + x * 120, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  async resume(): Promise<void> {
    await this.ctx?.resume();
  }

  isRunning(): boolean {
    return this.running;
  }
}

export const spatialAudio = new SpatialAudioEngine();
