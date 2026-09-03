/**
 * Vintage Console DSP Rack
 * 100% Native Web Audio C++ DSP (Zero ScriptProcessor latency / Zero main-thread underruns):
 * - WaveShaper bit-depth quantizer (4-bit, 8-bit, 12-bit, 16-bit)
 * - Hardware Clock band-limiting filter (GBA 18.157kHz, NDS 32kHz)
 * - SPC700 SNES / PSX Stereo Feedback Reverb
 * - Resonant Multi-mode Analog Filter
 * - Clean zero-latency bypass path
 */

import { DSPConfig } from '../types/audio';

function createBitQuantizerCurve(bitDepth: number): Float32Array<ArrayBuffer> {
  const n = 65536;
  const buffer = new ArrayBuffer(n * 4);
  const curve = new Float32Array(buffer);
  const stepCount = Math.pow(2, Math.max(2, Math.min(16, bitDepth)));
  const stepSize = 2.0 / stepCount;

  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2.0 - 1.0; // Normalized -1.0 to +1.0
    curve[i] = Math.floor((x + 1.0) / stepSize) * stepSize - 1.0;
  }
  return curve;
}

export class ConsoleDSPRack {
  private ctx: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;

  // Bypass routing
  private directBypassGain: GainNode;
  private dspEngageGain: GainNode;

  // Native Bitcrusher (WaveShaperNode runs in C++ on real-time audio thread)
  private bitQuantizer: WaveShaperNode;
  // Hardware Clock Decimation Filter
  private resampleFilter: BiquadFilterNode;

  // Resonant Master Tone Filter
  private biquadFilter: BiquadFilterNode;

  // Retro Reverb Network (SPC700 SNES / PSX style)
  private delayNodeL: DelayNode;
  private delayNodeR: DelayNode;
  private delayFeedbackL: GainNode;
  private delayFeedbackR: GainNode;
  private delayFilter: BiquadFilterNode;
  private delayFilterFeedbackSum: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  private config: DSPConfig;

  constructor(ctx: AudioContext, initialConfig: DSPConfig) {
    this.ctx = ctx;
    this.config = { ...initialConfig };

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    this.directBypassGain = ctx.createGain();
    this.dspEngageGain = ctx.createGain();

    // 1. Native Bitcrusher & Resampler Filter
    this.bitQuantizer = ctx.createWaveShaper();
    this.bitQuantizer.curve = createBitQuantizerCurve(this.config.bitDepth);
    this.bitQuantizer.oversample = 'none';

    this.resampleFilter = ctx.createBiquadFilter();
    this.resampleFilter.type = 'lowpass';
    this.resampleFilter.frequency.value = Math.min(20000, this.config.resampleRate / 2);

    // 2. Resonant Master Tone Filter
    this.biquadFilter = ctx.createBiquadFilter();
    this.biquadFilter.type = 'lowpass';
    this.biquadFilter.frequency.value = this.config.filterCutoff;
    this.biquadFilter.Q.value = this.config.filterResonance;

    // 3. Retro Reverb Network
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.delayNodeL = ctx.createDelay(1.0);
    this.delayNodeR = ctx.createDelay(1.0);
    this.delayFeedbackL = ctx.createGain();
    this.delayFeedbackR = ctx.createGain();
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilterFeedbackSum = ctx.createGain();

    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 3200; // Classic retro muffled dampening

    this.delayNodeL.delayTime.value = 0.11;
    this.delayNodeR.delayTime.value = 0.17;
    this.delayFeedbackL.gain.value = 0.35;
    this.delayFeedbackR.gain.value = 0.35;

    // Reverb loop connections:
    // Scale summing node by 0.5 to prevent energy compounding runaway
    this.delayFilterFeedbackSum.gain.value = 0.5;

    this.delayNodeL.connect(this.delayFilter);
    this.delayNodeR.connect(this.delayFilter);
    this.delayFilter.connect(this.wetGain);

    this.delayFilter.connect(this.delayFilterFeedbackSum);
    this.delayFilterFeedbackSum.connect(this.delayFeedbackL);
    this.delayFilterFeedbackSum.connect(this.delayFeedbackR);
    this.delayFeedbackL.connect(this.delayNodeR);
    this.delayFeedbackR.connect(this.delayNodeL);

    // Audio Graph Routing:
    // 1) Direct Bypass: inputNode -> directBypassGain -> outputNode
    this.inputNode.connect(this.directBypassGain);
    this.directBypassGain.connect(this.outputNode);

    // 2) DSP Path: inputNode -> dspEngageGain -> bitQuantizer -> resampleFilter -> biquadFilter -> (dry + wet) -> outputNode
    this.inputNode.connect(this.dspEngageGain);
    this.dspEngageGain.connect(this.bitQuantizer);
    this.bitQuantizer.connect(this.resampleFilter);
    this.resampleFilter.connect(this.biquadFilter);

    this.biquadFilter.connect(this.dryGain);
    this.biquadFilter.connect(this.delayNodeL);
    this.biquadFilter.connect(this.delayNodeR);

    this.dryGain.connect(this.outputNode);
    this.wetGain.connect(this.outputNode);

    this.updateConfig(this.config);
  }

  public updateConfig(newConfig: DSPConfig) {
    this.config = { ...newConfig };
    const now = this.ctx.currentTime;

    // Bypass crossfade (click-free)
    if (this.config.enabled) {
      this.directBypassGain.gain.setTargetAtTime(0.0, now, 0.01);
      this.dspEngageGain.gain.setTargetAtTime(1.0, now, 0.01);

      // Update bitcrusher curve
      this.bitQuantizer.curve = createBitQuantizerCurve(this.config.bitDepth);
      // Update hardware clock decimation frequency
      const cutoff = Math.min(20000, Math.max(2000, this.config.resampleRate / 2));
      this.resampleFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
    } else {
      this.directBypassGain.gain.setTargetAtTime(1.0, now, 0.01);
      this.dspEngageGain.gain.setTargetAtTime(0.0, now, 0.01);
    }

    // Update Filter
    this.biquadFilter.frequency.setTargetAtTime(this.config.filterCutoff, now, 0.02);
    this.biquadFilter.Q.setTargetAtTime(this.config.filterResonance, now, 0.02);

    // Update Reverb
    const wet = this.config.reverbEnabled ? this.config.reverbWet : 0.0;
    const dry = 1.0 - (wet * 0.3);
    this.wetGain.gain.setTargetAtTime(wet, now, 0.02);
    this.dryGain.gain.setTargetAtTime(dry, now, 0.02);

    // Feedback strictly limited so loop gain can never exceed 0.68 (no runaway howling)
    const feedback = Math.min(0.68, Math.max(0.05, this.config.reverbDecay * 0.16));
    this.delayFeedbackL.gain.setTargetAtTime(feedback, now, 0.02);
    this.delayFeedbackR.gain.setTargetAtTime(feedback, now, 0.02);
  }

  /**
   * Instantly silence reverb ring and flush delay lines (called on stop/pause)
   */
  public clearReverb() {
    const now = this.ctx.currentTime;
    this.delayFeedbackL.gain.cancelScheduledValues(now);
    this.delayFeedbackL.gain.setValueAtTime(0, now);
    this.delayFeedbackR.gain.cancelScheduledValues(now);
    this.delayFeedbackR.gain.setValueAtTime(0, now);

    // Restore configured feedback after delay lines drain
    setTimeout(() => {
      const restoreNow = this.ctx.currentTime;
      const feedback = Math.min(0.68, Math.max(0.05, this.config.reverbDecay * 0.16));
      this.delayFeedbackL.gain.setTargetAtTime(feedback, restoreNow, 0.02);
      this.delayFeedbackR.gain.setTargetAtTime(feedback, restoreNow, 0.02);
    }, 200);
  }

  public getConfig(): DSPConfig {
    return { ...this.config };
  }
}
