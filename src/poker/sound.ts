// Simple sound system using Web Audio API
class SoundSystem {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  private playTone(freq: number, duration: number, volume: number = 0.1, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number = 0.05) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  cardDeal() {
    this.playNoise(0.08, 0.06);
    setTimeout(() => this.playTone(800, 0.05, 0.03), 30);
  }

  cardFlip() {
    this.playNoise(0.06, 0.04);
  }

  chipPlace() {
    this.playTone(1200, 0.06, 0.04, 'square');
    setTimeout(() => this.playTone(1600, 0.04, 0.03, 'square'), 40);
  }

  chipStack() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playTone(1400 + i * 200, 0.04, 0.03, 'square'), i * 60);
    }
  }

  buttonClick() {
    this.playTone(600, 0.05, 0.05, 'sine');
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2, 0.06, 'sine'), i * 100);
    });
  }

  lose() {
    this.playTone(300, 0.3, 0.04, 'sine');
    setTimeout(() => this.playTone(250, 0.3, 0.03, 'sine'), 150);
  }

  allIn() {
    this.playTone(440, 0.1, 0.06, 'sawtooth');
    setTimeout(() => this.playTone(660, 0.1, 0.06, 'sawtooth'), 80);
    setTimeout(() => this.playTone(880, 0.15, 0.06, 'sawtooth'), 160);
  }

  fold() {
    this.playNoise(0.1, 0.03);
  }
}

export const soundSystem = new SoundSystem();
