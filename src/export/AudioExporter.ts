/**
 * Audio Asset Exporter & Project Serialization
 * Features:
 * - Faster-than-realtime offline WAV rendering (OfflineAudioContext)
 * - Full Multi-Track Song Arrangement rendering & Pattern rendering
 * - Per-Channel Stem rendering for GameMaker adaptive audio
 * - GameMaker / Godot Vorbis Loop Tagging (RIFF 'smpl' LOOPSTART & LOOPLENGTH)
 * - Save / Load .chroma project state
 */

import { ProjectState, Pattern, InstrumentChannel, NoteEvent } from '../types/audio';
import { midiToFrequency, createPulseWave, createWaveRamPeriodicWave, createGbNoiseBuffer } from '../audio/RetroChipSynth';
import { createHarmonicPeriodicWave } from '../audio/SoundFontManager';

export class AudioExporter {
  /**
   * Schedule a single offline synthesized note
   */
  private static scheduleOfflineNote(
    offlineCtx: OfflineAudioContext,
    destination: AudioNode,
    channel: InstrumentChannel,
    note: NoteEvent,
    startTime: number,
    secondsPerStep: number,
    volumeModifier: number = 1.0
  ) {
    const durationSec = Math.max(0.04, note.duration * secondsPerStep);
    const effectiveNote = note.note + (channel.octaveOffset * 12);
    const freq = midiToFrequency(effectiveNote);
    const finalVelocity = Math.max(0.01, Math.min(1.0, note.velocity * volumeModifier));

    const attack = Math.max(0.004, channel.attack || 0.01);
    const decay = Math.max(0.01, channel.decay || 0.15);
    const sustain = channel.sustain !== undefined ? channel.sustain : 0.6;
    const release = Math.max(0.04, channel.release || 0.15);

    const attackEnd = startTime + attack;
    const decayEnd = attackEnd + decay;
    const noteEnd = startTime + durationSec;
    const releaseEnd = noteEnd + release;

    const voiceGain = offlineCtx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, startTime);
    voiceGain.gain.linearRampToValueAtTime(finalVelocity, attackEnd);
    if (decayEnd < noteEnd) {
      voiceGain.gain.linearRampToValueAtTime(finalVelocity * sustain, decayEnd);
      voiceGain.gain.setValueAtTime(finalVelocity * sustain, noteEnd);
    }
    voiceGain.gain.linearRampToValueAtTime(0.0001, releaseEnd);

    let sourceNode: AudioNode;

    if (channel.preset === 'noise') {
      const noiseBuffer = createGbNoiseBuffer(offlineCtx, effectiveNote > 60);
      const bufSource = offlineCtx.createBufferSource();
      bufSource.buffer = noiseBuffer;
      bufSource.loop = true;
      bufSource.playbackRate.value = freq / 440;
      bufSource.start(startTime);
      bufSource.stop(releaseEnd + 0.05);
      sourceNode = bufSource;
    } else {
      const osc = offlineCtx.createOscillator();
      if (channel.type === 'soundfont') {
        osc.setPeriodicWave(createHarmonicPeriodicWave(offlineCtx, channel.preset));
      } else if (channel.preset.startsWith('pulse_')) {
        const duty = channel.preset === 'pulse_12' ? 0.125 :
                     channel.preset === 'pulse_25' ? 0.25 :
                     channel.preset === 'pulse_75' ? 0.75 : 0.5;
        osc.setPeriodicWave(createPulseWave(offlineCtx, duty));
      } else if (channel.preset === 'wave_ram') {
        osc.setPeriodicWave(createWaveRamPeriodicWave(offlineCtx));
      } else if (['sine', 'square', 'sawtooth', 'triangle'].includes(channel.preset)) {
        osc.type = channel.preset as OscillatorType;
      } else {
        osc.type = 'square';
      }

      osc.frequency.setValueAtTime(freq, startTime);

      if (channel.sweepAmount && channel.sweepAmount !== 0) {
        const targetFreq = midiToFrequency(effectiveNote + channel.sweepAmount);
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq), attackEnd + decay);
      }

      osc.start(startTime);
      osc.stop(releaseEnd + 0.05);
      sourceNode = osc;
    }

    sourceNode.connect(voiceGain);
    voiceGain.connect(destination);
  }

  /**
   * Render complete active pattern to 16-bit PCM WAV Blob with Loop Tags
   */
  public static async renderPatternToWav(
    project: ProjectState,
    pattern: Pattern,
    sampleRate: number = 44100
  ): Promise<Blob> {
    const secondsPerBeat = 60.0 / project.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const totalDuration = (pattern.lengthSteps * secondsPerStep) + 0.5;

    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDuration), sampleRate);

    // Master Limiter
    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -0.5;
    limiter.ratio.value = 20;
    limiter.connect(offlineCtx.destination);

    // Schedule pattern notes
    project.channels.forEach(channel => {
      if (channel.mute) return;

      const notes = pattern.notesByChannel[channel.id] || [];
      const chGain = offlineCtx.createGain();
      chGain.gain.value = channel.volume;
      const chPan = offlineCtx.createStereoPanner();
      chPan.pan.value = channel.pan;
      chPan.connect(chGain);
      chGain.connect(limiter);

      notes.forEach(note => {
        const startTime = note.step * secondsPerStep;
        this.scheduleOfflineNote(offlineCtx, chPan, channel, note, startTime, secondsPerStep);
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer, project.loopStartStep, project.loopLengthSteps, project.bpm);
  }

  /**
   * Render complete multi-track song arrangement from playlist to 16-bit PCM WAV Blob with Loop Tags
   */
  public static async renderSongToWav(
    project: ProjectState,
    sampleRate: number = 44100
  ): Promise<Blob> {
    const secondsPerBeat = 60.0 / project.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;

    let maxSteps = 64;
    project.timelineClips.forEach(c => {
      const end = c.startStep + c.lengthSteps;
      if (end > maxSteps) maxSteps = end;
    });

    const totalDuration = (maxSteps * secondsPerStep) + 0.8;
    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDuration), sampleRate);

    // Master Limiter
    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -0.5;
    limiter.ratio.value = 20;
    limiter.connect(offlineCtx.destination);

    const tracks = project.tracks;
    const anyTrackSolo = tracks.some(t => t.solo);

    // Create channel buses
    const channelBuses = new Map<string, { gain: GainNode; pan: StereoPannerNode }>();
    project.channels.forEach(channel => {
      if (channel.mute) return;
      const chGain = offlineCtx.createGain();
      chGain.gain.value = channel.volume;
      const chPan = offlineCtx.createStereoPanner();
      chPan.pan.value = channel.pan;
      chPan.connect(chGain);
      chGain.connect(limiter);
      channelBuses.set(channel.id, { gain: chGain, pan: chPan });
    });

    // Schedule all clips on active tracks
    project.timelineClips.forEach(clip => {
      if (clip.muted) return;
      const track = tracks[clip.trackIndex];
      if (track) {
        if (track.mute) return;
        if (anyTrackSolo && !track.solo) return;
      }

      const pattern = project.patterns.find(p => p.id === clip.patternId);
      if (!pattern) return;

      const patLen = pattern.lengthSteps || 64;
      const trackVol = track ? track.volume : 1.0;

      project.channels.forEach(channel => {
        if (channel.mute) return;
        const bus = channelBuses.get(channel.id);
        if (!bus) return;

        const notes = pattern.notesByChannel[channel.id] || [];
        const repetitions = Math.ceil(clip.lengthSteps / patLen);

        for (let rep = 0; rep < repetitions; rep++) {
          const repOffsetStep = rep * patLen;
          notes.forEach(note => {
            const clipRelativeStep = repOffsetStep + note.step;
            if (clipRelativeStep < clip.lengthSteps) {
              const globalStep = clip.startStep + clipRelativeStep;
              const startTime = globalStep * secondsPerStep;
              this.scheduleOfflineNote(offlineCtx, bus.pan, channel, note, startTime, secondsPerStep, trackVol);
            }
          });
        }
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer, project.loopStartStep, project.loopLengthSteps, project.bpm);
  }

  /**
   * Render an isolated channel stem to 16-bit PCM WAV Blob for dynamic game audio
   */
  public static async renderChannelStem(
    project: ProjectState,
    channelId: string,
    mode: 'pattern' | 'song' = 'song',
    sampleRate: number = 44100
  ): Promise<Blob> {
    const singleChannelProject: ProjectState = {
      ...project,
      channels: project.channels.map(ch => ({
        ...ch,
        mute: ch.id !== channelId
      }))
    };

    if (mode === 'pattern') {
      const pat = project.patterns.find(p => p.id === project.activePatternId) || project.patterns[0];
      return this.renderPatternToWav(singleChannelProject, pat, sampleRate);
    } else {
      return this.renderSongToWav(singleChannelProject, sampleRate);
    }
  }

  /**
   * Convert AudioBuffer to WAV format with RIFF 'smpl' chunk for zero-gap looping game audio
   */
  private static audioBufferToWavBlob(
    buffer: AudioBuffer,
    loopStartStep: number,
    loopLengthSteps: number,
    bpm: number
  ): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numSamples = buffer.length;
    const bytesPerSample = 2; // 16-bit PCM
    const blockAlign = numChannels * bytesPerSample;

    // Calculate loop sample points for GameMaker / Godot
    const secondsPerStep = (60.0 / bpm) / 4.0;
    const loopStartSample = Math.floor(loopStartStep * secondsPerStep * sampleRate);
    const loopLengthSamples = Math.floor(loopLengthSteps * secondsPerStep * sampleRate);

    // Include RIFF 'smpl' chunk (68 bytes) if loop is defined
    const hasLoop = loopLengthSamples > 0;
    const smplChunkSize = hasLoop ? 68 : 0;

    const dataSize = numSamples * blockAlign;
    const headerSize = 44 + smplChunkSize;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // 1. RIFF Header
    writeString(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(8, 'WAVE');

    // 2. fmt Sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16 bits per sample

    let currentOffset = 36;

    // 3. Optional Sampler 'smpl' Chunk for Looping Game Audio
    if (hasLoop) {
      writeString(currentOffset, 'smpl');
      view.setUint32(currentOffset + 4, 60, true); // subchunk size
      view.setUint32(currentOffset + 8, 0, true); // manufacturer
      view.setUint32(currentOffset + 12, 0, true); // product
      view.setUint32(currentOffset + 16, Math.floor(1000000000 / sampleRate), true); // sample period
      view.setUint32(currentOffset + 20, 60, true); // unity note (Middle C)
      view.setUint32(currentOffset + 24, 0, true); // pitch fraction
      view.setUint32(currentOffset + 28, 0, true); // SMPTE format
      view.setUint32(currentOffset + 32, 0, true); // SMPTE offset
      view.setUint32(currentOffset + 36, 1, true); // 1 loop point
      view.setUint32(currentOffset + 40, 0, true); // sampler data

      // Loop Point 0
      view.setUint32(currentOffset + 44, 0, true); // cue point ID
      view.setUint32(currentOffset + 48, 0, true); // type (forward loop)
      view.setUint32(currentOffset + 52, loopStartSample, true); // LOOPSTART
      view.setUint32(currentOffset + 56, loopStartSample + loopLengthSamples, true); // LOOPEND
      view.setUint32(currentOffset + 60, 0, true); // fraction
      view.setUint32(currentOffset + 64, 0, true); // play count (0 = infinite)

      currentOffset += 68;
    }

    // 4. data Sub-chunk
    writeString(currentOffset, 'data');
    view.setUint32(currentOffset + 4, dataSize, true);
    currentOffset += 8;

    // Write interleaved 16-bit PCM samples
    const channelData: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channelData.push(buffer.getChannelData(ch));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
        const intSample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(currentOffset, intSample, true);
        currentOffset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Save project state to .chroma JSON file
   */
  public static saveProjectFile(project: ProjectState) {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, `${project.name.toLowerCase().replace(/\s+/g, '_')}.chroma`);
  }

  /**
   * Load project state from user-selected .chroma file
   */
  public static async loadProjectFile(file: File): Promise<ProjectState> {
    const text = await file.text();
    const data = JSON.parse(text) as ProjectState;
    if (!data.version || !data.channels || !data.patterns) {
      throw new Error('Invalid .chroma project file format: missing required properties');
    }
    return data;
  }

  /**
   * Trigger browser file download
   */
  public static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
