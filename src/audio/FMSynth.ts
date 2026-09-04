/**
 * Authentic 2-Operator & 4-Operator FM Synthesis Engine
 * Emulates the sharp, metallic, punchy frequency modulation of the Yamaha YM2612 (Sega Genesis)
 * and vintage industrial synthesizer soundcards.
 */

import { ActiveVoice, midiToFrequency } from './RetroChipSynth';

export interface FMPresetConfig {
  name: string;
  carrierRatio: number;      // Carrier frequency multiplier (e.g. 1.0)
  modulatorRatio: number;    // Modulator frequency multiplier (e.g. 0.5, 1.0, 1.414, 3.5)
  modIndex: number;          // Peak modulation index / depth (in multiples of fundamental freq)
  modSustainIndex: number;   // Sustained modulation index after decay
  modAttack: number;         // Modulator envelope attack (seconds)
  modDecay: number;          // Modulator envelope decay (seconds)
  modRelease: number;        // Modulator envelope release (seconds)
  ampAttack: number;         // Carrier amplitude attack (seconds)
  ampDecay: number;          // Carrier amplitude decay (seconds)
  ampSustain: number;        // Carrier amplitude sustain level (0.0 - 1.0)
  ampRelease: number;        // Carrier amplitude release (seconds)
  modWaveform?: OscillatorType; // 'sine', 'sawtooth', 'square', 'triangle'
  carrierWaveform?: OscillatorType;
}

export const FM_PRESETS: Record<string, FMPresetConfig> = {
  // Classic punchy Genesis Solid Bass (Sonic / Streets of Rage)
  fm_solid_bass: {
    name: 'Sega Solid Bass (YM2612)',
    carrierRatio: 1.0,
    modulatorRatio: 0.5,
    modIndex: 4.5,
    modSustainIndex: 0.35,
    modAttack: 0.002,
    modDecay: 0.16,
    modRelease: 0.08,
    ampAttack: 0.003,
    ampDecay: 0.35,
    ampSustain: 0.5,
    ampRelease: 0.09,
    modWaveform: 'sine',
    carrierWaveform: 'sine'
  },

  // Gritty, dissonant, metallic grinding bass for Ancient Mechanical Boss
  fm_metallic_growl: {
    name: 'Industrial Grinding Mech Bass',
    carrierRatio: 1.0,
    modulatorRatio: 1.414, // Non-harmonic square root of 2 for metallic/tritone edge
    modIndex: 5.5,
    modSustainIndex: 1.2,
    modAttack: 0.001,
    modDecay: 0.22,
    modRelease: 0.12,
    ampAttack: 0.002,
    ampDecay: 0.45,
    ampSustain: 0.65,
    ampRelease: 0.12,
    modWaveform: 'sawtooth',
    carrierWaveform: 'sine'
  },

  // Laser-sharp cutting industrial FM machine lead
  fm_industrial_lead: {
    name: 'Alien Machine FM Lead',
    carrierRatio: 2.0,
    modulatorRatio: 3.0,
    modIndex: 4.0,
    modSustainIndex: 0.8,
    modAttack: 0.003,
    modDecay: 0.18,
    modRelease: 0.08,
    ampAttack: 0.004,
    ampDecay: 0.5,
    ampSustain: 0.7,
    ampRelease: 0.08,
    modWaveform: 'sine',
    carrierWaveform: 'sine'
  },

  // Anvil clanks and crystalline metallic chime
  fm_metallic_chime: {
    name: 'Metallic Anvil & Chime',
    carrierRatio: 1.0,
    modulatorRatio: 3.5,
    modIndex: 6.5,
    modSustainIndex: 0.05,
    modAttack: 0.001,
    modDecay: 0.9,
    modRelease: 0.6,
    ampAttack: 0.002,
    ampDecay: 1.4,
    ampSustain: 0.15,
    ampRelease: 0.7,
    modWaveform: 'sine',
    carrierWaveform: 'sine'
  },

  // Classic 80s/90s DX7 & Genesis Electric Piano
  fm_electric_piano: {
    name: 'Vintage FM Electric Piano',
    carrierRatio: 1.0,
    modulatorRatio: 1.0,
    modIndex: 3.2,
    modSustainIndex: 0.2,
    modAttack: 0.005,
    modDecay: 0.7,
    modRelease: 0.35,
    ampAttack: 0.006,
    ampDecay: 1.1,
    ampSustain: 0.3,
    ampRelease: 0.35,
    modWaveform: 'sine',
    carrierWaveform: 'sine'
  },

  // Deep industrial sub drone
  fm_dark_drone: {
    name: 'Deep Industrial Sub Drone',
    carrierRatio: 0.5,
    modulatorRatio: 0.75,
    modIndex: 3.8,
    modSustainIndex: 2.5,
    modAttack: 0.15,
    modDecay: 0.6,
    modRelease: 0.4,
    ampAttack: 0.12,
    ampDecay: 0.8,
    ampSustain: 0.85,
    ampRelease: 0.4,
    modWaveform: 'triangle',
    carrierWaveform: 'sine'
  }
};

export interface FMVoiceOverrides {
  preset?: string;
  carrierRatio?: number;
  modulatorRatio?: number;
  modIndex?: number;
  velocity?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

/**
 * Triggers an authentic 2-Operator FM synthesis voice
 */
export function playFMVoice(
  ctx: BaseAudioContext,
  destination: AudioNode,
  midiNote: number,
  overrides: FMVoiceOverrides = {},
  when: number = ctx.currentTime,
  durationSeconds?: number
): ActiveVoice {
  const baseFreq = midiToFrequency(midiNote);
  const presetKey = overrides.preset || 'fm_metallic_growl';
  const cfg = FM_PRESETS[presetKey] || FM_PRESETS.fm_metallic_growl;

  // Resolved parameters with user overrides
  const carrierRatio = overrides.carrierRatio ?? cfg.carrierRatio;
  const modulatorRatio = overrides.modulatorRatio ?? cfg.modulatorRatio;
  const peakModIndex = overrides.modIndex ?? cfg.modIndex;

  const ampAttack = Math.max(0.002, overrides.attack ?? cfg.ampAttack);
  const ampDecay = Math.max(0.01, overrides.decay ?? cfg.ampDecay);
  const ampSustain = Math.min(1.0, Math.max(0.01, overrides.sustain ?? cfg.ampSustain));
  const ampRelease = Math.max(0.01, overrides.release ?? cfg.ampRelease);

  const rawVelocity = overrides.velocity ?? 0.8;
  const velocity = Math.max(0.01, Math.min(1.0, rawVelocity * 0.7)); // Summing headroom scaling

  // 1. Modulator Oscillator
  const modulator = (ctx as AudioContext).createOscillator();
  modulator.type = cfg.modWaveform || 'sine';
  const modFreq = baseFreq * modulatorRatio;
  modulator.frequency.setValueAtTime(modFreq, when);

  // 2. Modulator Gain (Controls Dynamic Modulation Index / Harmonic Brightness)
  const modGain = (ctx as AudioContext).createGain();
  const peakDevHz = baseFreq * peakModIndex * velocity;
  const sustainDevHz = baseFreq * cfg.modSustainIndex * velocity;

  modGain.gain.setValueAtTime(0.0001, when);
  modGain.gain.linearRampToValueAtTime(Math.max(1, peakDevHz), when + cfg.modAttack);
  modGain.gain.exponentialRampToValueAtTime(Math.max(1, sustainDevHz), when + cfg.modAttack + cfg.modDecay);

  modulator.connect(modGain);

  // 3. Carrier Oscillator
  const carrier = (ctx as AudioContext).createOscillator();
  carrier.type = cfg.carrierWaveform || 'sine';
  const carrierFreq = baseFreq * carrierRatio;
  carrier.frequency.setValueAtTime(carrierFreq, when);

  // FM modulation routing: Modulator Gain connects directly to Carrier Frequency AudioParam!
  modGain.connect(carrier.frequency);

  // 4. Master Amplitude Envelope Gain
  const ampGain = (ctx as AudioContext).createGain();
  ampGain.gain.setValueAtTime(0.0001, when);
  ampGain.gain.linearRampToValueAtTime(velocity, when + ampAttack);
  ampGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, velocity * ampSustain), when + ampAttack + ampDecay);

  carrier.connect(ampGain);
  ampGain.connect(destination);

  // Start oscillators
  modulator.start(when);
  carrier.start(when);

  let stopped = false;

  const stopVoice = (releaseTime: number = ampRelease) => {
    if (stopped) return;
    stopped = true;

    const stopWhen = Math.max(ctx.currentTime, when);
    const rel = Math.max(0.01, releaseTime);

    try {
      ampGain.gain.cancelScheduledValues(stopWhen);
      ampGain.gain.setValueAtTime(Math.max(0.0001, ampGain.gain.value), stopWhen);
      ampGain.gain.exponentialRampToValueAtTime(0.0001, stopWhen + rel);

      modGain.gain.cancelScheduledValues(stopWhen);
      modGain.gain.setValueAtTime(Math.max(0.0001, modGain.gain.value), stopWhen);
      modGain.gain.exponentialRampToValueAtTime(0.0001, stopWhen + rel);

      modulator.stop(stopWhen + rel + 0.05);
      carrier.stop(stopWhen + rel + 0.05);
    } catch {}
  };

  // If a fixed duration is specified, schedule note release
  if (durationSeconds && durationSeconds > 0) {
    const noteEndTime = when + durationSeconds;
    ampGain.gain.setValueAtTime(Math.max(0.0001, velocity * ampSustain), noteEndTime);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, noteEndTime + ampRelease);

    modGain.gain.setValueAtTime(Math.max(0.0001, sustainDevHz), noteEndTime);
    modGain.gain.exponentialRampToValueAtTime(0.0001, noteEndTime + cfg.modRelease);

    modulator.stop(noteEndTime + ampRelease + 0.05);
    carrier.stop(noteEndTime + ampRelease + 0.05);
  }

  return {
    stop: stopVoice,
    gainNode: ampGain
  };
}
