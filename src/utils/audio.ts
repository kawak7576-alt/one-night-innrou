// Web Audio API synthesizer with pop dog sound effects, "デデーン！" shock, and weird synth for Tanner
class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Cute pop click / tap
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  // Cute puppy playful yip / bark
  public playPuppyBark() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dual oscillator bark
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(740, now + 0.04);
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.12);

      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.exponentialRampToValueAtTime(370, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.14);
      osc2.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  // Card Flip Swoosh
  public playCardFlip() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  public playNightBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [261.63, 392.0, 523.25].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch {
      // ignore
    }
  }

  public playMorningChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const start = this.ctx.currentTime + idx * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch {
      // ignore
    }
  }

  public playCountdownTick(pitchMultiplier = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(60 * pitchMultiplier, now + 0.08);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  public playFireCombustion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(180, now + 1.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 1.5);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // ignore
    }
  }

  // --- SPECIAL WEREWOLF "DEDEEEN!" (デデーン) SHOCK SOUND ---
  // Requested: "人狼陣営が勝利したときは、デデーンみたいなおどろおどろしい感じの演出で。"
  public playWerewolfDedeen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. First "DE" (デッ！) - Sudden loud brass impact
      const hit1 = [87.31, 116.54, 138.59, 174.61]; // Low F, Bb, C#, F chord
      hit1.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + 0.18);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      });

      // 2. Second "DEEEEN!!" (デーーーーン！！) at +0.22s - Massive sinister orchestral doom hit
      const strikeTime = now + 0.22;
      const doomChords = [55.0, 73.42, 82.41, 110.0, 155.56]; // Very low A, D, Eb (tritone dissonance!), A, Eb
      doomChords.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, strikeTime);
        osc.frequency.linearRampToValueAtTime(freq * 0.92, strikeTime + 2.2);

        gain.gain.setValueAtTime(0.35, strikeTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 2.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(strikeTime);
        osc.stop(strikeTime + 2.3);
      });

      // Sub bass boom for table-shaking impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(65, strikeTime);
      subOsc.frequency.exponentialRampToValueAtTime(25, strikeTime + 1.2);
      subGain.gain.setValueAtTime(0.55, strikeTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 1.5);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(strikeTime);
      subOsc.stop(strikeTime + 1.6);
    } catch {
      // ignore
    }
  }

  // --- SPECIAL TANNER (吊人) BIZARRE / WEIRD SOUND ---
  // Requested: "吊人陣営が勝利したときは、奇妙な感じの演出でお願い"
  public playTannerWeirdVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Strange wobbly detuned theremin melody
      const weirdNotes = [
        { f: 440, t: 0, d: 0.2 },
        { f: 466.16, t: 0.18, d: 0.25 }, // half-step up
        { f: 415.3, t: 0.4, d: 0.3 },    // half-step down
        { f: 554.37, t: 0.65, d: 0.35 },  // sharp third
        { f: 311.13, t: 0.95, d: 0.7 },   // sudden drop (tritone)
      ];

      weirdNotes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        // Add spooky vibrato
        const startTime = now + n.t;
        osc.frequency.setValueAtTime(n.f, startTime);
        // Wobble frequency
        osc.frequency.linearRampToValueAtTime(n.f * 1.05, startTime + n.d * 0.5);
        osc.frequency.linearRampToValueAtTime(n.f * 0.94, startTime + n.d);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + n.d + 0.05);
      });

      // 2. Comic "booo-womp" / bouncy jaw-harp sound
      const boingOsc = this.ctx.createOscillator();
      const boingGain = this.ctx.createGain();
      boingOsc.type = 'triangle';
      const boingStart = now + 1.2;
      boingOsc.frequency.setValueAtTime(280, boingStart);
      boingOsc.frequency.exponentialRampToValueAtTime(80, boingStart + 0.6);
      boingGain.gain.setValueAtTime(0.3, boingStart);
      boingGain.gain.exponentialRampToValueAtTime(0.001, boingStart + 0.7);
      boingOsc.connect(boingGain);
      boingGain.connect(this.ctx.destination);
      boingOsc.start(boingStart);
      boingOsc.stop(boingStart + 0.75);
    } catch {
      // ignore
    }
  }

  // Villager Victory: Cheerful brass fanfare + puppy bark!
  public playVillagerVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C major bright arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const start = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.85);
      });

      // Follow up with happy puppy bark
      setTimeout(() => {
        this.playPuppyBark();
      }, 700);
    } catch {
      // ignore
    }
  }

  public playVictory(team: 'villager' | 'werewolf' | 'tanner') {
    if (team === 'werewolf') {
      this.playWerewolfDedeen();
    } else if (team === 'tanner') {
      this.playTannerWeirdVictory();
    } else {
      this.playVillagerVictory();
    }
  }
}

export const sound = new SoundController();
