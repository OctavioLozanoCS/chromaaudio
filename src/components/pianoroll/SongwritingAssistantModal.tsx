import React, { useState } from 'react';
import { NoteEvent, InstrumentChannel, DSPConfig, GeneratedSongSection } from '../../types/audio';
import { SCALES, NOTE_NAMES } from './ScaleEngine';
import { X, Sparkles, Wand2, Music, Drum, Check, Zap, Gauge, KeyRound, Cpu, Layers, RefreshCw, Dices, Play, Compass, Flame, ShieldAlert, Sparkle, Film, Flag, Wind, Moon, PartyPopper } from 'lucide-react';

export interface StyleArchetype {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  category?: 'intro' | 'battle' | 'adventure' | 'ambient' | 'retro';
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

export const getStyleCategory = (style: StyleArchetype): 'intro' | 'battle' | 'adventure' | 'ambient' | 'retro' => {
  if (style.category) return style.category;
  if (['battle', 'boss', 'ancient_mech', 'magma', 'battle_encounter'].includes(style.id)) return 'battle';
  if (['overworld', 'desert', 'toby', 'sky_airship'].includes(style.id)) return 'adventure';
  if (['town', 'forest', 'cave', 'water', 'haunted', 'mystery', 'dungeon', 'cinematic_prologue'].includes(style.id)) return 'ambient';
  if (['cyber', 'comedy', 'synthwave_night', 'chiptune_carnival'].includes(style.id)) return 'retro';
  if (['fanfare', 'title_splash', 'battle_encounter', 'cinematic_prologue', 'stage_start'].includes(style.id)) return 'intro';
  return 'retro';
};

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
  },
  {
    id: 'ancient_mech',
    name: 'Ancient Mechanical Boss',
    subtitle: 'Pokémon RSE (Regi Trio) / Clockwork Alien GBA',
    icon: '🗿',
    recommendedBpm: 156,
    recommendedRoot: 1, // C# (The authentic key of the Regi Trio)
    recommendedScale: 'phrygian',
    dspPreset: {
      name: 'Dry Metallic GBA Industrial (18.157 kHz + 8-bit)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 0.35,
        reverbWet: 0.08,
        filterCutoff: 14000,
        filterResonance: 1.6
      }
    },
    progressionName: 'Regi Phrygian Oscillation (i – i – ♭II – ♭II)',
    chords: [
      { rootOffset: 0, type: 'min' }, // i (C#m)
      { rootOffset: 0, type: 'min' }, // i (C#m)
      { rootOffset: 1, type: 'maj' }, // bII (D major - the famous half-step modulation!)
      { rootOffset: 1, type: 'maj' }  // bII (D major)
    ],
    description: 'Cold, clockwork, alien golem encounter. Contrary-motion chromatic cascades, 3-against-4 timpani polyrhythms, and the iconic Phrygian half-step modulation.',
    melodicHookDescription: 'Crushing unison power stabs, escalating octave-stair bassline, and descending parallel-fifth clockwork cascades.'
  },
  {
    id: 'forest',
    name: 'Mystic Forest & Canopy',
    subtitle: 'Secret of Mana / Chrono Trigger / Donkey Kong Country',
    icon: '🌲',
    recommendedBpm: 116,
    recommendedRoot: 4, // E
    recommendedScale: 'dorian',
    dspPreset: {
      name: 'Forest Ambient Plate (22 kHz + Reverb)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 2.0,
        reverbWet: 0.35,
        filterCutoff: 14000,
        filterResonance: 0.9
      }
    },
    progressionName: 'Enchanted Canopy (i – IV – i – ii)',
    chords: [
      { rootOffset: 0, type: 'min7' }, // Em7
      { rootOffset: 5, type: 'maj' },  // A (Major IV in Dorian)
      { rootOffset: 0, type: 'min7' }, // Em7
      { rootOffset: 2, type: 'min7' }  // F#m7
    ],
    description: 'Lush woodland canopy and dappled sunlight. Dorian major IV gives wonder without darkness.',
    melodicHookDescription: 'Fluttering pentatonic woodwind arps and gentle organic grace notes.'
  },
  {
    id: 'cave',
    name: 'Crystal Mines & Ice Grotto',
    subtitle: 'Final Fantasy VI / Donkey Kong Ice / Super Mario 64',
    icon: '⛏️',
    recommendedBpm: 104,
    recommendedRoot: 0, // C
    recommendedScale: 'lydian',
    dspPreset: {
      name: 'Crystal Cavern Echo (32 kHz + Deep Wet)',
      config: {
        enabled: true,
        resampleRate: 32000,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 2.6,
        reverbWet: 0.4,
        filterCutoff: 18000,
        filterResonance: 1.2
      }
    },
    progressionName: 'Crystalline Lydian (I – II – vi – I)',
    chords: [
      { rootOffset: 0, type: 'maj7' }, // Cmaj7
      { rootOffset: 2, type: 'maj' },  // D (Lydian #4)
      { rootOffset: 9, type: 'min7' }, // Am7
      { rootOffset: 0, type: 'maj7' }  // Cmaj7
    ],
    description: 'Glittering stalactites and frozen subterranean vaults. Raised 4th (#4) creates airy mystic refraction.',
    melodicHookDescription: 'High-register bell chimes, music-box glockenspiel cascades, and gentle 3/4 waltz spacing.'
  },
  {
    id: 'desert',
    name: 'Ancient Sands & Desert Ruins',
    subtitle: 'Zelda Gerudo Valley / Shantae / Al-Qadim',
    icon: '🏜️',
    recommendedBpm: 124,
    recommendedRoot: 4, // E
    recommendedScale: 'phrygian',
    dspPreset: {
      name: 'Sunbaked Lo-Fi (18.157 kHz + 8-Bit)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 1.2,
        reverbWet: 0.22,
        filterCutoff: 16000,
        filterResonance: 1.4
      }
    },
    progressionName: 'Flamenco / Phrygian Dominant (I – ♭II – ♭VII – I)',
    chords: [
      { rootOffset: 0, type: 'maj' },  // E Major
      { rootOffset: 1, type: 'maj' },  // F Major (bII)
      { rootOffset: 10, type: 'min' }, // Dm (bvii)
      { rootOffset: 0, type: 'maj' }   // E Major
    ],
    description: 'Swirling sandstorms and ancient sandstone pyramids. Augmented 2nd intervals provide exotic allure.',
    melodicHookDescription: 'Rapid syncopated serpentine runs, pitch-swept flamenco plucks, and energetic offbeat slaps.'
  },
  {
    id: 'magma',
    name: 'Magma Depths & Molten Core',
    subtitle: 'Super Metroid Norfair / Mega Man Fire Stage / Doom',
    icon: '🌋',
    recommendedBpm: 148,
    recommendedRoot: 2, // D
    recommendedScale: 'minor',
    dspPreset: {
      name: 'Molten Crunch Bitcrusher (4-Bit + Hard Clip)',
      config: {
        enabled: true,
        resampleRate: 16000,
        bitDepth: 4,
        reverbEnabled: true,
        reverbDecay: 1.1,
        reverbWet: 0.18,
        filterCutoff: 19000,
        filterResonance: 2.2
      }
    },
    progressionName: 'Chromatic Volcano Chug (i – ♭II – i – ♭V)',
    chords: [
      { rootOffset: 0, type: 'min' }, // Dm
      { rootOffset: 1, type: 'maj' }, // Eb (bII tension)
      { rootOffset: 0, type: 'min' }, // Dm
      { rootOffset: 6, type: 'dim' }  // Ab dim (Tritone danger)
    ],
    description: 'Intense subterranean lava hazards and crumbling bridges. 4-bit crunchy bitcrushing and driving industrial noise.',
    melodicHookDescription: 'Heavy aggressive square riffs, chromatic descending scalar slides, and explosive noise accents.'
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Neo-City & Factory',
    subtitle: 'Mega Man X / Sonic CD / Streets of Rage FM',
    icon: '🏙️',
    recommendedBpm: 135,
    recommendedRoot: 9, // A
    recommendedScale: 'dorian',
    dspPreset: {
      name: 'Sega Genesis 16-Bit FM Crispness (32 kHz)',
      config: {
        enabled: true,
        resampleRate: 32000,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 0.9,
        reverbWet: 0.2,
        filterCutoff: 20000,
        filterResonance: 1.1
      }
    },
    progressionName: 'Neo-Tokyo Electro Drive (i – ♭VII – IV – ♭VI)',
    chords: [
      { rootOffset: 0, type: 'min' },  // Am
      { rootOffset: 10, type: 'maj' }, // G
      { rootOffset: 5, type: 'maj' },  // D (Dorian IV)
      { rootOffset: 8, type: 'maj' }   // F
    ],
    description: 'Neon skylines and high-speed mechanical monorails. Punchy slap bass and rapid clockwork arpeggiation.',
    melodicHookDescription: 'Relentless 16th-note arpeggiated synth ostinatos, syncopated square stabs, and mechanical grooves.'
  },
  {
    id: 'water',
    name: 'Sunken Temple & Underwater Ruins',
    subtitle: 'Donkey Kong Aquatic Ambiance / Mario 64 Dire Docks',
    icon: '🌊',
    recommendedBpm: 86,
    recommendedRoot: 5, // F
    recommendedScale: 'lydian',
    dspPreset: {
      name: 'Underwater Muffled Lowpass (8 kHz Resonant)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 3.2,
        reverbWet: 0.45,
        filterCutoff: 4500,
        filterResonance: 1.8
      }
    },
    progressionName: 'Aquatic Float (IΔ7 – IVΔ7 – ii7 – I)',
    chords: [
      { rootOffset: 0, type: 'maj7' }, // Fmaj7
      { rootOffset: 5, type: 'maj7' }, // Bbmaj7
      { rootOffset: 2, type: 'min7' }, // Gm7
      { rootOffset: 0, type: 'maj7' }  // Fmaj7
    ],
    description: 'Weightless aquatic drift and ancient submerged columns. Resonant lowpass filter creates oceanic depth.',
    melodicHookDescription: 'Slow floating suspended chords, undulating arpeggios, and peaceful wide intervals.'
  },
  {
    id: 'haunted',
    name: 'Haunted Manor & Ghost Realm',
    subtitle: 'Castlevania / Luigi\'s Mansion / Super Mario World Ghost House',
    icon: '👻',
    recommendedBpm: 98,
    recommendedRoot: 7, // G
    recommendedScale: 'minor',
    dspPreset: {
      name: 'Mansion Creep Echo (16 kHz + Eerie Delay)',
      config: {
        enabled: true,
        resampleRate: 16000,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 2.5,
        reverbWet: 0.38,
        filterCutoff: 11000,
        filterResonance: 1.5
      }
    },
    progressionName: 'Gothic Diminished Descent (i – ♯iv° – V7 – i)',
    chords: [
      { rootOffset: 0, type: 'min' },  // Gm
      { rootOffset: 6, type: 'dim' },  // C#dim (tritone!)
      { rootOffset: 7, type: 'dom7' }, // D7
      { rootOffset: 0, type: 'min' }   // Gm
    ],
    description: 'Creaking floorboards, cobwebs, and playful poltergeists. Diminished tritones provide spine-tingling suspense.',
    melodicHookDescription: 'Music-box celeste chimes, sudden dramatic silences, and whimsical chromatic grace leaps.'
  },
  {
    id: 'comedy',
    name: 'Quirky Encounter & Comic Relief',
    subtitle: 'EarthBound Saturn Valley / Undertale Papyrus / Mario RPG',
    icon: '🤪',
    recommendedBpm: 126,
    recommendedRoot: 0, // C
    recommendedScale: 'major',
    dspPreset: {
      name: 'Retro 8-Bit Cartoony (22 kHz DS)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 8,
        reverbEnabled: false,
        reverbDecay: 0.5,
        reverbWet: 0.05,
        filterCutoff: 18000,
        filterResonance: 0.8
      }
    },
    progressionName: 'Ragtime Stumble (I – ♯I° – ii7 – V7)',
    chords: [
      { rootOffset: 0, type: 'maj' },  // C
      { rootOffset: 1, type: 'dim' },  // C#dim
      { rootOffset: 2, type: 'min7' }, // Dm7
      { rootOffset: 7, type: 'dom7' }  // G7
    ],
    description: 'Bumbling sidekicks, strange eccentric merchants, and slapstick humor. Bouncy polka bass and dry acoustic snaps.',
    melodicHookDescription: 'Staccato syncopated woodblock rhythms, goofy slide-whistle semitone scoops, and cheerful turns.'
  },
  {
    id: 'mystery',
    name: 'Detective Lore & Investigation',
    subtitle: 'Ace Attorney / Hotel Dusk / Professor Layton',
    icon: '🕵️',
    recommendedBpm: 102,
    recommendedRoot: 9, // A
    recommendedScale: 'minor',
    dspPreset: {
      name: 'Late-Night Smoky Lounge (22 kHz + Warm Reverb)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 1.6,
        reverbWet: 0.28,
        filterCutoff: 13000,
        filterResonance: 0.8
      }
    },
    progressionName: 'Noir Crime Cadence (i – iv7 – ♭VIΔ7 – V7♭9)',
    chords: [
      { rootOffset: 0, type: 'min7' }, // Am7
      { rootOffset: 5, type: 'min7' }, // Dm7
      { rootOffset: 8, type: 'maj7' }, // Fmaj7
      { rootOffset: 7, type: 'dom7' }  // E7(b9)
    ],
    description: 'Examining crime scene clues and piecing together ancient conspiracies. Walking jazz bass and brooding minor 7ths.',
    melodicHookDescription: 'Sparse questioning Rhodes chords, mysterious melodic pauses, and evocative unresolved endings.'
  },
  {
    id: 'fanfare',
    name: 'Royal Victory Fanfare & Stinger',
    subtitle: 'Final Fantasy Victory / Dragon Quest Fanfare / Zelda Jingle',
    icon: '🎺',
    recommendedBpm: 138,
    recommendedRoot: 0, // C
    recommendedScale: 'major',
    dspPreset: {
      name: 'Triumphant Hall Reverb (18.157 kHz)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 1.4,
        reverbWet: 0.25,
        filterCutoff: 20000,
        filterResonance: 1.0
      }
    },
    progressionName: 'Heroic Triumph (I – IV – V – I)',
    chords: [
      { rootOffset: 0, type: 'maj' }, // C
      { rootOffset: 5, type: 'maj' }, // F
      { rootOffset: 7, type: 'maj' }, // G
      { rootOffset: 0, type: 'maj' }  // C
    ],
    description: 'Triumphant battle conclusion, level-up milestones, and royal ceremonies. Bold brass fanfares and marching snare rolls.',
    melodicHookDescription: 'Galloping dotted fanfare rhythms, soaring scalar ascents, and decisive punch.'
  },
  {
    id: 'title_splash',
    name: 'Nostalgic Title Screen',
    subtitle: 'Pokémon Red & Blue / Smash Melee / Mega Man 2 Title',
    icon: '🌟',
    category: 'intro',
    recommendedBpm: 134,
    recommendedRoot: 0, // C
    recommendedScale: 'major',
    dspPreset: {
      name: 'Warm GBA Title Reverb (18.157 kHz)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 1.6,
        reverbWet: 0.28,
        filterCutoff: 19000,
        filterResonance: 0.9
      }
    },
    progressionName: 'Royal Road Anime Cadence (IVΔ7 – V – iii7 – vi)',
    chords: [
      { rootOffset: 5, type: 'maj7' }, // IVmaj7 (Fmaj7)
      { rootOffset: 7, type: 'maj' },  // V (G)
      { rootOffset: 4, type: 'min7' }, // iii7 (Em7)
      { rootOffset: 9, type: 'min' }   // vi (Am)
    ],
    description: 'Majestic game launch and main title screen. The iconic Japanese "Royal Road" progression conveys boundless courage, childhood adventure, and high anticipation.',
    melodicHookDescription: 'Heroic opening fanfare with rising 16th arpeggios, soaring octave lifts, and sparkling high bell cascades.'
  },
  {
    id: 'battle_encounter',
    name: 'Battle Alert & Encounter Siren',
    subtitle: 'Wild Pokémon Battle Intro / FF Battle Swirl / Mother 3 Alert',
    icon: '⚠️',
    category: 'intro',
    recommendedBpm: 162,
    recommendedRoot: 2, // D
    recommendedScale: 'dorian',
    dspPreset: {
      name: 'Punchy 8-bit Battle Driver (18.157 kHz)',
      config: {
        enabled: true,
        resampleRate: 18157,
        bitDepth: 8,
        reverbEnabled: true,
        reverbDecay: 0.6,
        reverbWet: 0.12,
        filterCutoff: 20000,
        filterResonance: 1.6
      }
    },
    progressionName: 'Chromatic Battle Alarm (i – ♭II – i – ♭V)',
    chords: [
      { rootOffset: 0, type: 'min' }, // Dm
      { rootOffset: 1, type: 'maj' }, // Eb (bII emergency half-step)
      { rootOffset: 0, type: 'min' }, // Dm
      { rootOffset: 6, type: 'dim' }  // Ab dim (Tritone danger)
    ],
    description: 'Sudden screen transition and battle alert stinger. Relentless chromatic sirens, panic alarm stabs, and heart-pounding drum buildup before the battle drop.',
    melodicHookDescription: 'High-speed ascending chromatic siren sweeps, alarm pitch stabs, and accelerating 32nd-note snare rolls into the battle drop.'
  },
  {
    id: 'cinematic_prologue',
    name: 'Cinematic Story Prologue',
    subtitle: 'Chrono Trigger Title / Metroid Prime Lore / Dark Souls Intro',
    icon: '⏳',
    category: 'intro',
    recommendedBpm: 82,
    recommendedRoot: 9, // A
    recommendedScale: 'minor',
    dspPreset: {
      name: 'Cathedral Ambience & Hall Echo (22 kHz)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 3.2,
        reverbWet: 0.42,
        filterCutoff: 14000,
        filterResonance: 1.2
      }
    },
    progressionName: 'Ancient Tale Cadence (i – ♭VIΔ7 – iv – V7)',
    chords: [
      { rootOffset: 0, type: 'min' },  // Am
      { rootOffset: 8, type: 'maj7' }, // Fmaj7
      { rootOffset: 5, type: 'min' },  // Dm
      { rootOffset: 7, type: 'dom7' }  // E7
    ],
    description: 'Solemn backstory narration, scrolling opening text, and legendary lore. Deep sub-bass drones, emotional minor chords, and lingering atmospheric bells.',
    melodicHookDescription: 'Pulsing octave pedal tones, lonely bell tolls, and expressive horn swells with wide poignant pauses.'
  },
  {
    id: 'stage_start',
    name: 'Arcade Stage 1 / Ready Go!',
    subtitle: 'Sonic 2 Emerald Hill / Streets of Rage / Mega Man X Start',
    icon: '🏁',
    category: 'intro',
    recommendedBpm: 144,
    recommendedRoot: 7, // G
    recommendedScale: 'mixolydian',
    dspPreset: {
      name: 'Sega Genesis 16-Bit FM Crisp (32 kHz)',
      config: {
        enabled: true,
        resampleRate: 32000,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 0.8,
        reverbWet: 0.18,
        filterCutoff: 20000,
        filterResonance: 1.1
      }
    },
    progressionName: 'Arcade Funk Power (I – ♭VII – IV – I)',
    chords: [
      { rootOffset: 0, type: 'maj' },  // G
      { rootOffset: 10, type: 'maj' }, // F (bVII)
      { rootOffset: 5, type: 'maj' },  // C (IV)
      { rootOffset: 0, type: 'maj' }   // G
    ],
    description: 'Stage 1 curtain rise! "Ready... GO!" High-energy slap bass, bright synth brass stabs, and a driving syncopated groove to kick off the game in style.',
    melodicHookDescription: 'Punchy brass fanfares, syncopated 16th slap bass fills, and soaring pentatonic joy.'
  },
  {
    id: 'sky_airship',
    name: 'Sky Sanctuary & Airship Flight',
    subtitle: 'Super Mario Airship / Final Fantasy Blackjack / Skies of Arcadia',
    icon: '✈️',
    category: 'adventure',
    recommendedBpm: 138,
    recommendedRoot: 5, // F
    recommendedScale: 'lydian',
    dspPreset: {
      name: 'Open Sky Reverb (22 kHz + Air Shelf)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 2.2,
        reverbWet: 0.32,
        filterCutoff: 18000,
        filterResonance: 1.0
      }
    },
    progressionName: 'Cloud Kingdom Lift (IΔ7 – II – vi – IV)',
    chords: [
      { rootOffset: 0, type: 'maj7' }, // Fmaj7
      { rootOffset: 2, type: 'maj' },  // G (Lydian II)
      { rootOffset: 9, type: 'min7' }, // Dm7
      { rootOffset: 5, type: 'maj' }   // Bb
    ],
    description: 'Propellers spinning above endless clouds. Galloping 6/8 adventure rhythms, raised 4th Lydian buoyancy, and expansive horizon melodies.',
    melodicHookDescription: 'Galloping adventurous brass leaps, fluttering woodwind trills, and triumphant panoramic fanfares.'
  },
  {
    id: 'synthwave_night',
    name: 'Dark Synthwave & Cyber Hunt',
    subtitle: 'Hotline Miami / Kavinsky / Mega Man 9 Night Stage',
    icon: '🕶️',
    category: 'retro',
    recommendedBpm: 124,
    recommendedRoot: 6, // F#
    recommendedScale: 'minor',
    dspPreset: {
      name: '16-Bit Gated Reverb & Tape Saturator (32 kHz)',
      config: {
        enabled: true,
        resampleRate: 32000,
        bitDepth: 12,
        reverbEnabled: true,
        reverbDecay: 1.1,
        reverbWet: 0.28,
        filterCutoff: 19000,
        filterResonance: 1.3
      }
    },
    progressionName: 'Cyber Highway Descent (i – ♭VI – ♭III – ♭VII)',
    chords: [
      { rootOffset: 0, type: 'min' },  // F#m
      { rootOffset: 8, type: 'maj' },  // D
      { rootOffset: 3, type: 'maj' },  // A
      { rootOffset: 10, type: 'maj' }  // E
    ],
    description: 'Neon taillights streaking across midnight highways. Heavy 16th rolling basslines, punchy gated snares, and haunting detuned saw leads.',
    melodicHookDescription: 'Relentless 16th bass chug, pitch-swept synth arps, and dramatic nocturnal minor stabs.'
  },
  {
    id: 'chiptune_carnival',
    name: 'Bubbly 8-Bit Platformer',
    subtitle: 'Kirby Gourmet Race / Yoshi\'s Island / Shovel Knight',
    icon: '🎪',
    category: 'retro',
    recommendedBpm: 148,
    recommendedRoot: 0, // C
    recommendedScale: 'major',
    dspPreset: {
      name: 'Crisp NES 2A03 Direct (22 kHz)',
      config: {
        enabled: true,
        resampleRate: 22050,
        bitDepth: 8,
        reverbEnabled: false,
        reverbDecay: 0.4,
        reverbWet: 0.05,
        filterCutoff: 20000,
        filterResonance: 0.8
      }
    },
    progressionName: 'Ragtime Carnival Bounce (I – VI7 – ii7 – V7)',
    chords: [
      { rootOffset: 0, type: 'maj' },  // C
      { rootOffset: 9, type: 'dom7' }, // A7
      { rootOffset: 2, type: 'min7' }, // Dm7
      { rootOffset: 7, type: 'dom7' }  // G7
    ],
    description: 'Energetic platforming obstacles, bouncy springs, and colorful boss antics. Infectious syncopated ragtime swing and polka bass.',
    melodicHookDescription: 'Fast staccato triplet hops, chromatic grace slides, and joyful pentatonic acrobatics.'
  }
];

export type IntroStyleId = 
  | 'auto'
  | 'heroic_herald'
  | 'warning_siren'
  | 'ambient_swell'
  | 'arcade_stinger'
  | 'snare_march'
  | 'clockwork_machinery';

export type SongStructurePreset = 
  | 'full_anthem'   // Intro (4b) -> Verse (4b) -> Chorus (4b) -> Bridge (4b) -> Chorus (4b) -> Outro (4b) = 24 bars
  | 'intro_loop'     // Intro (4b) -> Verse (4b) -> Verse (4b) = 12 bars
  | 'verse_chorus'   // Intro (4b) -> Verse (4b) -> Chorus (4b) -> Chorus (4b) = 16 bars
  | 'loop_only'      // Verse (4b) -> Chorus (4b) = 8 bars
  | 'custom';

export const INTRO_STYLES_INFO: { id: IntroStyleId; name: string; icon: string; desc: string }[] = [
  { id: 'auto', name: '✨ Style Signature (Auto)', icon: '✨', desc: 'Authentic intro customized for the selected archetype' },
  { id: 'heroic_herald', name: '🎺 Heroic Title Herald', icon: '🎺', desc: 'Rising 16th octave arpeggios, triumphant brass stabs, and glittering cascades' },
  { id: 'warning_siren', name: '⚠️ Warning Alert Siren', icon: '⚠️', desc: 'Fast chromatic siren oscillations, alert alarm stabs, and accelerating snare roll' },
  { id: 'ambient_swell', name: '⏳ Ambient Story Swell', icon: '⏳', desc: 'Deep sub-bass drone, ethereal bells, ticking clock hats, and spacious crescendo' },
  { id: 'arcade_stinger', name: '🏁 Arcade "Ready Go!" Stinger', icon: '🏁', desc: 'Funk slap bass walkup, bright brass punch, and energetic drum turnaround' },
  { id: 'snare_march', name: '🥁 Military Snare March', icon: '🥁', desc: 'Marching snare rudiments, horn calls, and fortissimo drop turnaround' },
  { id: 'clockwork_machinery', name: '🗿 Clockwork Machinery', icon: '🗿', desc: 'Descending parallel-fifth cascades and 3-against-4 timpani polyrhythms' },
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
  onApplyMultiPatternIntroLoop?: (
    introNotes: Record<string, NoteEvent[]>,
    loopNotes: Record<string, NoteEvent[]>,
    styleName: string
  ) => void;
  onApplyMultiPartSong?: (
    sections: GeneratedSongSection[],
    songName: string,
    options?: {
      bpm?: number;
      scaleRoot?: number;
      scaleMode?: string;
      dsp?: Partial<DSPConfig>;
      loopStartStep?: number;
      loopLengthSteps?: number;
    }
  ) => void;
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
  onApplyMultiPatternIntroLoop,
  onApplyMultiPartSong,
  onChangeBpm,
  onChangeScaleRoot,
  onChangeScaleMode,
  onUpdateDSP
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'chords' | 'drums'>('style');

  // Selected Style Archetype & Filtering
  const [selectedStyleId, setSelectedStyleId] = useState<string>('title_splash');
  const [styleCategoryFilter, setStyleCategoryFilter] = useState<'all' | 'intro' | 'battle' | 'adventure' | 'ambient' | 'retro'>('all');
  const activeStyle = STYLE_ARCHETYPES.find(s => s.id === selectedStyleId) || STYLE_ARCHETYPES[0];

  // Procedural Variation Seed (Increments every time the user clicks "Reroll")
  const [variationSeed, setVariationSeed] = useState<number>(1);

  // Generation Target: Active Channel vs Full Band
  const [generationScope, setGenerationScope] = useState<'single' | 'full'>('full');

  // Multi-Part Song Arrangement & Structure Controls
  const [songStructure, setSongStructure] = useState<SongStructurePreset>('verse_chorus');
  const [customSections, setCustomSections] = useState<{
    intro: boolean;
    verse: boolean;
    chorus: boolean;
    bridge: boolean;
    outro: boolean;
  }>({
    intro: true,
    verse: true,
    chorus: true,
    bridge: false,
    outro: false
  });
  const [selectedIntroStyle, setSelectedIntroStyle] = useState<IntroStyleId>('auto');
  const [energyCurve, setEnergyCurve] = useState<'building' | 'octane' | 'contrast'>('building');
  const [chordVoicing, setChordVoicing] = useState<'triad' | 'lush' | 'power'>('triad');

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

  // Determines the effective intro style (auto chooses signature archetype intro)
  const getEffectiveIntroStyle = (): IntroStyleId => {
    if (selectedIntroStyle !== 'auto') return selectedIntroStyle;
    if (activeStyle.id === 'ancient_mech') return 'clockwork_machinery';
    if (activeStyle.id === 'battle_encounter' || activeStyle.id === 'boss') return 'warning_siren';
    if (activeStyle.id === 'title_splash' || activeStyle.id === 'fanfare') return 'heroic_herald';
    if (activeStyle.id === 'cinematic_prologue' || activeStyle.id === 'water' || activeStyle.id === 'cave') return 'ambient_swell';
    if (activeStyle.id === 'stage_start' || activeStyle.id === 'cyber') return 'arcade_stinger';
    if (activeStyle.id === 'battle' || activeStyle.id === 'magma') return 'warning_siren';
    return 'heroic_herald';
  };

  // Computes chord tones across 4 bars for the selected style honoring chordVoicing
  const getStyleChordTones = (bar: number, rootPitch: number, octave: number = 4) => {
    const chordDef = activeStyle.chords[bar % activeStyle.chords.length];
    const chordRoot = octave * 12 + rootPitch + chordDef.rootOffset;

    let intervals = [0, 4, 7]; // default major triad
    if (chordVoicing === 'power') {
      intervals = [0, 7, 12];
    } else if (chordVoicing === 'lush') {
      if (chordDef.type === 'min') intervals = [0, 3, 7, 10, 14];
      else if (chordDef.type === 'maj') intervals = [0, 4, 7, 11, 14];
      else if (chordDef.type === 'maj7') intervals = [0, 4, 7, 11, 14];
      else if (chordDef.type === 'min7') intervals = [0, 3, 7, 10, 14];
      else if (chordDef.type === 'dom7') intervals = [0, 4, 7, 10, 14];
      else if (chordDef.type === 'dim') intervals = [0, 3, 6, 9];
    } else {
      if (chordDef.type === 'min') intervals = [0, 3, 7];
      if (chordDef.type === 'maj7') intervals = [0, 4, 7, 11];
      if (chordDef.type === 'min7') intervals = [0, 3, 7, 10];
      if (chordDef.type === 'dom7') intervals = [0, 4, 7, 10];
      if (chordDef.type === 'dim') intervals = [0, 3, 6];
    }

    return intervals.map(i => chordRoot + i);
  };

  // 1. Procedural Lead Melody Engine (Variations + Density Modulated + Section Responsive)
  const generateLeadMelody = (
    rootPitch: number = scaleRoot,
    overrideOctave?: number,
    sectionType: 'verse' | 'chorus' | 'bridge' | 'outro' = 'verse'
  ): NoteEvent[] => {
    const baseOctave = overrideOctave !== undefined 
      ? overrideOctave 
      : (sectionType === 'chorus' ? 6 + octaveShift : 5 + octaveShift);
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
      } else if (activeStyle.id === 'boss') {
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
      } else if (activeStyle.id === 'ancient_mech') {
        // Ancient Mechanical Boss (Regi Trio): The 4 Authentic Memorable Masuda Motifs
        const isModulated = bar >= 2;
        const currentRoot = isModulated ? rootTone + 1 : rootTone;
        const currentFifth = currentRoot + 7;
        const currentFlatSix = currentRoot + 8;
        const currentOctave = currentRoot + 12;

        switch (phraseVariant) {
          case 0: // The Iconic Unison Power Stabs (Bars 4-6 in the original)
            rawNotes.push({ id: `lead_${bar}_0`, note: currentRoot, step: barStart + 0, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: currentFifth, step: barStart + 4, duration: 3.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_4_oct`, note: currentOctave, step: barStart + 4, duration: 3.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: currentRoot + 1, step: barStart + 8, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: currentRoot, step: barStart + 12, duration: 3.5, velocity: 1.0 });
            break;

          case 1: // The Alien Chromatic Signal (Junichi Masuda Golem Melody from Track 3)
            [0, 2, 4, 7, 9, 12].forEach((s, idx) => {
              const melodyPitches = [
                currentRoot + 3,
                currentRoot,
                currentRoot + 2,
                currentFlatSix,
                currentRoot + 11,
                currentFifth
              ];
              rawNotes.push({
                id: `lead_${bar}_${s}`,
                note: melodyPitches[idx],
                step: barStart + s,
                duration: 1.5,
                velocity: idx === 0 || idx === 3 ? 1.0 : 0.88
              });
            });
            break;

          case 2: // Interlocking Square-Wave Octave Ping-Pong (Track 1)
            rawNotes.push({ id: `lead_${bar}_0`, note: currentOctave, step: barStart + 0, duration: 1.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: currentOctave, step: barStart + 2, duration: 1.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: currentFlatSix, step: barStart + 4, duration: 1.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_5`, note: currentFifth, step: barStart + 5, duration: 1.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_6`, note: currentRoot, step: barStart + 6, duration: 1.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: currentRoot, step: barStart + 8, duration: 1.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: currentFlatSix, step: barStart + 10, duration: 1.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_11`, note: currentFifth, step: barStart + 11, duration: 1.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: currentOctave, step: barStart + 12, duration: 2.5, velocity: 1.0 });
            break;

          case 3: // Relentless 3-against-4 Polyrhythmic Power Stabs
            [0, 3, 6, 9, 12, 14].forEach((s, idx) => {
              const polyPitches = [currentRoot, currentFifth, currentFlatSix, currentOctave, currentFifth, currentRoot + 1];
              rawNotes.push({
                id: `lead_${bar}_${s}`,
                note: polyPitches[idx],
                step: barStart + s,
                duration: 1.5,
                velocity: idx % 2 === 0 ? 1.0 : 0.85
              });
            });
            break;
        }
      } else if (activeStyle.id === 'forest') {
        // Mystic Forest: Pentatonic Woodwind & Organic Canopy Flutter
        switch (phraseVariant) {
          case 0: // Pentatonic Flutter (1 -> 3 -> 5 -> 6 -> 5 -> 3 -> 1)
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_2`, note: thirdTone, step: barStart + 2, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 2, step: barStart + 8, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: thirdTone, step: barStart + 12, duration: 3.5, velocity: 0.85 });
            break;
          case 1: // Dappled Sunlight Grace Leap
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 1.5, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 12, step: barStart + 2, duration: 3.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone + 2, step: barStart + 6, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: thirdTone, step: barStart + 12, duration: 4, velocity: 0.85 });
            break;
          case 2: // Whispering Canopy Arpeggio
            [0, 3, 6, 9, 12].forEach((s, idx) => {
              const pitches = [rootTone, thirdTone, fifthTone, rootTone + 12, fifthTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 2.5, velocity: 0.85 });
            });
            break;
          case 3: // Pastoral Call & Echo
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 2, step: barStart + 8, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone, step: barStart + 10, duration: 5, velocity: 0.9 });
            break;
        }
      } else if (activeStyle.id === 'cave') {
        // Crystal Mines: Crystalline Lydian #4 Bell Reflections
        switch (phraseVariant) {
          case 0: // Lydian Raised 4th Mystic Shimmer
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 6, step: barStart + 4, duration: 3, velocity: 0.9 }); // Raised 4th (#4)
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 12, step: barStart + 8, duration: 3.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 4, velocity: 0.85 });
            break;
          case 1: // Ice Stalactite Drop (High Register Pings)
            [0, 4, 7, 11, 14].forEach((s, idx) => {
              const pitches = [rootTone + 19, rootTone + 16, rootTone + 12, rootTone + 16, rootTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.5, velocity: 0.85 });
            });
            break;
          case 2: // Subterranean Waltz Echo
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 4, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_6`, note: thirdTone, step: barStart + 6, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone, step: barStart + 10, duration: 5, velocity: 0.95 });
            break;
          case 3: // Glacial Resonant Sigh
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 14, step: barStart + 2, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_6`, note: rootTone + 12, step: barStart + 6, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 5, velocity: 0.9 });
            break;
        }
      } else if (activeStyle.id === 'desert') {
        // Ancient Sands: Flamenco / Phrygian Dominant Augmented 2nds
        switch (phraseVariant) {
          case 0: // Exotic Serpentine Augmented 2nd Run
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 1, step: barStart + 2, duration: 1, velocity: 0.9 }); // Minor 2nd
            rawNotes.push({ id: `lead_${bar}_3`, note: rootTone + 4, step: barStart + 3, duration: 2.5, velocity: 1.0 }); // Major 3rd (augmented interval!)
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone, step: barStart + 6, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_9`, note: rootTone + 4, step: barStart + 9, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 1, step: barStart + 12, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_14`, note: rootTone, step: barStart + 14, duration: 2, velocity: 0.95 });
            break;
          case 1: // Flamenco Staccato Triplet Plucks
            [0, 2, 4, 6, 8, 10, 12].forEach((s, idx) => {
              const pitches = [rootTone + 12, rootTone + 11, rootTone + 8, rootTone + 7, rootTone + 4, rootTone + 1, rootTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.4, velocity: idx === 0 ? 1.0 : 0.85 });
            });
            break;
          case 2: // Caravan Stately March
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 8, step: barStart + 8, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_11`, note: rootTone + 7, step: barStart + 11, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone + 4, step: barStart + 13, duration: 2.5, velocity: 0.9 });
            break;
          case 3: // Swirling Sandstorm Climb
            [0, 3, 6, 8, 10, 12].forEach((s, idx) => {
              const pitches = [rootTone, rootTone + 4, rootTone + 7, rootTone + 8, rootTone + 11, rootTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.8, velocity: 0.9 });
            });
            break;
        }
      } else if (activeStyle.id === 'magma') {
        // Magma Depths: Heavy Chromatic Danger Chug
        switch (phraseVariant) {
          case 0: // Heavy Chromatic Riff
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 1, step: barStart + 2, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone, step: barStart + 4, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_7`, note: rootTone + 6, step: barStart + 7, duration: 2.5, velocity: 1.0 }); // Tritone!
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone + 1, step: barStart + 13, duration: 2.5, velocity: 0.95 });
            break;
          case 1: // Tremolo Molten Slide
            for (let s = 0; s < 16; s += 2) {
              const pitch = s < 8 ? rootTone + 12 : rootTone + 11;
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitch, step: barStart + s, duration: 1.6, velocity: 0.92 });
            }
            break;
          case 2: // Industrial Power Accents
            [0, 3, 6, 10, 12].forEach(s => {
              rawNotes.push({ id: `lead_${bar}_${s}`, note: rootTone + 12, step: barStart + s, duration: 1.8, velocity: 0.98 });
            });
            break;
          case 3: // Hellfire Climax Run
            [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone, rootTone + 3, rootTone + 6, rootTone + 7, rootTone + 9, rootTone + 10, rootTone + 12, rootTone + 13];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.5, velocity: 0.95 });
            });
            break;
        }
      } else if (activeStyle.id === 'cyber') {
        // Cyberpunk Factory: Clockwork 16th Electro Ostinato
        switch (phraseVariant) {
          case 0: // Relentless 16th Ostinato Engine
            for (let s = 0; s < 16; s += 2) {
              const pitch = s % 4 === 0 ? rootTone + 12 : s % 4 === 2 ? fifthTone + 12 : rootTone;
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitch, step: barStart + s, duration: 1.5, velocity: s === 0 || s === 8 ? 1.0 : 0.85 });
            }
            break;
          case 1: // Heroic Mega Man X Leap
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: fifthTone, step: barStart + 2, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 12, step: barStart + 4, duration: 3.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 10, step: barStart + 8, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_11`, note: fifthTone, step: barStart + 11, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: thirdTone, step: barStart + 13, duration: 2.5, velocity: 0.85 });
            break;
          case 2: // Offbeat Synth Chops
            [2, 5, 8, 11, 14].forEach(s => {
              rawNotes.push({ id: `lead_${bar}_${s}`, note: rootTone + 12, step: barStart + s, duration: 1.5, velocity: 0.95 });
            });
            break;
          case 3: // Neon Monorail Velocity Scale
            [0, 2, 4, 6, 8, 10, 12].forEach((s, idx) => {
              const pitches = [rootTone, rootTone + 2, thirdTone, fifthTone, fifthTone + 2, rootTone + 10, rootTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.6, velocity: 0.9 });
            });
            break;
        }
      } else if (activeStyle.id === 'water') {
        // Sunken Temple: Slow Undulating Oceanic Arpeggios
        switch (phraseVariant) {
          case 0: // Oceanic Suspended 4th Drift
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 5, step: barStart + 0, duration: 4, velocity: 0.85 }); // Suspended 4th
            rawNotes.push({ id: `lead_${bar}_5`, note: thirdTone, step: barStart + 5, duration: 4, velocity: 0.8 });    // Resolution to 3rd
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 5, velocity: 0.9 });
            break;
          case 1: // Gentle Ascending Wave
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 3.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 3.5, velocity: 0.85 });
            break;
          case 2: // Muffled Coral Bell Pings
            [0, 4, 8, 12].forEach((s, idx) => {
              const pitches = [rootTone + 12, fifthTone + 12, rootTone + 12, thirdTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 3, velocity: 0.8 });
            });
            break;
          case 3: // Deep Abyssal Lullaby
            rawNotes.push({ id: `lead_${bar}_2`, note: fifthTone, step: barStart + 2, duration: 4, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_7`, note: thirdTone, step: barStart + 7, duration: 4, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4, velocity: 0.85 });
            break;
        }
      } else if (activeStyle.id === 'haunted') {
        // Haunted Manor: Celeste Music Box & Creepy Tritone Stabs
        switch (phraseVariant) {
          case 0: // Music Box Tritone Chime
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 3, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 6, step: barStart + 4, duration: 2.5, velocity: 0.95 }); // Tritone
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 7, step: barStart + 8, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone + 1, step: barStart + 13, duration: 2.5, velocity: 0.9 }); // Minor 2nd
            break;
          case 1: // Poltergeist Jump Leap
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_6`, note: rootTone + 18, step: barStart + 6, duration: 2.5, velocity: 1.0 }); // Sudden high leap!
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 3, velocity: 0.85 });
            break;
          case 2: // Cobweb Descending Chromatic Stumble
            [0, 3, 6, 9, 12].forEach((s, idx) => {
              const pitches = [rootTone + 12, rootTone + 11, rootTone + 8, rootTone + 6, rootTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 2, velocity: 0.85 });
            });
            break;
          case 3: // Spooky Clock Bell
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone + 12, step: barStart + 0, duration: 3, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_5`, note: thirdTone + 12, step: barStart + 5, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 5, velocity: 0.9 });
            break;
        }
      } else if (activeStyle.id === 'comedy') {
        // Quirky Encounter: Ragtime Polka Grace Notes & Goofy Scoops
        switch (phraseVariant) {
          case 0: // Ragtime Grace Scoop
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone - 1, step: barStart + 0, duration: 0.8, velocity: 0.8 }); // Grace note
            rawNotes.push({ id: `lead_${bar}_1`, note: thirdTone, step: barStart + 1, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_7`, note: rootTone + 12, step: barStart + 7, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone + 1, step: barStart + 10, duration: 1, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_11`, note: fifthTone, step: barStart + 11, duration: 2.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_14`, note: thirdTone, step: barStart + 14, duration: 2, velocity: 0.85 });
            break;
          case 1: // Goofy Slide Whistle
            [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone, rootTone + 2, rootTone + 4, rootTone + 7, rootTone + 12, rootTone + 7, rootTone + 4, rootTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.5, velocity: 0.9 });
            });
            break;
          case 2: // Bumbling Stumble
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_3`, note: rootTone + 6, step: barStart + 3, duration: 1.5, velocity: 0.85 }); // Flat 5 stumble!
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone, step: barStart + 6, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_10`, note: thirdTone, step: barStart + 10, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone, step: barStart + 13, duration: 2.5, velocity: 0.9 });
            break;
          case 3: // Cheerful Music Hall Turn
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: fifthTone, step: barStart + 2, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_5`, note: thirdTone, step: barStart + 5, duration: 2.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 2, step: barStart + 8, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_11`, note: rootTone, step: barStart + 11, duration: 4, velocity: 0.95 });
            break;
        }
      } else if (activeStyle.id === 'mystery') {
        // Detective Lore: Minor 7b5 Questioning Noir Motif
        switch (phraseVariant) {
          case 0: // Unresolved Question (Resting on flat 5 or 9th)
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 6, step: barStart + 8, duration: 3.5, velocity: 0.95 }); // Flat 5!
            rawNotes.push({ id: `lead_${bar}_12`, note: seventhTone, step: barStart + 12, duration: 4, velocity: 0.9 });
            break;
          case 1: // Smoky Walking Clue Motif
            rawNotes.push({ id: `lead_${bar}_2`, note: fifthTone, step: barStart + 2, duration: 2.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_5`, note: thirdTone, step: barStart + 5, duration: 2, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 2, step: barStart + 8, duration: 3, velocity: 0.9 }); // 9th
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4, velocity: 0.85 });
            break;
          case 2: // Sudden Flashback Epiphany
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 11, step: barStart + 4, duration: 2.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: seventhTone, step: barStart + 8, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 4, velocity: 0.9 });
            break;
          case 3: // Brooding Rain Silhouette
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone, step: barStart + 0, duration: 3.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone, step: barStart + 6, duration: 3, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_11`, note: rootTone, step: barStart + 11, duration: 4.5, velocity: 0.9 });
            break;
        }
      } else if (activeStyle.id === 'title_splash') {
        // Nostalgic Title Screen: Royal Road Fanfare & Triumphant Cascades
        switch (phraseVariant) {
          case 0: // Royal Road Fanfare Ascent
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_3`, note: thirdTone, step: barStart + 3, duration: 1.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone + 2, step: barStart + 8, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone + 12, step: barStart + 12, duration: 3.5, velocity: 1.0 });
            break;
          case 1: // Triumphant 16th Sparkling Sweep into High Climax
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: fifthTone, step: barStart + 2, duration: 1.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone, step: barStart + 6, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 12, step: barStart + 8, duration: 2.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_11`, note: rootTone + 14, step: barStart + 11, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 16, step: barStart + 12, duration: 3.5, velocity: 1.0 });
            break;
          case 2: // Galloping Herald Call & Consequent
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 12, step: barStart + 2, duration: 3.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone + 2, step: barStart + 6, duration: 2.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 12, step: barStart + 8, duration: 3.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: thirdTone + 12, step: barStart + 12, duration: 4.0, velocity: 1.0 });
            break;
          case 3: // Resolute Hero's Theme Cadence
            [0, 2, 4, 6, 8, 10, 12].forEach((s, idx) => {
              const pitches = [rootTone + 12, fifthTone, thirdTone, rootTone, rootTone + 2, thirdTone, rootTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.8, velocity: idx === 0 || idx === 6 ? 1.0 : 0.85 });
            });
            break;
        }
      } else if (activeStyle.id === 'battle_encounter') {
        // Battle Alert & Encounter Siren: High-speed panic sweeps and alarm stabs
        switch (phraseVariant) {
          case 0: // High-speed chromatic siren sweeps
            for (let s = 0; s < 16; s += 2) {
              const p = s % 4 === 0 ? rootTone + 12 : rootTone + 13;
              rawNotes.push({ id: `lead_${bar}_${s}`, note: p, step: barStart + s, duration: 1.5, velocity: s === 0 || s === 8 ? 1.0 : 0.9 });
            }
            break;
          case 1: // Warning alarm pitch stabs (octave + 1, tritone, root)
            [0, 3, 6, 9, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone + 12, rootTone + 13, rootTone + 6, rootTone + 12, rootTone + 13, rootTone + 18];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.5, velocity: 1.0 });
            });
            break;
          case 2: // Rapid chromatic scalar scramble
            [0, 1, 2, 3, 4, 6, 8, 10, 12].forEach((s, idx) => {
              const pitches = [rootTone, rootTone + 1, rootTone + 2, rootTone + 3, rootTone + 6, rootTone + 7, rootTone + 10, rootTone + 12, rootTone + 13];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx % pitches.length], step: barStart + s, duration: 1.2, velocity: idx % 2 === 0 ? 0.95 : 0.85 });
            });
            break;
          case 3: // Pre-battle unison power stabs into the drop
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 2.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 6, step: barStart + 4, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 13, step: barStart + 8, duration: 2.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 3.5, velocity: 1.0 });
            break;
        }
      } else if (activeStyle.id === 'cinematic_prologue') {
        // Cinematic Story Prologue: Solemn pedal horn swells and emotional lore
        switch (phraseVariant) {
          case 0: // Solemn pedal horn melody with spacious intervals
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 4.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_5`, note: fifthTone, step: barStart + 5, duration: 3.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 5.0, velocity: 0.95 });
            break;
          case 1: // Nostalgic flute sigh with resting pauses
            rawNotes.push({ id: `lead_${bar}_2`, note: thirdTone, step: barStart + 2, duration: 3.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone, step: barStart + 6, duration: 3.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: seventhTone, step: barStart + 10, duration: 2.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: fifthTone, step: barStart + 13, duration: 3.0, velocity: 0.8 });
            break;
          case 2: // Ancient lore climax arch
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 3.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 11, step: barStart + 4, duration: 3.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 8, step: barStart + 8, duration: 3.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 4.0, velocity: 0.85 });
            break;
          case 3: // Unresolved question cadence into the title theme
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone, step: barStart + 0, duration: 3.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_5`, note: rootTone + 2, step: barStart + 5, duration: 3.0, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_9`, note: rootTone, step: barStart + 9, duration: 6.0, velocity: 0.9 });
            break;
        }
      } else if (activeStyle.id === 'stage_start') {
        // Arcade Stage 1 / Ready Go!: Punchy brass fanfares and syncopated funk
        switch (phraseVariant) {
          case 0: // Punchy brass fanfare call-and-response
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 1.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_2`, note: fifthTone, step: barStart + 2, duration: 1.5, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: rootTone + 12, step: barStart + 4, duration: 3.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 10, step: barStart + 8, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_11`, note: fifthTone, step: barStart + 11, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone + 12, step: barStart + 13, duration: 2.5, velocity: 0.95 });
            break;
          case 1: // Fast syncopated pentatonic run with chromatic slide
            [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone + 12, rootTone + 10, rootTone + 7, rootTone + 5, rootTone + 3, rootTone + 2, rootTone, rootTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.5, velocity: idx % 2 === 0 ? 0.95 : 0.85 });
            });
            break;
          case 2: // Offbeat synth brass chops
            [2, 5, 8, 11, 14].forEach(s => {
              rawNotes.push({ id: `lead_${bar}_${s}`, note: rootTone + 12, step: barStart + s, duration: 1.5, velocity: 0.95 });
              rawNotes.push({ id: `lead_${bar}_${s}_5th`, note: fifthTone + 12, step: barStart + s, duration: 1.5, velocity: 0.9 });
            });
            break;
          case 3: // Celebratory "Stage 1 Clear" Hook
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone + 12, step: barStart + 2, duration: 3.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone + 2, step: barStart + 6, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: fifthTone, step: barStart + 8, duration: 3.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone, step: barStart + 12, duration: 4.0, velocity: 1.0 });
            break;
        }
      } else if (activeStyle.id === 'sky_airship') {
        // Sky Sanctuary & Airship Flight: Galloping 6/8 adventure horn leaps
        switch (phraseVariant) {
          case 0: // Galloping 6/8 adventurous horn theme
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_3`, note: thirdTone, step: barStart + 3, duration: 1.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_5`, note: fifthTone, step: barStart + 5, duration: 2.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_8`, note: rootTone + 12, step: barStart + 8, duration: 3.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 3.5, velocity: 0.9 });
            break;
          case 1: // Soaring triadic leap across clouds
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_3`, note: rootTone + 12, step: barStart + 3, duration: 3.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_7`, note: rootTone + 14, step: barStart + 7, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_13`, note: thirdTone + 12, step: barStart + 13, duration: 2.5, velocity: 0.95 });
            break;
          case 2: // Fluttering woodwind 6/8 arpeggio
            [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone, thirdTone, fifthTone, rootTone + 12, fifthTone, thirdTone, rootTone, fifthTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.5, velocity: 0.85 });
            });
            break;
          case 3: // Triumphant airship captain cadence
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone + 12, step: barStart + 0, duration: 3.0, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_8`, note: thirdTone, step: barStart + 8, duration: 2.5, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_11`, note: rootTone, step: barStart + 11, duration: 4.5, velocity: 0.95 });
            break;
        }
      } else if (activeStyle.id === 'synthwave_night') {
        // Dark Synthwave & Cyber Hunt: Detuned saw lead with dramatic nocturnal stabs
        switch (phraseVariant) {
          case 0: // Detuned saw lead with dramatic pitch rests
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 3.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: thirdTone, step: barStart + 4, duration: 2.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_7`, note: fifthTone, step: barStart + 7, duration: 3.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_11`, note: rootTone + 10, step: barStart + 11, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_13`, note: rootTone + 12, step: barStart + 13, duration: 3.0, velocity: 1.0 });
            break;
          case 1: // Cyberpunk highway arpeggiated lead run
            for (let s = 0; s < 16; s += 2) {
              const pitches = [rootTone, thirdTone, fifthTone, rootTone + 10, rootTone + 12, rootTone + 10, fifthTone, thirdTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[(s / 2) % pitches.length], step: barStart + s, duration: 1.6, velocity: s % 4 === 0 ? 0.95 : 0.8 });
            }
            break;
          case 2: // Dark minor syncopated stabs
            [0, 3, 6, 8, 11, 14].forEach(s => {
              rawNotes.push({ id: `lead_${bar}_${s}`, note: rootTone + 12, step: barStart + s, duration: 1.5, velocity: 0.95 });
            });
            break;
          case 3: // High emotional nocturne resolve
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone + 12, step: barStart + 0, duration: 3.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_5`, note: thirdTone + 12, step: barStart + 5, duration: 3.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_9`, note: rootTone + 12, step: barStart + 9, duration: 3.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_13`, note: fifthTone, step: barStart + 13, duration: 3.0, velocity: 0.85 });
            break;
        }
      } else if (activeStyle.id === 'chiptune_carnival') {
        // Bubbly 8-Bit Platformer: Kirby Gourmet Race staccato hops and ragtime swing
        switch (phraseVariant) {
          case 0: // Kirby Gourmet Race staccato triplet hops
            [0, 2, 3, 4, 6, 8, 10, 11, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone, thirdTone, thirdTone + 1, thirdTone + 2, fifthTone, rootTone + 12, fifthTone, fifthTone - 1, fifthTone, rootTone];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx % pitches.length], step: barStart + s, duration: 0.9, velocity: idx % 2 === 0 ? 0.95 : 0.8 });
            });
            break;
          case 1: // Goofy chromatic grace slides and playful turns
            rawNotes.push({ id: `lead_${bar}_0`, note: thirdTone - 1, step: barStart + 0, duration: 0.8, velocity: 0.8 });
            rawNotes.push({ id: `lead_${bar}_1`, note: thirdTone, step: barStart + 1, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_7`, note: rootTone + 12, step: barStart + 7, duration: 2.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 9, step: barStart + 10, duration: 2.0, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_13`, note: fifthTone, step: barStart + 13, duration: 2.5, velocity: 0.9 });
            break;
          case 2: // Cheerful bouncing arpeggio sprint
            [0, 3, 6, 8, 10, 12, 14].forEach((s, idx) => {
              const pitches = [rootTone + 12, fifthTone, thirdTone, rootTone, thirdTone, fifthTone, rootTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.4, velocity: 0.9 });
            });
            break;
          case 3: // Decisive cartoon comedy finish
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 2.0, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_3`, note: rootTone + 12, step: barStart + 3, duration: 2.0, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_6`, note: fifthTone + 12, step: barStart + 6, duration: 2.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 1.5, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 3.5, velocity: 1.0 });
            break;
        }
      } else {
        // Royal Fanfare & Default Triumph
        switch (phraseVariant) {
          case 0: // Galloping Herald Fanfare
            rawNotes.push({ id: `lead_${bar}_0`, note: rootTone, step: barStart + 0, duration: 1.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_2`, note: rootTone, step: barStart + 2, duration: 1, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_3`, note: rootTone, step: barStart + 3, duration: 1, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_4`, note: fifthTone, step: barStart + 4, duration: 3.5, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_8`, note: thirdTone, step: barStart + 8, duration: 2, velocity: 0.9 });
            rawNotes.push({ id: `lead_${bar}_10`, note: fifthTone, step: barStart + 10, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_12`, note: rootTone + 12, step: barStart + 12, duration: 4, velocity: 1.0 });
            break;
          case 1: // Ascending Triumph March
            [0, 2, 4, 6, 8, 10, 12].forEach((s, idx) => {
              const pitches = [rootTone, rootTone + 2, thirdTone, rootTone + 5, fifthTone, fifthTone + 2, rootTone + 12];
              rawNotes.push({ id: `lead_${bar}_${s}`, note: pitches[idx], step: barStart + s, duration: 1.8, velocity: 0.95 });
            });
            break;
          case 2: // Royal Fanfare Echo
            rawNotes.push({ id: `lead_${bar}_0`, note: fifthTone, step: barStart + 0, duration: 2, velocity: 0.95 });
            rawNotes.push({ id: `lead_${bar}_3`, note: rootTone + 12, step: barStart + 3, duration: 3, velocity: 1.0 });
            rawNotes.push({ id: `lead_${bar}_7`, note: fifthTone, step: barStart + 7, duration: 2, velocity: 0.85 });
            rawNotes.push({ id: `lead_${bar}_10`, note: rootTone + 12, step: barStart + 10, duration: 4, velocity: 1.0 });
            break;
          case 3: // Decisive Victory Punch
            [0, 4, 8].forEach(s => {
              rawNotes.push({ id: `lead_${bar}_${s}`, note: rootTone + 12, step: barStart + s, duration: 1.5, velocity: 1.0 });
            });
            rawNotes.push({ id: `lead_${bar}_12`, note: fifthTone, step: barStart + 12, duration: 3.5, velocity: 0.95 });
            break;
        }
      }
    }

    let processedNotes = rawNotes;

    // Apply Density Modulation:
    if (melodyDensity === 'sparse') {
      // Keep only anchor notes on primary beats (steps 0, 4, 8, 12) with longer durations
      processedNotes = processedNotes.filter((n, idx) => idx % 2 === 0).map(n => ({
        ...n,
        duration: Math.min(6, n.duration * 1.6)
      }));
    } else if (melodyDensity === 'energetic') {
      // Add extra 16th grace notes / pickups
      const energeticNotes: NoteEvent[] = [...processedNotes];
      processedNotes.forEach(n => {
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
      processedNotes = energeticNotes.sort((a, b) => a.step - b.step);
    }

    // Apply Section Dynamic Shaping:
    if (sectionType === 'chorus') {
      // Climax energy: higher velocities, sustained notes slightly lengthened
      processedNotes = processedNotes.map(n => ({
        ...n,
        velocity: Math.min(1.0, n.velocity + 0.08)
      }));
    } else if (sectionType === 'bridge') {
      // Introspective breakdown: softer velocities, reflective durations
      processedNotes = processedNotes.map(n => ({
        ...n,
        velocity: Math.max(0.4, n.velocity * 0.82),
        duration: n.duration * 1.2
      }));
    } else if (sectionType === 'outro') {
      // Cadential finish: ensure the final bar resolves decisively on root
      const lastBarStart = (totalBars - 1) * 16;
      processedNotes = processedNotes.filter(n => n.step < lastBarStart + 12);
      processedNotes.push({
        id: `outro_cadence_final`,
        note: (baseOctave * 12) + rootPitch,
        step: lastBarStart + 12,
        duration: 4.0,
        velocity: 1.0
      });
    }

    return processedNotes;
  };

  // 2. Chiptune Arpeggio Bed Engine (Seed-Varied Cascades & Section Dynamics)
  const generateArpBed = (
    rootPitch: number = scaleRoot,
    sectionType: 'verse' | 'chorus' | 'bridge' | 'outro' = 'verse'
  ): NoteEvent[] => {
    const notes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);
    const arpStyle = variationSeed % 3; // 0 = Up, 1 = Up-Down, 2 = Broken
    const baseOctave = sectionType === 'chorus' ? 6 : 5;

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const chordTones = getStyleChordTones(bar, rootPitch, baseOctave);
      const len = chordTones.length;

      if (sectionType === 'bridge') {
        // Bridge: Ethereal sustained chord arpeggio / half-speed pulses
        for (let s = 0; s < 16; s += 4) {
          const pIdx = (s / 4) % len;
          notes.push({
            id: `arp_${bar}_${s}`,
            note: chordTones[pIdx],
            step: barStart + s,
            duration: 3.8,
            velocity: 0.6
          });
        }
        continue;
      }

      if (activeStyle.id === 'ancient_mech') {
        // Authentic Regi Clockwork Arp: Descending parallel-fifths triad cells (Root -> 5th -> Root)
        const isModulated = bar >= 2;
        const currentRoot = isModulated ? chordTones[0] + 1 : chordTones[0];
        const baseHigh = currentRoot + 12;

        for (let beat = 0; beat < 4; beat++) {
          const beatStep = beat * 4;
          const cellRoot = baseHigh - ((bar * 4 + beat) % 12);
          const cellFifth = cellRoot - 5;

          notes.push({ id: `arp_${bar}_${beatStep + 0}`, note: cellRoot, step: barStart + beatStep + 0, duration: 0.9, velocity: 0.8 });
          notes.push({ id: `arp_${bar}_${beatStep + 1}`, note: cellFifth, step: barStart + beatStep + 1, duration: 0.9, velocity: 0.7 });
          notes.push({ id: `arp_${bar}_${beatStep + 2}`, note: cellRoot, step: barStart + beatStep + 2, duration: 0.9, velocity: 0.75 });
          notes.push({ id: `arp_${bar}_${beatStep + 3}`, note: cellFifth, step: barStart + beatStep + 3, duration: 0.8, velocity: 0.6 });
        }
        continue;
      }

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

        const velBoost = sectionType === 'chorus' ? 0.1 : 0;
        notes.push({
          id: `arp_${bar}_${s}`,
          note: chordTones[pitchIndex],
          step: barStart + s,
          duration: 1,
          velocity: Math.min(1.0, (s % 4 === 0 ? 0.75 : 0.6) + velBoost)
        });
      }
    }

    return notes;
  };

  // 3. Driving Walking / Slap Bass Engine (Seed-Varied Patterns & Section Dynamics)
  const generateBassline = (
    rootPitch: number = scaleRoot,
    sectionType: 'verse' | 'chorus' | 'bridge' | 'outro' = 'verse'
  ): NoteEvent[] => {
    const notes: NoteEvent[] = [];
    const totalBars = Math.floor(lengthSteps / 16);
    const bassStyle = variationSeed % 4;

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 16;
      const chordTones = getStyleChordTones(bar, rootPitch, 3); // Octave 3 bass
      const root = chordTones[0];
      const fifth = chordTones[2] || root + 7;

      if (sectionType === 'bridge') {
        // Introspective bridge: long sustained bass pedal
        notes.push({
          id: `bass_${bar}_0`,
          note: root,
          step: barStart + 0,
          duration: 15.5,
          velocity: 0.75
        });
        continue;
      }

      if (activeStyle.id === 'ancient_mech') {
        // Authentic Regi Battle Ostinato: Root-Root-b6-5 groove with Phrygian half-step modulation
        const isModulated = bar >= 2;
        const currentRoot = isModulated ? root + 1 : root;
        const currentFifth = currentRoot + 7;
        const currentFlatSix = currentRoot + 8;
        const turnaroundEnd = isModulated ? currentRoot + 10 : currentRoot + 10;

        // Steps 0-11: Root - Root - b6 - 5 - Root - Root - b6 - 5
        notes.push({ id: `bass_${bar}_0`, note: currentRoot, step: barStart + 0, duration: 1.5, velocity: 1.0 });
        notes.push({ id: `bass_${bar}_2`, note: currentRoot, step: barStart + 2, duration: 1.0, velocity: 0.85 });
        notes.push({ id: `bass_${bar}_4`, note: currentFlatSix, step: barStart + 4, duration: 1.0, velocity: 0.95 });
        notes.push({ id: `bass_${bar}_5`, note: currentFifth, step: barStart + 5, duration: 1.0, velocity: 0.9 });
        notes.push({ id: `bass_${bar}_6`, note: currentRoot, step: barStart + 6, duration: 1.5, velocity: 0.95 });
        notes.push({ id: `bass_${bar}_8`, note: currentRoot, step: barStart + 8, duration: 1.0, velocity: 0.85 });
        notes.push({ id: `bass_${bar}_10`, note: currentFlatSix, step: barStart + 10, duration: 1.0, velocity: 0.95 });
        notes.push({ id: `bass_${bar}_11`, note: currentFifth, step: barStart + 11, duration: 1.0, velocity: 0.9 });

        // Steps 12-15: Signature turnaround (5 -> 5 -> b6 -> 5 -> b7)
        if (bar % 2 === 1) {
          notes.push({ id: `bass_${bar}_12`, note: currentFifth - 12, step: barStart + 12, duration: 1.0, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_13`, note: currentFlatSix - 12, step: barStart + 13, duration: 1.0, velocity: 0.95 });
          notes.push({ id: `bass_${bar}_14`, note: currentFifth - 12, step: barStart + 14, duration: 1.0, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_15`, note: turnaroundEnd - 12, step: barStart + 15, duration: 1.0, velocity: 0.95 });
        } else {
          notes.push({ id: `bass_${bar}_12`, note: currentRoot, step: barStart + 12, duration: 1.5, velocity: 0.95 });
          notes.push({ id: `bass_${bar}_14`, note: currentFlatSix, step: barStart + 14, duration: 1.0, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_15`, note: currentFifth, step: barStart + 15, duration: 1.0, velocity: 0.9 });
        }
        continue;
      }

      if (activeStyle.id === 'synthwave_night') {
        // Dark Synthwave: Relentless 16th rolling bassline (Hotline Miami / Kavinsky)
        for (let s = 0; s < 16; s++) {
          const isOctave = s % 2 === 1;
          notes.push({
            id: `bass_${bar}_${s}`,
            note: isOctave ? root + 12 : root,
            step: barStart + s,
            duration: 0.9,
            velocity: s % 4 === 0 ? 1.0 : (s % 2 === 0 ? 0.88 : 0.74)
          });
        }
        continue;
      }

      if (activeStyle.id === 'sky_airship') {
        // Sky Sanctuary / Airship: Galloping 6/8 adventure feel
        [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
          const pitch = idx % 2 === 0 ? root : fifth;
          notes.push({
            id: `bass_${bar}_${s}`,
            note: pitch,
            step: barStart + s,
            duration: 1.8,
            velocity: idx === 0 ? 1.0 : 0.85
          });
        });
        continue;
      }

      if (activeStyle.id === 'chiptune_carnival') {
        // Bubbly 8-Bit Platformer: 2/4 Ragtime Polka Oom-Pah Bounce
        notes.push({ id: `bass_${bar}_0`, note: root, step: barStart + 0, duration: 2.0, velocity: 1.0 });
        notes.push({ id: `bass_${bar}_4`, note: fifth, step: barStart + 4, duration: 2.0, velocity: 0.9 });
        notes.push({ id: `bass_${bar}_8`, note: root, step: barStart + 8, duration: 2.0, velocity: 0.95 });
        if (bar % 2 === 1) {
          notes.push({ id: `bass_${bar}_12`, note: fifth, step: barStart + 12, duration: 1.2, velocity: 0.85 });
          notes.push({ id: `bass_${bar}_14`, note: root - 1, step: barStart + 14, duration: 1.0, velocity: 0.9 });
          notes.push({ id: `bass_${bar}_15`, note: root, step: barStart + 15, duration: 1.0, velocity: 0.95 });
        } else {
          notes.push({ id: `bass_${bar}_12`, note: fifth, step: barStart + 12, duration: 2.0, velocity: 0.9 });
        }
        continue;
      }

      if (activeStyle.id === 'battle_encounter') {
        // Urgent Battle Encounter: Pumping 16th alert chug
        for (let s = 0; s < 16; s += 2) {
          const isAccent = s === 0 || s === 6 || s === 10;
          notes.push({
            id: `bass_${bar}_${s}`,
            note: isAccent ? root : root + 12,
            step: barStart + s,
            duration: 1.6,
            velocity: isAccent ? 1.0 : 0.82
          });
        }
        continue;
      }

      if (activeStyle.id === 'stage_start') {
        // Arcade Stage 1: Slap Bass funk groove
        notes.push({ id: `bass_${bar}_0`, note: root, step: barStart + 0, duration: 2.0, velocity: 1.0 });
        notes.push({ id: `bass_${bar}_3`, note: root + 12, step: barStart + 3, duration: 1.5, velocity: 0.95 });
        notes.push({ id: `bass_${bar}_6`, note: fifth, step: barStart + 6, duration: 2.0, velocity: 0.9 });
        notes.push({ id: `bass_${bar}_10`, note: root + 12, step: barStart + 10, duration: 1.8, velocity: 0.95 });
        notes.push({ id: `bass_${bar}_13`, note: fifth + 2, step: barStart + 13, duration: 1.5, velocity: 0.85 });
        notes.push({ id: `bass_${bar}_15`, note: root - 1, step: barStart + 15, duration: 1.0, velocity: 0.9 });
        continue;
      }

      if (activeStyle.id === 'title_splash') {
        // Nostalgic Title Screen: Majestic rolling orchestral pedals
        notes.push({ id: `bass_${bar}_0`, note: root, step: barStart + 0, duration: 6.0, velocity: 1.0 });
        notes.push({ id: `bass_${bar}_8`, note: fifth, step: barStart + 8, duration: 4.0, velocity: 0.9 });
        notes.push({ id: `bass_${bar}_12`, note: root + 12, step: barStart + 12, duration: 4.0, velocity: 0.95 });
        continue;
      }

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

    if (sectionType === 'chorus') {
      return notes.map(n => ({ ...n, velocity: Math.min(1.0, n.velocity + 0.06) }));
    }

    return notes;
  };

  // 4. Retro Drum Beat Engine (Seed-Varied Grooves, Turnarounds, & Section Dynamics)
  const generateDrumBeat = (
    sectionType: 'verse' | 'chorus' | 'bridge' | 'outro' = 'verse'
  ): NoteEvent[] => {
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

      if (sectionType === 'bridge') {
        // Introspective Half-Time breakdown
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.85 });
        notes.push({ id: `ds_${bar}_8`, note: SNARE, step: barStart + 8, duration: 2, velocity: 0.75 });
        for (let s = 0; s < 16; s += 4) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.5, velocity: 0.5 });
        }
        continue;
      }

      if (activeStyle.id === 'town' || activeStyle.id === 'water' || activeStyle.id === 'forest' || activeStyle.id === 'cave') {
        // Half-time relaxed organic/ambient groove
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 3, velocity: 0.85 });
        if (activeStyle.id !== 'water') {
          notes.push({ id: `ds_${bar}_8`, note: SNARE, step: barStart + 8, duration: 2, velocity: 0.7 });
        }
        for (let s = 0; s < 16; s += 2) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.5, velocity: s % 4 === 0 ? 0.65 : 0.45 });
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
      } else if (activeStyle.id === 'synthwave_night') {
        // Dark Synthwave: 4-on-the-floor kick, heavy gated snare, rolling 16th hats with offbeat open hats
        [0, 4, 8, 12].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 2, velocity: 1.0 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2.5, velocity: 1.0 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2.5, velocity: 1.0 });
        for (let s = 0; s < 16; s++) {
          notes.push({
            id: `dh_${bar}_${s}`,
            note: s % 4 === 2 ? OPEN_HAT : CLOSED_HAT,
            step: barStart + s,
            duration: 1,
            velocity: s % 2 === 0 ? 0.85 : 0.65
          });
        }
      } else if (activeStyle.id === 'sky_airship') {
        // Galloping 6/8 Adventure Drums
        [0, 6, 10].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.8, velocity: 0.95 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2.0, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2.0, velocity: 0.95 });
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(s => {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.2, velocity: s % 4 === 0 ? 0.9 : 0.7 });
        });
      } else if (activeStyle.id === 'chiptune_carnival') {
        // Bubbly 2/4 Ragtime Polka Drums
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2.0, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2.0, velocity: 0.9 });
        notes.push({ id: `dk_${bar}_8`, note: KICK, step: barStart + 8, duration: 2.0, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2.0, velocity: 0.95 });
        [2, 6, 10, 14].forEach(s => {
          notes.push({ id: `dh_${bar}_${s}`, note: OPEN_HAT, step: barStart + s, duration: 1.2, velocity: 0.85 });
        });
      } else if (activeStyle.id === 'battle_encounter') {
        // Urgent Battle Encounter Assault Drums
        [0, 3, 6, 8, 11, 14].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.5, velocity: 1.0 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2.0, velocity: 1.0 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2.0, velocity: 1.0 });
        for (let s = 0; s < 16; s++) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 0.8, velocity: s % 2 === 0 ? 0.9 : 0.7 });
        }
      } else if (activeStyle.id === 'stage_start') {
        // 16-Bit Arcade Funk Beat
        [0, 6, 10].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.8, velocity: 0.98 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2.0, velocity: 1.0 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2.0, velocity: 1.0 });
        [2, 8, 14].forEach(s => {
          notes.push({ id: `doh_${bar}_${s}`, note: OPEN_HAT, step: barStart + s, duration: 1.5, velocity: 0.9 });
        });
        for (let s = 0; s < 16; s += 2) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.0, velocity: 0.75 });
        }
      } else if (activeStyle.id === 'title_splash') {
        // Nostalgic Title Screen: Triumphant Marching Beats
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2.5, velocity: 1.0 });
        notes.push({ id: `dk_${bar}_8`, note: KICK, step: barStart + 8, duration: 2.0, velocity: 0.95 });
        [4, 10, 12, 14].forEach(s => {
          notes.push({ id: `ds_${bar}_${s}`, note: SNARE, step: barStart + s, duration: 1.2, velocity: s === 4 ? 1.0 : 0.85 });
        });
        [0, 4, 8, 12].forEach(s => {
          notes.push({ id: `doh_${bar}_${s}`, note: OPEN_HAT, step: barStart + s, duration: 2.0, velocity: 0.9 });
        });
      } else if (activeStyle.id === 'cyber') {
        // 16-Bit Cyberpunk Factory Electro Drive
        [0, 4, 8, 12].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 2, velocity: 0.96 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        for (let s = 0; s < 16; s++) {
          notes.push({ id: `dh_${bar}_${s}`, note: s % 4 === 2 ? OPEN_HAT : CLOSED_HAT, step: barStart + s, duration: 1, velocity: s % 2 === 0 ? 0.85 : 0.65 });
        }
      } else if (activeStyle.id === 'magma') {
        // Heavy Double-Kick Industrial Rock Assault
        [0, 3, 6, 8, 11, 14].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.8, velocity: 0.98 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.98 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.98 });
        for (let s = 0; s < 16; s += 2) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.5, velocity: 0.8 });
        }
      } else if (activeStyle.id === 'desert') {
        // Syncopated Ethnic Tresillo Desert Groove
        [0, 6, 10].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 2, velocity: 0.95 });
        });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.9 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        [2, 5, 8, 11, 14].forEach(s => {
          notes.push({ id: `doh_${bar}_${s}`, note: OPEN_HAT, step: barStart + s, duration: 1.5, velocity: 0.85 });
        });
      } else if (activeStyle.id === 'comedy') {
        // Bouncy 2/4 Polka / Ragtime Beat
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.85 });
        notes.push({ id: `dk_${bar}_8`, note: KICK, step: barStart + 8, duration: 2, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.85 });
        for (let s = 2; s < 16; s += 4) {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.5, velocity: 0.7 });
        }
      } else if (activeStyle.id === 'fanfare') {
        // Military Marching Cadence & Triumphant Fills
        [0, 8].forEach(s => {
          notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 2, velocity: 1.0 });
        });
        [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].forEach(s => {
          notes.push({ id: `ds_${bar}_${s}`, note: SNARE, step: barStart + s, duration: 0.9, velocity: s % 4 === 0 ? 0.95 : 0.75 });
        });
      } else if (activeStyle.id === 'haunted') {
        // Sparse Creeping Offbeat Clicks & Dramatic Emptiness
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.75 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.7 });
        [3, 7, 11, 15].forEach(s => {
          notes.push({ id: `dh_${bar}_${s}`, note: CLOSED_HAT, step: barStart + s, duration: 1.2, velocity: 0.6 });
        });
      } else if (activeStyle.id === 'ancient_mech') {
        // Authentic Regi Battle Percussion: 3-against-4 Timpani Polyrhythm + Driving Industrial Beat
        notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 1.5, velocity: 1.0 });
        notes.push({ id: `dk_${bar}_8`, note: KICK, step: barStart + 8, duration: 1.5, velocity: 0.95 });
        notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 1.5, velocity: 1.0 });
        notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 1.5, velocity: 1.0 });

        [0, 3, 6, 9, 12, 15].forEach(s => {
          if (s !== 0 && s !== 8) {
            notes.push({ id: `poly_kick_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.0, velocity: 0.85 });
          }
        });

        for (let s = 0; s < 16; s++) {
          if (isLastBar && drumTurnaround && s >= 12) {
            notes.push({ id: `fill_${bar}_${s}`, note: SNARE, step: barStart + s, duration: 0.8, velocity: 0.8 + (s - 12) * 0.05 });
          } else {
            notes.push({
              id: `dh_${bar}_${s}`,
              note: s % 2 === 0 ? CLOSED_HAT : OPEN_HAT,
              step: barStart + s,
              duration: 0.8,
              velocity: s % 4 === 0 ? 0.9 : 0.65
            });
          }
        }
      } else {
        // Varied Battle & Adventure Grooves:
        if (drumGrooveStyle === 0) {
          notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.95 });
          notes.push({ id: `dk_${bar}_8`, note: KICK, step: barStart + 8, duration: 2, velocity: 0.9 });
          notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        } else if (drumGrooveStyle === 1) {
          notes.push({ id: `dk_${bar}_0`, note: KICK, step: barStart + 0, duration: 2, velocity: 0.95 });
          notes.push({ id: `dk_${bar}_6`, note: KICK, step: barStart + 6, duration: 2, velocity: 0.9 });
          notes.push({ id: `dk_${bar}_10`, note: KICK, step: barStart + 10, duration: 2, velocity: 0.9 });
          notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
        } else {
          [0, 4, 8, 12].forEach(s => notes.push({ id: `dk_${bar}_${s}`, note: KICK, step: barStart + s, duration: 1.5, velocity: 0.9 }));
          notes.push({ id: `ds_${bar}_4`, note: SNARE, step: barStart + 4, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_12`, note: SNARE, step: barStart + 12, duration: 2, velocity: 0.95 });
          notes.push({ id: `ds_${bar}_14`, note: SNARE, step: barStart + 14, duration: 1, velocity: 0.7 });
        }

        for (let s = 0; s < 16; s++) {
          if (isLastBar && drumTurnaround && s >= 12) {
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

    if (sectionType === 'chorus') {
      return notes.map(n => ({ ...n, velocity: Math.min(1.0, n.velocity + 0.05) }));
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

  // -----------------------------------------------------------
  // PROCEDURAL INTRO MUSIC ENGINES (6 Flavors)
  // -----------------------------------------------------------
  const generateIntroLead = (
    introFlavor: IntroStyleId = 'auto',
    rootPitch: number = scaleRoot
  ): NoteEvent[] => {
    const flavor = introFlavor === 'auto' ? getEffectiveIntroStyle() : introFlavor;
    const notes: NoteEvent[] = [];
    const baseOctave = 5 + octaveShift;
    const chordTones = getStyleChordTones(0, rootPitch, baseOctave);
    const rootTone = chordTones[0];
    const thirdTone = chordTones[1];
    const fifthTone = chordTones[2];
    const flatSix = rootTone + 8;
    const octaveTone = rootTone + 12;

    if (flavor === 'heroic_herald') {
      // 🎺 Rising 16th Herald Fanfare & Triumphant Cascades
      // Bar 0: Stately fanfare herald call
      notes.push({ id: `intro_lead_0`, note: rootTone, step: 0, duration: 1.5, velocity: 1.0 });
      notes.push({ id: `intro_lead_2`, note: rootTone, step: 2, duration: 1.0, velocity: 0.9 });
      notes.push({ id: `intro_lead_4`, note: fifthTone, step: 4, duration: 3.5, velocity: 1.0 });
      notes.push({ id: `intro_lead_8`, note: thirdTone, step: 8, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_lead_12`, note: octaveTone, step: 12, duration: 4.0, velocity: 1.0 });

      // Bar 1: Ascending triadic sweep into the heavens
      notes.push({ id: `intro_lead_16`, note: octaveTone, step: 16, duration: 2.0, velocity: 0.95 });
      notes.push({ id: `intro_lead_18`, note: fifthTone, step: 18, duration: 1.5, velocity: 0.85 });
      notes.push({ id: `intro_lead_20`, note: thirdTone, step: 20, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_lead_22`, note: fifthTone, step: 22, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_lead_24`, note: octaveTone, step: 24, duration: 2.5, velocity: 1.0 });
      notes.push({ id: `intro_lead_27`, note: octaveTone + 2, step: 27, duration: 1.5, velocity: 0.9 });
      notes.push({ id: `intro_lead_28`, note: octaveTone + 4, step: 28, duration: 3.5, velocity: 1.0 });

      // Bar 2: Resounding horn response
      notes.push({ id: `intro_lead_32`, note: fifthTone, step: 32, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_lead_34`, note: octaveTone, step: 34, duration: 3.0, velocity: 1.0 });
      notes.push({ id: `intro_lead_38`, note: fifthTone + 2, step: 38, duration: 2.0, velocity: 0.85 });
      notes.push({ id: `intro_lead_40`, note: octaveTone, step: 40, duration: 3.0, velocity: 0.95 });
      notes.push({ id: `intro_lead_44`, note: thirdTone + 12, step: 44, duration: 4.0, velocity: 1.0 });

      // Bar 3: Grand fortissimo power stabs into the drop!
      notes.push({ id: `intro_lead_48`, note: octaveTone, step: 48, duration: 3.0, velocity: 1.0 });
      notes.push({ id: `intro_lead_48_5th`, note: fifthTone + 12, step: 48, duration: 3.0, velocity: 0.95 });
      notes.push({ id: `intro_lead_54`, note: octaveTone, step: 54, duration: 3.0, velocity: 1.0 });
      notes.push({ id: `intro_lead_54_5th`, note: fifthTone + 12, step: 54, duration: 3.0, velocity: 0.95 });
      notes.push({ id: `intro_lead_60`, note: octaveTone + 12, step: 60, duration: 2.0, velocity: 1.0 });
      return notes;
    }

    if (flavor === 'warning_siren') {
      // ⚠️ Rapid Chromatic Siren Oscillations & Alert Alarm
      // Bars 0-1: Oscillating emergency siren
      for (let s = 0; s < 32; s += 2) {
        const p = s % 4 === 0 ? octaveTone : octaveTone + 1;
        notes.push({ id: `intro_siren_${s}`, note: p, step: s, duration: 1.5, velocity: s % 8 === 0 ? 1.0 : 0.88 });
      }

      // Bar 2: Alarming dissonant stabs (Tritone, Flat 2nd, High Octave)
      [32, 35, 38, 41, 44].forEach((s, idx) => {
        const alertPitches = [octaveTone, octaveTone + 1, rootTone + 6, octaveTone, octaveTone + 12];
        notes.push({ id: `intro_siren_${s}`, note: alertPitches[idx], step: s, duration: 2.0, velocity: 1.0 });
      });

      // Bar 3: Accelerating alarm pulse into the drop
      [48, 52, 56, 58, 60, 62].forEach((s, idx) => {
        notes.push({ id: `intro_siren_${s}`, note: octaveTone, step: s, duration: 1.2, velocity: 0.85 + idx * 0.03 });
      });
      return notes;
    }

    if (flavor === 'ambient_swell') {
      // ⏳ Spacious Bell Tolls, Poignant Sighs, & Emotional Story Prologue
      // Bar 0: Lonely bell toll
      notes.push({ id: `intro_swell_0`, note: octaveTone, step: 0, duration: 14.0, velocity: 0.9 });
      // Bar 1: Ethereal fifth harmonic
      notes.push({ id: `intro_swell_16`, note: fifthTone + 12, step: 16, duration: 14.0, velocity: 0.85 });
      // Bar 2: Poignant minor third sigh
      notes.push({ id: `intro_swell_32`, note: thirdTone + 12, step: 32, duration: 6.0, velocity: 0.85 });
      notes.push({ id: `intro_swell_40`, note: fifthTone, step: 40, duration: 6.0, velocity: 0.8 });
      // Bar 3: Ascending crescendo swell
      notes.push({ id: `intro_swell_48`, note: rootTone, step: 48, duration: 2.0, velocity: 0.8 });
      notes.push({ id: `intro_swell_52`, note: rootTone + 2, step: 52, duration: 2.0, velocity: 0.85 });
      notes.push({ id: `intro_swell_56`, note: thirdTone, step: 56, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_swell_60`, note: fifthTone, step: 60, duration: 3.5, velocity: 1.0 });
      return notes;
    }

    if (flavor === 'arcade_stinger') {
      // 🏁 "Ready... GO!" Arcade Funk Brass Stabs
      // Bar 0: "Ready..."
      notes.push({ id: `intro_arcade_0`, note: rootTone, step: 0, duration: 1.5, velocity: 1.0 });
      notes.push({ id: `intro_arcade_4`, note: fifthTone, step: 4, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_arcade_8`, note: octaveTone, step: 8, duration: 1.5, velocity: 1.0 });
      notes.push({ id: `intro_arcade_12`, note: fifthTone + 12, step: 12, duration: 3.5, velocity: 1.0 });

      // Bar 1: Repeat punch
      notes.push({ id: `intro_arcade_16`, note: rootTone, step: 16, duration: 1.5, velocity: 1.0 });
      notes.push({ id: `intro_arcade_20`, note: fifthTone, step: 20, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_arcade_24`, note: octaveTone + 12, step: 24, duration: 4.0, velocity: 1.0 });

      // Bar 2: "...GO!" Pentatonic upward slide
      [32, 34, 36, 38, 40].forEach((s, idx) => {
        const slidePitches = [rootTone, thirdTone, fifthTone, rootTone + 10, octaveTone];
        notes.push({ id: `intro_arcade_${s}`, note: slidePitches[idx], step: s, duration: 1.8, velocity: 1.0 });
      });

      // Bar 3: Staccato funk chops and dramatic silence before drop
      notes.push({ id: `intro_arcade_48`, note: octaveTone, step: 48, duration: 1.5, velocity: 1.0 });
      notes.push({ id: `intro_arcade_52`, note: fifthTone + 12, step: 52, duration: 1.5, velocity: 1.0 });
      notes.push({ id: `intro_arcade_56`, note: octaveTone + 12, step: 56, duration: 1.8, velocity: 1.0 });
      return notes;
    }

    if (flavor === 'snare_march') {
      // 🥁 Military Herald Horn Call & Rudiment March
      // Bars 0-1: Military herald trumpet
      notes.push({ id: `intro_march_0`, note: rootTone, step: 0, duration: 2.5, velocity: 1.0 });
      notes.push({ id: `intro_march_4`, note: rootTone, step: 4, duration: 1.0, velocity: 0.9 });
      notes.push({ id: `intro_march_6`, note: fifthTone, step: 6, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_march_8`, note: octaveTone, step: 8, duration: 3.5, velocity: 1.0 });
      notes.push({ id: `intro_march_16`, note: thirdTone + 12, step: 16, duration: 2.5, velocity: 0.95 });
      notes.push({ id: `intro_march_20`, note: octaveTone, step: 20, duration: 1.5, velocity: 0.9 });
      notes.push({ id: `intro_march_24`, note: fifthTone, step: 24, duration: 4.0, velocity: 1.0 });

      // Bar 2: Bugle call
      notes.push({ id: `intro_march_32`, note: fifthTone, step: 32, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_march_35`, note: octaveTone, step: 35, duration: 2.5, velocity: 1.0 });
      notes.push({ id: `intro_march_40`, note: fifthTone + 2, step: 40, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_march_44`, note: fifthTone, step: 44, duration: 3.0, velocity: 0.95 });

      // Bar 3: Fortissimo unison drop stabs
      notes.push({ id: `intro_march_48`, note: octaveTone, step: 48, duration: 3.5, velocity: 1.0 });
      notes.push({ id: `intro_march_48_5th`, note: fifthTone + 12, step: 48, duration: 3.5, velocity: 0.95 });
      notes.push({ id: `intro_march_56`, note: octaveTone, step: 56, duration: 3.5, velocity: 1.0 });
      notes.push({ id: `intro_march_56_5th`, note: fifthTone + 12, step: 56, duration: 3.5, velocity: 0.95 });
      return notes;
    }

    // 🗿 Clockwork Machinery (Authentic Regi Theme Startup)
    // Bars 0-1 (steps 0-31): Interlocking ping-pong responses across the octaves
    [0, 8, 16, 24].forEach((s, idx) => {
      const p = idx % 2 === 0 ? octaveTone : rootTone;
      notes.push({ id: `intro_lead_${s}`, note: p, step: s, duration: 1.5, velocity: 0.9 });
      notes.push({ id: `intro_lead_${s + 4}`, note: flatSix, step: s + 4, duration: 1.0, velocity: 0.85 });
      notes.push({ id: `intro_lead_${s + 5}`, note: fifthTone, step: s + 5, duration: 1.0, velocity: 0.85 });
    });

    // Bar 2 (steps 32-47): The Alien Golem Signal
    [32, 34, 36, 40, 42, 45].forEach((s, idx) => {
      const signalPitches = [rootTone + 3, rootTone, rootTone + 2, flatSix, rootTone + 11, fifthTone];
      notes.push({ id: `intro_lead_${s}`, note: signalPitches[idx], step: s, duration: 1.5, velocity: 0.95 });
    });

    // Bar 3 (steps 48-63): Massive harmonized power stabs into the drop!
    notes.push({ id: `intro_lead_drop_48`, note: rootTone, step: 48, duration: 3.5, velocity: 1.0 });
    notes.push({ id: `intro_lead_drop_48_5th`, note: fifthTone, step: 48, duration: 3.5, velocity: 0.95 });
    notes.push({ id: `intro_lead_drop_54`, note: rootTone + 1, step: 54, duration: 3.5, velocity: 1.0 });
    notes.push({ id: `intro_lead_drop_54_5th`, note: fifthTone + 1, step: 54, duration: 3.5, velocity: 0.95 });
    notes.push({ id: `intro_lead_drop_60`, note: octaveTone, step: 60, duration: 2.0, velocity: 1.0 });
    return notes;
  };

  const generateIntroArp = (
    introFlavor: IntroStyleId = 'auto',
    rootPitch: number = scaleRoot
  ): NoteEvent[] => {
    const flavor = introFlavor === 'auto' ? getEffectiveIntroStyle() : introFlavor;
    const notes: NoteEvent[] = [];
    const baseHigh = (5 * 12) + rootPitch + 12;

    if (flavor === 'heroic_herald') {
      // Sparkling ascending cascades climbing octave by octave
      const chordTones = getStyleChordTones(0, rootPitch, 5);
      for (let s = 0; s < 64; s++) {
        const octaveOffset = Math.floor(s / 16) * 4;
        const p = chordTones[s % chordTones.length] + octaveOffset;
        notes.push({
          id: `intro_arp_${s}`,
          note: p,
          step: s,
          duration: 0.9,
          velocity: s % 4 === 0 ? 0.85 : 0.65
        });
      }
      return notes;
    }

    if (flavor === 'warning_siren') {
      // Dissonant high-speed oscillation
      for (let s = 0; s < 64; s += 2) {
        const p = s % 4 === 0 ? baseHigh : baseHigh + 6; // Tritone alarm
        notes.push({
          id: `intro_arp_${s}`,
          note: p,
          step: s,
          duration: 1.2,
          velocity: 0.7 + (s / 64) * 0.25
        });
      }
      return notes;
    }

    if (flavor === 'ambient_swell') {
      // Sparse music-box chime notes
      [4, 12, 20, 28, 36, 44, 52, 60].forEach((s, idx) => {
        const chimePitches = [baseHigh, baseHigh + 7, baseHigh + 4, baseHigh + 12, baseHigh + 7, baseHigh + 11, baseHigh + 14, baseHigh + 12];
        notes.push({
          id: `intro_arp_${s}`,
          note: chimePitches[idx],
          step: s,
          duration: 3.0,
          velocity: 0.65
        });
      });
      return notes;
    }

    if (flavor === 'arcade_stinger') {
      // Bouncy 16th video-game ping-pong arp
      const tones = getStyleChordTones(0, rootPitch, 5);
      for (let s = 0; s < 60; s++) {
        const cycle = tones.length * 2 - 2;
        const pos = s % cycle;
        const pIdx = pos < tones.length ? pos : cycle - pos;
        notes.push({
          id: `intro_arp_${s}`,
          note: tones[pIdx],
          step: s,
          duration: 0.9,
          velocity: s % 4 === 0 ? 0.8 : 0.6
        });
      }
      return notes;
    }

    if (flavor === 'snare_march') {
      // Rhythmic chord stabs on quarter notes
      const tones = getStyleChordTones(0, rootPitch, 5);
      for (let s = 0; s < 64; s += 4) {
        tones.slice(0, 3).forEach((p, idx) => {
          notes.push({
            id: `intro_arp_${s}_${idx}`,
            note: p,
            step: s,
            duration: 2.0,
            velocity: s % 8 === 0 ? 0.85 : 0.7
          });
        });
      }
      return notes;
    }

    // 🗿 Clockwork Machinery: The iconic Descending Parallel-Fifths Cascade!
    for (let beat = 0; beat < 8; beat++) {
      const beatStep = beat * 4;
      const cellRoot = baseHigh - beat;
      const cellFifth = cellRoot - 5;

      notes.push({ id: `intro_arp_${beatStep + 0}`, note: cellRoot, step: beatStep + 0, duration: 0.9, velocity: 0.85 });
      notes.push({ id: `intro_arp_${beatStep + 1}`, note: cellFifth, step: beatStep + 1, duration: 0.9, velocity: 0.75 });
      notes.push({ id: `intro_arp_${beatStep + 2}`, note: cellRoot, step: beatStep + 2, duration: 0.9, velocity: 0.8 });
    }

    for (let s = 32; s < 48; s += 2) {
      const p = s % 4 === 0 ? baseHigh - 8 : baseHigh - 12;
      notes.push({ id: `intro_arp_${s}`, note: p, step: s, duration: 1.0, velocity: 0.75 });
    }

    for (let s = 48; s < 64; s++) {
      notes.push({
        id: `intro_arp_${s}`,
        note: (baseHigh - 12) + (s - 48),
        step: s,
        duration: 0.8,
        velocity: 0.6 + ((s - 48) / 16) * 0.35
      });
    }

    return notes;
  };

  const generateIntroBass = (
    introFlavor: IntroStyleId = 'auto',
    rootPitch: number = scaleRoot
  ): NoteEvent[] => {
    const flavor = introFlavor === 'auto' ? getEffectiveIntroStyle() : introFlavor;
    const notes: NoteEvent[] = [];
    const rootTone = (2 * 12) + rootPitch; // Octave 2 low bass

    if (flavor === 'heroic_herald') {
      // Stately escalating bass stair across bars
      notes.push({ id: `intro_bass_0`, note: rootTone, step: 0, duration: 7.5, velocity: 0.95 });
      notes.push({ id: `intro_bass_8`, note: rootTone, step: 8, duration: 7.5, velocity: 0.95 });
      notes.push({ id: `intro_bass_16`, note: rootTone + 5, step: 16, duration: 7.5, velocity: 0.95 });
      notes.push({ id: `intro_bass_24`, note: rootTone + 5, step: 24, duration: 7.5, velocity: 0.95 });
      notes.push({ id: `intro_bass_32`, note: rootTone + 7, step: 32, duration: 7.5, velocity: 1.0 });
      notes.push({ id: `intro_bass_40`, note: rootTone + 7, step: 40, duration: 7.5, velocity: 1.0 });
      for (let s = 48; s < 64; s += 2) {
        notes.push({ id: `intro_bass_${s}`, note: s >= 56 ? rootTone + 12 : rootTone, step: s, duration: 1.8, velocity: 0.85 + ((s - 48) / 16) * 0.15 });
      }
      return notes;
    }

    if (flavor === 'warning_siren') {
      // Low pulsing drone with rapid 16th acceleration into drop
      for (let s = 0; s < 48; s += 4) {
        notes.push({ id: `intro_bass_${s}`, note: rootTone, step: s, duration: 3.5, velocity: 0.9 });
      }
      for (let s = 48; s < 64; s += 2) {
        const p = s >= 56 ? rootTone + 1 : rootTone;
        notes.push({ id: `intro_bass_${s}`, note: p, step: s, duration: 1.5, velocity: 0.8 + ((s - 48) / 16) * 0.2 });
      }
      return notes;
    }

    if (flavor === 'ambient_swell') {
      // Deep whole-note drone pedals
      [0, 16, 32, 48].forEach((s, idx) => {
        const pitchOffsets = [0, 8, 5, 7];
        notes.push({
          id: `intro_bass_${s}`,
          note: rootTone + pitchOffsets[idx],
          step: s,
          duration: 15.5,
          velocity: 0.75 + idx * 0.06
        });
      });
      return notes;
    }

    if (flavor === 'arcade_stinger') {
      // Funky slap bass walkup
      notes.push({ id: `intro_bass_0`, note: rootTone, step: 0, duration: 3.0, velocity: 1.0 });
      notes.push({ id: `intro_bass_4`, note: rootTone + 12, step: 4, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_bass_8`, note: rootTone, step: 8, duration: 3.0, velocity: 1.0 });
      notes.push({ id: `intro_bass_12`, note: rootTone + 10, step: 12, duration: 3.0, velocity: 0.9 });
      notes.push({ id: `intro_bass_16`, note: rootTone, step: 16, duration: 2.0, velocity: 1.0 });
      notes.push({ id: `intro_bass_20`, note: rootTone + 12, step: 20, duration: 2.0, velocity: 0.95 });
      notes.push({ id: `intro_bass_24`, note: rootTone + 7, step: 24, duration: 2.0, velocity: 0.9 });
      notes.push({ id: `intro_bass_28`, note: rootTone + 12, step: 28, duration: 2.0, velocity: 0.95 });
      [32, 36, 40, 44].forEach((s, idx) => {
        notes.push({ id: `intro_bass_${s}`, note: rootTone + idx * 2, step: s, duration: 3.0, velocity: 0.95 });
      });
      notes.push({ id: `intro_bass_48`, note: rootTone + 12, step: 48, duration: 2.0, velocity: 1.0 });
      notes.push({ id: `intro_bass_52`, note: rootTone + 10, step: 52, duration: 2.0, velocity: 0.95 });
      notes.push({ id: `intro_bass_56`, note: rootTone + 7, step: 56, duration: 2.0, velocity: 1.0 });
      return notes;
    }

    if (flavor === 'snare_march') {
      // Root-fifth marching cadence
      for (let s = 0; s < 64; s += 8) {
        notes.push({ id: `intro_bass_${s}`, note: rootTone, step: s, duration: 3.5, velocity: 0.95 });
        notes.push({ id: `intro_bass_${s + 4}`, note: rootTone + 7, step: s + 4, duration: 3.5, velocity: 0.9 });
      }
      return notes;
    }

    // 🗿 Clockwork Machinery: Escalating Octave Stair!
    [0, 1, 2].forEach(barIdx => {
      const bStart = barIdx * 16;
      const bRoot = rootTone + (barIdx * 12);
      const bSix = bRoot + 8;
      const bFifth = bRoot + 7;

      notes.push({ id: `intro_bass_${bStart + 0}`, note: bRoot, step: bStart + 0, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_bass_${bStart + 2}`, note: bRoot, step: bStart + 2, duration: 1.0, velocity: 0.85 });
      notes.push({ id: `intro_bass_${bStart + 4}`, note: bSix, step: bStart + 4, duration: 1.0, velocity: 0.95 });
      notes.push({ id: `intro_bass_${bStart + 5}`, note: bFifth, step: bStart + 5, duration: 1.0, velocity: 0.9 });
      notes.push({ id: `intro_bass_${bStart + 6}`, note: bRoot, step: bStart + 6, duration: 1.5, velocity: 0.95 });
      notes.push({ id: `intro_bass_${bStart + 8}`, note: bRoot, step: bStart + 8, duration: 1.0, velocity: 0.85 });
      notes.push({ id: `intro_bass_${bStart + 10}`, note: bSix, step: bStart + 10, duration: 1.0, velocity: 0.95 });
      notes.push({ id: `intro_bass_${bStart + 11}`, note: bFifth, step: bStart + 11, duration: 1.0, velocity: 0.9 });
    });

    for (let s = 48; s < 64; s += 2) {
      const p = s >= 56 ? (s % 4 === 0 ? rootTone + 13 : rootTone + 12) : rootTone + 12;
      notes.push({
        id: `intro_bass_${s}`,
        note: p,
        step: s,
        duration: 1.5,
        velocity: 0.8 + ((s - 48) / 16) * 0.2
      });
    }

    return notes;
  };

  const generateIntroDrums = (
    introFlavor: IntroStyleId = 'auto'
  ): NoteEvent[] => {
    const flavor = introFlavor === 'auto' ? getEffectiveIntroStyle() : introFlavor;
    const notes: NoteEvent[] = [];
    const KICK = 48;
    const SNARE = 50;
    const CLOSED_HAT = 54;
    const OPEN_HAT = 58;

    if (flavor === 'heroic_herald') {
      // Timpani downbeats on 0, 8, 16, 24, 32, 40
      [0, 8, 16, 24, 32, 40].forEach(s => {
        notes.push({ id: `intro_drum_${s}`, note: KICK, step: s, duration: 2.0, velocity: 1.0 });
        notes.push({ id: `intro_drum_hat_${s}`, note: OPEN_HAT, step: s, duration: 2.0, velocity: 0.85 });
      });
      [36, 44].forEach(s => {
        notes.push({ id: `intro_drum_${s}`, note: SNARE, step: s, duration: 1.5, velocity: 0.9 });
      });
      for (let s = 48; s < 64; s++) {
        notes.push({
          id: `intro_drum_fill_${s}`,
          note: SNARE,
          step: s,
          duration: 0.8,
          velocity: 0.7 + ((s - 48) / 16) * 0.3
        });
      }
      return notes;
    }

    if (flavor === 'warning_siren') {
      // Heartbeat kicks and accelerating snare roll
      [0, 3, 16, 19, 32, 35].forEach(s => {
        notes.push({ id: `intro_drum_${s}`, note: KICK, step: s, duration: 1.5, velocity: 1.0 });
      });
      for (let s = 32; s < 48; s += 2) {
        notes.push({ id: `intro_drum_${s}`, note: SNARE, step: s, duration: 1.0, velocity: 0.7 + ((s - 32) / 16) * 0.15 });
      }
      for (let s = 48; s < 64; s++) {
        notes.push({ id: `intro_drum_${s}`, note: SNARE, step: s, duration: 0.8, velocity: 0.8 + ((s - 48) / 16) * 0.2 });
      }
      return notes;
    }

    if (flavor === 'ambient_swell') {
      // Sparse ticking clockwork hats and gentle cymbal swell
      for (let s = 0; s < 48; s += 8) {
        notes.push({ id: `intro_drum_${s}`, note: CLOSED_HAT, step: s, duration: 2.0, velocity: 0.6 });
      }
      notes.push({ id: `intro_drum_swell_48`, note: KICK, step: 48, duration: 4.0, velocity: 0.8 });
      for (let s = 48; s < 64; s += 2) {
        notes.push({ id: `intro_drum_${s}`, note: OPEN_HAT, step: s, duration: 1.5, velocity: 0.5 + ((s - 48) / 16) * 0.45 });
      }
      return notes;
    }

    if (flavor === 'arcade_stinger') {
      // Countdown clicks on 0, 16, 32 and explosive drum fill in bar 3
      [0, 16, 32].forEach(s => {
        notes.push({ id: `intro_drum_count_${s}`, note: CLOSED_HAT, step: s, duration: 2.0, velocity: 1.0 });
        notes.push({ id: `intro_drum_kick_${s}`, note: KICK, step: s, duration: 2.0, velocity: 0.9 });
      });
      [48, 50, 52, 54, 56].forEach((s, idx) => {
        notes.push({ id: `intro_drum_fill_${s}`, note: SNARE, step: s, duration: 1.0, velocity: 0.85 + idx * 0.03 });
        notes.push({ id: `intro_drum_fill_k_${s}`, note: KICK, step: s, duration: 1.0, velocity: 0.9 });
      });
      notes.push({ id: `intro_drum_crash_58`, note: OPEN_HAT, step: 58, duration: 4.0, velocity: 1.0 });
      return notes;
    }

    if (flavor === 'snare_march') {
      // Marching snare rudiments and rolls
      for (let s = 0; s < 64; s += 8) {
        notes.push({ id: `intro_drum_march_${s}`, note: KICK, step: s, duration: 2.0, velocity: 1.0 });
      }
      [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].forEach(offset => {
        [0, 16, 32].forEach(barOffset => {
          notes.push({
            id: `intro_drum_snare_${barOffset + offset}`,
            note: SNARE,
            step: barOffset + offset,
            duration: 0.8,
            velocity: offset % 4 === 0 ? 0.95 : 0.7
          });
        });
      });
      for (let s = 48; s < 62; s++) {
        notes.push({ id: `intro_drum_roll_${s}`, note: SNARE, step: s, duration: 0.8, velocity: 0.75 + ((s - 48) / 14) * 0.25 });
      }
      notes.push({ id: `intro_drum_crash_62`, note: SNARE, step: 62, duration: 2.0, velocity: 1.0 });
      return notes;
    }

    // 🗿 Clockwork Machinery: Sporadic clicks, 3-against-4 polyrhythm, and snare turnaround
    notes.push({ id: `intro_drum_6`, note: CLOSED_HAT, step: 6, duration: 1, velocity: 0.7 });
    notes.push({ id: `intro_drum_14`, note: CLOSED_HAT, step: 14, duration: 1, velocity: 0.75 });
    notes.push({ id: `intro_drum_20`, note: KICK, step: 20, duration: 2, velocity: 0.9 });
    notes.push({ id: `intro_drum_24`, note: SNARE, step: 24, duration: 1.5, velocity: 0.85 });
    notes.push({ id: `intro_drum_30`, note: CLOSED_HAT, step: 30, duration: 1, velocity: 0.8 });

    [32, 35, 38, 41, 44, 47].forEach(s => {
      notes.push({ id: `intro_drum_poly_${s}`, note: KICK, step: s, duration: 1.5, velocity: 0.95 });
    });

    for (let s = 48; s < 64; s++) {
      if (s >= 52) {
        notes.push({
          id: `intro_drum_fill_${s}`,
          note: SNARE,
          step: s,
          duration: 0.8,
          velocity: 0.7 + ((s - 52) / 12) * 0.3
        });
      } else {
        notes.push({
          id: `intro_drum_${s}`,
          note: s % 2 === 0 ? KICK : CLOSED_HAT,
          step: s,
          duration: 1,
          velocity: 0.85
        });
      }
    }

    return notes;
  };

  // Generate Intro + Loop multi-pattern arrangement
  const handleGenerateIntroAndLoop = () => {
    if (!onApplyMultiPatternIntroLoop || channels.length === 0) return;

    const leadChan = channels[0];
    const arpChan = channels[1] || channels[0];
    const bassChan = channels.find(c => c.id.includes('bass') || c.name.toLowerCase().includes('bass')) || channels[2] || channels[0];
    const drumChan = channels.find(c => c.id.includes('drum') || c.name.toLowerCase().includes('drum') || c.preset === 'noise') || channels[3] || channels[0];

    const effectiveIntro = getEffectiveIntroStyle();

    // 1. Generate Intro Pattern Notes (4 bars)
    const introNotes: Record<string, NoteEvent[]> = {};
    introNotes[leadChan.id] = generateIntroLead(effectiveIntro);
    if (arpChan.id !== leadChan.id) introNotes[arpChan.id] = generateIntroArp(effectiveIntro);
    if (bassChan.id !== leadChan.id && bassChan.id !== arpChan.id) introNotes[bassChan.id] = generateIntroBass(effectiveIntro);
    if (drumChan.id !== leadChan.id && drumChan.id !== bassChan.id) introNotes[drumChan.id] = generateIntroDrums(effectiveIntro);

    // 2. Generate Loop Pattern Notes (4 bars: full theme groove)
    const loopNotes: Record<string, NoteEvent[]> = {};
    loopNotes[leadChan.id] = generateLeadMelody(scaleRoot, undefined, 'verse');
    if (arpChan.id !== leadChan.id) loopNotes[arpChan.id] = generateArpBed(scaleRoot, 'verse');
    if (bassChan.id !== leadChan.id && bassChan.id !== arpChan.id) loopNotes[bassChan.id] = generateBassline(scaleRoot, 'verse');
    if (drumChan.id !== leadChan.id && drumChan.id !== bassChan.id) loopNotes[drumChan.id] = generateDrumBeat('verse');

    onApplyMultiPatternIntroLoop(introNotes, loopNotes, activeStyle.name);
    onClose();
  };

  // Generate Multi-Part Song Arrangement across timeline playlist
  const handleGenerateMultiPartSong = () => {
    if (!onApplyMultiPartSong || channels.length === 0) return;

    const leadChan = channels[0];
    const arpChan = channels[1] || channels[0];
    const bassChan = channels.find(c => c.id.includes('bass') || c.name.toLowerCase().includes('bass')) || channels[2] || channels[0];
    const drumChan = channels.find(c => c.id.includes('drum') || c.name.toLowerCase().includes('drum') || c.preset === 'noise') || channels[3] || channels[0];

    const effectiveIntro = getEffectiveIntroStyle();
    const sectionsToBuild: { id: string; name: string; sectionType: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro'; color: string; repeat: number }[] = [];

    if (songStructure === 'full_anthem') {
      // 24 bars: Intro (4b) -> Verse (4b) -> Chorus (4b) -> Bridge (4b) -> Chorus Reprise (4b) -> Outro (4b)
      sectionsToBuild.push({ id: 'intro', name: 'Intro', sectionType: 'intro', color: '#f59e0b', repeat: 1 });
      sectionsToBuild.push({ id: 'verse', name: 'Verse (Theme A)', sectionType: 'verse', color: '#6366f1', repeat: 1 });
      sectionsToBuild.push({ id: 'chorus', name: 'Chorus (Theme B)', sectionType: 'chorus', color: '#ec4899', repeat: 1 });
      sectionsToBuild.push({ id: 'bridge', name: 'Bridge (Breakdown)', sectionType: 'bridge', color: '#8b5cf6', repeat: 1 });
      sectionsToBuild.push({ id: 'chorus_reprise', name: 'Chorus (Climax)', sectionType: 'chorus', color: '#ec4899', repeat: 1 });
      sectionsToBuild.push({ id: 'outro', name: 'Outro (Cadence)', sectionType: 'outro', color: '#10b981', repeat: 1 });
    } else if (songStructure === 'verse_chorus') {
      // 16 bars: Intro (4b) -> Verse (4b) -> Chorus (8b)
      sectionsToBuild.push({ id: 'intro', name: 'Intro', sectionType: 'intro', color: '#f59e0b', repeat: 1 });
      sectionsToBuild.push({ id: 'verse', name: 'Verse (Theme A)', sectionType: 'verse', color: '#6366f1', repeat: 1 });
      sectionsToBuild.push({ id: 'chorus', name: 'Chorus (Climax)', sectionType: 'chorus', color: '#ec4899', repeat: 2 });
    } else if (songStructure === 'intro_loop') {
      // 12 bars: Intro (4b) -> Main Theme Loop (8b)
      sectionsToBuild.push({ id: 'intro', name: 'Intro', sectionType: 'intro', color: '#f59e0b', repeat: 1 });
      sectionsToBuild.push({ id: 'theme', name: 'Main Theme Loop', sectionType: 'verse', color: '#6366f1', repeat: 2 });
    } else if (songStructure === 'loop_only') {
      // 8 bars: Verse (4b) -> Chorus (4b)
      sectionsToBuild.push({ id: 'verse', name: 'Verse (Theme A)', sectionType: 'verse', color: '#6366f1', repeat: 1 });
      sectionsToBuild.push({ id: 'chorus', name: 'Chorus (Theme B)', sectionType: 'chorus', color: '#ec4899', repeat: 1 });
    } else {
      // Custom Matrix
      if (customSections.intro) sectionsToBuild.push({ id: 'intro', name: 'Intro', sectionType: 'intro', color: '#f59e0b', repeat: 1 });
      if (customSections.verse) sectionsToBuild.push({ id: 'verse', name: 'Verse', sectionType: 'verse', color: '#6366f1', repeat: 1 });
      if (customSections.chorus) sectionsToBuild.push({ id: 'chorus', name: 'Chorus', sectionType: 'chorus', color: '#ec4899', repeat: 1 });
      if (customSections.bridge) sectionsToBuild.push({ id: 'bridge', name: 'Bridge', sectionType: 'bridge', color: '#8b5cf6', repeat: 1 });
      if (customSections.outro) sectionsToBuild.push({ id: 'outro', name: 'Outro', sectionType: 'outro', color: '#10b981', repeat: 1 });
    }

    if (sectionsToBuild.length === 0) return;

    const generatedSections: GeneratedSongSection[] = sectionsToBuild.map((secDef) => {
      const secNotes: Record<string, NoteEvent[]> = {};
      if (secDef.sectionType === 'intro') {
        secNotes[leadChan.id] = generateIntroLead(effectiveIntro);
        if (arpChan.id !== leadChan.id) secNotes[arpChan.id] = generateIntroArp(effectiveIntro);
        if (bassChan.id !== leadChan.id && bassChan.id !== arpChan.id) secNotes[bassChan.id] = generateIntroBass(effectiveIntro);
        if (drumChan.id !== leadChan.id && drumChan.id !== bassChan.id) secNotes[drumChan.id] = generateIntroDrums(effectiveIntro);
      } else {
        secNotes[leadChan.id] = generateLeadMelody(scaleRoot, undefined, secDef.sectionType);
        if (arpChan.id !== leadChan.id) secNotes[arpChan.id] = generateArpBed(scaleRoot, secDef.sectionType);
        if (bassChan.id !== leadChan.id && bassChan.id !== arpChan.id) secNotes[bassChan.id] = generateBassline(scaleRoot, secDef.sectionType);
        if (drumChan.id !== leadChan.id && drumChan.id !== bassChan.id) secNotes[drumChan.id] = generateDrumBeat(secDef.sectionType);
      }

      return {
        id: secDef.id,
        name: secDef.name,
        lengthSteps: 64, // standard 4 bars
        notesByChannel: secNotes,
        color: secDef.color,
        repeatInTimeline: secDef.repeat
      };
    });

    onApplyMultiPartSong(generatedSections, activeStyle.name, {
      bpm: activeStyle.recommendedBpm,
      scaleRoot: activeStyle.recommendedRoot,
      scaleMode: activeStyle.recommendedScale,
      dsp: activeStyle.dspPreset.config
    });

    onClose();
  };

  // Final Action Handler: Apply generated notes to single active pattern
  const handleApply = () => {
    if (activeTab === 'style') {
      if (generationScope === 'full' && onApplyFullArrangement && channels.length >= 2) {
        // Automatically map parts across channels
        const leadChan = channels[0];
        const arpChan = channels[1] || channels[0];
        const bassChan = channels.find(c => c.id.includes('bass') || c.name.toLowerCase().includes('bass')) || channels[2] || channels[0];
        const drumChan = channels.find(c => c.id.includes('drum') || c.name.toLowerCase().includes('drum') || c.preset === 'noise') || channels[3] || channels[0];

        const arrangement: Record<string, NoteEvent[]> = {};
        arrangement[leadChan.id] = generateLeadMelody(scaleRoot, undefined, 'verse');
        if (arpChan.id !== leadChan.id) arrangement[arpChan.id] = generateArpBed(scaleRoot, 'verse');
        if (bassChan.id !== leadChan.id && bassChan.id !== arpChan.id) arrangement[bassChan.id] = generateBassline(scaleRoot, 'verse');
        if (drumChan.id !== leadChan.id && drumChan.id !== bassChan.id) arrangement[drumChan.id] = generateDrumBeat('verse');

        onApplyFullArrangement(arrangement);
      } else {
        // Single Active Channel Lead Melody
        const leadNotes = generateLeadMelody(scaleRoot, undefined, 'verse');
        onApplyNotes(leadNotes);
      }
    } else if (activeTab === 'chords') {
      const chordNotes = generateChordsOnly();
      onApplyNotes(chordNotes);
    } else if (activeTab === 'drums') {
      const drumNotes = generateDrumBeat('verse');
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

              {/* Archetype Cards & Category Filtering */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Select Musical Style Archetype
                  </label>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {[
                      { id: 'all', label: 'All', icon: '✨', count: STYLE_ARCHETYPES.length },
                      { id: 'intro', label: '🌟 Intros & Stingers', icon: '', count: STYLE_ARCHETYPES.filter(s => getStyleCategory(s) === 'intro').length },
                      { id: 'battle', label: '⚔️ Battles', icon: '', count: STYLE_ARCHETYPES.filter(s => getStyleCategory(s) === 'battle').length },
                      { id: 'adventure', label: '🧭 Adventure', icon: '', count: STYLE_ARCHETYPES.filter(s => getStyleCategory(s) === 'adventure').length },
                      { id: 'ambient', label: '☕ Ambient', icon: '', count: STYLE_ARCHETYPES.filter(s => getStyleCategory(s) === 'ambient').length },
                      { id: 'retro', label: '🏙️ Retro', icon: '', count: STYLE_ARCHETYPES.filter(s => getStyleCategory(s) === 'retro').length }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setStyleCategoryFilter(cat.id as any)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all ${
                          styleCategoryFilter === cat.id
                            ? 'bg-indigo-600 text-white font-bold shadow-sm ring-1 ring-indigo-400'
                            : 'bg-gray-950 text-gray-400 hover:text-gray-200 border border-gray-800'
                        }`}
                      >
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.label}</span>
                        <span className="text-[10px] opacity-70">({cat.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {STYLE_ARCHETYPES.filter(s => styleCategoryFilter === 'all' || getStyleCategory(s) === styleCategoryFilter).map(style => (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedStyleId === style.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                          : 'bg-gray-800/60 border-gray-700/70 hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{style.icon}</span>
                          <div>
                            <div className="font-bold text-xs text-indigo-300">{style.name}</div>
                            <div className="text-[10px] text-gray-400">{style.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700 text-emerald-400">
                          {style.recommendedBpm} BPM
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed line-clamp-2">
                        {style.description}
                      </p>

                      <div className="mt-1.5 text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate">
                        {style.melodicHookDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Part Song Structure & Arranger Studio Panel */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-gray-950 to-purple-950/30 p-4 rounded-xl border border-indigo-800/40 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-indigo-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-400" />
                    <span className="text-xs font-mono font-bold text-gray-100 uppercase tracking-wider">
                      Multi-Part Song Structure & Arranger Studio
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Multi-Section
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-300/80 font-mono">
                    Builds coordinated sections across Playlist timeline
                  </span>
                </div>

                {/* Song Structure Presets */}
                <div>
                  <label className="text-[11px] font-mono text-gray-300 block mb-1.5 font-semibold">
                    1. Choose Composition Architecture:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
                    {[
                      { id: 'full_anthem', name: 'Full Anthem', bars: '24 Bars', desc: 'Intro -> Verse -> Chorus -> Bridge -> Chorus -> Outro' },
                      { id: 'verse_chorus', name: 'Verse + Chorus', bars: '16 Bars', desc: 'Intro -> Verse -> Chorus (x2)' },
                      { id: 'intro_loop', name: 'Intro + Loop', bars: '12 Bars', desc: 'Intro -> Main Theme Loop (x2)' },
                      { id: 'loop_only', name: '2-Part Loop', bars: '8 Bars', desc: 'Verse -> Chorus' },
                      { id: 'custom', name: 'Custom Matrix', bars: 'Flexible', desc: 'Choose your own parts' }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setSongStructure(preset.id as any)}
                        title={preset.desc}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          songStructure === preset.id
                            ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400'
                            : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                        }`}
                      >
                        <div className="font-bold text-[11px] text-gray-100">{preset.name}</div>
                        <div className="text-[10px] text-indigo-300 font-bold">{preset.bars}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Section Matrix Checkboxes */}
                  {songStructure === 'custom' && (
                    <div className="mt-2.5 p-2.5 bg-gray-950/80 border border-indigo-900/50 rounded-lg flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="text-gray-400 text-[11px]">Include Parts:</span>
                      {[
                        { key: 'intro', label: 'Intro (4b)', color: 'text-amber-400' },
                        { key: 'verse', label: 'Verse (4b)', color: 'text-indigo-400' },
                        { key: 'chorus', label: 'Chorus (4b)', color: 'text-pink-400' },
                        { key: 'bridge', label: 'Bridge (4b)', color: 'text-purple-400' },
                        { key: 'outro', label: 'Outro (4b)', color: 'text-emerald-400' }
                      ].map(sec => (
                        <label key={sec.key} className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={(customSections as any)[sec.key]}
                            onChange={(e) => setCustomSections({ ...customSections, [sec.key]: e.target.checked })}
                            className="accent-indigo-500 rounded"
                          />
                          <span className={sec.color}>{sec.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Intro Flavor & Chord Voicing & Energy Curve Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Intro Flavor Selector */}
                  <div className="bg-gray-950/70 p-2.5 rounded-lg border border-gray-800">
                    <label className="text-[11px] font-mono text-gray-300 block mb-1 font-semibold">
                      Intro Music Flavor:
                    </label>
                    <select
                      value={selectedIntroStyle}
                      onChange={(e) => setSelectedIntroStyle(e.target.value as any)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
                    >
                      {INTRO_STYLES_INFO.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.icon} {item.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">
                      {INTRO_STYLES_INFO.find(i => i.id === selectedIntroStyle)?.desc || INTRO_STYLES_INFO[0].desc}
                    </p>
                  </div>

                  {/* Chord Voicing Selector */}
                  <div className="bg-gray-950/70 p-2.5 rounded-lg border border-gray-800">
                    <label className="text-[11px] font-mono text-gray-300 block mb-1 font-semibold">
                      Chord Voicing:
                    </label>
                    <div className="flex rounded-md bg-gray-900 p-0.5 border border-gray-800 text-[11px] font-mono">
                      {[
                        { id: 'triad', label: 'Triad' },
                        { id: 'lush', label: 'Lush 7/9' },
                        { id: 'power', label: 'Power 5' }
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => setChordVoicing(v.id as any)}
                          className={`flex-1 py-1 rounded transition-colors ${
                            chordVoicing === v.id ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {chordVoicing === 'triad' && 'Punchy clean triad harmonies'}
                      {chordVoicing === 'lush' && 'Rich nostalgic 7th/9th extensions'}
                      {chordVoicing === 'power' && 'Heavy raw octave & fifth drive'}
                    </p>
                  </div>

                  {/* Energy Curve Selector */}
                  <div className="bg-gray-950/70 p-2.5 rounded-lg border border-gray-800">
                    <label className="text-[11px] font-mono text-gray-300 block mb-1 font-semibold">
                      Section Dynamic Curve:
                    </label>
                    <div className="flex rounded-md bg-gray-900 p-0.5 border border-gray-800 text-[11px] font-mono">
                      {[
                        { id: 'building', label: 'Building' },
                        { id: 'octane', label: 'High' },
                        { id: 'contrast', label: 'Contrast' }
                      ].map(ec => (
                        <button
                          key={ec.id}
                          onClick={() => setEnergyCurve(ec.id as any)}
                          className={`flex-1 py-1 rounded transition-colors ${
                            energyCurve === ec.id ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {ec.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {energyCurve === 'building' && 'Gentle verse, roaring chorus, quiet bridge'}
                      {energyCurve === 'octane' && 'Relentless peak battle drive throughout'}
                      {energyCurve === 'contrast' && 'Extreme velocity leaps between sections'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Density & Octave controls */}
              <div className="grid grid-cols-2 gap-4 pt-1">
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-gray-800 bg-gray-950 gap-3">
          <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span>Variation #{variationSeed}</span>
            <span>•</span>
            <span className="truncate max-w-xs">
              {activeTab === 'style' && onApplyMultiPartSong
                ? `🎵 Multi-part mode: ${songStructure.replace('_', ' ')} (${activeStyle.name})`
                : `Writes ${lengthSteps} steps (${Math.floor(lengthSteps / 16)} bars) into ${channel.name}`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl font-mono text-xs transition-colors"
            >
              Cancel
            </button>

            {/* Secondary: Single Pattern (4 Bars) */}
            <button
              onClick={handleApply}
              title="Generate into active pattern only (4 bars)"
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl font-mono text-xs font-semibold transition-all"
            >
              {generationScope === 'full' && activeTab === 'style' ? 'Single Pattern (Full Band)' : 'Single Pattern'}
            </button>

            {/* Primary: Multi-Part Song Arrangement on Playlist */}
            {activeTab === 'style' && onApplyMultiPartSong && (
              <button
                onClick={handleGenerateMultiPartSong}
                title="Generate a multi-section arrangement directly placed on Playlist track 0"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 hover:from-amber-500 hover:via-indigo-500 hover:to-purple-500 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              >
                <Sparkles size={15} />
                <span>✨ Generate Multi-Part Song</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
