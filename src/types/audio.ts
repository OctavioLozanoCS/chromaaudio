export type WaveformType = 
  | 'pulse_12'
  | 'pulse_25' 
  | 'pulse_50' 
  | 'pulse_75' 
  | 'wave_ram' 
  | 'noise' 
  | 'triangle' 
  | 'sine' 
  | 'sawtooth';

export type InstrumentType = 'chip_synth' | 'soundfont' | 'sample' | 'fm_synth';

export interface NoteEvent {
  id: string;
  note: number; // MIDI note number (0 - 127), e.g. 60 is C4
  step: number; // Step index in pattern (e.g. 0 - 63 for 4 bars of 16th notes)
  duration: number; // In steps (e.g. 1 = 16th note, 4 = quarter note)
  velocity: number; // 0.0 - 1.0 (default 0.8)
  pan?: number; // -1.0 to 1.0
}

export interface InstrumentChannel {
  id: string;
  name: string;
  color: string;
  type: InstrumentType;
  preset: string;
  volume: number; // 0.0 - 1.0
  pan: number; // -1.0 - 1.0
  mute: boolean;
  solo: boolean;
  octaveOffset: number; // -2 to +2
  dutyCycle?: number; // For pulse waves: 0.125, 0.25, 0.5, 0.75
  sweepAmount?: number; // Pitch sweep
  vibratoDepth?: number;
  vibratoSpeed?: number;
  attack: number; // in seconds
  decay: number;
  sustain: number;
  release: number;
}

export interface Pattern {
  id: string;
  name: string;
  lengthSteps: number; // default 64 (4 bars)
  notesByChannel: Record<string, NoteEvent[]>; // channelId -> NoteEvent[]
}

export interface TimelineClip {
  id: string;
  trackIndex: number;
  startStep: number;
  lengthSteps: number;
  patternId?: string;
  audioBufferId?: string;
  name: string;
  color: string;
  muted: boolean;
}

export interface TimelineTrack {
  id: string;
  name: string;
  color: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export interface DSPConfig {
  enabled: boolean;
  resampleRate: number; // 8000, 16000, 18157 (GBA), 22050, 32000 (DS), 44100
  bitDepth: number; // 4 (ADPCM), 8 (GBA PCM), 12, 16
  reverbEnabled: boolean;
  reverbDecay: number; // 0.1 to 4.0s
  reverbWet: number; // 0.0 to 1.0
  filterCutoff: number; // 200 - 20000 Hz
  filterResonance: number; // 0 - 20
}

export interface ProjectState {
  version: string;
  name: string;
  bpm: number;
  snapGrid: number; // 1 = 16th, 2 = 8th, 4 = quarter, 0.5 = 32nd
  activePatternId: string;
  channels: InstrumentChannel[];
  patterns: Pattern[];
  tracks: TimelineTrack[];
  timelineClips: TimelineClip[];
  dsp: DSPConfig;
  loopStartStep: number;
  loopLengthSteps: number;
  scaleRoot: number; // 0 = C, 1 = C#, ... 11 = B
  scaleMode: string; // 'major', 'minor', 'dorian', 'phrygian', 'pentatonic', etc.
}
