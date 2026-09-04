/**
 * High-performance SoundFont & Sample Manager
 * Supports:
 * - Built-in sampled / physically-modeled retro instrument banks (Grand Piano, Strings, Slap Bass, Brass, Guitar, Drums)
 * - Drag-and-drop loading for user .sf2 SoundFonts and WAV samples
 * - Polyphonic key mapping and voice lifecycle management
 */

import { midiToFrequency } from './RetroChipSynth';
import { SoundFontParser, ParsedSoundFontPreset, ParsedSampleZone } from './SoundFontParser';

export interface SoundFontPreset {
  id: string;
  name: string;
  category: 'keys' | 'strings' | 'brass' | 'bass' | 'lead' | 'drums' | 'custom';
}

export function createHarmonicPeriodicWave(ctx: BaseAudioContext, presetId: string): PeriodicWave {
  let harmonics: number[] = [1.0, 0.5, 0.25, 0.12];
  switch (presetId) {
    case 'gm_grand_piano':
      harmonics = [1.0, 0.6, 0.4, 0.25, 0.15, 0.08, 0.04];
      break;
    case 'gm_romantic_strings':
      harmonics = [1.0, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
      break;
    case 'gm_slap_bass':
      harmonics = [1.2, 0.9, 0.8, 0.3, 0.1];
      break;
    case 'gm_bright_brass':
      harmonics = [1.0, 0.9, 0.8, 0.7, 0.5, 0.3, 0.2, 0.1];
      break;
    case 'gm_overdrive_guitar':
      harmonics = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65];
      break;
    case 'gm_retro_choir':
      harmonics = [1.0, 0.3, 0.6, 0.2, 0.4, 0.1];
      break;
  }
  const real = new Float32Array(harmonics.length + 1);
  const imag = new Float32Array(harmonics.length + 1);
  for (let i = 0; i < harmonics.length; i++) {
    imag[i + 1] = harmonics[i];
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

export class SoundFontManager {
  private ctx: BaseAudioContext;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private loadedSoundFonts: Map<string, ArrayBuffer> = new Map();
  private activeVoices: Set<{ stop: (rel?: number) => void }> = new Set();

  public static customPresetsMap: Map<string, ParsedSoundFontPreset> = new Map();
  private presetChangeCallbacks: Set<() => void> = new Set();

  // Built-in instrument definitions
  public readonly defaultPresets: SoundFontPreset[] = [
    { id: 'gm_grand_piano', name: '🎹 GBA Grand Piano', category: 'keys' },
    { id: 'gm_romantic_strings', name: '🎻 Touhou Romantic Strings', category: 'strings' },
    { id: 'gm_slap_bass', name: '🎸 Funk Slap Bass', category: 'bass' },
    { id: 'gm_bright_brass', name: '🎺 Toby Fox Bright Brass', category: 'brass' },
    { id: 'gm_overdrive_guitar', name: '⚡ Megalovania Lead Guitar', category: 'lead' },
    { id: 'gm_retro_choir', name: '✨ 16-Bit Aahs Choir', category: 'strings' },
    { id: 'gm_gba_percussion', name: '🥁 Retro 90s Drum Kit', category: 'drums' },
  ];

  public stopAllVoices() {
    this.activeVoices.forEach(v => {
      try {
        v.stop(0.02);
      } catch {}
    });
    this.activeVoices.clear();
  }

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.initializeDefaultTimbres();
  }

  // Pre-bake high quality short sample waveforms for zero-lag instant playback
  private initializeDefaultTimbres() {
    // Generate percussion samples (Kick, Snare, Hi-hat, Tom)
    this.generateDrumSamples();
  }

  private generateDrumSamples() {
    const rate = this.ctx.sampleRate;

    // Kick: 150Hz -> 30Hz exponential pitch drop
    const kickBuf = this.ctx.createBuffer(1, rate * 0.35, rate);
    const kickData = kickBuf.getChannelData(0);
    for (let i = 0; i < kickData.length; i++) {
      const t = i / rate;
      const freq = 160 * Math.exp(-t * 18);
      const amp = Math.exp(-t * 9);
      // Soft-clipped sine punch
      const raw = Math.sin(2 * Math.PI * freq * t);
      kickData[i] = Math.tanh(raw * 2.2) * amp;
    }
    this.sampleBuffers.set('drum_kick', kickBuf);

    // Snare: Bandpassed noise + 220Hz tone
    const snareBuf = this.ctx.createBuffer(1, rate * 0.28, rate);
    const snareData = snareBuf.getChannelData(0);
    for (let i = 0; i < snareData.length; i++) {
      const t = i / rate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14);
      const tone = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 18);
      snareData[i] = (noise * 0.75 + tone * 0.35);
    }
    this.sampleBuffers.set('drum_snare', snareBuf);

    // Hi-Hat: Crisp highpassed metallic noise
    const hatBuf = this.ctx.createBuffer(1, rate * 0.12, rate);
    const hatData = hatBuf.getChannelData(0);
    for (let i = 0; i < hatData.length; i++) {
      const t = i / rate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 35);
      hatData[i] = noise * 0.55;
    }
    this.sampleBuffers.set('drum_hihat', hatBuf);
  }

  /**
   * Triggers a SoundFont or multi-sample note
   */
  public playNote(
    destination: AudioNode,
    midiNote: number,
    presetId: string,
    velocity: number = 0.8,
    when: number = this.ctx.currentTime,
    durationSeconds?: number
  ): { stop: (rel?: number) => void } {
    const vel = Math.max(0.01, Math.min(1.0, velocity * 0.65));

    let voice: { stop: (rel?: number) => void };
    if (SoundFontManager.customPresetsMap.has(presetId)) {
      voice = this.playCustomSampleVoice(destination, midiNote, presetId, vel, when, durationSeconds);
    } else if (presetId === 'gm_gba_percussion') {
      voice = this.playDrumNote(destination, midiNote, vel, when);
    } else {
      // Melodic soundfont voice synthesis using multi-harmonic acoustic wavetables
      voice = this.playHarmonicSampleVoice(destination, midiNote, presetId, vel, when, durationSeconds);
    }

    const trackedVoice = {
      stop: (rel?: number) => {
        this.activeVoices.delete(trackedVoice);
        voice.stop(rel);
      }
    };
    this.activeVoices.add(trackedVoice);
    return trackedVoice;
  }

  private playDrumNote(
    destination: AudioNode,
    midiNote: number,
    velocity: number,
    when: number
  ): { stop: () => void } {
    let buf = this.sampleBuffers.get('drum_kick');
    // Standard GM Drum map: 35/36 = Kick, 38/40 = Snare, 42/44/46 = Hats
    if (midiNote === 38 || midiNote === 40) {
      buf = this.sampleBuffers.get('drum_snare');
    } else if (midiNote >= 42 && midiNote <= 46) {
      buf = this.sampleBuffers.get('drum_hihat');
    }

    if (!buf) {
      return { stop: () => {} };
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, when);
    src.connect(gain);
    gain.connect(destination);
    src.start(when);

    return {
      stop: () => {
        try {
          src.stop();
        } catch {}
      }
    };
  }

  private playHarmonicSampleVoice(
    destination: AudioNode,
    midiNote: number,
    presetId: string,
    velocity: number,
    when: number,
    durationSeconds?: number
  ): { stop: (rel?: number) => void } {
    const freq = midiToFrequency(midiNote);
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, when);

    let attack = 0.015;
    let decay = 0.3;
    let sustain = 0.6;
    let release = 0.2;

    switch (presetId) {
      case 'gm_grand_piano':
        attack = 0.008;
        decay = 1.2;
        sustain = 0.2;
        release = 0.25;
        break;
      case 'gm_romantic_strings':
        attack = 0.08;
        decay = 0.4;
        sustain = 0.85;
        release = 0.35;
        break;
      case 'gm_slap_bass':
        attack = 0.005;
        decay = 0.25;
        sustain = 0.4;
        release = 0.15;
        break;
      case 'gm_bright_brass':
        attack = 0.035;
        decay = 0.3;
        sustain = 0.75;
        release = 0.2;
        break;
      case 'gm_overdrive_guitar':
        attack = 0.01;
        decay = 0.2;
        sustain = 0.9;
        release = 0.25;
        break;
      case 'gm_retro_choir':
        attack = 0.08;
        decay = 0.35;
        sustain = 0.7;
        release = 0.3;
        break;
    }

    const wave = createHarmonicPeriodicWave(this.ctx, presetId);

    const osc = this.ctx.createOscillator();
    osc.setPeriodicWave(wave);
    osc.frequency.setValueAtTime(freq, when);

    // Warm resonant tone filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(16000, freq * 8), when);

    // ADSR Envelope (Click-free linear ramps in strict chronological order)
    if (durationSeconds !== undefined && durationSeconds > 0) {
      const noteEnd = when + durationSeconds;
      const relEnd = noteEnd + release;

      if (durationSeconds <= attack) {
        // Released during attack phase
        const peakAtRelease = Math.max(0.0001, velocity * (durationSeconds / attack));
        masterGain.gain.linearRampToValueAtTime(peakAtRelease, noteEnd);
        masterGain.gain.linearRampToValueAtTime(0.0001, relEnd);
      } else if (durationSeconds < attack + decay) {
        // Released during decay phase
        const decayProgress = (durationSeconds - attack) / decay;
        const levelAtRelease = Math.max(0.0001, velocity * (1.0 - (1.0 - sustain) * decayProgress));
        masterGain.gain.linearRampToValueAtTime(velocity, when + attack);
        masterGain.gain.linearRampToValueAtTime(levelAtRelease, noteEnd);
        masterGain.gain.linearRampToValueAtTime(0.0001, relEnd);
      } else {
        // Full attack and decay, then sustained until noteEnd
        masterGain.gain.linearRampToValueAtTime(velocity, when + attack);
        masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, velocity * sustain), when + attack + decay);
        masterGain.gain.setValueAtTime(Math.max(0.0001, velocity * sustain), noteEnd);
        masterGain.gain.linearRampToValueAtTime(0.0001, relEnd);
      }

      try {
        osc.stop(relEnd + 0.05);
      } catch {}
    } else {
      // Live interactive keypress (held until noteOff/stop is triggered)
      masterGain.gain.linearRampToValueAtTime(velocity, when + attack);
      masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, velocity * sustain), when + attack + decay);
    }

    osc.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(destination);

    osc.start(when);

    let stopped = false;
    const stop = (relTime?: number) => {
      if (stopped) return;
      stopped = true;
      const now = this.ctx.currentTime;
      const r = relTime !== undefined ? relTime : Math.min(0.08, release);
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + r);

      try {
        osc.stop(now + r + 0.02);
      } catch {}

      setTimeout(() => {
        try {
          masterGain.disconnect();
        } catch {}
      }, (r + 0.05) * 1000);
    };

    return { stop };
  }

  private playCustomSampleVoice(
    destination: AudioNode,
    midiNote: number,
    presetId: string,
    velocity: number,
    when: number,
    durationSeconds?: number
  ): { stop: (rel?: number) => void } {
    const preset = SoundFontManager.customPresetsMap.get(presetId);
    if (!preset || preset.zones.length === 0) {
      return { stop: () => {} };
    }

    // Find best zone for note
    let bestZone = preset.zones.find(z => midiNote >= z.minKey && midiNote <= z.maxKey);
    if (!bestZone) {
      let minDiff = Infinity;
      preset.zones.forEach(z => {
        const diff = Math.abs(midiNote - z.rootKey);
        if (diff < minDiff) {
          minDiff = diff;
          bestZone = z;
        }
      });
    }

    if (!bestZone || !bestZone.buffer) {
      return { stop: () => {} };
    }

    const source = this.ctx.createBufferSource();
    source.buffer = bestZone.buffer;

    const semitones = midiNote - bestZone.rootKey;
    const rate = Math.max(0.05, Math.pow(2, semitones / 12));
    source.playbackRate.setValueAtTime(rate, when);

    if (bestZone.isLooped && bestZone.loopStart !== undefined && bestZone.loopEnd !== undefined) {
      source.loop = true;
      source.loopStart = bestZone.loopStart;
      source.loopEnd = bestZone.loopEnd;
    }

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, when);

    const attack = 0.005;
    const release = 0.12;

    if (durationSeconds !== undefined && durationSeconds > 0) {
      const noteEnd = when + durationSeconds;
      const relEnd = noteEnd + release;
      masterGain.gain.linearRampToValueAtTime(velocity, when + attack);
      masterGain.gain.setValueAtTime(velocity, noteEnd);
      masterGain.gain.linearRampToValueAtTime(0.0001, relEnd);
      try {
        source.start(when);
        source.stop(relEnd + 0.05);
      } catch {}
    } else {
      masterGain.gain.linearRampToValueAtTime(velocity, when + attack);
      try {
        source.start(when);
      } catch {}
    }

    source.connect(masterGain);
    masterGain.connect(destination);

    let stopped = false;
    const stop = (relTime?: number) => {
      if (stopped) return;
      stopped = true;
      const now = this.ctx.currentTime;
      const r = relTime !== undefined ? relTime : 0.05;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + r);
      try {
        source.stop(now + r + 0.02);
      } catch {}
      setTimeout(() => {
        try {
          masterGain.disconnect();
          source.disconnect();
        } catch {}
      }, (r + 0.05) * 1000);
    };

    return { stop };
  }

  /**
   * Import SoundFont 2 (.sf2) or audio sample file (.wav)
   */
  public async importSoundFontFile(file: File): Promise<ParsedSoundFontPreset[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let loaded: ParsedSoundFontPreset[] = [];

    if (ext === 'sf2') {
      const buf = await file.arrayBuffer();
      loaded = await SoundFontParser.parseSf2(buf, this.ctx);
    } else if (ext === 'wav' || ext === 'wave' || ext === 'mp3' || ext === 'ogg') {
      const p = await SoundFontParser.parseWavFile(file, this.ctx);
      loaded = [p];
    } else {
      throw new Error(`Unsupported format: .${ext}. Please upload a .sf2 or .wav file.`);
    }

    loaded.forEach(preset => {
      SoundFontManager.customPresetsMap.set(preset.id, preset);
    });

    this.notifyPresetsChanged();
    return loaded;
  }

  public getCustomPresets(): ParsedSoundFontPreset[] {
    return Array.from(SoundFontManager.customPresetsMap.values());
  }

  public onPresetsChanged(cb: () => void): () => void {
    this.presetChangeCallbacks.add(cb);
    return () => {
      this.presetChangeCallbacks.delete(cb);
    };
  }

  private notifyPresetsChanged() {
    this.presetChangeCallbacks.forEach(cb => cb());
  }

  /**
   * Load user-provided SoundFont (.sf2) binary array buffer
   */
  public loadUserSoundFont(name: string, buffer: ArrayBuffer) {
    this.loadedSoundFonts.set(name, buffer);
  }
}
