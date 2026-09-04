/**
 * Retro Vocal & Dialogue Processor
 * Transforms voice recordings and audio samples into authentic retro game dialogue styles:
 * - Flowery (Deltarune): Varispeed tape pitch-up, 16kHz resample, 8-bit quantization, radio bandpass, warm drive
 * - Jevil (Deltarune): Varispeed +5.5st, slapback Haas stereo doubler, circus room resonance
 * - Kefka's Laugh (Final Fantasy VI, SNES): 4-bit BRR ADPCM emulation, 32kHz roll-off, SNES 8-tap echo
 * - Spamton (Deltarune): Syllable stutter repeater, harsh telephone filter, hard clipping distortion
 * - NPC Typewriter Dialogue: Micro-grain slicing with randomized pitch jitter for text chatter
 */

import { AudioExporter, ExportAudioFormat } from '../export/AudioExporter';
import { createBitQuantizerCurve } from './ConsoleDSP';

export interface VocalFXParams {
  // Pitch & Speed (Varispeed tape style or independent)
  pitchShift: number; // semitones (-12 to +12)
  playbackRate: number; // 0.5 to 2.0 (derived or custom)

  // Vintage Sampler Resampling & Quantization
  resampleRate: number; // 8000, 11025, 16000, 22050, 32000, 44100
  bitDepth: number; // 4, 6, 8, 10, 12, 16

  // Bandpass & Nasal Resonance (Telephone / Intercom / Cartoon)
  lowCutFreq: number; // Hz (highpass)
  highCutFreq: number; // Hz (lowpass)
  presenceFreq: number; // Hz (peaking)
  presenceGain: number; // dB (-6 to +12)

  // Character Dynamics & FX
  drive: number; // 0.0 to 1.0 (analog preamp soft-clipping)
  stereoDoubler: boolean; // Haas slapback delay for Jevil
  doublerDelayMs: number; // 15 to 45 ms
  echoAmount: number; // 0.0 to 1.0 (SNES feedback delay)
  stutterCount: number; // 0 to 4 (repeats initial phonemes for Spamton)
  stutterDurationMs: number; // 40 to 90 ms

  // Special Character FX
  robotize?: boolean; // Ring Modulator carrier for Queen (Deltarune Ch. 2)
  robotizeFreq?: number; // 60 to 200 Hz carrier frequency
  radioSquelch?: boolean; // Star Fox 64 walkie-talkie static burst
}

export type VocalPresetId = 
  | 'flowery' 
  | 'jevil' 
  | 'kefka' 
  | 'spamton' 
  | 'queen' 
  | 'sans' 
  | 'papyrus' 
  | 'starfox' 
  | 'animalese' 
  | 'npc_dialogue' 
  | 'clean';

export interface VocalPreset {
  id: VocalPresetId;
  name: string;
  icon: string;
  description: string;
  params: VocalFXParams;
  sampleQuote: string;
}

export const VOCAL_PRESETS: Record<VocalPresetId, VocalPreset> = {
  flowery: {
    id: 'flowery',
    name: 'Flowery',
    icon: '🌻',
    description: 'Deltarune Chapter 5 antagonist: Varispeed pitch-up, 16kHz resample, 8-bit grit, and nasal cartoon radio bandpass.',
    params: {
      pitchShift: 4.5,
      playbackRate: Math.pow(2, 4.5 / 12),
      resampleRate: 16000,
      bitDepth: 8,
      lowCutFreq: 280,
      highCutFreq: 4600,
      presenceFreq: 2800,
      presenceGain: 6.5,
      drive: 0.35,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.1,
      stutterCount: 0,
      stutterDurationMs: 60
    },
    sampleQuote: "That's a wonderful idea, friend!"
  },
  jevil: {
    id: 'jevil',
    name: 'Jevil',
    icon: '🃏',
    description: 'Chaos Jester (Deltarune): High-speed pitch-shift, 18kHz sampler, and a deranged 32ms slapback stereo doubler.',
    params: {
      pitchShift: 5.5,
      playbackRate: Math.pow(2, 5.5 / 12),
      resampleRate: 18000,
      bitDepth: 10,
      lowCutFreq: 220,
      highCutFreq: 7500,
      presenceFreq: 3200,
      presenceGain: 4.0,
      drive: 0.2,
      stereoDoubler: true,
      doublerDelayMs: 32,
      echoAmount: 0.35,
      stutterCount: 0,
      stutterDurationMs: 60
    },
    sampleQuote: "CHAOS, CHAOS! I CAN DO ANYTHING!"
  },
  kefka: {
    id: 'kefka',
    name: "Kefka's Laugh",
    icon: '🤡',
    description: 'Final Fantasy VI (SNES): 4-bit BRR ADPCM compression, 32kHz Gaussian treble roll-off, and iconic SPC700 8-tap echo.',
    params: {
      pitchShift: 7.0,
      playbackRate: Math.pow(2, 7.0 / 12),
      resampleRate: 32000,
      bitDepth: 4,
      lowCutFreq: 180,
      highCutFreq: 3600,
      presenceFreq: 2200,
      presenceGain: 3.0,
      drive: 0.15,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.55,
      stutterCount: 0,
      stutterDurationMs: 50
    },
    sampleQuote: "Uee-hee-hee! Ha-ha-ha-ha-ha!"
  },
  spamton: {
    id: 'spamton',
    name: 'Spamton G.',
    icon: '📺',
    description: 'Big Shot (Deltarune): Initial syllable stutter chopper, harsh telephone speaker EQ, and blown-out clipping overdrive.',
    params: {
      pitchShift: 2.0,
      playbackRate: Math.pow(2, 2.0 / 12),
      resampleRate: 11025,
      bitDepth: 6,
      lowCutFreq: 400,
      highCutFreq: 3400,
      presenceFreq: 3000,
      presenceGain: 9.0,
      drive: 0.7,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.05,
      stutterCount: 3,
      stutterDurationMs: 70
    },
    sampleQuote: "NOW'S YOUR CHANCE TO BE A [[BIG SHOT]]!"
  },
  queen: {
    id: 'queen',
    name: 'Queen',
    icon: '👑',
    description: 'Deltarune Ch. 2: Robotized ring modulator carrier (105 Hz), stepped cadence, and crisp text-to-speech formant presence.',
    params: {
      pitchShift: 1.0,
      playbackRate: Math.pow(2, 1.0 / 12),
      resampleRate: 22050,
      bitDepth: 12,
      lowCutFreq: 220,
      highCutFreq: 8000,
      presenceFreq: 3000,
      presenceGain: 7.0,
      drive: 0.15,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.15,
      stutterCount: 0,
      stutterDurationMs: 50,
      robotize: true,
      robotizeFreq: 105
    },
    sampleQuote: "Kris Get The Banana! Potassium."
  },
  sans: {
    id: 'sans',
    name: 'Sans',
    icon: '💀',
    description: 'Undertale: Low-pitched, muffled bone mutter with 950Hz lowpass filter and 6-bit crunch.',
    params: {
      pitchShift: -5.0,
      playbackRate: Math.pow(2, -5.0 / 12),
      resampleRate: 8000,
      bitDepth: 6,
      lowCutFreq: 80,
      highCutFreq: 950,
      presenceFreq: 600,
      presenceGain: 2.0,
      drive: 0.3,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.0,
      stutterCount: 0,
      stutterDurationMs: 50
    },
    sampleQuote: "it's a beautiful day outside."
  },
  papyrus: {
    id: 'papyrus',
    name: 'Papyrus',
    icon: '🦴',
    description: 'Undertale: High, staccato, piercing skull rattle with snappy bandpass and cartoon presence.',
    params: {
      pitchShift: 6.0,
      playbackRate: Math.pow(2, 6.0 / 12),
      resampleRate: 11025,
      bitDepth: 8,
      lowCutFreq: 400,
      highCutFreq: 6000,
      presenceFreq: 2600,
      presenceGain: 9.0,
      drive: 0.25,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.0,
      stutterCount: 0,
      stutterDurationMs: 50
    },
    sampleQuote: "NYEH HEH HEH! I, THE GREAT PAPYRUS!"
  },
  starfox: {
    id: 'starfox',
    name: 'Star Fox Comms',
    icon: '🦊',
    description: 'Corneria Military Radio (N64): High-noise walkie-talkie bandpass, radio squelch static burst, and overdrive.',
    params: {
      pitchShift: 0.0,
      playbackRate: 1.0,
      resampleRate: 11025,
      bitDepth: 8,
      lowCutFreq: 380,
      highCutFreq: 2800,
      presenceFreq: 2100,
      presenceGain: 8.5,
      drive: 0.6,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.0,
      stutterCount: 0,
      stutterDurationMs: 50,
      radioSquelch: true
    },
    sampleQuote: "Do a barrel roll! Good luck."
  },
  animalese: {
    id: 'animalese',
    name: 'Animalese',
    icon: '🐾',
    description: 'Animal Crossing / Banjo: Rapid-fire phoneme chatter (+8st varispeed) with high-speed vowel chirps.',
    params: {
      pitchShift: 8.0,
      playbackRate: Math.pow(2, 8.0 / 12),
      resampleRate: 22050,
      bitDepth: 8,
      lowCutFreq: 250,
      highCutFreq: 8500,
      presenceFreq: 3400,
      presenceGain: 5.0,
      drive: 0.15,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.0,
      stutterCount: 0,
      stutterDurationMs: 40
    },
    sampleQuote: "Welcome to town! Tom Nook needs your bells."
  },
  npc_dialogue: {
    id: 'npc_dialogue',
    name: 'Typewriter Chirp',
    icon: '💬',
    description: 'Undertale / Deltarune text chattering: Micro-grain vowel slice with pitch fluctuation for character text boxes.',
    params: {
      pitchShift: 0,
      playbackRate: 1.0,
      resampleRate: 16000,
      bitDepth: 8,
      lowCutFreq: 200,
      highCutFreq: 5000,
      presenceFreq: 2500,
      presenceGain: 5.0,
      drive: 0.25,
      stereoDoubler: false,
      doublerDelayMs: 20,
      echoAmount: 0.0,
      stutterCount: 0,
      stutterDurationMs: 50
    },
    sampleQuote: "In this world, it's kill or be killed."
  },
  clean: {
    id: 'clean',
    name: 'Studio Clean',
    icon: '🎙️',
    description: 'Neutral unprocessed playback with subtle trim and normalizer.',
    params: {
      pitchShift: 0,
      playbackRate: 1.0,
      resampleRate: 44100,
      bitDepth: 16,
      lowCutFreq: 40,
      highCutFreq: 20000,
      presenceFreq: 2500,
      presenceGain: 0.0,
      drive: 0.0,
      stereoDoubler: false,
      doublerDelayMs: 25,
      echoAmount: 0.0,
      stutterCount: 0,
      stutterDurationMs: 50
    },
    sampleQuote: "Testing, testing, one two three."
  }
};

export class RetroVocalProcessor {
  private static instance: RetroVocalProcessor | null = null;
  private audioCtx: AudioContext;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private currentStream: MediaStream | null = null;
  private activeSourceNode: AudioBufferSourceNode | null = null;

  private constructor() {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtxClass();
  }

  public static getInstance(): RetroVocalProcessor {
    if (!RetroVocalProcessor.instance) {
      RetroVocalProcessor.instance = new RetroVocalProcessor();
    }
    return RetroVocalProcessor.instance;
  }

  public getContext(): AudioContext {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Start recording microphone audio into memory
   */
  public async startRecording(): Promise<void> {
    this.recordedChunks = [];
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported by your browser environment.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    this.currentStream = stream;
    const recorder = new MediaRecorder(stream);
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    recorder.start(100); // 100ms chunks
  }

  public getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  /**
   * Stop microphone recording and decode into an AudioBuffer
   */
  public async stopRecording(): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const recorder = this.mediaRecorder;
      if (!recorder) {
        reject(new Error('No active recorder to stop'));
        return;
      }

      recorder.onstop = async () => {
        try {
          if (this.currentStream) {
            this.currentStream.getTracks().forEach(t => t.stop());
            this.currentStream = null;
          }

          const mime = recorder.mimeType || undefined;
          const blob = mime ? new Blob(this.recordedChunks, { type: mime }) : new Blob(this.recordedChunks);
          const arrayBuffer = await blob.arrayBuffer();
          const decoded = await this.audioCtx.decodeAudioData(arrayBuffer);
          resolve(decoded);
        } catch (err) {
          reject(err);
        }
      };

      recorder.stop();
    });
  }

  /**
   * Decode an imported audio file (WAV, MP3, OGG)
   */
  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    return await this.audioCtx.decodeAudioData(arrayBuffer);
  }

  /**
   * Generate an instant, vocal-like demo phrase procedurally (Formant-synthesized speech)
   * Ensures users can test Flowery, Jevil, Kefka, and Spamton immediately even without a microphone!
   */
  public generateDemoVocalBuffer(): AudioBuffer {
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    const duration = 1.4; // 1.4 seconds
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Synthesize vocal syllables: "HA - HA - HEE - YA!"
    // Formant filter frequencies for vocal vowels [a, o, i]
    const syllables = [
      { start: 0.05, end: 0.30, pitch: 180, formants: [730, 1090, 2440] }, // "Ha"
      { start: 0.35, end: 0.60, pitch: 220, formants: [730, 1090, 2440] }, // "Ha"
      { start: 0.65, end: 0.95, pitch: 260, formants: [270, 2290, 3010] }, // "Hee"
      { start: 1.00, end: 1.35, pitch: 310, formants: [660, 1720, 2410] }  // "Ya!"
    ];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const s of syllables) {
        if (t >= s.start && t <= s.end) {
          const localT = t - s.start;
          const sylDur = s.end - s.start;
          
          // Glottal pulse fundamental
          const f0 = s.pitch;
          const glottal = (localT * f0) % 1.0 < 0.3 ? 1.0 : -0.3;

          // Formant resonance oscillators
          let vocal = 0;
          for (let fi = 0; fi < s.formants.length; fi++) {
            const f = s.formants[fi];
            const weight = fi === 0 ? 0.6 : fi === 1 ? 0.35 : 0.2;
            vocal += Math.sin(2 * Math.PI * f * localT) * weight;
          }

          // Syllable volume envelope
          let env = 1.0;
          if (localT < 0.03) {
            env = localT / 0.03;
          } else if (localT > sylDur - 0.05) {
            env = Math.max(0, (sylDur - localT) / 0.05);
          }

          sample += (glottal * 0.4 + vocal * 0.6) * env * 0.8;
        }
      }

      channelData[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Slice and trim an AudioBuffer between startSec and endSec
   */
  public sliceBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const totalDuration = buffer.duration;
    const clampedStart = Math.max(0, Math.min(totalDuration, startSec));
    const clampedEnd = Math.max(clampedStart + 0.02, Math.min(totalDuration, endSec));

    const startSample = Math.floor(clampedStart * sampleRate);
    const endSample = Math.floor(clampedEnd * sampleRate);
    const sliceLen = Math.max(128, endSample - startSample);

    const sliced = this.audioCtx.createBuffer(buffer.numberOfChannels, sliceLen, sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = sliced.getChannelData(ch);
      for (let i = 0; i < sliceLen; i++) {
        dst[i] = src[startSample + i] || 0;
      }
    }
    return sliced;
  }

  /**
   * Render transformed vocal audio using an OfflineAudioContext for 1:1 parity and zero-latency output
   */
  public async renderProcessedVocal(
    inputBuffer: AudioBuffer,
    params: VocalFXParams,
    trimStartSec: number = 0,
    trimEndSec?: number
  ): Promise<AudioBuffer> {
    const endSec = trimEndSec !== undefined ? trimEndSec : inputBuffer.duration;
    const rawSliced = this.sliceBuffer(inputBuffer, trimStartSec, endSec);

    // 1. Prepare Stutter Chopper if enabled (Spamton signature)
    let bufferToProcess = rawSliced;
    if (params.stutterCount > 0) {
      bufferToProcess = this.applyStutter(rawSliced, params.stutterCount, params.stutterDurationMs / 1000);
    }

    // 2. Compute effective duration taking Varispeed into account
    const speed = Math.max(0.25, Math.min(4.0, Math.pow(2, params.pitchShift / 12)));
    const processedDuration = (bufferToProcess.duration / speed) + (params.echoAmount > 0 ? 0.6 : 0.1);
    const sampleRate = 44100;
    const totalSamples = Math.max(256, Math.ceil(processedDuration * sampleRate));

    // Create Stereo Offline Audio Context
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // Source Node
    const source = offlineCtx.createBufferSource();
    source.buffer = bufferToProcess;
    source.playbackRate.setValueAtTime(speed, 0);

    // Highpass Low-Cut Filter
    const lowCut = offlineCtx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.setValueAtTime(Math.max(20, params.lowCutFreq), 0);

    // High-frequency Decimation / Resample Filter
    // Simulates the analog reconstruction filter of 8kHz, 16kHz, or 32kHz vintage DACs
    const resampleLpf = offlineCtx.createBiquadFilter();
    resampleLpf.type = 'lowpass';
    resampleLpf.frequency.setValueAtTime(Math.min(20000, params.resampleRate / 2), 0);

    // Lowpass High-Cut Filter (Telephone warmth)
    const highCut = offlineCtx.createBiquadFilter();
    highCut.type = 'lowpass';
    highCut.frequency.setValueAtTime(Math.max(200, params.highCutFreq), 0);

    // Nasal Presence Peaking Filter (Cartoon Intelligibility)
    const presence = offlineCtx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.setValueAtTime(params.presenceFreq, 0);
    presence.gain.setValueAtTime(params.presenceGain, 0);
    presence.Q.setValueAtTime(1.8, 0);

    // Vintage Sampler Bit Quantizer (WaveShaper)
    const quantizer = offlineCtx.createWaveShaper();
    quantizer.curve = createBitQuantizerCurve(params.bitDepth);
    quantizer.oversample = 'none';

    // Warm Preamp Overdrive / Soft Clipper
    const driveShaper = offlineCtx.createWaveShaper();
    driveShaper.curve = this.createSoftDriveCurve(params.drive);

    // Master Gain
    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.9, 0);

    // Wire up serial DSP chain: source -> lowCut -> presence -> highCut -> resampleLpf -> quantizer -> driveShaper -> (robotize) -> masterGain
    source.connect(lowCut);
    lowCut.connect(presence);
    presence.connect(highCut);
    highCut.connect(resampleLpf);
    resampleLpf.connect(quantizer);
    quantizer.connect(driveShaper);

    let finalEffectNode: AudioNode = driveShaper;

    // Ring Modulator (Robotize / Queen / Dalek effect)
    if (params.robotize) {
      const ringGain = offlineCtx.createGain();
      ringGain.gain.setValueAtTime(0.5, 0);

      const carrierOsc = offlineCtx.createOscillator();
      carrierOsc.type = 'sine';
      carrierOsc.frequency.setValueAtTime(params.robotizeFreq || 105, 0);

      const carrierDepth = offlineCtx.createGain();
      carrierDepth.gain.setValueAtTime(0.5, 0);

      carrierOsc.connect(carrierDepth);
      carrierDepth.connect(ringGain.gain);
      carrierOsc.start(0);

      driveShaper.connect(ringGain);
      finalEffectNode = ringGain;
    }

    finalEffectNode.connect(masterGain);

    // Star Fox 64 Radio Squelch burst at transmission end
    if (params.radioSquelch) {
      const squelchDuration = 0.07;
      const noiseBuffer = offlineCtx.createBuffer(1, Math.floor(sampleRate * squelchDuration), sampleRate);
      const nData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < nData.length; i++) {
        nData[i] = (Math.random() * 2 - 1) * Math.sin((i / nData.length) * Math.PI);
      }

      const noiseSource = offlineCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const squelchFilter = offlineCtx.createBiquadFilter();
      squelchFilter.type = 'bandpass';
      squelchFilter.frequency.setValueAtTime(2400, 0);
      squelchFilter.Q.setValueAtTime(3.5, 0);

      const squelchGain = offlineCtx.createGain();
      squelchGain.gain.setValueAtTime(0.35, 0);

      const endTime = Math.max(0, (bufferToProcess.duration / speed) - 0.02);
      noiseSource.connect(squelchFilter);
      squelchFilter.connect(squelchGain);
      squelchGain.connect(masterGain);
      noiseSource.start(endTime);
    }

    // 3. Stereo Doubler & Reverb routing
    if (params.stereoDoubler) {
      // Jevil Manic Doubler: Left channel direct, Right channel delayed by doublerDelayMs
      const splitter = offlineCtx.createChannelSplitter(2);
      const merger = offlineCtx.createChannelMerger(2);

      const delayR = offlineCtx.createDelay(0.1);
      delayR.delayTime.setValueAtTime(params.doublerDelayMs / 1000, 0);

      masterGain.connect(splitter);
      // Left channel direct
      splitter.connect(merger, 0, 0);
      // Right channel delayed
      splitter.connect(delayR, 0);
      delayR.connect(merger, 0, 1);

      if (params.echoAmount > 0) {
        const echo = this.createFeedbackEcho(offlineCtx, merger, params.echoAmount);
        echo.connect(offlineCtx.destination);
      } else {
        merger.connect(offlineCtx.destination);
      }
    } else {
      // Mono/Stereo standard
      if (params.echoAmount > 0) {
        const echo = this.createFeedbackEcho(offlineCtx, masterGain, params.echoAmount);
        echo.connect(offlineCtx.destination);
      } else {
        masterGain.connect(offlineCtx.destination);
      }
    }

    source.start(0);
    return await offlineCtx.startRendering();
  }

  /**
   * Helper to repeat initial slice of audio (Spamton stutter)
   */
  private applyStutter(buffer: AudioBuffer, count: number, stutterSec: number): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const stutterSamples = Math.min(buffer.length, Math.floor(stutterSec * sampleRate));
    const extraSamples = stutterSamples * count;
    const totalSamples = buffer.length + extraSamples;

    const out = this.audioCtx.createBuffer(buffer.numberOfChannels, totalSamples, sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = out.getChannelData(ch);

      let writeOffset = 0;
      // Write repeated initial slices
      for (let rep = 0; rep < count; rep++) {
        for (let i = 0; i < stutterSamples; i++) {
          dst[writeOffset + i] = src[i];
        }
        writeOffset += stutterSamples;
      }

      // Write entire original buffer
      for (let i = 0; i < buffer.length; i++) {
        dst[writeOffset + i] = src[i];
      }
    }
    return out;
  }

  /**
   * Create smooth analog soft-clip saturation curve
   */
  private createSoftDriveCurve(drive: number): Float32Array<ArrayBuffer> {
    const n = 1024;
    const curve = new Float32Array(n);
    const k = Math.max(0.0, drive * 8.0);

    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2.0 - 1.0;
      if (k === 0) {
        curve[i] = x;
      } else {
        // Soft tanh saturation
        curve[i] = Math.tanh((1 + k) * x) / Math.tanh(1 + k);
      }
    }
    return curve;
  }

  /**
   * Create vintage SNES SPC700 feedback echo network
   */
  private createFeedbackEcho(ctx: OfflineAudioContext, inputNode: AudioNode, amount: number): AudioNode {
    const outGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    dryGain.gain.setValueAtTime(1.0, 0);
    wetGain.gain.setValueAtTime(amount * 0.75, 0);

    const delay = ctx.createDelay(0.5);
    delay.delayTime.setValueAtTime(0.14, 0); // 140ms SNES echo

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(Math.min(0.7, amount * 0.65), 0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, 0); // Muffled feedback rolloff

    inputNode.connect(dryGain);
    dryGain.connect(outGain);

    inputNode.connect(delay);
    delay.connect(filter);
    filter.connect(feedback);
    feedback.connect(delay);

    filter.connect(wetGain);
    wetGain.connect(outGain);

    return outGain;
  }

  /**
   * Audition an AudioBuffer in real time
   */
  public playBuffer(buffer: AudioBuffer, onEnded?: () => void): void {
    this.stopPlayback();
    const ctx = this.getContext();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      this.activeSourceNode = null;
      if (onEnded) onEnded();
    };
    src.start();
    this.activeSourceNode = src;
  }

  /**
   * Stop any active auditioning
   */
  public stopPlayback(): void {
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
      } catch (_) {}
      this.activeSourceNode = null;
    }
  }

  /**
   * Extract a micro-grain (40-60ms) for NPC dialogue typing sound
   */
  public extractDialogueGrain(buffer: AudioBuffer, grainDurationSec: number = 0.05): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const grainSamples = Math.min(buffer.length, Math.floor(grainDurationSec * sampleRate));
    
    // Find the highest energy peak in the buffer to isolate a punchy vowel
    const data = buffer.getChannelData(0);
    let peakIdx = 0;
    let maxAmp = 0;
    const searchLimit = Math.min(data.length, Math.floor(buffer.duration * 0.7 * sampleRate));
    
    for (let i = 0; i < searchLimit; i++) {
      const absVal = Math.abs(data[i]);
      if (absVal > maxAmp) {
        maxAmp = absVal;
        peakIdx = i;
      }
    }

    const startIdx = Math.max(0, peakIdx - Math.floor(grainSamples * 0.2));
    const endIdx = Math.min(data.length, startIdx + grainSamples);
    const actualLen = endIdx - startIdx;

    const grain = this.audioCtx.createBuffer(1, actualLen, sampleRate);
    const grainData = grain.getChannelData(0);

    for (let i = 0; i < actualLen; i++) {
      // Quick envelope to avoid audio clicks
      let env = 1.0;
      if (i < 64) env = i / 64;
      else if (i > actualLen - 128) env = (actualLen - i) / 128;
      grainData[i] = data[startIdx + i] * env;
    }

    return grain;
  }

  /**
   * Trigger a single dialogue typewriter chirp with random micro-pitch jitter (Undertale style)
   */
  public playDialogueChirp(
    grainBuffer: AudioBuffer,
    characterId: VocalPresetId = 'flowery',
    pitchJitterCents: number = 40
  ): void {
    const ctx = this.getContext();
    const src = ctx.createBufferSource();
    src.buffer = grainBuffer;

    let baseMultiplier = 1.0;
    let effectiveJitter = pitchJitterCents;

    if (characterId === 'sans') {
      baseMultiplier = 0.58; // Deep bone rattle
      effectiveJitter = 20;
    } else if (characterId === 'papyrus') {
      baseMultiplier = 1.45; // High, sharp skull clatter
      effectiveJitter = 15;
    } else if (characterId === 'queen') {
      baseMultiplier = 1.0; // Monotone robot
      effectiveJitter = 0;
    } else if (characterId === 'jevil') {
      baseMultiplier = 1.15;
      effectiveJitter = 85; // Wild chaotic jumps
    } else if (characterId === 'animalese') {
      baseMultiplier = 1.6;
      effectiveJitter = 65; // Rapid babble
    }

    // Random pitch jitter in cents (±effectiveJitter)
    const centsOffset = (Math.random() * 2 - 1) * effectiveJitter;
    const rate = baseMultiplier * Math.pow(2, centsOffset / 1200);
    src.playbackRate.value = rate;

    const gain = ctx.createGain();
    gain.gain.value = 0.75;

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }
}
