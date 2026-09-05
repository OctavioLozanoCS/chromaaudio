# 🗺️ ChromaAudio Studio: Project Roadmap & Planned Features

This document tracks completed milestones, active works-in-progress, and planned features inspired by modern DAWs (**Ableton Live**, **Bitwig Studio**), audio editing suites (**Sony ACID Pro**, **Sony Sound Forge**), and classic **Chiptune Trackers** (**FamiTracker**, **LSDj**, **Renoise**).

---

## 🚀 Recent Accomplishments (v0.2.0)

### 🎹 Piano Roll Ergonomics & 4-Bar View Engine
- **1-Click "Fit 4 Bars" View:** Instantly scales the horizontal viewport so all 4 bars (64 steps) fit perfectly within any monitor or window size.
- **Section Badges:** On-canvas `BAR 1`, `BAR 2`, `BAR 3`, and `BAR 4` division markers for instant spatial orientation.
- **Dedicated Horizontal Scrollbar:** Integrated timeline scrollbar with a live playhead indicator and draggable thumb.
- **Quick-Jump Pills:** Rapid viewport jumping to `[All 4]`, `[Bar 1]`, `[Bar 2]`, `[Bar 3]`, or `[Bar 4]`.
- **Smooth Hand Panning:** Middle-click drag and Shift + Wheel horizontal scrolling across the piano roll and velocity drawer.

### 🎛️ SoundFont 2 (SF2) Architecture Overhaul
- **Full Generator Tree Parsing:** Rewrote SoundFont 2.04 parser to traverse the complete chunk hierarchy (`phdr` → `pbag` → `pgen` → `inst` → `ibag` → `igen` → `shdr`), supporting massive multi-instrument general MIDI SoundFonts such as the Roland SC-88.
- **Microtonal Pitch Correction:** Preserves fine-tuning cents alongside root key offsets for authentic pitch reproduction.
- **Instant Audition & Auto-Select:** Selecting an instrument preset automatically activates the channel and triggers an immediate C4 preview note.

### 🎙️ Dialogue & Retro Vocal Lab
- **11 Iconic Character Presets:** Flowey, Jevil, Spamton, Queen, Sans, Papyrus, Kefka, Star Fox, Animalese, Typewriter Chirp, and Clean.
- **Interactive Dialogue Simulator:** Authentic Undertale/Deltarune typewriter sound effects with customizable pitch center and jitter.
- **Microphone Recording & Trimming:** Live mic input with direct waveform trimming and VU metering.

### 🎮 Export Pipelines
- **Loop-Tagged Ogg Vorbis & WAV:** Embedded RIFF `smpl` loop points and Vorbis comment tags (`LOOPSTART`, `LOOPLENGTH`) for GameMaker and Godot.
- **Tail Spillover & Split Intro/Loop Exporter:** Zero-gap loop rendering with acoustic reverb tail folded back into the start.

---

## 🛠️ In-Progress & Planned Features

### Phase 1: High-Impact Retro Composing (Near-Term)

#### 1. Hardware 60Hz Fast Arpeggio Tables (`RetroChipSynth.ts`)
- **Origin:** FamiTracker / LSDj / Commodore 64 Trackers.
- **Concept:** Monophonic NES 2A03 and Game Boy channels cannot play chords simultaneously. Vintage game composers cycled the pitch at 50/60Hz across semitone intervals (`0-3-7` for minor, `0-4-7` for major, `0-12` for octaves) to produce the signature chords heard in *Pokemon*, *Mega Man*, and *Castlevania*.
- **Implementation Plan:** Add an Arp dropdown in the channel rack that rapidly modulates the oscillator frequency using scheduled curve tables.

#### 2. Retrospective Jam Capture ("Capture MIDI" style)
- **Origin:** Ableton Live 10+.
- **Concept:** Listens to incoming computer typing keyboard and MIDI events in a rolling 60-second circular buffer. When you play a great melody or bassline without having clicked record, pressing **"Capture Jam"** quantizes and places the notes into the active pattern.
- **Implementation Plan:** Maintain a rolling event array in `AudioEngine.ts` and add a 1-click button to `TopBar.tsx`.

#### 3. Note Probability & Velocity Randomization
- **Origin:** Ableton Live 11 / Bitwig Studio Operators.
- **Concept:** Assign each note a trigger probability percentage (e.g. 70% chance to play) and velocity spread.
- **Impact:** Short 4-bar retro game loops sound constantly evolving and organic without requiring extra memory or track duplication.
- **Implementation Plan:** Extend `NoteEvent` with `probability?: number` and add a Chance tab to `VelocityDrawer.tsx`.

#### 4. 1-Click SFX Variation Generator
- **Origin:** Sony Sound Forge / Game Audio best practices.
- **Concept:** Automatically generates 4–5 micro-detuned/pitch-varied audio files from any procedural sound effect (e.g., `laser_01.wav` through `laser_05.wav`), packaged for game engine import.
- **Implementation Plan:** Add a batch variation export button to `ProceduralSFXGenerator.tsx`.

---

### Phase 2: Arrangement & Sound Design (Mid-Term)

#### 1. Playlist Clip Transposition & ACIDized Key Conformity
- **Origin:** Sony ACID Pro.
- **Concept:** Clips placed on the timeline can have independent semitone pitch offsets (e.g. 0, +5, +7, -2). Combining this with `ScaleEngine.ts` ensures transposed clips stay locked within the project's musical scale.
- **Impact:** Compose complete verse/chorus song arrangements from a single pattern without having to duplicate patterns.

#### 2. Destructive 2-Track Waveform Surgery
- **Origin:** Sony Sound Forge.
- **Concept:** A dedicated lightweight 2-track audio modal for single-sample zoom editing, DC offset elimination, Peak/RMS normalization, audio reversal, and fade-in/fade-out curves.
- **Impact:** Perfect for prepping speech dialogue samples and clean sound effects before game deployment.

#### 3. The "Chopper" & Transient Slicer
- **Origin:** Sony ACID Pro / Ableton Simpler.
- **Concept:** Highlight a 1-beat or 1/16th slice of an audio sample or speech recording and drop rhythmic stutters/rolls directly onto the timeline or map them across keyboard keys.

#### 4. Piano Roll Strum, Chop, & Humanize Tools
- **Origin:** FL Studio.
- **Concept:** 1-click tools to slice chords into ascending/descending arpeggios, apply subtle strum delays across chord notes, and apply micro-timing swing.

---

### Phase 3: Advanced Modular & Interactive Audio (Long-Term)

#### 1. Clip Follow Actions & Dynamic Game States
- **Origin:** Ableton Live Session View.
- **Concept:** Define transition rules when a clip finishes (loop $N$ times, advance to next, or branch with weighted probability). Useful for testing interactive game music transitions directly inside the DAW.

#### 2. Custom 4-Bit Wave RAM Synthesizer
- **Origin:** Game Boy DMG Channel 3 / Little Sound Dj (LSDj).
- **Concept:** A hands-on 32-step 16-level waveform drawing canvas for custom gritty chiptune basses and lead waveforms.

#### 3. Macro Audio Effect Racks
- **Origin:** Ableton Live / Bitwig Studio.
- **Concept:** Macro knobs controlling multiple Console DSP parameters simultaneously (e.g., a "Lo-Fi Dungeon" knob controlling filter cutoff, bit depth, and reverb wet level simultaneously).

---

## 📋 Open Issues & Backlog

- [ ] **SF2 Large Preset Lists:** Add a search filter to the SoundFont preset dropdown for soundfonts containing over 100 instruments.
- [ ] **Multi-Select Note Box Drag:** Add marquee box selection in the Piano Roll for moving or deleting blocks of notes.
- [ ] **Timeline Pattern Splitting:** Implement a slice tool split on playlist pattern clips.
- [ ] **Audio Export Progress Bar:** Display a percentage-based rendering progress bar during long multi-track song offline exports.
