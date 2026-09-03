import { ProjectState, InstrumentChannel, Pattern, TimelineTrack, TimelineClip } from '../types/audio';

export const DEFAULT_CHANNELS: InstrumentChannel[] = [
  {
    id: 'ch_lead_gb',
    name: '👾 GB Pulse Lead',
    color: '#38bdf8', // Light sky blue
    type: 'chip_synth',
    preset: 'pulse_25',
    volume: 0.7,
    pan: -0.15,
    mute: false,
    solo: false,
    octaveOffset: 0,
    attack: 0.005,
    decay: 0.12,
    sustain: 0.65,
    release: 0.15
  },
  {
    id: 'ch_harm_gb',
    name: '⚡ GB Pulse Arp',
    color: '#818cf8', // Indigo
    type: 'chip_synth',
    preset: 'pulse_50',
    volume: 0.6,
    pan: 0.2,
    mute: false,
    solo: false,
    octaveOffset: 0,
    attack: 0.01,
    decay: 0.15,
    sustain: 0.5,
    release: 0.2
  },
  {
    id: 'ch_bass_gb',
    name: '🔊 4-Bit Wave Bass',
    color: '#34d399', // Emerald
    type: 'chip_synth',
    preset: 'wave_ram',
    volume: 0.7,
    pan: 0,
    mute: false,
    solo: false,
    octaveOffset: -1,
    attack: 0.005,
    decay: 0.2,
    sustain: 0.7,
    release: 0.1
  },
  {
    id: 'ch_drums_gb',
    name: '🥁 LFSR Noise Perc',
    color: '#fbbf24', // Amber
    type: 'chip_synth',
    preset: 'noise',
    volume: 0.6,
    pan: 0,
    mute: false,
    solo: false,
    octaveOffset: 0,
    attack: 0.002,
    decay: 0.12,
    sustain: 0.1,
    release: 0.08
  },
  {
    id: 'ch_piano_sf',
    name: '🎹 GBA Grand Piano',
    color: '#f472b6', // Pink
    type: 'soundfont',
    preset: 'gm_grand_piano',
    volume: 0.7,
    pan: -0.1,
    mute: false,
    solo: false,
    octaveOffset: 0,
    attack: 0.01,
    decay: 0.8,
    sustain: 0.3,
    release: 0.2
  },
  {
    id: 'ch_strings_sf',
    name: '🎻 Touhou Strings',
    color: '#c084fc', // Purple
    type: 'soundfont',
    preset: 'gm_romantic_strings',
    volume: 0.65,
    pan: 0.15,
    mute: false,
    solo: false,
    octaveOffset: 0,
    attack: 0.08,
    decay: 0.5,
    sustain: 0.85,
    release: 0.4
  }
];

// Nostalgic Undertale / GBA style opening motif
export const DEFAULT_PATTERN: Pattern = {
  id: 'pat_1',
  name: 'Pattern 1 - Overworld Motif',
  lengthSteps: 64, // 4 bars of 16th notes
  notesByChannel: {
    ch_lead_gb: [
      // Bar 1: D4 -> D4 -> D5 -> A4
      { id: 'n1', note: 62, step: 0, duration: 2, velocity: 0.85 },
      { id: 'n2', note: 62, step: 2, duration: 2, velocity: 0.85 },
      { id: 'n3', note: 74, step: 4, duration: 4, velocity: 0.9 },
      { id: 'n4', note: 69, step: 8, duration: 6, velocity: 0.85 },
      { id: 'n5', note: 68, step: 14, duration: 2, velocity: 0.8 },
      // Bar 2: G4 -> F4 -> D4 -> F4 -> G4
      { id: 'n6', note: 67, step: 16, duration: 4, velocity: 0.85 },
      { id: 'n7', note: 65, step: 20, duration: 4, velocity: 0.85 },
      { id: 'n8', note: 62, step: 24, duration: 2, velocity: 0.8 },
      { id: 'n9', note: 65, step: 26, duration: 2, velocity: 0.85 },
      { id: 'n10', note: 67, step: 28, duration: 4, velocity: 0.9 },
      // Bar 3: C4 -> C4 -> D5 -> A4
      { id: 'n11', note: 60, step: 32, duration: 2, velocity: 0.85 },
      { id: 'n12', note: 60, step: 34, duration: 2, velocity: 0.85 },
      { id: 'n13', note: 74, step: 36, duration: 4, velocity: 0.9 },
      { id: 'n14', note: 69, step: 40, duration: 6, velocity: 0.85 },
      // Bar 4: G4 -> F4 -> D4
      { id: 'n15', note: 67, step: 48, duration: 4, velocity: 0.85 },
      { id: 'n16', note: 65, step: 52, duration: 4, velocity: 0.85 },
      { id: 'n17', note: 62, step: 56, duration: 6, velocity: 0.85 }
    ],
    ch_bass_gb: [
      // Walking / Driving bassline (D -> C -> B -> Bb)
      { id: 'b1', note: 50, step: 0, duration: 4, velocity: 0.9 },
      { id: 'b2', note: 50, step: 8, duration: 4, velocity: 0.9 },
      { id: 'b3', note: 50, step: 16, duration: 4, velocity: 0.9 },
      { id: 'b4', note: 53, step: 24, duration: 4, velocity: 0.9 },

      { id: 'b5', note: 48, step: 32, duration: 4, velocity: 0.9 },
      { id: 'b6', note: 48, step: 40, duration: 4, velocity: 0.9 },
      { id: 'b7', note: 47, step: 48, duration: 4, velocity: 0.9 },
      { id: 'b8', note: 46, step: 56, duration: 4, velocity: 0.9 }
    ],
    ch_drums_gb: [
      // Snare on 4, 12, 20, 28...
      { id: 'd1', note: 60, step: 4, duration: 1, velocity: 0.8 },
      { id: 'd2', note: 60, step: 12, duration: 1, velocity: 0.8 },
      { id: 'd3', note: 60, step: 20, duration: 1, velocity: 0.8 },
      { id: 'd4', note: 60, step: 28, duration: 1, velocity: 0.8 },
      { id: 'd5', note: 60, step: 36, duration: 1, velocity: 0.8 },
      { id: 'd6', note: 60, step: 44, duration: 1, velocity: 0.8 },
      { id: 'd7', note: 60, step: 52, duration: 1, velocity: 0.8 },
      { id: 'd8', note: 60, step: 60, duration: 1, velocity: 0.8 }
    ]
  }
};

export const DEFAULT_PATTERN_2: Pattern = {
  id: 'pat_2',
  name: 'Pattern 2 - High Chorus',
  lengthSteps: 64,
  notesByChannel: {
    ch_lead_gb: [
      { id: 'n2_1', note: 74, step: 0, duration: 4, velocity: 0.9 },
      { id: 'n2_2', note: 72, step: 4, duration: 4, velocity: 0.85 },
      { id: 'n2_3', note: 70, step: 8, duration: 4, velocity: 0.85 },
      { id: 'n2_4', note: 69, step: 12, duration: 4, velocity: 0.9 },
      { id: 'n2_5', note: 67, step: 16, duration: 4, velocity: 0.85 },
      { id: 'n2_6', note: 65, step: 20, duration: 4, velocity: 0.85 },
      { id: 'n2_7', note: 67, step: 24, duration: 8, velocity: 0.9 },
      { id: 'n2_8', note: 74, step: 32, duration: 4, velocity: 0.9 },
      { id: 'n2_9', note: 76, step: 36, duration: 4, velocity: 0.9 },
      { id: 'n2_10', note: 77, step: 40, duration: 6, velocity: 0.95 },
      { id: 'n2_11', note: 76, step: 48, duration: 4, velocity: 0.85 },
      { id: 'n2_12', note: 74, step: 52, duration: 4, velocity: 0.85 },
      { id: 'n2_13', note: 72, step: 56, duration: 8, velocity: 0.9 }
    ],
    ch_bass_gb: [
      { id: 'b2_1', note: 50, step: 0, duration: 4, velocity: 0.9 },
      { id: 'b2_2', note: 50, step: 8, duration: 4, velocity: 0.9 },
      { id: 'b2_3', note: 46, step: 16, duration: 4, velocity: 0.9 },
      { id: 'b2_4', note: 46, step: 24, duration: 4, velocity: 0.9 },
      { id: 'b2_5', note: 48, step: 32, duration: 4, velocity: 0.9 },
      { id: 'b2_6', note: 48, step: 40, duration: 4, velocity: 0.9 },
      { id: 'b2_7', note: 50, step: 48, duration: 4, velocity: 0.9 },
      { id: 'b2_8', note: 50, step: 56, duration: 4, velocity: 0.9 }
    ],
    ch_drums_gb: [
      { id: 'd2_1', note: 60, step: 4, duration: 1, velocity: 0.8 },
      { id: 'd2_2', note: 60, step: 12, duration: 1, velocity: 0.8 },
      { id: 'd2_3', note: 60, step: 20, duration: 1, velocity: 0.8 },
      { id: 'd2_4', note: 60, step: 28, duration: 1, velocity: 0.8 },
      { id: 'd2_5', note: 60, step: 36, duration: 1, velocity: 0.8 },
      { id: 'd2_6', note: 60, step: 44, duration: 1, velocity: 0.8 },
      { id: 'd2_7', note: 60, step: 52, duration: 1, velocity: 0.8 },
      { id: 'd2_8', note: 60, step: 60, duration: 1, velocity: 0.8 }
    ]
  }
};

export const DEFAULT_TRACKS: TimelineTrack[] = [
  { id: 'trk_1', name: 'Track 1 (Lead)', color: '#38bdf8', volume: 0.85, pan: 0, mute: false, solo: false },
  { id: 'trk_2', name: 'Track 2 (Arp)', color: '#818cf8', volume: 0.75, pan: 0, mute: false, solo: false },
  { id: 'trk_3', name: 'Track 3 (Bass)', color: '#34d399', volume: 0.9, pan: 0, mute: false, solo: false },
  { id: 'trk_4', name: 'Track 4 (Drums)', color: '#fbbf24', volume: 0.8, pan: 0, mute: false, solo: false },
  { id: 'trk_5', name: 'Track 5 (Accompany)', color: '#f472b6', volume: 0.8, pan: 0, mute: false, solo: false },
  { id: 'trk_6', name: 'Track 6 (FX)', color: '#c084fc', volume: 0.75, pan: 0, mute: false, solo: false }
];

export const DEFAULT_CLIPS: TimelineClip[] = [
  {
    id: 'clip_1',
    trackIndex: 0,
    startStep: 0,
    lengthSteps: 64,
    patternId: 'pat_1',
    name: 'Pattern 1',
    color: '#4f46e5',
    muted: false
  },
  {
    id: 'clip_2',
    trackIndex: 0,
    startStep: 64,
    lengthSteps: 64,
    patternId: 'pat_2',
    name: 'Pattern 2 (Chorus)',
    color: '#6366f1',
    muted: false
  }
];

export function createDefaultProject(): ProjectState {
  return {
    version: '1.0.0',
    name: 'ChromaAudio Project 1',
    bpm: 130,
    snapGrid: 1, // 16th note snap
    activePatternId: 'pat_1',
    channels: DEFAULT_CHANNELS,
    patterns: [DEFAULT_PATTERN, DEFAULT_PATTERN_2],
    tracks: DEFAULT_TRACKS,
    timelineClips: DEFAULT_CLIPS,
    dsp: {
      enabled: false,
      resampleRate: 18157, // GBA
      bitDepth: 8,
      reverbEnabled: true,
      reverbDecay: 1.2,
      reverbWet: 0.2,
      filterCutoff: 18000,
      filterResonance: 1.0
    },
    loopStartStep: 0,
    loopLengthSteps: 128,
    scaleRoot: 2, // D
    scaleMode: 'dorian' // D Dorian / Minor
  };
}
