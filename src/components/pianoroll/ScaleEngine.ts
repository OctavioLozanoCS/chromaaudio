/**
 * Musical Scale Highlighting Engine
 * Accurately highlights in-key piano roll rows for instant harmonic intuition.
 */

export interface ScaleDefinition {
  id: string;
  name: string;
  intervals: number[]; // Semitone intervals from root
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES: Record<string, ScaleDefinition> = {
  major: {
    id: 'major',
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11]
  },
  minor: {
    id: 'minor',
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10]
  },
  harmonic_minor: {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11]
  },
  dorian: {
    id: 'dorian',
    name: 'Dorian (Chrono / Zelda)',
    intervals: [0, 2, 3, 5, 7, 9, 10]
  },
  phrygian: {
    id: 'phrygian',
    name: 'Phrygian (Dark Boss Theme)',
    intervals: [0, 1, 3, 5, 7, 8, 10]
  },
  lydian: {
    id: 'lydian',
    name: 'Lydian (Dreamy Ethereal)',
    intervals: [0, 2, 4, 6, 7, 9, 11]
  },
  mixolydian: {
    id: 'mixolydian',
    name: 'Mixolydian (Adventure)',
    intervals: [0, 2, 4, 5, 7, 9, 10]
  },
  pentatonic_major: {
    id: 'pentatonic_major',
    name: 'Pentatonic Major',
    intervals: [0, 2, 4, 7, 9]
  },
  pentatonic_minor: {
    id: 'pentatonic_minor',
    name: 'Pentatonic Minor',
    intervals: [0, 3, 5, 7, 10]
  },
  blues: {
    id: 'blues',
    name: 'Blues Scale',
    intervals: [0, 3, 5, 6, 7, 10]
  }
};

export function isNoteInScale(midiNote: number, rootPitch: number, scaleKey: string): boolean {
  const scale = SCALES[scaleKey];
  if (!scale) return true;

  const pitchClass = (midiNote - rootPitch + 120) % 12;
  return scale.intervals.includes(pitchClass);
}

export function getNoteLabel(midiNote: number): string {
  const note = NOTE_NAMES[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return `${note}${octave}`;
}

export function isBlackKey(midiNote: number): boolean {
  const pitchClass = midiNote % 12;
  return [1, 3, 6, 8, 10].includes(pitchClass);
}
