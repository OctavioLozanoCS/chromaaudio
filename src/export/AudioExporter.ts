/**
 * Audio Asset Exporter & Project Serialization
 * Features:
 * - Faster-than-realtime offline WAV rendering (OfflineAudioContext)
 * - Full Multi-Track Song Arrangement rendering & Pattern rendering
 * - Per-Channel Stem rendering for GameMaker adaptive audio
 * - GameMaker / Godot Vorbis Loop Tagging (RIFF 'smpl' LOOPSTART & LOOPLENGTH)
 * - Save / Load .chroma project state
 */

import { ProjectState, Pattern, InstrumentChannel, NoteEvent, DSPConfig } from '../types/audio';
import { playChipVoice } from '../audio/RetroChipSynth';
import { playFMVoice } from '../audio/FMSynth';
import { playSampleVoice, SampleManager } from '../audio/SampleVoice';
import { SoundFontManager } from '../audio/SoundFontManager';
import { createBitQuantizerCurve } from '../audio/ConsoleDSP';
import ogg from '@audio/encode-ogg';

export type ExportAudioFormat = 'wav' | 'ogg';

export interface IntroLoopExportResult {
  introBlob: Blob | null;
  loopBlob: Blob;
  hasIntro: boolean;
  introDurationSec: number;
  loopDurationSec: number;
  format?: ExportAudioFormat;
}

export class AudioExporter {
  /**
   * Schedule a single offline synthesized note with 1:1 acoustic parity to live playback
   */
  private static scheduleOfflineNote(
    offlineCtx: OfflineAudioContext,
    soundFontManager: SoundFontManager,
    destination: AudioNode,
    channel: InstrumentChannel,
    note: NoteEvent,
    startTime: number,
    secondsPerStep: number,
    volumeModifier: number = 1.0
  ) {
    const durationSec = Math.max(0.04, note.duration * secondsPerStep);
    const effectiveNote = note.note + (channel.octaveOffset * 12);
    const finalVelocity = Math.max(0.01, Math.min(1.0, note.velocity * volumeModifier));

    if (channel.type === 'soundfont') {
      soundFontManager.playNote(
        destination,
        effectiveNote,
        channel.preset,
        finalVelocity,
        startTime,
        durationSec
      );
    } else if (channel.type === 'sample' || SampleManager.hasSample(channel.preset)) {
      const sampleBuf = SampleManager.getSample(channel.preset);
      if (sampleBuf) {
        playSampleVoice(offlineCtx, destination, sampleBuf, effectiveNote, {
          velocity: finalVelocity,
          attack: channel.attack,
          decay: channel.decay,
          sustain: channel.sustain,
          release: channel.release
        }, startTime, durationSec);
      }
    } else if (channel.type === 'fm_synth' || channel.preset.startsWith('fm_')) {
      playFMVoice(
        offlineCtx,
        destination,
        effectiveNote,
        {
          preset: channel.preset,
          velocity: finalVelocity,
          attack: channel.attack,
          decay: channel.decay,
          sustain: channel.sustain,
          release: channel.release
        },
        startTime,
        durationSec
      );
    } else {
      const waveform = (channel.preset as any) || 'pulse_50';
      playChipVoice(
        offlineCtx,
        destination,
        effectiveNote,
        {
          waveform,
          velocity: finalVelocity,
          attack: channel.attack,
          decay: channel.decay,
          sustain: channel.sustain,
          release: channel.release,
          sweepAmount: channel.sweepAmount,
          vibratoDepth: channel.vibratoDepth,
          vibratoSpeed: channel.vibratoSpeed
        },
        startTime,
        durationSec
      );
    }
  }

  /**
   * Constructs the offline DSP chain (bitcrusher, clock resampler, filter, SPC700 reverb)
   * Strictly respects dsp.enabled master bypass just like in-app ConsoleDSPRack.
   */
  private static setupOfflineDSPRack(
    offlineCtx: OfflineAudioContext,
    dsp: DSPConfig,
    destination: AudioNode
  ): AudioNode {
    const inputNode = offlineCtx.createGain();

    if (!dsp.enabled) {
      inputNode.connect(destination);
      return inputNode;
    }

    const outputNode = offlineCtx.createGain();
    outputNode.connect(destination);

    // Resonant Master Tone Filter
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = dsp.filterCutoff || 18000;
    filter.Q.value = dsp.filterResonance || 1.0;

    // Bitcrusher & Resampler
    const bitQuantizer = offlineCtx.createWaveShaper();
    bitQuantizer.curve = createBitQuantizerCurve(dsp.bitDepth);
    bitQuantizer.oversample = 'none';

    const resampleFilter = offlineCtx.createBiquadFilter();
    resampleFilter.type = 'lowpass';
    resampleFilter.frequency.value = Math.min(20000, Math.max(2000, (dsp.resampleRate || 18157) / 2));

    inputNode.connect(bitQuantizer);
    bitQuantizer.connect(resampleFilter);
    resampleFilter.connect(filter);

    // SPC700 Reverb network
    if (dsp.reverbEnabled && dsp.reverbWet > 0) {
      const wetGain = offlineCtx.createGain();
      const dryGain = offlineCtx.createGain();
      wetGain.gain.value = dsp.reverbWet;
      dryGain.gain.value = 1.0 - (dsp.reverbWet * 0.3);

      const delayL = offlineCtx.createDelay(1.0);
      const delayR = offlineCtx.createDelay(1.0);
      delayL.delayTime.value = 0.11;
      delayR.delayTime.value = 0.17;

      const fbL = offlineCtx.createGain();
      const fbR = offlineCtx.createGain();
      const feedback = Math.min(0.68, Math.max(0.05, (dsp.reverbDecay || 1.2) * 0.16));
      fbL.gain.value = feedback;
      fbR.gain.value = feedback;

      const delayFilter = offlineCtx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 3200;

      const fbSum = offlineCtx.createGain();
      fbSum.gain.value = 0.5;

      filter.connect(dryGain);
      filter.connect(delayL);
      filter.connect(delayR);

      delayL.connect(delayFilter);
      delayR.connect(delayFilter);
      delayFilter.connect(wetGain);

      delayFilter.connect(fbSum);
      fbSum.connect(fbL);
      fbSum.connect(fbR);
      fbL.connect(delayR);
      fbR.connect(delayL);

      dryGain.connect(outputNode);
      wetGain.connect(outputNode);
    } else {
      filter.connect(outputNode);
    }

    return inputNode;
  }

  /**
   * Render arbitrary timeline step range to an offline AudioBuffer
   */
  public static async renderSongRangeToAudioBuffer(
    project: ProjectState,
    startStep: number,
    lengthSteps: number,
    tailSeconds: number = 0.5,
    sampleRate: number = 44100,
    muteFilter?: (channelId: string) => boolean
  ): Promise<AudioBuffer> {
    const secondsPerBeat = 60.0 / project.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const rangeDuration = (lengthSteps * secondsPerStep) + tailSeconds;

    const offlineCtx = new OfflineAudioContext(2, Math.max(1, Math.floor(sampleRate * rangeDuration)), sampleRate);

    // Master Volume Gain (identical to AudioEngine: 0.65)
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.65;

    // Master Limiter (Soft-knee transparent mastering peak limiter - identical to AudioEngine)
    const masterLimiter = offlineCtx.createDynamicsCompressor();
    masterLimiter.threshold.value = -6.0;
    masterLimiter.knee.value = 12.0;
    masterLimiter.ratio.value = 8.0;
    masterLimiter.attack.value = 0.005;
    masterLimiter.release.value = 0.12;

    masterGain.connect(masterLimiter);
    masterLimiter.connect(offlineCtx.destination);

    // DSP Rack routing
    const dspInput = this.setupOfflineDSPRack(offlineCtx, project.dsp, masterGain);

    // Offline SoundFont Manager instance (for GM SoundFonts & sampled drum kit)
    const soundFontManager = new SoundFontManager(offlineCtx);

    const tracks = project.tracks;
    const anyTrackSolo = tracks.some(t => t.solo);
    const anyChannelSolo = project.channels.some(c => c.solo);

    // Create channel buses
    const channelBuses = new Map<string, { gain: GainNode; pan: StereoPannerNode }>();
    project.channels.forEach(channel => {
      const isMuted = muteFilter ? muteFilter(channel.id) : (channel.mute || (anyChannelSolo && !channel.solo));
      if (isMuted) return;

      const chGain = offlineCtx.createGain();
      chGain.gain.value = channel.volume;
      const chPan = offlineCtx.createStereoPanner();
      chPan.pan.value = channel.pan;
      chPan.connect(chGain);
      chGain.connect(dspInput);
      channelBuses.set(channel.id, { gain: chGain, pan: chPan });
    });

    const rangeEndStep = startStep + lengthSteps;

    // Schedule all clips that fall within this range
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
              // Check if note falls within our rendered range
              if (globalStep >= startStep && globalStep < rangeEndStep) {
                const relativeStep = globalStep - startStep;
                const startTime = relativeStep * secondsPerStep;
                this.scheduleOfflineNote(offlineCtx, soundFontManager, bus.pan, channel, note, startTime, secondsPerStep, trackVol);
              }
            }
          });
        }
      });
    });

    return await offlineCtx.startRendering();
  }

  /**
   * Render complete active pattern to WAV or OGG Blob with Loop Tags & DSP
   */
  public static async renderPattern(
    project: ProjectState,
    pattern: Pattern,
    format: ExportAudioFormat = 'wav',
    sampleRate: number = 44100,
    quality: number = 0.85
  ): Promise<Blob> {
    const secondsPerBeat = 60.0 / project.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const totalDuration = (pattern.lengthSteps * secondsPerStep) + 0.5;

    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDuration), sampleRate);

    // Master Volume Gain (identical to AudioEngine: 0.65)
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.65;

    // Master Limiter (Soft-knee transparent mastering peak limiter - identical to AudioEngine)
    const masterLimiter = offlineCtx.createDynamicsCompressor();
    masterLimiter.threshold.value = -6.0;
    masterLimiter.knee.value = 12.0;
    masterLimiter.ratio.value = 8.0;
    masterLimiter.attack.value = 0.005;
    masterLimiter.release.value = 0.12;

    masterGain.connect(masterLimiter);
    masterLimiter.connect(offlineCtx.destination);

    const dspInput = this.setupOfflineDSPRack(offlineCtx, project.dsp, masterGain);

    // Offline SoundFont Manager instance (for GM SoundFonts & sampled drum kit)
    const soundFontManager = new SoundFontManager(offlineCtx);

    const anyChannelSolo = project.channels.some(c => c.solo);
    project.channels.forEach(channel => {
      if (channel.mute || (anyChannelSolo && !channel.solo)) return;

      const notes = pattern.notesByChannel[channel.id] || [];
      const chGain = offlineCtx.createGain();
      chGain.gain.value = channel.volume;
      const chPan = offlineCtx.createStereoPanner();
      chPan.pan.value = channel.pan;
      chPan.connect(chGain);
      chGain.connect(dspInput);

      notes.forEach(note => {
        const startTime = note.step * secondsPerStep;
        this.scheduleOfflineNote(offlineCtx, soundFontManager, chPan, channel, note, startTime, secondsPerStep);
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return await this.audioBufferToExportBlob(
      renderedBuffer,
      format,
      project.loopStartStep,
      project.loopLengthSteps,
      project.bpm,
      pattern.name,
      quality
    );
  }

  public static async renderPatternToWav(
    project: ProjectState,
    pattern: Pattern,
    sampleRate: number = 44100
  ): Promise<Blob> {
    return this.renderPattern(project, pattern, 'wav', sampleRate);
  }

  /**
   * Render complete multi-track song arrangement from playlist to WAV or OGG Blob with Loop Tags
   */
  public static async renderSong(
    project: ProjectState,
    format: ExportAudioFormat = 'wav',
    sampleRate: number = 44100,
    quality: number = 0.85
  ): Promise<Blob> {
    let maxSteps = 64;
    project.timelineClips.forEach(c => {
      const end = c.startStep + c.lengthSteps;
      if (end > maxSteps) maxSteps = end;
    });

    const renderedBuffer = await this.renderSongRangeToAudioBuffer(project, 0, maxSteps, 0.8, sampleRate);
    return await this.audioBufferToExportBlob(
      renderedBuffer,
      format,
      project.loopStartStep,
      project.loopLengthSteps,
      project.bpm,
      project.name,
      quality
    );
  }

  public static async renderSongToWav(
    project: ProjectState,
    sampleRate: number = 44100
  ): Promise<Blob> {
    return this.renderSong(project, 'wav', sampleRate);
  }

  /**
   * Render Split Intro & Loop files for game engines:
   * - intro: 0 to loopStartStep (plays once on area enter)
   * - loop: loopStartStep to loopStartStep + loopLengthSteps (loops infinitely)
   */
  public static async renderIntroAndLoop(
    project: ProjectState,
    format: ExportAudioFormat = 'wav',
    sampleRate: number = 44100,
    quality: number = 0.85
  ): Promise<IntroLoopExportResult> {
    const loopStart = project.loopStartStep || 0;
    const loopLen = project.loopLengthSteps || 64;
    const secondsPerStep = (60.0 / project.bpm) / 4.0;

    let introBlob: Blob | null = null;
    let introDurationSec = 0;

    if (loopStart > 0) {
      const introBuf = await this.renderSongRangeToAudioBuffer(project, 0, loopStart, 0.05, sampleRate);
      introDurationSec = loopStart * secondsPerStep;
      introBlob = await this.audioBufferToExportBlob(
        introBuf,
        format,
        0,
        0,
        project.bpm,
        `${project.name} (Intro)`,
        quality
      );
    }

    // Render loop portion
    const loopBuf = await this.renderSongRangeToAudioBuffer(project, loopStart, loopLen, 0.05, sampleRate);
    const loopDurationSec = loopLen * secondsPerStep;
    const loopBlob = await this.audioBufferToExportBlob(
      loopBuf,
      format,
      0,
      loopLen,
      project.bpm,
      `${project.name} (Loop)`,
      quality
    );

    return {
      introBlob,
      loopBlob,
      hasIntro: loopStart > 0,
      introDurationSec,
      loopDurationSec,
      format
    };
  }

  public static async renderIntroAndLoopToWav(
    project: ProjectState,
    sampleRate: number = 44100
  ): Promise<IntroLoopExportResult> {
    return this.renderIntroAndLoop(project, 'wav', sampleRate);
  }

  /**
   * Render Seamless Loop with Tail Spillover
   * Renders the loop section, folds any trailing reverb/delay ring from the end back into the start,
   * guaranteeing zero clicks, gaps, or energy drop when looped in-game.
   */
  public static async renderSeamlessLoopWithTail(
    project: ProjectState,
    format: ExportAudioFormat = 'wav',
    sampleRate: number = 44100,
    quality: number = 0.85
  ): Promise<Blob> {
    const loopStart = project.loopStartStep || 0;
    const loopLen = project.loopLengthSteps || 64;
    const secondsPerStep = (60.0 / project.bpm) / 4.0;
    const tailSec = Math.max(0.5, (project.dsp.reverbDecay || 1.2) + 0.4);

    // Render loop with extended tail
    const fullBuffer = await this.renderSongRangeToAudioBuffer(project, loopStart, loopLen, tailSec, sampleRate);

    const loopSamples = Math.floor(loopLen * secondsPerStep * sampleRate);
    const totalSamples = fullBuffer.length;
    const tailSamples = totalSamples - loopSamples;

    // Create exact-length loop buffer
    const offlineCtx = new OfflineAudioContext(2, loopSamples, sampleRate);
    const cleanLoopBuf = offlineCtx.createBuffer(2, loopSamples, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const srcData = fullBuffer.getChannelData(ch);
      const dstData = cleanLoopBuf.getChannelData(ch);

      // Copy primary loop
      for (let i = 0; i < loopSamples; i++) {
        dstData[i] = srcData[i];
      }

      // Spillover fold: add tail into the start of the loop
      const foldCount = Math.min(loopSamples, tailSamples);
      for (let i = 0; i < foldCount; i++) {
        dstData[i] = Math.max(-1.0, Math.min(1.0, dstData[i] + srcData[loopSamples + i]));
      }
    }

    return await this.audioBufferToExportBlob(
      cleanLoopBuf,
      format,
      0,
      loopLen,
      project.bpm,
      `${project.name} (Seamless Loop)`,
      quality
    );
  }

  /**
   * Render an isolated channel stem to WAV or OGG Blob for dynamic game audio
   */
  public static async renderChannelStem(
    project: ProjectState,
    channelId: string,
    mode: 'pattern' | 'song' = 'song',
    format: ExportAudioFormat = 'wav',
    sampleRate: number = 44100,
    quality: number = 0.85
  ): Promise<Blob> {
    const ch = project.channels.find(c => c.id === channelId);
    const stemTitle = `${project.name} - Stem: ${ch?.name || channelId}`;
    if (mode === 'pattern') {
      const pat = project.patterns.find(p => p.id === project.activePatternId) || project.patterns[0];
      const singleChannelProject: ProjectState = {
        ...project,
        channels: project.channels.map(c => ({
          ...c,
          mute: c.id !== channelId
        }))
      };
      return this.renderPattern(singleChannelProject, pat, format, sampleRate, quality);
    } else {
      let maxSteps = 64;
      project.timelineClips.forEach(c => {
        const end = c.startStep + c.lengthSteps;
        if (end > maxSteps) maxSteps = end;
      });
      const renderedBuffer = await this.renderSongRangeToAudioBuffer(
        project,
        0,
        maxSteps,
        0.8,
        sampleRate,
        (id) => id !== channelId
      );
      return await this.audioBufferToExportBlob(
        renderedBuffer,
        format,
        project.loopStartStep,
        project.loopLengthSteps,
        project.bpm,
        stemTitle,
        quality
      );
    }
  }

  /**
   * Unified AudioBuffer exporter supporting both WAV and OGG with respective loop metadata
   */
  public static async audioBufferToExportBlob(
    buffer: AudioBuffer,
    format: ExportAudioFormat,
    loopStartStep: number,
    loopLengthSteps: number,
    bpm: number,
    title: string = 'ChromaAudio Track',
    quality: number = 0.85
  ): Promise<Blob> {
    if (format === 'ogg') {
      return await this.audioBufferToOggBlob(buffer, loopStartStep, loopLengthSteps, bpm, title, quality);
    }
    return this.audioBufferToWavBlob(buffer, loopStartStep, loopLengthSteps, bpm);
  }

  /**
   * Convert AudioBuffer to compressed Ogg Vorbis with GameMaker / Godot Vorbis comment loop tags
   */
  public static async audioBufferToOggBlob(
    buffer: AudioBuffer,
    loopStartStep: number,
    loopLengthSteps: number,
    bpm: number,
    title: string = 'ChromaAudio Track',
    quality: number = 0.85
  ): Promise<Blob> {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;

    const channelsData: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channelsData.push(buffer.getChannelData(ch));
    }

    const encoder = await ogg({ sampleRate, channels: numChannels, quality });
    const chunk = encoder.encode(channelsData);
    const tail = encoder.flush();
    encoder.free();

    const oggBytes = new Uint8Array(chunk.length + tail.length);
    oggBytes.set(chunk, 0);
    oggBytes.set(tail, chunk.length);

    // Calculate loop sample points for GameMaker / Godot
    const secondsPerStep = (60.0 / bpm) / 4.0;
    const loopStartSample = Math.floor(loopStartStep * secondsPerStep * sampleRate);
    const loopLengthSamples = Math.floor(loopLengthSteps * secondsPerStep * sampleRate);

    const tags: Record<string, string> = {
      TITLE: title,
      ENCODER: 'ChromaAudio Ogg Vorbis Exporter'
    };

    if (loopLengthSamples > 0) {
      tags['LOOPSTART'] = loopStartSample.toString();
      tags['LOOPLENGTH'] = loopLengthSamples.toString();
    }

    const taggedOgg = AudioExporter.writeVorbisComments(oggBytes, tags);
    return new Blob([taggedOgg as any], { type: 'audio/ogg' });
  }

  private static readonly OGG_CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let r = i << 24;
      for (let j = 0; j < 8; j++) {
        r = ((r & 0x80000000) ? ((r << 1) ^ 0x04C11DB7) : (r << 1)) >>> 0;
      }
      table[i] = r >>> 0;
    }
    return table;
  })();

  private static calculateOggCrc(data: Uint8Array): number {
    let crc = 0;
    const tbl = AudioExporter.OGG_CRC_TABLE;
    for (let i = 0; i < data.length; i++) {
      crc = ((crc << 8) ^ tbl[((crc >>> 24) ^ data[i]) & 0xFF]) >>> 0;
    }
    return crc >>> 0;
  }

  /**
   * Embeds Vorbis Comment metadata (TITLE, ARTIST, LOOPSTART, LOOPLENGTH) into an Ogg Vorbis bitstream.
   * GameMaker and Godot read LOOPSTART / LOOPLENGTH from Vorbis comments for seamless background music streaming.
   */
  public static writeVorbisComments(oggBytes: Uint8Array, tags: Record<string, string>): Uint8Array {
    const TE = new TextEncoder();
    const vendor = TE.encode('ChromaAudio Game Audio Studio');
    const entries: Uint8Array[] = [];
    for (const [k, v] of Object.entries(tags)) {
      if (v !== undefined && v !== null && v !== '') {
        entries.push(TE.encode(`${k.toUpperCase()}=${v}`));
      }
    }

    let commentPacketSize = 7 + 4 + vendor.length + 4;
    for (const e of entries) commentPacketSize += 4 + e.length;
    commentPacketSize += 1; // framing bit

    const commentPacket = new Uint8Array(commentPacketSize);
    const view = new DataView(commentPacket.buffer);
    commentPacket[0] = 3;
    commentPacket.set(TE.encode('vorbis'), 1);
    let pos = 7;
    view.setUint32(pos, vendor.length, true); pos += 4;
    commentPacket.set(vendor, pos); pos += vendor.length;
    view.setUint32(pos, entries.length, true); pos += 4;
    for (const e of entries) {
      view.setUint32(pos, e.length, true); pos += 4;
      commentPacket.set(e, pos); pos += e.length;
    }
    commentPacket[pos] = 1; // framing bit

    interface OggPage {
      start: number;
      len: number;
      nSegs: number;
      segTable: Uint8Array;
      payloadStart: number;
    }
    const pages: OggPage[] = [];
    let off = 0;
    while (off + 27 <= oggBytes.length) {
      if (!(oggBytes[off] === 0x4F && oggBytes[off + 1] === 0x67 && oggBytes[off + 2] === 0x67 && oggBytes[off + 3] === 0x53)) break;
      const nSegs = oggBytes[off + 26];
      const segTable = oggBytes.subarray(off + 27, off + 27 + nSegs);
      let payloadLen = 0;
      for (let i = 0; i < nSegs; i++) payloadLen += segTable[i];
      pages.push({ start: off, len: 27 + nSegs + payloadLen, nSegs, segTable, payloadStart: off + 27 + nSegs });
      off += 27 + nSegs + payloadLen;
    }

    if (pages.length < 2) return oggBytes;
    const serial = new DataView(oggBytes.buffer, oggBytes.byteOffset).getUint32(pages[0].start + 14, true);

    const packets: Uint8Array[] = [];
    let curChunks: Uint8Array[] = [];
    let lastHeaderPage = -1;
    let bailed = false;

    for (let pi = 0; pi < pages.length && packets.length < 3; pi++) {
      const pg = pages[pi];
      let segOff = pg.payloadStart;
      for (let s = 0; s < pg.nSegs; s++) {
        const segLen = pg.segTable[s];
        curChunks.push(oggBytes.subarray(segOff, segOff + segLen));
        segOff += segLen;
        if (segLen < 255) {
          let n = 0;
          for (const c of curChunks) n += c.length;
          const fullPacket = new Uint8Array(n);
          let pOff = 0;
          for (const c of curChunks) { fullPacket.set(c, pOff); pOff += c.length; }
          packets.push(fullPacket);
          curChunks = [];
          if (packets.length === 3) {
            if (s < pg.nSegs - 1) bailed = true; // audio shares setup page
            lastHeaderPage = pi;
            break;
          }
        }
      }
    }

    if (bailed || packets.length < 3) return oggBytes;
    const p1 = packets[1];
    if (!(p1[0] === 3 && p1[1] === 0x76 && p1[2] === 0x6F && p1[3] === 0x72 && p1[4] === 0x62 && p1[5] === 0x69 && p1[6] === 0x73)) {
      return oggBytes;
    }

    const concatArrays = (arrays: Uint8Array[]): Uint8Array => {
      let len = 0;
      for (const a of arrays) len += a.length;
      const res = new Uint8Array(len);
      let o = 0;
      for (const a of arrays) { res.set(a, o); o += a.length; }
      return res;
    };

    const buildOggPage = (payload: Uint8Array, segLens: number[], serialNum: number, seq: number, granule: bigint, flags: number): Uint8Array => {
      const nSegments = segLens.length;
      const page = new Uint8Array(27 + nSegments + payload.length);
      const dv = new DataView(page.buffer);
      page[0] = 0x4F; page[1] = 0x67; page[2] = 0x67; page[3] = 0x53;
      page[4] = 0;
      page[5] = flags;
      dv.setUint32(6, Number(granule & 0xFFFFFFFFn), true);
      dv.setUint32(10, Number((granule >> 32n) & 0xFFFFFFFFn), true);
      dv.setUint32(14, serialNum, true);
      dv.setUint32(18, seq, true);
      dv.setUint32(22, 0, true);
      page[26] = nSegments;
      for (let i = 0; i < nSegments; i++) page[27 + i] = segLens[i];
      page.set(payload, 27 + nSegments);
      dv.setUint32(22, AudioExporter.calculateOggCrc(page), true);
      return page;
    };

    const pageify = (pkts: Uint8Array[], serialNum: number, startSeq: number, firstFlags: number): { pages: Uint8Array[], nextSeq: number } => {
      const allBytes = concatArrays(pkts);
      const segLens: number[] = [];
      for (const p of pkts) {
        const full255s = Math.floor(p.length / 255);
        for (let i = 0; i < full255s; i++) segLens.push(255);
        segLens.push(p.length % 255);
      }
      const outPages: Uint8Array[] = [];
      let segIdx = 0, byteOff = 0, seq = startSeq, pageNo = 0, prevLast = -1;
      while (segIdx < segLens.length) {
        const count = Math.min(255, segLens.length - segIdx);
        const pageSegs = segLens.slice(segIdx, segIdx + count);
        let payloadLen = 0;
        for (const s of pageSegs) payloadLen += s;
        const flags = pageNo === 0 ? firstFlags : (prevLast === 255 ? 0x01 : 0);
        outPages.push(buildOggPage(allBytes.subarray(byteOff, byteOff + payloadLen), pageSegs, serialNum, seq++, 0n, flags));
        prevLast = pageSegs[pageSegs.length - 1];
        segIdx += count; byteOff += payloadLen; pageNo++;
      }
      return { pages: outPages, nextSeq: seq };
    };

    const header = [packets[0], commentPacket, packets[2]];
    const page0 = pageify([header[0]], serial, 0, 0x02);
    const page1 = pageify([header[1], header[2]], serial, page0.nextSeq, 0);

    let seq = page1.nextSeq;
    const audioPages: Uint8Array[] = [];
    for (let pi = lastHeaderPage + 1; pi < pages.length; pi++) {
      const pg = pages[pi];
      const copy = oggBytes.slice(pg.start, pg.start + pg.len);
      const dv = new DataView(copy.buffer);
      dv.setUint32(18, seq++, true);
      dv.setUint32(22, 0, true);
      dv.setUint32(22, AudioExporter.calculateOggCrc(copy), true);
      audioPages.push(copy);
    }

    return concatArrays([...page0.pages, ...page1.pages, ...audioPages]);
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
