/**
 * Computer Typing Keyboard to Piano Mapper (FL Studio style)
 * 100% mouse & computer keyboard composition without external hardware.
 */

export interface KeyboardMappingState {
  baseOctave: number; // default 4 (Middle C)
  activeMidiNotes: Set<number>;
}

// Maps standard US QWERTY physical key codes to relative semitones from root octave C
const KEY_TO_SEMITONE: Record<string, number> = {
  // Lower octave keys (A S D F...)
  KeyA: 0,  // C
  KeyW: 1,  // C#
  KeyS: 2,  // D
  KeyE: 3,  // D#
  KeyD: 4,  // E
  KeyF: 5,  // F
  KeyT: 6,  // F#
  KeyG: 7,  // G
  KeyY: 8,  // G#
  KeyH: 9,  // A
  KeyU: 10, // A#
  KeyJ: 11, // B
  KeyK: 12, // C (+1 Oct)
  KeyO: 13, // C#
  KeyL: 14, // D
  KeyP: 15, // D#
  Semicolon: 16, // E
  Quote: 17,     // F

  // Upper row auxiliary mapping (Q 2 W 3 E R...)
  KeyQ: 12,
  Digit2: 13,
  // KeyW is handled above
  Digit3: 15,
  KeyR: 17,
  Digit5: 18,
  // KeyT is handled above
  Digit6: 20,
  // KeyY is handled above
  Digit7: 22,
};

export class TypingKeyboardMapper {
  private baseOctave: number = 4;
  private activeKeys: Map<string, number> = new Map(); // code -> midiNote
  private onNoteOn: (note: number) => void;
  private onNoteOff: (note: number) => void;
  private onOctaveChange?: (octave: number) => void;
  private enabled: boolean = true;

  constructor(
    onNoteOn: (note: number) => void,
    onNoteOff: (note: number) => void,
    onOctaveChange?: (octave: number) => void
  ) {
    this.onNoteOn = onNoteOn;
    this.onNoteOff = onNoteOff;
    this.onOctaveChange = onOctaveChange;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.releaseAllNotes();
    }
  }

  public setOctave(octave: number) {
    this.baseOctave = Math.max(1, Math.min(7, octave));
    this.onOctaveChange?.(this.baseOctave);
  }

  public getOctave(): number {
    return this.baseOctave;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (!this.enabled) return;

    // Ignore when typing in input textboxes
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    // Octave Shifting: Z (down), X (up)
    if (e.code === 'KeyZ' && !e.repeat) {
      this.setOctave(this.baseOctave - 1);
      return;
    }
    if (e.code === 'KeyX' && !e.repeat) {
      this.setOctave(this.baseOctave + 1);
      return;
    }

    const semitone = KEY_TO_SEMITONE[e.code];
    if (semitone !== undefined && !e.repeat && !this.activeKeys.has(e.code)) {
      // Calculate MIDI note: C(octave) is (octave + 1) * 12
      const midi = (this.baseOctave + 1) * 12 + semitone;
      this.activeKeys.set(e.code, midi);
      this.onNoteOn(midi);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const midi = this.activeKeys.get(e.code);
    if (midi !== undefined) {
      this.activeKeys.delete(e.code);
      this.onNoteOff(midi);
    }
  }

  public releaseAllNotes() {
    this.activeKeys.forEach(midi => {
      this.onNoteOff(midi);
    });
    this.activeKeys.clear();
  }

  public destroy() {
    this.releaseAllNotes();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
