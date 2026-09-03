import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NoteEvent, InstrumentChannel, DSPConfig } from '../../types/audio';
import { isNoteInScale, getNoteLabel, isBlackKey } from './ScaleEngine';
import { VelocityDrawer } from './VelocityDrawer';
import { AudioEngine } from '../../audio/AudioEngine';
import { Sparkles, Zap, Music2, Trash2, ArrowUp, ArrowDown, Wand2 } from 'lucide-react';
import { SongwritingAssistantModal } from './SongwritingAssistantModal';

// Maps relative semitones from root C of current octave to physical computer keyboard keys
const SEMITONE_TO_KEY_LABEL: Record<number, string> = {
  0: 'A',   // C
  1: 'W',   // C#
  2: 'S',   // D
  3: 'E',   // D#
  4: 'D',   // E
  5: 'F',   // F
  6: 'T',   // F#
  7: 'G',   // G
  8: 'Y',   // G#
  9: 'H',   // A
  10: 'U',  // A#
  11: 'J',  // B
  12: 'K',  // C (+1 Oct)
  13: 'O',  // C#
  14: 'L',  // D
  15: 'P',  // D#
  16: ';',  // E
  17: "'",  // F
};

// Chord stamping definitions
const CHORD_DEFINITIONS: Record<string, { label: string; intervals: number[] }> = {
  single: { label: 'Single Note', intervals: [0] },
  major: { label: 'Major Triad', intervals: [0, 4, 7] },
  minor: { label: 'Minor Triad', intervals: [0, 3, 7] },
  sus2: { label: 'Sus2', intervals: [0, 2, 7] },
  sus4: { label: 'Sus4', intervals: [0, 5, 7] },
  maj7: { label: 'Major 7th', intervals: [0, 4, 7, 11] },
  min7: { label: 'Minor 7th', intervals: [0, 3, 7, 10] },
  dom7: { label: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  dim: { label: 'Diminished', intervals: [0, 3, 6] },
  power: { label: 'Power 5th', intervals: [0, 7] },
  octave: { label: 'Octave Double', intervals: [0, 12] }
};

interface PianoRollCanvasProps {
  channel: InstrumentChannel;
  notes: NoteEvent[];
  lengthSteps: number;
  scaleRoot: number;
  scaleMode: string;
  snapGrid: number; // 1 = 16th, 2 = 8th, 4 = quarter, 0.5 = 32nd
  activeKeyboardNotes?: Set<number>;
  typingOctave?: number;
  bpm?: number;
  channels?: InstrumentChannel[];
  dsp?: DSPConfig;
  onChangeBpm?: (bpm: number) => void;
  onChangeScaleRoot?: (root: number) => void;
  onChangeScaleMode?: (mode: string) => void;
  onUpdateDSP?: (dsp: Partial<DSPConfig>) => void;
  onAddNote: (note: NoteEvent) => void;
  onUpdateNote: (note: NoteEvent) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateVelocity: (noteId: string, velocity: number) => void;
  onBatchUpdateNotes?: (notes: NoteEvent[]) => void;
  onApplyFullArrangement?: (notesByChannel: Record<string, NoteEvent[]>) => void;
}

export const PianoRollCanvas: React.FC<PianoRollCanvasProps> = ({
  channel,
  notes,
  lengthSteps,
  scaleRoot,
  scaleMode,
  snapGrid,
  activeKeyboardNotes,
  typingOctave = 4,
  bpm,
  channels,
  dsp,
  onChangeBpm,
  onChangeScaleRoot,
  onChangeScaleMode,
  onUpdateDSP,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onUpdateVelocity,
  onBatchUpdateNotes,
  onApplyFullArrangement
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Layout parameters
  const pianoKeyWidth = 64;
  const rowHeight = 18;
  const [stepWidth, setStepWidth] = useState<number>(24);
  const [scrollTop, setScrollTop] = useState<number>(18 * (96 - 65)); // Center around C5/C4
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  // Active Chord Stamp Mode
  const [chordType, setChordType] = useState<string>('single');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Live playhead step
  const [playheadStep, setPlayheadStep] = useState<number>(0);

  // Mouse key auditioning state
  const mouseAuditionPitch = useRef<number | null>(null);
  const activeMouseVoicePitch = useRef<number | null>(null);
  const previewCutoffTimer = useRef<number | null>(null);
  const [mouseActiveNotes, setMouseActiveNotes] = useState<Set<number>>(new Set());

  // Mouse note interaction state
  const isMouseDown = useRef<boolean>(false);
  const dragAction = useRef<'draw' | 'move' | 'resize' | null>(null);
  const activeNote = useRef<NoteEvent | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; originalStep: number; originalPitch: number; originalDuration: number }>({
    x: 0, y: 0, originalStep: 0, originalPitch: 60, originalDuration: 1
  });

  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 500 });
  const audioEngine = AudioEngine.getInstance();

  // Dynamically resize canvas to fit container perfectly without distortion
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        setCanvasSize({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Subscribe to live audio playhead
  useEffect(() => {
    const unsub = audioEngine.onStepChange((step) => {
      setPlayheadStep(step);
    });
    return unsub;
  }, [audioEngine]);

  const minMidi = 24; // C1
  const maxMidi = 96; // C7
  const totalRows = maxMidi - minMidi + 1;
  const totalCanvasHeight = totalRows * rowHeight;

  // Auto-center vertically when playing notes that are outside the current view
  useEffect(() => {
    if (!activeKeyboardNotes || activeKeyboardNotes.size === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const viewHeight = canvas.height;

    const firstNote = Array.from(activeKeyboardNotes)[0];
    const rowIndex = maxMidi - firstNote;
    const noteY = rowIndex * rowHeight;

    if (noteY < scrollTop + 30 || noteY > scrollTop + viewHeight - 50) {
      setScrollTop(Math.max(0, Math.min(totalCanvasHeight - viewHeight, noteY - viewHeight / 2)));
    }
  }, [activeKeyboardNotes, maxMidi, rowHeight, scrollTop, totalCanvasHeight]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Rows & Scale Shading
    for (let i = 0; i < totalRows; i++) {
      const midiNote = maxMidi - i;
      const y = i * rowHeight - scrollTop;
      if (y + rowHeight < 0 || y > height) continue;

      const inScale = isNoteInScale(midiNote, scaleRoot, scaleMode);
      const isBlack = isBlackKey(midiNote);
      const isRoot = (midiNote % 12) === scaleRoot;
      const isKeyActive = (activeKeyboardNotes && activeKeyboardNotes.has(midiNote)) || mouseActiveNotes.has(midiNote);

      // Row background
      if (isRoot) {
        ctx.fillStyle = inScale ? '#1e1b4b' : '#171717'; // Highlight tonic root
      } else if (inScale) {
        ctx.fillStyle = isBlack ? '#18181b' : '#222738'; // In-scale rows (lighter)
      } else {
        ctx.fillStyle = '#0d0f17'; // Non-scale rows shaded dark
      }
      ctx.fillRect(pianoKeyWidth, y, width - pianoKeyWidth, rowHeight);

      // Active Note Horizontal Row Glow
      if (isKeyActive) {
        ctx.fillStyle = `${channel.color || '#38bdf8'}35`;
        ctx.fillRect(pianoKeyWidth, y, width - pianoKeyWidth, rowHeight);
      }

      // Horizontal subtle divider
      ctx.strokeStyle = isKeyActive ? (channel.color || '#38bdf8') : '#27272a';
      ctx.lineWidth = isKeyActive ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(pianoKeyWidth, y + rowHeight);
      ctx.lineTo(width, y + rowHeight);
      ctx.stroke();
    }

    // 2. Draw Vertical Beat & Step Grid Lines
    ctx.save();
    for (let s = 0; s <= lengthSteps; s++) {
      const x = pianoKeyWidth + s * stepWidth - scrollLeft;
      if (x < pianoKeyWidth || x > width) continue;

      const isMeasure = s % 16 === 0;
      const isBeat = s % 4 === 0;

      ctx.beginPath();
      if (isMeasure) {
        ctx.strokeStyle = '#4f46e5'; // Purple-indigo measure bar
        ctx.lineWidth = 1.5;
      } else if (isBeat) {
        ctx.strokeStyle = '#3f3f46'; // Beat bar
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = '#27272a'; // 16th note step
        ctx.lineWidth = 0.5;
      }
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Draw Notes
    notes.forEach(n => {
      const rowIndex = maxMidi - n.note;
      const y = rowIndex * rowHeight - scrollTop;
      const x = pianoKeyWidth + n.step * stepWidth - scrollLeft;
      const w = Math.max(8, n.duration * stepWidth - 2);

      if (y + rowHeight < 0 || y > height || x + w < pianoKeyWidth || x > width) return;

      // Note body
      const gradient = ctx.createLinearGradient(x, y, x, y + rowHeight);
      gradient.addColorStop(0, channel.color || '#6366f1');
      gradient.addColorStop(1, '#4338ca');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y + 1, w, rowHeight - 2, 3);
      ctx.fill();

      // Note border
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Resize handle indicator on right edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + w - 4, y + 2, 3, rowHeight - 4);

      // Note label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono';
      if (w > 28) {
        ctx.fillText(getNoteLabel(n.note), x + 4, y + 12);
      }
    });

    // 4. Draw Piano Keys (Left Column with Visual Illumination)
    ctx.save();
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, pianoKeyWidth, height);

    const baseMidiC = (typingOctave + 1) * 12;

    for (let i = 0; i < totalRows; i++) {
      const midiNote = maxMidi - i;
      const y = i * rowHeight - scrollTop;
      if (y + rowHeight < 0 || y > height) continue;

      const isBlack = isBlackKey(midiNote);
      const isC = (midiNote % 12) === 0;
      const isKeyActive = (activeKeyboardNotes && activeKeyboardNotes.has(midiNote)) || mouseActiveNotes.has(midiNote);

      // Keyboard key shortcut mapping
      const relSemitone = midiNote - baseMidiC;
      const shortcutKey = SEMITONE_TO_KEY_LABEL[relSemitone];

      if (isKeyActive) {
        // Vibrant illuminated pressed key
        const keyGrad = ctx.createLinearGradient(0, y, pianoKeyWidth, y);
        keyGrad.addColorStop(0, channel.color || '#38bdf8');
        keyGrad.addColorStop(0.75, '#ffffff');
        keyGrad.addColorStop(1, channel.color || '#38bdf8');
        ctx.fillStyle = keyGrad;
        ctx.fillRect(0, y, pianoKeyWidth - 1, rowHeight - 1);

        // 3D Inset pressed shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, y + rowHeight - 3, pianoKeyWidth - 1, 2);
        ctx.fillRect(pianoKeyWidth - 4, y, 3, rowHeight - 1);

        // White inner bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(1, y + 1, pianoKeyWidth - 3, 2);

        // High contrast note label
        ctx.fillStyle = '#09090b';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(getNoteLabel(midiNote), 4, y + 12);
      } else {
        // Normal unpressed piano key
        if (isBlack) {
          ctx.fillStyle = '#111827'; // Ebony
        } else {
          ctx.fillStyle = '#f3f4f6'; // Ivory
        }
        ctx.fillRect(0, y, pianoKeyWidth - 1, rowHeight - 1);

        // Subtle 3D edge on white keys
        if (!isBlack) {
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(pianoKeyWidth - 3, y, 2, rowHeight - 1);
        }

        ctx.fillStyle = isBlack ? '#9ca3af' : '#111827';
        ctx.font = isC ? 'bold 10px JetBrains Mono' : '9px JetBrains Mono';
        if (isC || !isBlack) {
          ctx.fillText(getNoteLabel(midiNote), 4, y + 12);
        }
      }

      // Divider line between keys
      ctx.fillStyle = isKeyActive ? 'rgba(0, 0, 0, 0.4)' : '#374151';
      ctx.fillRect(0, y + rowHeight - 1, pianoKeyWidth, 1);

      // Typing Keyboard Keycap Badge (e.g. [A], [W], [S]...)
      if (shortcutKey) {
        const badgeW = 15;
        const badgeH = rowHeight - 4;
        const badgeX = pianoKeyWidth - badgeW - 4;
        const badgeY = y + 2;

        ctx.fillStyle = isKeyActive 
          ? '#0f172a' 
          : (isBlack ? '#1f2937' : '#e2e8f0');
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
        ctx.fill();

        ctx.strokeStyle = isKeyActive ? '#ffffff' : (isBlack ? '#4b5563' : '#cbd5e1');
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isKeyActive 
          ? '#ffffff' 
          : (isBlack ? '#f3f4f6' : '#1e293b');
        ctx.font = 'bold 8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(shortcutKey, badgeX + badgeW / 2, badgeY + badgeH - 2.5);
        ctx.textAlign = 'left';
      }
    }

    // Piano key column border
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(pianoKeyWidth - 1, 0, 2, height);
    ctx.restore();

    // 5. Draw Synchronized Playhead Line
    const playheadX = pianoKeyWidth + playheadStep * stepWidth - scrollLeft;
    if (playheadX >= pianoKeyWidth && playheadX <= width) {
      ctx.save();
      ctx.strokeStyle = '#ef4444'; // Radiant red/orange line
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top triangle marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [
    totalRows, maxMidi, rowHeight, scrollTop, scrollLeft, pianoKeyWidth, lengthSteps,
    stepWidth, scaleRoot, scaleMode, notes, channel, playheadStep, activeKeyboardNotes,
    mouseActiveNotes, typingOctave
  ]);

  useEffect(() => {
    render();
  }, [render]);

  // Coordinate helpers
  const getMidiAtY = (y: number): number => {
    const row = Math.floor((y + scrollTop) / rowHeight);
    return Math.max(minMidi, Math.min(maxMidi, maxMidi - row));
  };

  const getStepAtX = (x: number): number => {
    if (x < pianoKeyWidth) return 0;
    const rawStep = (x - pianoKeyWidth + scrollLeft) / stepWidth;
    return Math.max(0, Math.floor(rawStep / snapGrid) * snapGrid);
  };

  // Helper to cleanly stop any audition voice triggered by mouse actions
  const stopMousePreview = useCallback(() => {
    if (previewCutoffTimer.current !== null) {
      clearTimeout(previewCutoffTimer.current);
      previewCutoffTimer.current = null;
    }
    if (activeMouseVoicePitch.current !== null) {
      audioEngine.triggerNoteOff(channel, activeMouseVoicePitch.current, 0.04);
      activeMouseVoicePitch.current = null;
    }
    if (mouseAuditionPitch.current !== null) {
      audioEngine.triggerNoteOff(channel, mouseAuditionPitch.current, 0.04);
      mouseAuditionPitch.current = null;
    }
    setMouseActiveNotes(new Set());
    audioEngine.stopAllVoices();
  }, [audioEngine, channel]);

  // Helper to play an audition note with auto-release
  const playMousePreview = useCallback((pitch: number, velocity: number = 0.8, autoCutoffMs: number = 0) => {
    if (previewCutoffTimer.current !== null) {
      clearTimeout(previewCutoffTimer.current);
      previewCutoffTimer.current = null;
    }
    if (activeMouseVoicePitch.current !== null && activeMouseVoicePitch.current !== pitch) {
      audioEngine.triggerNoteOff(channel, activeMouseVoicePitch.current, 0.03);
    }

    activeMouseVoicePitch.current = pitch;
    mouseAuditionPitch.current = pitch;
    setMouseActiveNotes(new Set([pitch]));
    audioEngine.triggerNoteOn(channel, pitch, velocity);

    if (autoCutoffMs > 0) {
      previewCutoffTimer.current = window.setTimeout(() => {
        if (activeMouseVoicePitch.current === pitch) {
          audioEngine.triggerNoteOff(channel, pitch, 0.04);
          activeMouseVoicePitch.current = null;
          mouseAuditionPitch.current = null;
          setMouseActiveNotes(new Set());
        }
      }, autoCutoffMs);
    }
  }, [audioEngine, channel]);

  // Helper to audition a chord
  const playMouseChordPreview = useCallback((pitches: number[], velocity: number = 0.8, autoCutoffMs: number = 250) => {
    stopMousePreview();
    pitches.forEach(p => {
      audioEngine.triggerNoteOn(channel, p, velocity);
    });
    setMouseActiveNotes(new Set(pitches));

    if (autoCutoffMs > 0) {
      previewCutoffTimer.current = window.setTimeout(() => {
        pitches.forEach(p => {
          audioEngine.triggerNoteOff(channel, p, 0.04);
        });
        setMouseActiveNotes(new Set());
      }, autoCutoffMs);
    }
  }, [audioEngine, channel, stopMousePreview]);

  // Global window pointer listener ensures notes stop even if mouse is released outside canvas
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      stopMousePreview();
      isMouseDown.current = false;
      dragAction.current = null;
      activeNote.current = null;
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('blur', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('blur', handleGlobalPointerUp);
      stopMousePreview();
    };
  }, [stopMousePreview]);

  // Mouse Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Audition key if clicking on piano key column (holds until pointer release)
    if (x < pianoKeyWidth) {
      const pitch = getMidiAtY(y);
      playMousePreview(pitch, 0.85);
      return;
    }

    const clickedStep = getStepAtX(x);
    const clickedMidi = getMidiAtY(y);

    // Right-click: Instant Note Deletion (FL Studio Ergonomics)
    if (e.button === 2) {
      const target = notes.find(n => n.note === clickedMidi && clickedStep >= n.step && clickedStep < n.step + n.duration);
      if (target) {
        onDeleteNote(target.id);
      }
      return;
    }

    // Left-click: Check if clicking an existing note
    const existing = notes.find(n => n.note === clickedMidi && clickedStep >= n.step && clickedStep < n.step + n.duration);

    if (existing) {
      activeNote.current = existing;
      const notePixelX = pianoKeyWidth + existing.step * stepWidth - scrollLeft;
      const notePixelW = existing.duration * stepWidth;
      const isNearRightEdge = (x - notePixelX) > (notePixelW - 10);

      if (isNearRightEdge) {
        dragAction.current = 'resize';
      } else {
        dragAction.current = 'move';
      }

      dragStartPos.current = {
        x, y,
        originalStep: existing.step,
        originalPitch: existing.note,
        originalDuration: existing.duration
      };

      // Preview note briefly on click, stops immediately on pointer release
      playMousePreview(existing.note, existing.velocity, 220);
    } else {
      // Draw new note or chord stamp
      const intervals = CHORD_DEFINITIONS[chordType]?.intervals || [0];
      const newNotes: NoteEvent[] = intervals.map((interval, i) => ({
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${i}`,
        note: Math.max(minMidi, Math.min(maxMidi, clickedMidi + interval)),
        step: clickedStep,
        duration: snapGrid,
        velocity: 0.8
      }));

      if (onBatchUpdateNotes && newNotes.length > 1) {
        onBatchUpdateNotes([...notes, ...newNotes]);
      } else {
        newNotes.forEach(n => onAddNote(n));
      }

      activeNote.current = newNotes[0];
      dragAction.current = 'resize';
      dragStartPos.current = {
        x, y,
        originalStep: clickedStep,
        originalPitch: clickedMidi,
        originalDuration: snapGrid
      };

      if (newNotes.length > 1) {
        playMouseChordPreview(newNotes.map(n => n.note), 0.8, 250);
      } else {
        playMousePreview(clickedMidi, 0.8, 220);
      }
    }

    isMouseDown.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Handle mouse piano key glissando on left column
    if (mouseAuditionPitch.current !== null && !isMouseDown.current) {
      if (x < pianoKeyWidth) {
        const pitch = getMidiAtY(y);
        if (pitch !== mouseAuditionPitch.current) {
          playMousePreview(pitch, 0.85);
        }
      } else {
        stopMousePreview();
      }
      return;
    }

    if (!isMouseDown.current || !activeNote.current) return;

    if (dragAction.current === 'resize') {
      const rawSteps = Math.max(snapGrid, Math.round(((x - dragStartPos.current.x) / stepWidth) / snapGrid) * snapGrid);
      const newDuration = Math.max(snapGrid, dragStartPos.current.originalDuration + rawSteps);
      if (newDuration !== activeNote.current.duration) {
        onUpdateNote({
          ...activeNote.current,
          duration: newDuration
        });
      }
    } else if (dragAction.current === 'move') {
      const stepDelta = Math.round(((x - dragStartPos.current.x) / stepWidth) / snapGrid) * snapGrid;
      const newPitch = getMidiAtY(y);
      const newStep = Math.max(0, dragStartPos.current.originalStep + stepDelta);

      if (newStep !== activeNote.current.step || newPitch !== activeNote.current.note) {
        if (newPitch !== activeNote.current.note) {
          playMousePreview(newPitch, activeNote.current.velocity, 180);
        }
        onUpdateNote({
          ...activeNote.current,
          step: newStep,
          note: newPitch
        });
      }
    }
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e && canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }

    stopMousePreview();

    isMouseDown.current = false;
    dragAction.current = null;
    activeNote.current = null;
  };

  // Scroll & Zoom wheel handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setStepWidth(prev => Math.max(12, Math.min(80, prev * zoomFactor)));
    } else if (e.shiftKey) {
      setScrollLeft(prev => Math.max(0, prev + e.deltaY));
    } else {
      setScrollTop(prev => Math.max(0, Math.min(totalCanvasHeight - 300, prev + e.deltaY)));
    }
  };

  // -------------------------------------------------------------
  // POWER TOOLS: Quantize, Arpeggiator, Strum, Transpose
  // -------------------------------------------------------------

  // Quick Quantize (Q or Ctrl+Q)
  const handleQuantizeNotes = useCallback(() => {
    if (notes.length === 0 || !onBatchUpdateNotes) return;
    const quantGrid = snapGrid;
    const quantized = notes.map(n => {
      const snappedStep = Math.round(n.step / quantGrid) * quantGrid;
      const snappedDuration = Math.max(quantGrid, Math.round(n.duration / quantGrid) * quantGrid);
      return {
        ...n,
        step: snappedStep,
        duration: snappedDuration
      };
    });
    onBatchUpdateNotes(quantized);
  }, [notes, snapGrid, onBatchUpdateNotes]);

  // Retro Chiptune Arpeggiator (Alt+A)
  const handleArpeggiateNotes = useCallback((speed: number = 1) => {
    if (notes.length === 0 || !onBatchUpdateNotes) return;

    // Group notes by step
    const stepGroups = new Map<number, NoteEvent[]>();
    notes.forEach(n => {
      const list = stepGroups.get(n.step) || [];
      list.push(n);
      stepGroups.set(n.step, list);
    });

    const result: NoteEvent[] = [];

    stepGroups.forEach((chordNotes, step) => {
      if (chordNotes.length <= 1) {
        result.push(...chordNotes);
        return;
      }

      // Sort notes ascending by pitch
      const sortedPitches = chordNotes.map(n => n.note).sort((a, b) => a - b);
      const chordLen = Math.max(...chordNotes.map(n => n.duration));
      const arpStepSize = Math.max(0.5, speed); // 1 = 16th note, 0.5 = 32nd note
      const numTicks = Math.floor(chordLen / arpStepSize);

      for (let i = 0; i < numTicks; i++) {
        const pitchIndex = i % sortedPitches.length;
        const currentStep = step + i * arpStepSize;
        result.push({
          id: `arp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${i}`,
          note: sortedPitches[pitchIndex],
          step: currentStep,
          duration: arpStepSize,
          velocity: chordNotes[0].velocity
        });
      }
    });

    onBatchUpdateNotes(result);
  }, [notes, onBatchUpdateNotes]);

  // Strum / Humanize Tool (Alt+S)
  const handleStrumNotes = useCallback((offsetSteps: number = 0.25) => {
    if (notes.length === 0 || !onBatchUpdateNotes) return;

    const stepGroups = new Map<number, NoteEvent[]>();
    notes.forEach(n => {
      const list = stepGroups.get(n.step) || [];
      list.push(n);
      stepGroups.set(n.step, list);
    });

    const result: NoteEvent[] = [];

    stepGroups.forEach((chordNotes) => {
      if (chordNotes.length <= 1) {
        result.push(...chordNotes);
        return;
      }

      // Sort low to high (upward strum)
      const sorted = [...chordNotes].sort((a, b) => a.note - b.note);
      sorted.forEach((n, idx) => {
        const staggeredStep = n.step + idx * offsetSteps;
        const staggeredVelocity = Math.max(0.4, Math.min(1.0, n.velocity + (Math.random() * 0.08 - 0.04)));
        result.push({
          ...n,
          step: staggeredStep,
          velocity: parseFloat(staggeredVelocity.toFixed(2))
        });
      });
    });

    onBatchUpdateNotes(result);
  }, [notes, onBatchUpdateNotes]);

  // Transpose by semitones (+12, -12, +1, -1)
  const handleTranspose = useCallback((semitones: number) => {
    if (notes.length === 0 || !onBatchUpdateNotes) return;
    const transposed = notes.map(n => ({
      ...n,
      note: Math.max(minMidi, Math.min(maxMidi, n.note + semitones))
    }));
    onBatchUpdateNotes(transposed);
  }, [notes, minMidi, maxMidi, onBatchUpdateNotes]);

  // Clear all notes in channel
  const handleClearAllNotes = useCallback(() => {
    if (notes.length === 0 || !onBatchUpdateNotes) return;
    if (confirm(`Clear all ${notes.length} notes in ${channel.name}?`)) {
      onBatchUpdateNotes([]);
    }
  }, [notes, channel.name, onBatchUpdateNotes]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        handleQuantizeNotes();
      } else if (e.key === 'q' || e.key === 'Q') {
        handleQuantizeNotes();
      } else if (e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        handleTranspose(12);
      } else if (e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        handleTranspose(-12);
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        handleTranspose(1);
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        handleTranspose(-1);
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleArpeggiateNotes(1);
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleStrumNotes(0.25);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuantizeNotes, handleTranspose, handleArpeggiateNotes, handleStrumNotes]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 select-none">
      {/* Piano Roll Power Tools Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-xs gap-3 z-10 shadow-sm">
        {/* Left: Chord Stamper Dropdown, Quantize, Arp & Strum */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Chord Stamper Mode */}
          <div className="flex items-center gap-1.5 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800 font-mono text-xs shadow-inner">
            <span className="text-gray-500 text-[10px] uppercase font-bold">STAMP:</span>
            <select
              value={chordType}
              onChange={(e) => setChordType(e.target.value)}
              className="bg-transparent text-indigo-400 font-bold outline-none cursor-pointer text-xs"
            >
              {Object.entries(CHORD_DEFINITIONS).map(([key, def]) => (
                <option key={key} value={key} className="bg-gray-900 text-gray-200">
                  {def.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-gray-800" />

          {/* Quick Quantize Button */}
          <button
            onClick={handleQuantizeNotes}
            title="Quantize Notes to Grid Snap (Q or Ctrl+Q)"
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-emerald-400 border border-gray-700 hover:border-emerald-500 rounded-lg font-mono text-xs font-semibold transition-colors shadow-sm"
          >
            <Sparkles size={12} />
            <span>Quantize (Q)</span>
          </button>

          {/* Retro Chiptune Arpeggiator Button */}
          <button
            onClick={() => handleArpeggiateNotes(1)}
            title="Arpeggiate Chords into 16th Note Runs (Alt+A)"
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-indigo-400 border border-gray-700 hover:border-indigo-500 rounded-lg font-mono text-xs font-semibold transition-colors shadow-sm"
          >
            <Zap size={12} />
            <span>Arp (Alt+A)</span>
          </button>

          {/* Strum / Humanize Button */}
          <button
            onClick={() => handleStrumNotes(0.25)}
            title="Strum Chord Notes (Alt+S)"
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-amber-400 border border-gray-700 hover:border-amber-500 rounded-lg font-mono text-xs font-semibold transition-colors shadow-sm"
          >
            <Music2 size={12} />
            <span>Strum (Alt+S)</span>
          </button>

          <div className="h-4 w-px bg-gray-800" />

          {/* Retro RPG Songwriting & Style Assistant Button */}
          <button
            onClick={() => setIsAssistantOpen(true)}
            title="Open GBA / DS / Indie RPG Songwriting & Style Assistant"
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-mono text-xs font-bold shadow-md shadow-indigo-600/30 transition-all ml-1"
          >
            <Wand2 size={12} />
            <span>Style Assistant</span>
          </button>
        </div>

        {/* Right: Transpose & Clean */}
        <div className="flex items-center gap-2">
          {/* Octave Transpose */}
          <div className="flex items-center bg-gray-950 rounded-lg border border-gray-800 font-mono text-xs shadow-inner">
            <button
              onClick={() => handleTranspose(-12)}
              title="Transpose Octave Down (Shift+Down)"
              className="px-2 py-1 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border-r border-gray-800"
            >
              -12
            </button>
            <span className="px-1.5 text-[10px] text-gray-500 font-bold">OCT</span>
            <button
              onClick={() => handleTranspose(12)}
              title="Transpose Octave Up (Shift+Up)"
              className="px-2 py-1 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border-l border-gray-800"
            >
              +12
            </button>
          </div>

          {/* Semitone Transpose */}
          <div className="flex items-center bg-gray-950 rounded-lg border border-gray-800 font-mono text-xs shadow-inner">
            <button
              onClick={() => handleTranspose(-1)}
              title="Transpose Semitone Down (Alt+Down)"
              className="px-2 py-1 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border-r border-gray-800"
            >
              -1
            </button>
            <span className="px-1.5 text-[10px] text-gray-500 font-bold">SEMI</span>
            <button
              onClick={() => handleTranspose(1)}
              title="Transpose Semitone Up (Alt+Up)"
              className="px-2 py-1 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border-l border-gray-800"
            >
              +1
            </button>
          </div>

          {/* Clear Channel Notes */}
          <button
            onClick={handleClearAllNotes}
            title="Clear all notes in this channel"
            className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors ml-1"
          >
            <Trash2 size={13} />
          </button>

          <span className="text-[10px] font-mono text-gray-500 ml-1">
            {notes.length} Notes
          </span>
        </div>
      </div>

      {/* Canvas Workspace */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gray-950"
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-full cursor-pointer block"
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Per-Note Velocity Automation Drawer */}
      <VelocityDrawer
        notes={notes}
        lengthSteps={lengthSteps}
        stepWidth={stepWidth}
        scrollLeft={scrollLeft}
        onUpdateNoteVelocity={onUpdateVelocity}
      />

      {/* Retro RPG Songwriting & Style Assistant Modal */}
      <SongwritingAssistantModal
        isOpen={isAssistantOpen}
        channel={channel}
        channels={channels}
        bpm={bpm}
        scaleRoot={scaleRoot}
        scaleMode={scaleMode}
        lengthSteps={lengthSteps}
        dsp={dsp}
        onClose={() => setIsAssistantOpen(false)}
        onApplyNotes={(generated) => {
          if (onBatchUpdateNotes) {
            onBatchUpdateNotes(generated);
          }
        }}
        onApplyFullArrangement={onApplyFullArrangement}
        onChangeBpm={onChangeBpm}
        onChangeScaleRoot={onChangeScaleRoot}
        onChangeScaleMode={onChangeScaleMode}
        onUpdateDSP={onUpdateDSP}
      />
    </div>
  );
};
