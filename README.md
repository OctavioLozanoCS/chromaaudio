# 🎵 ChromaAudio Studio

> **Retro Game BGM & SFX Workstation**  
> Combining the fluent pattern sequencing & piano roll of **FL Studio** with the linear multi-track timeline & batch game asset exporting of **REAPER**.

---

## ⚡ Quick Start
To launch ChromaAudio on Windows:
1. Double-click **`run_chromaaudio.bat`** (or run `npm.cmd run dev` in this directory).
2. It will automatically start the local server and open `http://localhost:5174` in your browser.

---

## 🎹 Computer Keyboard & Mouse Ergonomics (No MIDI Hardware Required)

ChromaAudio is designed from the ground up for **100% computer mouse and typing keyboard** operation:

### 1. Computer Typing Keyboard as Piano (FL Studio Style)
*   **White Keys**: `A`, `S`, `D`, `F`, `G`, `H`, `J`, `K`, `L`, `;`, `'`
*   **Black Accidentals**: `W`, `E`, `T`, `Y`, `U`, `O`, `P`
*   **Upper Octave Row**: `Q`, `2`, `W`, `3`, `E`, `R`, `5`, `T`, `6`, `Y`, `7`, `U`
*   **Octave Shift**:
    *   Press **`Z`**: Shift base octave down (-1 Octave)
    *   Press **`X`**: Shift base octave up (+1 Octave)
*   **Transport**:
    *   **`Space`**: Toggle Play / Stop

### 2. Mouse Controls in Piano Roll
*   **Left-Click**: Place a new note snapped to the active grid (`1/4`, `1/8`, `1/16`, `1/32`).
*   **Right-Click**: Instantly delete the clicked note.
*   **Right Edge Drag**: Stretch/resize note duration with grid snapping.
*   **Middle Drag / Shift + Scroll**: Scroll horizontally across timeline.
*   **Ctrl + Scroll Wheel**: Zoom in and out horizontally.
*   **Scroll Wheel**: Scroll vertically across pitch octaves (C1 to C7).

---

## 🎛️ Audio Core Engine & Sound Palette

### 1. Authentic Game Boy DMG & NES Chip Synthesizers
*   **Pulse 1 (12.5% & 25% Duty Cycles)**: Sharp, nasal, authentic chiptune leads with pitch sweep envelopes.
*   **Pulse 2 (50% & 75% Duty Cycles)**: Classic warm square waves with vibrato LFO.
*   **Wave RAM**: 4-bit stepped periodic 32-sample waveform generator for rich retro basslines.
*   **LFSR Noise**: Game Boy Linear Feedback Shift Register pseudo-random noise generator with periodic and metallic modes for retro percussion, snares, and hi-hats.

### 2. SoundFont & Sample Engine
*   **🎹 GBA Grand Piano**: Compressed, warm acoustic keys inspired by GBA JRPG soundtracks.
*   **🎻 Touhou Romantic Strings**: Lush, expressive string ensemble modeled on Roland SC-88 hardware rips.
*   **🎸 Funk Slap Bass**: Punchy electric bass plucks.
*   **🎺 Toby Fox Bright Brass**: Resonant retro brass fanfare.
*   **⚡ Megalovania Overdrive Lead**: Harmonic electric lead.
*   **🥁 Retro 90s Drum Kit**: Punchy kicks, snares, and metallic hats.

### 3. Vintage Console DSP Rack
*   **GBA / Nintendo DS Hardware Resampler**: Downsample in real-time to 8 kHz, 16 kHz, 18.157 kHz (GBA native hardware clock), 22.05 kHz, or 32 kHz (NDS native clock).
*   **Bit Depth Quantizer**: Crush audio to 4-bit (Nintendo DS ADPCM), 8-bit (GBA DirectSound PCM), 12-bit, or 16-bit.
*   **SNES / PSX Console Reverb**: Emulates the muffled feedback delay algorithms of 90s console soundchips (SPC700).
*   **Resonant Lowpass Filter**: Warm analog tone shaping with adjustable Q resonance.

### 4. Procedural SFX Lab (sfxr / ChipTone Style)
*   Instant generation of classic 8-bit sound effects:
    *   🚀 **Jump** (rapid upward sweep)
    *   🔫 **Laser** (sharp downward pitch drop)
    *   🪙 **Coin / Pickup** (two-tone melodic chime)
    *   💥 **Explosion** (lowpass filtered noise rumble)
    *   ⚡ **Powerup** (arpeggiated stair sweep)
    *   ⚔️ **Hit / Hurt** (crunchy impact slide)
    *   💬 **NPC Text Beep** (Undertale dialogue chatter tone)
    *   🎲 **Randomize** (generative sound designer)
*   **1-Click WAV Download**: Instantly export sound effects ready for GameMaker, Godot, or Unity.

---

## 🎮 Game Engine Integration (GameMaker & Godot)

### Seamless Looping Music Metadata
When you click **Export WAV** or **Export OGG**, ChromaAudio automatically encodes:
1. Standard 16-bit 44.1 kHz PCM audio or high-quality Vorbis compression.
2. RIFF **`smpl`** loop markers and OGG Vorbis comment tags (`LOOPSTART` and `LOOPLENGTH` sample indices).

GameMaker and Godot read these tags natively, allowing your music to loop seamlessly in-game with zero audible gaps or clicks.

---

## 🗺️ Roadmap & Planned Features
See [**`ROADMAP.md`**](file:///C:/Users/lozan106/chromaaudio/ROADMAP.md) for in-depth details on completed milestones and upcoming features inspired by **Ableton Live**, **Sony ACID Pro**, **Sony Sound Forge**, and **Vintage Trackers**:
* **Hardware 60Hz Fast Arp Tables** (Authentic monophonic NES/GB chord cycling)
* **Retrospective Jam Capture** ("Capture MIDI" style typing keyboard buffer)
* **Note Trigger Probability & Velocity Randomization** (Generative non-repetitive loops)
* **1-Click Batch SFX Variation Generator** (Multi-variation sound effects for game engines)
* **Playlist Clip Transposition & ACIDized Key Conformity**

