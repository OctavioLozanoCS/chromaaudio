/**
 * Master Central Audio Engine
 * Coordinates:
 * - Low-latency AudioContext
 * - Channel Mixer & Master Limiter
 * - Jitter-free Lookahead Sequencer Scheduler
 * - Console DSP Rack integration
 * - SoundFont & Retro Chip Synth voice management
 */

import { InstrumentChannel, NoteEvent, Pattern, DSPConfig, ProjectState } from '../types/audio';
import { playChipVoice, ActiveVoice } from './RetroChipSynth';
import { SoundFontManager } from './SoundFontManager';
import { ConsoleDSPRack } from './ConsoleDSP';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext;
  public masterGain: GainNode;
  private masterLimiter: DynamicsCompressorNode;
  public dspRack: ConsoleDSPRack;
  public soundFontManager: SoundFontManager;

  // Channel audio bus graph: channelId -> { inputNode, gainNode, pannerNode }
  private channelBuses: Map<string, { gain: GainNode; panner: StereoPannerNode }> = new Map();

  // Active live auditioned voices: key (channelId_note) -> ActiveVoice / stop fn
  private activeVoices: Map<string, { stop: (r?: number) => void }> = new Map();

  // Playback & Sequencer state
  public isPlaying: boolean = false;
  public currentBpm: number = 130;
  public currentStep: number = 0; // Float or int for smooth playhead
  private playbackStartTime: number = 0;
  private nextStepTime: number = 0;
  private currentSchedulerStep: number = 0;
  private scheduleTimerId: number | null = null;
  private playbackMode: 'pattern' | 'song' = 'pattern';

  // Listeners
  private onStepChangeCallbacks: Set<(step: number) => void> = new Set();
  private onPlaybackStateCallbacks: Set<(playing: boolean) => void> = new Set();

  private activeProject: ProjectState | null = null;
  private scheduledVoices: Set<{ stop: (rel?: number) => void }> = new Set();

  private constructor() {
    // Initialize low latency, high stability AudioContext (WASAPI shared mode on Windows)
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'balanced' });

    // Master Limiter with soft knee (prevents intermodulation distortion and digital clipping)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -6.0; // 6 dB clean dynamic headroom
    this.masterLimiter.knee.value = 12.0; // Smooth musical soft-knee transition
    this.masterLimiter.ratio.value = 8.0;
    this.masterLimiter.attack.value = 0.005; // 5ms prevents waveform chopping
    this.masterLimiter.release.value = 0.12; // 120ms smooth recovery

    // Master Volume Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.65;

    // Vintage Console DSP Rack
    const initialDSP: DSPConfig = {
      enabled: false,
      resampleRate: 18157, // GBA DirectSound rate
      bitDepth: 8,
      reverbEnabled: true,
      reverbDecay: 1.2,
      reverbWet: 0.25,
      filterCutoff: 18000,
      filterResonance: 1.0
    };
    this.dspRack = new ConsoleDSPRack(this.ctx, initialDSP);

    // Master Audio Chain:
    // Channel Buses -> DSP Rack Input -> DSP Rack Output -> Master Gain -> Master Limiter -> Audio Destination
    this.dspRack.outputNode.connect(this.masterGain);
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);

    // Initialize SoundFont Manager
    this.soundFontManager = new SoundFontManager(this.ctx);
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async resumeContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Synchronize channels with the mixer graph
   */
  public updateChannels(channels: InstrumentChannel[]) {
    // Create or update channel buses
    channels.forEach(ch => {
      let bus = this.channelBuses.get(ch.id);
      if (!bus) {
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();
        panner.connect(gain);
        gain.connect(this.dspRack.inputNode);
        bus = { gain, panner };
        this.channelBuses.set(ch.id, bus);
      }

      // Update volume, pan, mute, solo
      const effectiveVol = ch.mute ? 0 : ch.volume;
      bus.gain.gain.setTargetAtTime(effectiveVol, this.ctx.currentTime, 0.01);
      bus.panner.pan.setTargetAtTime(ch.pan, this.ctx.currentTime, 0.01);
    });
  }

  /**
   * Real-time trigger note for live keyboard auditioning
   */
  public triggerNoteOn(channel: InstrumentChannel, midiNote: number, velocity: number = 0.8) {
    this.resumeContext();
    const effectiveNote = midiNote + (channel.octaveOffset * 12);
    const voiceKey = `${channel.id}_${effectiveNote}`;

    // Stop existing voice on this note if playing
    this.triggerNoteOff(channel, midiNote);

    const bus = this.channelBuses.get(channel.id);
    const destination = bus ? bus.panner : this.dspRack.inputNode;

    if (channel.type === 'soundfont') {
      const voice = this.soundFontManager.playNote(destination, effectiveNote, channel.preset, velocity);
      this.activeVoices.set(voiceKey, voice);
    } else {
      // Game Boy DMG / Chip Synth
      const waveform = (channel.preset as any) || 'pulse_50';
      const voice: ActiveVoice = playChipVoice(this.ctx, destination, effectiveNote, {
        waveform,
        velocity,
        attack: channel.attack,
        decay: channel.decay,
        sustain: channel.sustain,
        release: channel.release,
        sweepAmount: channel.sweepAmount,
        vibratoDepth: channel.vibratoDepth,
        vibratoSpeed: channel.vibratoSpeed
      });
      this.activeVoices.set(voiceKey, voice);
    }
  }

  public triggerNoteOff(channel: InstrumentChannel, midiNote: number, releaseTime: number = 0.05) {
    const effectiveNote = midiNote + (channel.octaveOffset * 12);
    const voiceKey = `${channel.id}_${effectiveNote}`;
    const voice = this.activeVoices.get(voiceKey);
    if (voice) {
      voice.stop(releaseTime);
      this.activeVoices.delete(voiceKey);
    }
  }

  public stopAllVoices() {
    // 1. Stop active interactive keyboard/mouse voices
    this.activeVoices.forEach(v => {
      try { v.stop(0.02); } catch {}
    });
    this.activeVoices.clear();

    // 2. Stop all sequencer scheduled voices
    this.scheduledVoices.forEach(v => {
      try { v.stop(0.02); } catch {}
    });
    this.scheduledVoices.clear();

    // 3. Stop all soundfont voices
    this.soundFontManager.stopAllVoices();
  }

  /**
   * Transport Controls: Play, Stop, BPM
   */
  public updateProject(project: ProjectState) {
    this.activeProject = project;
    this.currentBpm = project.bpm;
  }

  public play(project: ProjectState, mode: 'pattern' | 'song' = 'pattern') {
    this.resumeContext();
    if (this.isPlaying) return;

    this.activeProject = project;
    this.playbackMode = mode;
    this.currentBpm = project.bpm;
    this.isPlaying = true;
    this.notifyPlaybackChange(true);

    this.playbackStartTime = this.ctx.currentTime + 0.05;
    this.nextStepTime = this.playbackStartTime;
    this.currentSchedulerStep = 0;
    this.currentStep = 0;

    this.startScheduler();
  }

  public stop() {
    this.isPlaying = false;
    this.notifyPlaybackChange(false);
    if (this.scheduleTimerId !== null) {
      cancelAnimationFrame(this.scheduleTimerId);
      this.scheduleTimerId = null;
    }
    this.stopAllVoices();
    this.dspRack.clearReverb(); // Instantly kill any lingering reverb/delay tail
    this.currentStep = 0;
    this.notifyStepChange(0);
  }

  private startScheduler() {
    const scheduleAheadSec = 0.1; // Schedule notes 100ms in advance for zero jitter

    const tick = () => {
      if (!this.isPlaying || !this.activeProject) return;

      const secondsPerBeat = 60.0 / this.currentBpm;
      const secondsPerStep = secondsPerBeat / 4.0; // 16th note step

      // Determine loop bounds
      let loopStart = 0;
      let loopLen = 64;

      if (this.playbackMode === 'pattern') {
        const pat = this.getActivePattern();
        loopLen = pat?.lengthSteps || 64;
      } else {
        const songMax = this.getSongMaxSteps();
        const hasCustomLoop = this.activeProject.loopLengthSteps > 0 && this.activeProject.loopLengthSteps < songMax;
        loopStart = hasCustomLoop ? this.activeProject.loopStartStep : 0;
        loopLen = hasCustomLoop ? this.activeProject.loopLengthSteps : songMax;
      }
      const loopEnd = loopStart + loopLen;

      // Ensure scheduler starts inside bounds
      if (this.currentSchedulerStep >= loopEnd) {
        this.currentSchedulerStep = loopStart;
      }

      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadSec) {
        this.scheduleStepNotes(this.currentSchedulerStep, this.nextStepTime);
        this.nextStepTime += secondsPerStep;
        this.currentSchedulerStep++;
        if (this.currentSchedulerStep >= loopEnd) {
          this.currentSchedulerStep = loopStart;
        }
      }

      // Smooth, hardware-accurate audible playhead position
      if (this.ctx.currentTime >= this.playbackStartTime) {
        const elapsedSec = this.ctx.currentTime - this.playbackStartTime;
        const totalStepsElapsed = Math.floor(elapsedSec / secondsPerStep);

        let visualStep = 0;
        if (totalStepsElapsed < loopStart) {
          visualStep = totalStepsElapsed;
        } else {
          visualStep = loopStart + ((totalStepsElapsed - loopStart) % loopLen);
        }
        this.currentStep = visualStep;
        this.notifyStepChange(visualStep);
      } else {
        this.currentStep = 0;
        this.notifyStepChange(0);
      }

      this.scheduleTimerId = requestAnimationFrame(tick);
    };

    this.scheduleTimerId = requestAnimationFrame(tick);
  }

  private getActivePattern(): Pattern | undefined {
    if (!this.activeProject) return undefined;
    return this.activeProject.patterns.find(p => p.id === this.activeProject?.activePatternId) || this.activeProject.patterns[0];
  }

  private getSongMaxSteps(): number {
    if (!this.activeProject || this.activeProject.timelineClips.length === 0) return 64;
    let max = 64;
    this.activeProject.timelineClips.forEach(c => {
      const end = c.startStep + c.lengthSteps;
      if (end > max) max = end;
    });
    return max;
  }

  private scheduleStepNotes(step: number, when: number) {
    if (!this.activeProject) return;

    if (this.playbackMode === 'pattern') {
      const pattern = this.getActivePattern();
      if (!pattern) return;

      this.activeProject.channels.forEach(channel => {
        if (channel.mute) return;
        const notes = pattern.notesByChannel[channel.id] || [];
        notes.forEach(n => {
          if (n.step === step) {
            this.scheduleNotePlayback(channel, n, when);
          }
        });
      });
    } else {
      // Song Arrangement Mode
      const tracks = this.activeProject.tracks;
      const anyTrackSolo = tracks.some(t => t.solo);

      this.activeProject.timelineClips.forEach(clip => {
        if (clip.muted) return;

        // Check track mute / solo
        const track = tracks[clip.trackIndex];
        if (track) {
          if (track.mute) return;
          if (anyTrackSolo && !track.solo) return;
        }

        if (step >= clip.startStep && step < clip.startStep + clip.lengthSteps) {
          const pattern = this.activeProject?.patterns.find(p => p.id === clip.patternId);
          if (pattern) {
            const patLen = pattern.lengthSteps || 64;
            const internalStep = (step - clip.startStep) % patLen;

            this.activeProject?.channels.forEach(channel => {
              if (channel.mute) return;
              const notes = pattern.notesByChannel[channel.id] || [];
              notes.forEach(n => {
                if (n.step === internalStep) {
                  const trackVol = track ? track.volume : 1.0;
                  this.scheduleNotePlayback(channel, n, when, trackVol);
                }
              });
            });
          }
        }
      });
    }
  }

  private scheduleNotePlayback(channel: InstrumentChannel, note: NoteEvent, when: number, volumeModifier: number = 1.0) {
    const effectiveNote = note.note + (channel.octaveOffset * 12);
    const bus = this.channelBuses.get(channel.id);
    const destination = bus ? bus.panner : this.dspRack.inputNode;
    const durationSeconds = (note.duration * (60.0 / this.currentBpm)) / 4.0;
    const finalVelocity = Math.max(0.01, Math.min(1.0, note.velocity * volumeModifier));

    let voice: { stop: (rel?: number) => void } | null = null;
    if (channel.type === 'soundfont') {
      voice = this.soundFontManager.playNote(destination, effectiveNote, channel.preset, finalVelocity, when, durationSeconds);
    } else {
      const waveform = (channel.preset as any) || 'pulse_50';
      voice = playChipVoice(this.ctx, destination, effectiveNote, {
        waveform,
        velocity: finalVelocity,
        attack: channel.attack,
        decay: channel.decay,
        sustain: channel.sustain,
        release: channel.release,
        sweepAmount: channel.sweepAmount,
        vibratoDepth: channel.vibratoDepth,
        vibratoSpeed: channel.vibratoSpeed
      }, when, durationSeconds);
    }

    if (voice) {
      this.scheduledVoices.add(voice);
      // Automatically prune from tracking set after note completes
      setTimeout(() => {
        if (voice) this.scheduledVoices.delete(voice);
      }, (durationSeconds + 1.0) * 1000);
    }
  }

  public onStepChange(cb: (step: number) => void): () => void {
    this.onStepChangeCallbacks.add(cb);
    return () => {
      this.onStepChangeCallbacks.delete(cb);
    };
  }

  public onPlaybackChange(cb: (playing: boolean) => void): () => void {
    this.onPlaybackStateCallbacks.add(cb);
    return () => {
      this.onPlaybackStateCallbacks.delete(cb);
    };
  }

  private notifyStepChange(step: number) {
    this.onStepChangeCallbacks.forEach(cb => cb(step));
  }

  private notifyPlaybackChange(playing: boolean) {
    this.onPlaybackStateCallbacks.forEach(cb => cb(playing));
  }
}
