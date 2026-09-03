import React, { useState } from 'react';
import { NoteEvent, InstrumentChannel, DSPConfig } from '../../types/audio';
import { SCALES, NOTE_NAMES } from './ScaleEngine';
import { X, Sparkles, Wand2, Music, Drum, Check, Zap, Gauge, KeyRound, Cpu, Layers, RefreshCw, Dices } from 'lucide-react';

export interface StyleArchetype {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  recommendedBpm: number;
  recommendedRoot: number; // 0 = C, 2 = D, etc.
  recommendedScale: string;
  dspPreset: {
    name: string;
    config: Partial<DSPConfig>;
  };
  progressionName: string;
  chords: { rootOffset: number; type: 'maj' | 'min' | 'maj7' | 'min7' | 'dom7' | 'dim' }[];
  description: string;
  melodicHookDescription: string;
}

export const STYLE_ARCHETYPES: StyleArchetype[] = [
  {
    id: 'battle',
    name: 'Heroic JRPG Battle',
    subtitle: 'Pokémon RSE / Golden Sun / Mega Man Battle',
    icon: '⚔️',
    recommendedBpm: 152,
    recommendedRoot: 2, // D
    recommendedScale: 'dorian',
    dspPreset: {
      name: 'GBA Sound Driver (18.157 kHz + 8-bit)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 1.0,
        reverbWet: 0.2,
        filterCutoff: 18000,
        filterResonance: 1.0
      }
    },
    progressionName: 'Andalusian / Dorian Battle (i – ♭VII – ♭VI – V7)',
    chords: [
      { rootOffset: 0, type: 'min' },  // i (Dm)
      { rootOffset: 10, type: 'maj' }, // bVII (C)
      { rootOffset: 8, type: 'maj' },  // bVI (Bb)
      { rootOffset: 7, type: 'dom7' }  // V7 (A7)
    ],
    description: 'High-stakes battle with driving 16th pulse leads, rapid walking bass, and explosive 16th noise percussion.',
    melodicHookDescription: 'Syncopated 16th lead with antecedent call-and-response and chromatic upper grace scoops.'
  },
  {
    id: 'overworld',
    name: 'Overworld Adventure',
    subtitle: 'Golden Sun Exploration / Pokémon Route 101',
    icon: '🧭',
    recommendedBpm: 128,
    recommendedRoot: 5, // F
    recommendedScale: 'major',
    dspPreset: {
      name: 'GBA Warm Plate Reverb (18.157 kHz)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 1.5,
        reverbWet: 0.25,
        filterCutoff: 19000,
        filterResonance: 0.8
      }
    },
    progressionName: 'Pokémon Adventure Cadence (I – ♭VII – IV – I)',
    chords: [
      { rootOffset: 0, type: 'maj' },  // I (F)
      { rootOffset: 10, type: 'maj' }, // bVII (Eb)
      { rootOffset: 5, type: 'maj' },  // IV (Bb)
      { rootOffset: 0, type: 'maj' }   // I (F)
    ],
    description: 'Boundless exploration and wanderlust. The ♭VII flat-seven injects heroic optimism and expansive open skies.',
    melodicHookDescription: 'Soaring triadic leaps (1 -> 5 -> 6 -> 5) with joyful dotted-eighth syncopation.'
  },
  {
    id: 'town',
    name: 'Cozy RPG Village',
    subtitle: 'Mother 3 / Animal Crossing / Pokémon Center',
    icon: '☕',
    recommendedBpm: 92,
    recommendedRoot: 0, // C
    recommendedScale: 'major',
    dspPreset: {
      name: 'Cozy Lofi DS Acoustics (22 kHz + Warm Filter)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 1.8,
        reverbWet: 0.3,
        filterCutoff: 12000,
        filterResonance: 0.7
      }
    },
    progressionName: 'Village Haven (IΔ7 – vi7 – ii7 – V7)',
    chords: [
      { rootOffset: 0, type: 'maj7' }, // Cmaj7
      { rootOffset: 9, type: 'min7' }, // Am7
      { rootOffset: 2, type: 'min7' }, // Dm7
      { rootOffset: 7, type: 'dom7' }  // G7
    ],
    description: 'Safe haven tavern and warm fireplace glow. Lush circle-of-fifths 7th chords with gentle half-time brush groove.',
    melodicHookDescription: 'Lyrical step-wise descending sighs with resting pauses on warm 7ths and 9ths.'
  },
  {
    id: 'toby',
    name: 'Bittersweet Journey',
    subtitle: 'Undertale / Deltarune / EarthBound Motif',
    icon: '🧡',
    recommendedBpm: 106,
    recommendedRoot: 7, // G
    recommendedScale: 'major',
    dspPreset: {
      name: 'Undertale Hall Reverb (16 kHz Lofi)',
      config: {
        enabled: true,
        resampleRate: 16000,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 2.2,
        reverbWet: 0.35,
        filterCutoff: 16000,
        filterResonance: 1.0
      }
    },
    progressionName: 'Toby Fox Emotional Walkdown (vi – V – IV – V)',
    chords: [
      { rootOffset: 9, type: 'min' },  // Em
      { rootOffset: 7, type: 'maj' },  // D
      { rootOffset: 5, type: 'maj' },  // C
      { rootOffset: 7, type: 'maj' }   // D
    ],
    description: 'Bittersweet nostalgia and determination. The step-wise descending bassline conveys heartfelt storytelling.',
    melodicHookDescription: 'Memorable 4-bar leitmotif: 3-note theme (3-2-1), upward echo, climax arch, and gentle resolution.'
  },
  {
    id: 'dungeon',
    name: 'Ancient Catacombs & Ruins',
    subtitle: 'Zelda / Castlevania / Metroid Fusion',
    icon: '🏰',
    recommendedBpm: 112,
    recommendedRoot: 9, // A
    recommendedScale: 'phrygian',
    dspPreset: {
      name: 'DS Echo Chamber (32 kHz + Deep Reverb)',
      config: {
        enabled: true,
        resampleRate: 32000,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 2.8,
        reverbWet: 0.45,
        filterCutoff: 10000,
        filterResonance: 2.0
      }
    },
    progressionName: 'Ancient Phrygian Mystery (i – iv – ♭VI – V)',
    chords: [
      { rootOffset: 0, type: 'min' }, // Am
      { rootOffset: 5, type: 'min' }, // Dm
      { rootOffset: 8, type: 'maj' }, // F
      { rootOffset: 7, type: 'dom7' } // E7
    ],
    description: 'Creeping darkness and echoing stone chambers. Minor 2nd Phrygian chromatic stabs and ominous walking drone bass.',
    melodicHookDescription: 'Sparse, eerie minor intervals with dramatic atmospheric pauses between phrases.'
  },
  {
    id: 'boss',
    name: 'Boss Fight Climax',
    subtitle: 'Touhou / Final Fantasy / Megalovania',
    icon: '🔥',
    recommendedBpm: 168,
    recommendedRoot: 0, // C
    recommendedScale: 'minor',
    dspPreset: {
      name: 'Tight Punchy Boss Compression (18.157 kHz)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 0.8,
        reverbWet: 0.15,
        filterCutoff: 20000,
        filterResonance: 1.5
      }
    },
    progressionName: 'High-Speed Boss Rush (i – ♭VII – ♭VI – V7)',
    chords: [
      { rootOffset: 0, type: 'min' },  // Cm
      { rootOffset: 10, type: 'maj' }, // Bb
      { rootOffset: 8, type: 'maj' },  // Ab
      { rootOffset: 7, type: 'dom7' }  // G7
    ],
    description: 'Maximum adrenaline battle rush. Four-on-the-floor Eurobeat kicks, pumping offbeat noise hats, and octave synth stabs.',
    melodicHookDescription: 'Blistering 16th-note scalar runs with harmonic minor leading tones (#7) and octave stabs.'
  }
];

interface SongwritingAssistantModalProps {
  isOpen: boolean;
  channel: InstrumentChannel;
  channels?: InstrumentChannel[];
  bpm?: number;
  scaleRoot: number;
  scaleMode: string;
  lengthSteps: number;
  dsp?: DSPConfig;
  onClose: () => void;
  onApplyNotes: (notes: NoteEvent[]) => void;
  onApplyFullArrangement?: (notesByChannel: Record<string, NoteEvent[]>) => void;
  onChangeBpm?: (bpm: number) => void;
  onChangeScaleRoot?: (root: number) => void;
  onChangeScaleMode?: (mode: string) => void;
  onUpdateDSP?: (dsp: Partial<DSPConfig>) => void;
}

export const SongwritingAssistantModal: React.FC<SongwritingAssistantModalProps> = ({
  isOpen,
  channel,
  channels = [],
  bpm = 130,
  scaleRoot,
  scaleMode,
  lengthSteps,
  onClose,
  onApplyNotes,
  onApplyFullArrangement,
  onChangeBpm,
  onChangeScaleRoot,
  onChangeScaleMode,
  onUpdateDSP
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'chords' | 'drums'>('style');

  // Selected Style Archetype
  const [selectedStyleId, setSelectedStyleId] = useState<string>('battle');
  const activeStyle = STYLE_ARCHETYPES.find(s => s.id === selectedStyleId) || STYLE_ARCHETYPES[0];

  // Procedural Variation Seed (Increments every time the user clicks "Reroll")
  const [variationSeed, setVariationSeed] = useState<number>(1);

  // Generation Target: Active Channel vs Full Band
  const [generationScope, setGenerationScope] = useState<'single' | 'full'>('full');

  // Melody & Motif controls
  const [melodyDensity, setMelodyDensity] = useState<'sparse' | 'melodic' | 'energetic'>('melodic');
  const [octaveShift, setOctaveShift] = useState<number>(0);

  // Chords state
  const [chordRhythm, setChordRhythm] = useState<'whole' | 'half' | 'pulse'>('whole');
  const [chordOctave, setChordOctave] = useState<number>(4);

  // Drums state
  const [drumTurnaround, setDrumTurnaround] = useState<boolean>(true);

  if (!isOpen) return null;

  // -----------------------------------------------------------
  // 1-CLICK STYLE SETTINGS APPLIERS
  // -----------------------------------------------------------
  const handleApplyBpm = () => {
    if (onChangeBpm) onChangeBpm(activeStyle.recommendedBpm);
  };

  const handleApplyKey = () => {
    if (onChangeScaleRoot) onChangeScaleRoot(activeStyle.recommendedRoot);
    if (onChangeScaleMode) onChangeScaleMode(activeStyle.recommendedScale);
  };

  const handleApplyDSP = () => {
    if (onUpdateDSP) onUpdateDSP(activeStyle.dspPreset.config);
  };

  const handleApplyAllStyleSettings = () => {
    handleApplyBpm();
    handleApplyKey();
    handleApplyDSP();
  };

  // -----------------------------------------------------------
  // PROCEDURAL MOTIVIC GENERATION ENGINES
  // -----------------------------------------------------------

  // Computes chord tones across 4 bars for the selected style
  const getStyleChordTones = (bar: number, rootPitch: number, octave: number = 4) => {
    const chordDef = activeStyle.chords[bar % activeStyle.chords.length];
    const chordRoot = octave * 12 + rootPitch + chordDef.rootOffset;

    let intervals = [0, 4, 7]; // default major triad
    if (chordDef.type === 'min') intervals = [0, 3, 7];
    if (chordDef.type === 'maj7') intervals = [0, 4, 7, 11];
    if (chordDef.type === 'min7') intervals = [0, 3, 7, 10];
    if (chordDef.type === 'dom7') intervals = [0, 4, 7, 10];
    if (chordDef.type === 'dim') intervals = [0, 3, 6];

    return intervals.map(i => chordRoot + i);
  };

  // 1. Procedural Lead Melody Engine (Variations + Density Modulated)
  const generateLeadMelody = (rootPitch: number = scaleRoot): NoteEvent[] => {
    const baseOctave = 5 + octaveShift;
    const rawNotes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const chordTones = getStyleChordTones(bar, rootPitch, baseOctave);
      const rootTone = chordTones[0];
      const thirdTone = chordTones[1];
      const fifthTone = chordTones[2];
      const seventhTone = chordTones[3] || rootTone + 10;

      // Phrase variant selector combines seed and bar index
      const phraseVariant = ((variationSeed - 1) + bar * 3) % 4;

      if (activeStyle.id === 'battle') {
        // Battle Archetype: 4 Distinct Phrase Variants
        switch (phraseVariant) {
          case 0: // Classic Syncopated 16th Riff
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 2, step: barStart + 2, duration: 1, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_3`, note: thirdTone, step: barStart + 3, duration: 1, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 2, step: barStart + 8, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 1.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: thirdTone, step: barStart + 12, duration: 3.5, velocity: 0.95 });
            break;
          case 1: // Ascending Triadic Sweep into High Climax
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_3`, note: thirdTone, step: barStart + 3, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_5`, note: fifthTone, step: barStart + 5, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_7`, note: rootTone + 12, step: barStart + 7, duration: 3, velocity: 1.0 }); // High Climax!
            rawNotes.push({ id: `lead_${bar}_11`, note: fifthTone + 2, step: barStart + 11, duration: 1, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 3.5, velocity: 0.95 });
            break;
          case 2: // Offbeat Syncopated Stabs
            rawNotes.push({ id: `lead_${bar}_2`, note: thirdTone, step: barStart + 2, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_7`, note: rootTone + 12, step: barStart + 7, duration: 2, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: thirdTone, step: barStart + 13, duration: 2.5, velocity: 0.85 });
            break;
          case 3: // Rapid Heroic Scalar Run & Resolution
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 1, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_1`, note: rootTone + 2, step: barStart + 1, duration: 1, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_2`, note: thirdTone, step: barStart + 2, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 2, step: barStart + 8, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 1.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4, velocity: 1.0 });
            break;
        }
      } else if (activeStyle.id === 'overworld') {
        // Overworld Archetype: 4 Distinct Phrase Variants
        switch (phraseVariant) {
          case 0: // Soaring Triadic Leap (1 -> 5 -> 6 -> 5)
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_3`, note: thirdTone, step: barStart + 3, duration: 1, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 2, step: barStart + 8, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 4, velocity: 0.9 });
            break;
          case 1: // Stepwise Joyful Wanderlust (1 -> 2 -> 3 -> 5)
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 2, step: barStart + 2, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 3.5, velocity: 0.95 });
            break;
          case 2: // Horn Fanfare Call & Echo
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 12, step: barStart + 2, duration: 3, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone, step: barStart + 6, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: thirdTone, step: barStart + 8, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4, velocity: 0.95 });
            break;
          case 3: // Syncopated Dance Contour
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_3`, note: fifthTone, step: barStart + 3, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_6`, note: rootTone + 12, step: barStart + 6, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 2, step: barStart + 8, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_11`, note: fifthTone, step: barStart + 11, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: thirdTone, step: barStart + 13, duration: 2.5, velocity: 0.85 });
            break;
        }
      } else if (activeStyle.id === 'town') {
        // Cozy Village: 4 Lyrical Variants
        switch (phraseVariant) {
          case 0: // Gentle Stepwise Descending Sigh
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone, step: barStart + 0, duration: 3.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_6`, note: seventhTone, step: barStart + 6, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 4, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: thirdTone, step: barStart + 13, duration: 3, velocity: 0.8 });
            break;
          case 1: // Ascending Acoustic Pluck Motif
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 2.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 4, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone + 12, step: barStart + 13, duration: 2.5, velocity: 0.8 });
            break;
          case 2: // Warm Jazz 7th/9th Cadence
            rawNotes.push({ id: `lead_${bar}_2`, note: thirdTone, step: barStart + 2, duration: 2.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_5`, note: fifthTone, step: barStart + 5, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_8`, note: seventhTone, step: barStart + 8, duration: 3.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 3.5, velocity: 0.85 });
            break;
          case 3: // Music-box Lullaby Turnaround
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_6`, note: rootTone + 2, step: barStart + 6, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone, step: barStart + 8, duration: 6, velocity: 0.9 });
            break;
        }
      } else if (activeStyle.id === 'toby') {
        // Toby Fox / Undertale Leitmotif: 4 Emotional Variants
        switch (phraseVariant) {
          case 0: // Iconic 3-Note Theme (3 -> 2 -> 1)
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 2, step: barStart + 2, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone, step: barStart + 4, duration: 4, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone + 2, step: barStart + 10, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 4, velocity: 0.9 });
            break;
          case 1: // Upward Emotional Resolve (1 -> 2 -> 3 -> 5)
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 2, step: barStart + 2, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 3.5, velocity: 1.0 });
            break;
          case 2: // Rest on Beat 1 into Poignant Climax
            rawNotes.push({ id: `lead_${bar}_2`, note: thirdTone, step: barStart + 2, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 12, step: barStart + 8, duration: 3.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 3.5, velocity: 0.9 });
            break;
          case 3: // Gentle Chiptune Bell Cascade
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_6`, note: thirdTone, step: barStart + 6, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 2, step: barStart + 8, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4, velocity: 0.95 });
            break;
        }
      } else if (activeStyle.id === 'dungeon') {
        // Ancient Catacombs: 4 Phrygian Chromatic Variants
        switch (phraseVariant) {
          case 0: // Minor 2nd Chromatic Stab & Silence
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 4, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_6`, note: rootTone + 1, step: barStart + 6, duration: 2, velocity: 0.85 }); // Minor 2nd Phrygian tension!
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone, step: barStart + 8, duration: 4, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: fifthTone, step: barStart + 13, duration: 3, velocity: 0.85 });
            break;
          case 1: // Diminished Tritone Crawl
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 6, step: barStart + 4, duration: 3, velocity: 0.95 }); // Tritone!
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 1, step: barStart + 12, duration: 3.5, velocity: 0.85 });
            break;
          case 2: // Ominous Bell Toll Octaves
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 3, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone, step: barStart + 4, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 13, step: barStart + 8, duration: 3, velocity: 0.95 }); // High minor 2nd!
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 3.5, velocity: 0.9 });
            break;
          case 3: // Slow Dissonant Suspension
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 5, step: barStart + 2, duration: 3, velocity: 0.9 }); // Suspended 4th
            rawNotes.push({ id: `lead_${bar}_6`, note: thirdTone, step: barStart + 6, duration: 3, velocity: 0.85 }); // Resolution
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 1, step: barStart + 10, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4, velocity: 0.95 });
            break;
        }
      } else {
        // Boss Fight Climax: 4 Blistering Variants
        switch (phraseVariant) {
          case 0: // Blistering 16th Octave Stabs
            for (let s = 0; s < 16; s += 2) {
              const octaveNote = s % 4 === 0 ? rootTone + 12 : rootTone;
              rawNotes.push({
                id: `lead_${bar}_${s}`,
                note: octaveNote,
                step: barStart + s,
                duration: 1.5,
                velocity: s === 0 || s === 8 ? 1.0 : 0.85
              });
            }
            break;
          case 1: // Cascading 16th Harmonic Minor Waterfall
            const run = [rootTone + 12, rootTone + 11, rootTone + 8, rootTone + 7, rootTone + 5, rootTone + 3, rootTone + 2, rootTone];
            run.forEach((notePitch, idx) => {
              rawNotes.push({
                id: `lead_${bar}_${idx * 2}`,
                note: notePitch,
                step: barStart + (idx * 2),
                duration: 1.8,
                velocity: idx === 0 ? 1.0 : 0.85
              });
            });
            break;
          case 2: // Offbeat Power Stabs
            [2, 6, 10, 14].forEach(s => {
              rawNotes.push({
                id: `lead_${bar}_${s}`,
                note: rootTone + 12,
                step: barStart + s,
                duration: 1.8,
                velocity: 0.98
              });
            });
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 2, velocity: 0.95 });
            break;
          case 3: // Galloping High-Register Tremolo Lead
            for (let s = 0; s < 16; s += 2) {
              const pitch = s < 8 ? fifthTone + 12 : rootTone + 12;
              rawNotes.push({
                id: `lead_${bar}_${s}`,
                note: pitch,
                step: barStart + s,
                duration: 1.5,
                velocity: 0.9
              });
            }
            break;
        }
      }
    }

    // Apply Density Modulation:
    if (melodyDensity === 'sparse') {
      // Keep only anchor notes on primary beats (steps 0, 4, 8, 12) with longer durations
      return rawNotes.filter((n, idx) => idx % 2 === 0).map(n => ({
        ...n,
        duration: Math.min(6, n.duration * 1.6)
      }));
    } else if (melodyDensity === 'energetic') {
      // Add extra 16th grace notes / pickups
      const energeticNotes: NoteEvent[] = [...rawNotes];
      rawNotes.forEach(n => {
        if (n.step % 4 === 0 && n.step > 0) {
          energeticNotes.push({
            id: `pickup_${n.id}`,
            note: n.note - 2,
            step: n.step - 1,
            duration: 0.8,
            velocity: 0.7
          });
        }
      });
      return energeticNotes.sort((a, b) => a.step - b.step);
    }

    return rawNotes;
  };

  // 2. Chiptune Arpeggio Bed Engine (Seed-Varied Cascades)
  const generateArpBed = (rootPitch: number = scaleRoot): NoteEvent[] => {
    const notes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);
    const arpStyle = variationSeed % 3; // 0 = Up, 1 = Up-Down, 2 = Broken

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const chordTones = getStyleChordTones(bar, rootPitch, 5); // Octave 5 arpeggios
      const len = chordTones.length;

      for (let s = 0; s < 16; s++) {
        let pitchIndex = s % len;
        if (arpStyle === 1) {
          // Ping-Pong Up and Down
          const cycle = (len * 2) - 2;
          const pos = s % cycle;
          pitchIndex = pos < len ? pos : cycle - pos;
        } else if (arpStyle === 2) {
          // Broken Arp (0, 2, 1, 2)
          const pattern = [0, 2, 1, 2];
          pitchIndex = pattern[s % pattern.length] % len;
        }

        notes.push({
          id: `arp_${bar}_${s}`,
          note: chordTones[pitchIndex],
          step: barStart + s,
          duration: 1,
          velocity: s % 4 === 0 ? 0.75 : 0.6
        });
      }
    }

    return notes;
  };

  // 3. Driving Walking / Slap Bass Engine (Seed-Varied Patterns)
  const generateBassline = (rootPitch: number = scaleRoot): NoteEvent[] => {
    const notes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);
    const bassStyle = variationSeed % 4;

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const chordTones = getStyleChordTones(bar, rootPitch, 3); // Octave 3 bass
      const root = chordTones[0];
      const fifth = chordTones[2] || root + 7;

      switch (bassStyle) {
        case 0: // Classic Walking Bass (Root -> Octave -> 5th -> Chromatic Approach)
          notes.push({ id: `bass_${bar}_0`, note: root, step: barStart + 0, duration: 3.5, velocity: 0.95 });
          notes.push({ id: `bass_${bar}_4`, note: root + 12, step: barStart + 4, duration: 2, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_6`, note: root, step: barStart + 6, duration: 1.5, velocity: 0.8 });
          notes.push({ id: `bass_${bar}_8`, note: fifth, step: barStart + 8, duration: 3.5, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_12`, note: root + 12, step: barStart + 12, duration: 2, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_14`, note: root - 1, step: barStart + 14, duration: 1.5, velocity: 0.9 });
          break;
        case 1: // Golden Sun Bouncy Root-Fifth-Octave
          notes.push({ id: `bass_${bar}_0`, note: root, step: barStart + 0, duration: 2, velocity: 0.95 });
          notes.push({ id: `bass_${bar}_2`, note: fifth, step: barStart + 2, duration: 2, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_4`, note: root + 12, step: barStart + 4, duration: 2, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_6`, note: fifth, step: barStart + 6, duration: 2, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_8`, note: root, step: barStart + 8, duration: 2, velocity: 0.95 });
          notes.push({ id: `bass_${bar}_10`, note: fifth, step: barStart + 10, duration: 2, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_12`, note: root + 12, step: barStart + 12, duration: 3.5, velocity: 0.9 });
          break;
        case 2: // Driving Pumping 8ths (High-Energy Rock/JRPG)
          for (let s = 0; s < 16; s += 2) {
            notes.push({
              id: `bass_${bar}_${s}`,
              note: s >= 12 ? fifth : root,
              step: barStart + s,
              duration: 1.8,
              velocity: s % 4 === 0 ? 0.95 : 0.8
            });
          }
          break;
        case 3: // Syncopated Slap Bounce (Offbeat Syncopation)
          notes.push({ id: `bass_${bar}_0`, note: root, step: barStart + 0, duration: 2.5, velocity: 1.0 });
          notes.push({ id: `bass_${bar}_3`, note: root + 12, step: barStart + 3, duration: 1.5, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_6`, note: fifth, step: barStart + 6, duration: 2, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_10`, note: root + 12, step: barStart + 10, duration: 2, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_13`, note: root - 2, step: barStart + 13, duration: 2.5, velocity: 0.85 });
          break;
      }
    }

    return notes;
  };

  // 4. Retro Drum Beat Engine (Seed-Varied Grooves & Turnaround Fills)
  const generateDrumBeat = (): NoteEvent[] => {
    const notes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);
    const drumGrooveStyle = variationSeed % 3;

    const KICK = 48;      // Low Thump
    const SNARE = 50;     // Snappy Noise Snare
    const CLOSED_HAT = 54;// Metallic Hat
    const OPEN_HAT = 58;  // Sizzle Hat

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const isLastBar = bar === totalBars - 1;

      if (activeStyle.id === 'town') {
        // Half-time relaxed town groove
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 3, velocity: 0.85 });
        notes.push({ id: `ds_${bar}_8`, note: SNARE, step: barStart + 8, duration: 2, velocity: 0.75 });
        for (let s = 0; s < 16; s += 2) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.5, velocity: s % 4 === 0 ? 0.7 : 0.55 });
        }
      } else if (activeStyle.id === 'boss') {
        // Eurobeat 4-on-the-floor
        [0, 4, 8, 12].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 2, velocity: 0.98 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        [2, 6, 10, 14].forEach(s => {
          notes.push({ id: `doh_${bar}_${s}`, note: OPEN_HAT, step: barStart + s, duration: 1.8, velocity: 0.9 });
        });
      } else {
        // Varied Battle & Adventure Grooves:
        if (drumGrooveStyle === 0) {
          // Standard Driving 16th Beat
          notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.95 });
          notes.push({ id: `dk_${bar}_8`, note: KICK, step: barStart + 8, duration: 2, velocity: 0.9 });
          notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        } else if (drumGrooveStyle === 1) {
          // Syncopated Tresillo Kick (beats 1, 2-and, 4)
          notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.95 });
          notes.push({ id: `dk_${bar}_6`, note: KICK, step: barStart + 6, duration: 2, velocity: 0.9 });
          notes.push({ id: `dk_${bar}_10`, note: KICK, step: barStart + 10, duration: 2, velocity: 0.9 });
          notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        } else {
          // Double-Time Driving Kick (1, 2, 3, 4 with syncopated ghost snare)
          [0, 4, 8, 12].forEach(s => notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.5, velocity: 0.9 }));
          notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_14`, note: SNARE, step: barStart + 14, duration: 1, velocity: 0.7 }); // Ghost snare
        }

        // Hats with Turnaround Fill at End:
        for (let s = 0; s < 16; s++) {
          if (isLastBar && drumTurnaround && s >= 12) {
            // Turnaround Snare Roll Fill
            notes.push({ id: `fill_${bar}_${s}`, note: SNARE, step: barStart + s, duration: 1, velocity: 0.75 + (s - 12) * 0.08 });
          } else {
            notes.push({
              id: `dh_${bar}_${s}`,
              note: s % 4 === 2 ? OPEN_HAT : CLOSED_HAT,
              step: barStart + s,
              duration: 1,
              velocity: s % 2 === 0 ? 0.85 : 0.65
            });
          }
        }
      }
    }

    return notes;
  };

  // 5. Sustained Chords Engine
  const generateChordsOnly = (rootPitch: number = scaleRoot): NoteEvent[] => {
    const notes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const chordPitches = getStyleChordTones(bar, rootPitch, chordOctave);

      if (chordRhythm === 'whole') {
        chordPitches.forEach((pitch, idx) => {
          notes.push({ id: `ch_${bar}_${idx}`, note: pitch, step: barStart, duration: 16, velocity: 0.75 });
        });
      } else if (chordRhythm === 'half') {
        [0, 8].forEach(offset => {
          chordPitches.forEach((pitch, idx) => {
            notes.push({ id: `ch_${bar}_${offset}_${idx}`, note: pitch, step: barStart + offset, duration: 7.5, velocity: 0.75 });
          });
        });
      } else {
        // 8th Pulse
        for (let s = 0; s < 16; s += 2) {
          chordPitches.forEach((pitch, idx) => {
            notes.push({ id: `ch_${bar}_${s}_${idx}`, note: pitch, step: barStart + s, duration: 1.5, velocity: s % 4 === 0 ? 0.8 : 0.65 });
          });
        }
      }
    }

    return notes;
  };

  // Final Action Handler: Apply generated notes
  const handleApply = () => {
    if (activeTab === 'style') {
      if (generationScope === 'full' && onApplyFullArrangement && channels.length >= 2) {
        // Automatically map parts across channels
        const leadChan = channels[0];
        const arpChan = channels[1] || channels[0];
        const bassChan = channels.find(c => c.id.includes('bass') || c.name.toLowerCase().includes('bass')) || channels[2] || channels[0];
        const drumChan = channels.find(c => c.id.includes('drum') || c.name.toLowerCase().includes('drum') || c.preset === 'noise') || channels[3] || channels[0];

        const arrangement: Record<string, NoteEvent[]> = {};
        arrangement[leadChan.id] = generateLeadMelody();
        if (arpChan.id !== leadChan.id) arrangement[arpChan.id] = generateArpBed();
        if (bassChan.id !== leadChan.id && bassChan.id !== arpChan.id) arrangement[bassChan.id] = generateBassline();
        if (drumChan.id !== leadChan.id && drumChan.id !== bassChan.id) arrangement[drumChan.id] = generateDrumBeat();

        onApplyFullArrangement(arrangement);
      } else {
        // Single Active Channel Lead Melody
        const leadNotes = generateLeadMelody();
        onApplyNotes(leadNotes);
      }
    } else if (activeTab === 'chords') {
      const chordNotes = generateChordsOnly();
      onApplyNotes(chordNotes);
    } else if (activeTab === 'drums') {
      const drumNotes = generateDrumBeat();
      onApplyNotes(drumNotes);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Wand2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-100">
                  Songwriting & Style Assistant
                </h2>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-mono border border-indigo-700/50">
                  GBA • DS • Indie RPG
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Target: <span className="font-semibold text-gray-200">{channel.name}</span> • Current: <span className="font-mono text-emerald-400 font-bold">{bpm} BPM</span>, <span className="font-mono text-indigo-400 font-bold">{NOTE_NAMES[scaleRoot]} {scaleMode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Style Preset Recommendation Banner */}
        <div className="px-6 py-3.5 bg-indigo-950/40 border-b border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Gauge size={14} className="text-emerald-400" />
              <span>Recommended BPM:</span>
              <span className="font-bold text-emerald-300">{activeStyle.recommendedBpm} BPM</span>
              {bpm !== activeStyle.recommendedBpm && (
                <button
                  onClick={handleApplyBpm}
                  className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold ml-1 transition-colors"
                >
                  Set {activeStyle.recommendedBpm}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-gray-300">
              <KeyRound size={14} className="text-indigo-400" />
              <span>Recommended Key:</span>
              <span className="font-bold text-indigo-300">
                {NOTE_NAMES[activeStyle.recommendedRoot]} {activeStyle.recommendedScale}
              </span>
              {(scaleRoot !== activeStyle.recommendedRoot || scaleMode !== activeStyle.recommendedScale) && (
                <button
                  onClick={handleApplyKey}
                  className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-bold ml-1 transition-colors"
                >
                  Set Key
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-gray-300 hidden md:flex">
              <Cpu size={14} className="text-purple-400" />
              <span className="text-[11px] text-gray-400">{activeStyle.dspPreset.name}</span>
              <button
                onClick={handleApplyDSP}
                className="px-2 py-0.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded text-[10px] font-bold ml-1 transition-colors"
              >
                Set DSP
              </button>
            </div>
          </div>

          <button
            onClick={handleApplyAllStyleSettings}
            title="Set Recommended BPM, Key, and Console DSP in 1 click"
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition-all ml-auto"
          >
            <Zap size={12} />
            <span>Apply All Style Vibe</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-gray-800 bg-gray-950/60 px-6 gap-2">
          <button
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'style'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Song Style & Motif Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('chords')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'chords'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Music size={14} />
            <span>JRPG Chord Progressions</span>
          </button>

          <button
            onClick={() => setActiveTab('drums')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'drums'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Drum size={14} />
            <span>Retro Drum Grooves</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* 1. SONG STYLE TAB */}
          {activeTab === 'style' && (
            <div className="space-y-4">
              {/* Generation Scope Selector & Variation Reroll */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-300 block">Generation Scope</span>
                    <span className="text-[11px] text-gray-400">
                      {generationScope === 'full' 
                        ? 'Full Band: Lead, Arp, Bass, Drums'
                        : `Target: ${channel.name}`}
                    </span>
                  </div>

                  <div className="flex rounded-lg bg-gray-900 p-1 border border-gray-800 text-xs font-mono">
                    <button
                      onClick={() => setGenerationScope('full')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                        generationScope === 'full'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Layers size={13} />
                      <span>Full Band</span>
                    </button>
                    <button
                      onClick={() => setGenerationScope('single')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        generationScope === 'single'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Channel
                    </button>
                  </div>
                </div>

                {/* Procedural Reroll Button */}
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-gray-200">Motif Variation</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        #{variationSeed}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Generates unique phrases & rhythms</span>
                  </div>

                  <button
                    onClick={() => setVariationSeed(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
                  >
                    <RefreshCw size={12} className="animate-spin-once" />
                    <span>🎲 Reroll</span>
                  </button>
                </div>
              </div>

              {/* Archetype Cards */}
              <div>
                <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Select Musical Style Archetype
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {STYLE_ARCHETYPES.map(style => (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedStyleId === style.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                          : 'bg-gray-800/60 border-gray-700/70 hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{style.icon}</span>
                          <div>
                            <div className="font-bold text-xs text-indigo-300">{style.name}</div>
                            <div className="text-[10px] text-gray-400">{style.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-emerald-400">
                          {style.recommendedBpm} BPM
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 mt-2 leading-relaxed">
                        {style.description}
                      </p>

                      <div className="mt-2 text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        {style.melodicHookDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Density & Octave controls */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <label className="text-xs font-mono text-gray-400 block mb-2">Phrasing & Density</label>
                  <div className="flex rounded-lg bg-gray-900 p-1 border border-gray-800">
                    {(['sparse', 'melodic', 'energetic'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setMelodyDensity(d)}
                        className={`flex-1 py-1 text-xs rounded-md capitalize font-mono transition-colors ${
                          melodyDensity === d ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <label className="text-xs font-mono text-gray-400 block mb-2">Lead Octave Shift</label>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setOctaveShift(prev => Math.max(-2, prev - 1))}
                      className="px-3 py-1 bg-gray-900 hover:bg-gray-850 rounded border border-gray-800 font-mono text-xs text-gray-300"
                    >
                      -1 Oct
                    </button>
                    <span className="font-mono font-bold text-xs text-indigo-400">
                      {octaveShift >= 0 ? `+${octaveShift}` : octaveShift} Oct
                    </span>
                    <button
                      onClick={() => setOctaveShift(prev => Math.min(2, prev + 1))}
                      className="px-3 py-1 bg-gray-900 hover:bg-gray-850 rounded border border-gray-800 font-mono text-xs text-gray-300"
                    >
                      +1 Oct
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHORDS TAB */}
          {activeTab === 'chords' && (
            <div className="space-y-4">
              <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider block">
                Chord Progression Voicing
              </label>

              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Active Progression for {activeStyle.name}:</div>
                <div className="text-sm font-bold text-amber-400 font-mono">{activeStyle.progressionName}</div>
                <div className="text-xs text-gray-300 mt-2">{activeStyle.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <label className="text-xs font-mono text-gray-400 block mb-2">Chord Rhythm</label>
                  <div className="flex rounded-lg bg-gray-900 p-1 border border-gray-800">
                    {[
                      { id: 'whole', label: 'Whole Notes' },
                      { id: 'half', label: 'Half Notes' },
                      { id: 'pulse', label: '8th Pulse' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setChordRhythm(r.id as any)}
                        className={`flex-1 py-1 text-[11px] rounded-md font-mono transition-colors ${
                          chordRhythm === r.id ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <label className="text-xs font-mono text-gray-400 block mb-2">Chord Base Register</label>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setChordOctave(prev => Math.max(2, prev - 1))}
                      className="px-3 py-1 bg-gray-900 hover:bg-gray-850 rounded border border-gray-800 font-mono text-xs text-gray-300"
                    >
                      -1 Oct
                    </button>
                    <span className="font-mono font-bold text-xs text-indigo-400">
                      C{chordOctave} (Octave {chordOctave})
                    </span>
                    <button
                      onClick={() => setChordOctave(prev => Math.min(6, prev + 1))}
                      className="px-3 py-1 bg-gray-900 hover:bg-gray-850 rounded border border-gray-800 font-mono text-xs text-gray-300"
                    >
                      +1 Oct
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. DRUMS TAB */}
          {activeTab === 'drums' && (
            <div className="space-y-4">
              <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider block">
                Retro Drum Groove Parameters
              </label>

              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Drum Groove Style:</div>
                <div className="text-sm font-bold text-indigo-300 font-mono">{activeStyle.name} Drum Pattern</div>
                <div className="text-xs text-gray-300 mt-2">
                  Driving kicks on 1 & 3, cracking noise snares on 2 & 4, and rolling 16th metallic hats with accent dynamics.
                </div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-300 block">End-of-Pattern Drum Fill</span>
                  <span className="text-[11px] text-gray-400">Includes 32nd-note snare roll turnaround on bar 4</span>
                </div>
                <input
                  type="checkbox"
                  checked={drumTurnaround}
                  onChange={(e) => setDrumTurnaround(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-950">
          <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span>Variation #{variationSeed}</span>
            <span>•</span>
            <span>
              {generationScope === 'full' && activeTab === 'style'
                ? '✨ Will generate coordinated Lead, Arp, Bass, and Drums across channels'
                : `Writes ${lengthSteps} steps (${Math.floor(lengthSteps / 16)} bars) into ${channel.name}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              <Check size={15} />
              <span>{generationScope === 'full' && activeTab === 'style' ? 'Generate Full Arrangement' : 'Generate into Pattern'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
