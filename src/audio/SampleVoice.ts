/**
 * Pitched Sample Playback Engine
 * Plays audio buffers (vocal snippets, dialogue grains, drum samples) mapped across MIDI pitches (C4 / 60 base)
 * with full ADSR volume envelope and gain scaling.
 */

export class SampleManager {
  private static buffers: Map<string, AudioBuffer> = new Map();

  public static registerSample(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }

  public static getSample(id: string): AudioBuffer | undefined {
    return this.buffers.get(id);
  }

  public static hasSample(id: string): boolean {
    return this.buffers.has(id);
  }
}

export interface SampleVoiceParams {
  velocity?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  baseNote?: number; // Base pitch (default 60 = C4)
}

export function playSampleVoice(
  ctx: BaseAudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  midiNote: number,
  params: SampleVoiceParams = {},
  startTime?: number,
  duration?: number
): { stop: (releaseTime?: number) => void } {
  const now = startTime !== undefined ? startTime : ctx.currentTime;
  const baseNote = params.baseNote ?? 60;
  const velocity = params.velocity ?? 0.8;
  const attack = Math.max(0.002, params.attack ?? 0.005);
  const decay = Math.max(0.01, params.decay ?? 0.2);
  const sustain = Math.max(0.0, Math.min(1.0, params.sustain ?? 0.8));
  const release = Math.max(0.02, params.release ?? 0.1);

  // Pitch calculation: C4 (60) is normal 1.0x speed
  const semitoneOffset = midiNote - baseNote;
  const playbackRate = Math.max(0.125, Math.min(8.0, Math.pow(2, semitoneOffset / 12)));

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(playbackRate, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(velocity, now + attack);
  gain.gain.linearRampToValueAtTime(velocity * sustain, now + attack + decay);

  source.connect(gain);
  gain.connect(destination);

  source.start(now);

  const effectiveDuration = duration !== undefined ? duration : (buffer.duration / playbackRate);
  if (effectiveDuration > 0) {
    const stopTime = now + effectiveDuration;
    gain.gain.setValueAtTime(velocity * sustain, stopTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + release);
    source.stop(stopTime + release + 0.05);
  }

  return {
    stop: (rel?: number) => {
      const r = rel !== undefined ? rel : release;
      const stopNow = ctx.currentTime;
      gain.gain.cancelScheduledValues(stopNow);
      gain.gain.setValueAtTime(gain.gain.value, stopNow);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopNow + r);
      source.stop(stopNow + r + 0.05);
    }
  };
}
