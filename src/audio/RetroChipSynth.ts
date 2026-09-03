/**
 * Authentic Game Boy DMG & NES hardware oscillator emulation.
 * Features:
 * - Anti-aliased Pulse waves (12.5%, 25%, 50%, 75% duty cycles)
 * - 4-bit Wave RAM stepped periodic waveforms
 * - Cached LFSR noise generator (15-bit white & 7-bit metallic)
 * - Sample-accurate hardware envelope scheduling (zero clicks, zero pops)
 */

export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Generate band-limited periodic wave for Game Boy variable duty cycles
export function createPulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  const n = 32; // 32 harmonics prevents Nyquist aliasing
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  // Fourier series for pulse wave with duty cycle d + Lanczos/Hann window for smooth transitions
  for (let i = 1; i < n; i++) {
    const rawFourier = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    const window = Math.cos((i * Math.PI) / (2 * n)); // Gentle high-frequency rolloff
    imag[i] = rawFourier * window;
  }

  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

// 4-bit Wave RAM samples (Game Boy 32-sample wave table patterns)
const WAVE_RAM_PATTERNS = {
  warm_bass: [
    0, 1, 3, 5, 7, 9, 11, 13, 15, 14, 12, 10, 8, 6, 4, 2,
    0, 0, 1, 2, 4, 6, 8, 10, 12, 14, 15, 13, 11, 8, 4, 1
  ],
  retro_organ: [
    0, 4, 8, 12, 15, 12, 8, 4, 0, 4, 8, 12, 15, 12, 8, 4,
    0, 4, 8, 12, 15, 12, 8, 4, 0, 4, 8, 12, 15, 12, 8, 4
  ],
  saw_step: [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
  ]
};

export function createWaveRamPeriodicWave(ctx: BaseAudioContext, patternName: keyof typeof WAVE_RAM_PATTERNS = 'warm_bass'): PeriodicWave {
  const pattern = WAVE_RAM_PATTERNS[patternName] || WAVE_RAM_PATTERNS.warm_bass;
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  for (let k = 1; k < n; k++) {
    let sumReal = 0;
    let sumImag = 0;
    for (let t = 0; t < 32; t++) {
      const val = (pattern[t] / 7.5) - 1.0;
      const angle = (2 * Math.PI * k * t) / 32;
      sumReal += val * Math.cos(angle);
      sumImag -= val * Math.sin(angle);
    }
    const window = Math.cos((k * Math.PI) / (2 * n));
    real[k] = (sumReal / 32) * window;
    imag[k] = (sumImag / 32) * window;
  }

  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

// Pre-cached LFSR Noise buffers (prevents GC pauses and buffer allocation pops)
let cached15BitNoise: AudioBuffer | null = null;
let cached7BitNoise: AudioBuffer | null = null;

export function getCachedGbNoiseBuffer(ctx: BaseAudioContext, is7Bit: boolean): AudioBuffer {
  if (is7Bit) {
    if (!cached7BitNoise || cached7BitNoise.sampleRate !== ctx.sampleRate) {
      cached7BitNoise = createGbNoiseBuffer(ctx, true, 2.0);
    }
    return cached7BitNoise;
  } else {
    if (!cached15BitNoise || cached15BitNoise.sampleRate !== ctx.sampleRate) {
      cached15BitNoise = createGbNoiseBuffer(ctx, false, 2.0);
    }
    return cached15BitNoise;
  }
}

export function createGbNoiseBuffer(ctx: BaseAudioContext, is7Bit: boolean = false, duration: number = 2.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);

  let lfsr = 0x7FFF;
  const feedbackBit = is7Bit ? 6 : 14;

  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const bit0 = lfsr & 1;
    const bit1 = (lfsr >> 1) & 1;
    const newBit = bit0 ^ bit1;
    
    lfsr = (lfsr >> 1) | (newBit << 14);
    if (is7Bit) {
      lfsr = (lfsr & ~(1 << feedbackBit)) | (newBit << feedbackBit);
    }

    const raw = bit0 ? 0.35 : -0.35; // Scaled to avoid DC spikes
    last = last * 0.9 + raw * 0.1; // Gentle 1-pole lowpass smoothing
    data[i] = last;
  }

  return buffer;
}

export interface ActiveVoice {
  stop: (releaseTime?: number) => void;
  gainNode: GainNode;
}

export function playChipVoice(
  ctx: BaseAudioContext,
  destination: AudioNode,
  midiNote: number,
  params: {
    waveform: 'pulse_12' | 'pulse_25' | 'pulse_50' | 'pulse_75' | 'wave_ram' | 'noise' | 'triangle' | 'sine' | 'sawtooth';
    velocity?: number; // 0.0 - 1.0
    attack?: number; // seconds
    decay?: number; // seconds
    sustain?: number; // 0.0 - 1.0
    release?: number; // seconds
    sweepAmount?: number; // semitone slide
    vibratoDepth?: number;
    vibratoSpeed?: number;
  },
  when: number = ctx.currentTime,
  durationSeconds?: number
): ActiveVoice {
  const freq = midiToFrequency(midiNote);
  // Scale voice volume slightly to maintain healthy summing headroom
  const rawVelocity = params.velocity ?? 0.8;
  const velocity = Math.max(0.01, rawVelocity * 0.65);
  const attack = Math.max(0.003, params.attack ?? 0.01);
  const decay = Math.max(0.01, params.decay ?? 0.1);
  const sustain = Math.min(1.0, Math.max(0.05, params.sustain ?? 0.7));
  const release = Math.max(0.01, params.release ?? 0.15);

  const masterVoiceGain = (ctx as AudioContext).createGain();
  masterVoiceGain.gain.setValueAtTime(0.0001, when);

  let voiceSourceNode: AudioNode;

  if (params.waveform === 'noise') {
    const noiseBuffer = getCachedGbNoiseBuffer(ctx, midiNote > 60);
    const bufferSource = (ctx as AudioContext).createBufferSource();
    bufferSource.buffer = noiseBuffer;
    bufferSource.loop = true;
    bufferSource.playbackRate.value = Math.max(0.2, freq / 440);
    bufferSource.start(when);
    voiceSourceNode = bufferSource;
  } else {
    const osc = (ctx as AudioContext).createOscillator();
    
    if (params.waveform.startsWith('pulse_')) {
      const duty = params.waveform === 'pulse_12' ? 0.125 :
                   params.waveform === 'pulse_25' ? 0.25 :
                   params.waveform === 'pulse_75' ? 0.75 : 0.5;
      osc.setPeriodicWave(createPulseWave(ctx, duty));
    } else if (params.waveform === 'wave_ram') {
      osc.setPeriodicWave(createWaveRamPeriodicWave(ctx, 'warm_bass'));
    } else {
      osc.type = params.waveform as OscillatorType;
    }

    osc.frequency.setValueAtTime(freq, when);

    if (params.sweepAmount && params.sweepAmount !== 0) {
      const targetFreq = midiToFrequency(midiNote + params.sweepAmount);
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq), when + attack + decay);
    }

    if (params.vibratoDepth && params.vibratoDepth > 0) {
      const lfo = (ctx as AudioContext).createOscillator();
      const lfoGain = (ctx as AudioContext).createGain();
      lfo.frequency.value = params.vibratoSpeed ?? 6.0;
      lfoGain.gain.value = freq * (params.vibratoDepth * 0.05);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(when);
    }

    osc.start(when);
    voiceSourceNode = osc;
  }

  voiceSourceNode.connect(masterVoiceGain);
  masterVoiceGain.connect(destination);

  // ADSR Envelope (Click-free linear ramps in strict chronological order)
  if (durationSeconds !== undefined && durationSeconds > 0) {
    const noteEnd = when + durationSeconds;
    const relEnd = noteEnd + release;

    if (durationSeconds <= attack) {
      const peakAtRelease = Math.max(0.0001, velocity * (durationSeconds / attack));
      masterVoiceGain.gain.linearRampToValueAtTime(peakAtRelease, noteEnd);
      masterVoiceGain.gain.linearRampToValueAtTime(0.0001, relEnd);
    } else if (durationSeconds < attack + decay) {
      const decayProgress = (durationSeconds - attack) / decay;
      const levelAtRelease = Math.max(0.0001, velocity * (1.0 - (1.0 - sustain) * decayProgress));
      masterVoiceGain.gain.linearRampToValueAtTime(velocity, when + attack);
      masterVoiceGain.gain.linearRampToValueAtTime(levelAtRelease, noteEnd);
      masterVoiceGain.gain.linearRampToValueAtTime(0.0001, relEnd);
    } else {
      masterVoiceGain.gain.linearRampToValueAtTime(velocity, when + attack);
      masterVoiceGain.gain.linearRampToValueAtTime(velocity * sustain, when + attack + decay);
      masterVoiceGain.gain.setValueAtTime(velocity * sustain, noteEnd);
      masterVoiceGain.gain.linearRampToValueAtTime(0.0001, relEnd);
    }

    if ('stop' in voiceSourceNode && typeof voiceSourceNode.stop === 'function') {
      try {
        voiceSourceNode.stop(relEnd + 0.05);
      } catch {}
    }
  } else {
    // Live interactive keypress (held until noteOff/stop is triggered)
    masterVoiceGain.gain.linearRampToValueAtTime(velocity, when + attack);
    masterVoiceGain.gain.linearRampToValueAtTime(velocity * sustain, when + attack + decay);
  }

  let stopped = false;
  const stop = (releaseTime?: number) => {
    if (stopped) return;
    stopped = true;
    const now = ctx.currentTime;
    const rel = releaseTime !== undefined ? releaseTime : Math.min(0.08, release);
    
    masterVoiceGain.gain.cancelScheduledValues(now);
    masterVoiceGain.gain.setValueAtTime(Math.max(0.0001, masterVoiceGain.gain.value), now);
    masterVoiceGain.gain.linearRampToValueAtTime(0.0001, now + rel);

    if ('stop' in voiceSourceNode && typeof voiceSourceNode.stop === 'function') {
      try {
        voiceSourceNode.stop(now + rel + 0.02);
      } catch {}
    }

    setTimeout(() => {
      try {
        masterVoiceGain.disconnect();
      } catch {}
    }, (rel + 0.05) * 1000);
  };

  return { stop, gainNode: masterVoiceGain };
}
