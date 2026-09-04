import React, { useState, useEffect, useRef } from 'react';
import { Play, Download, Sparkles, Volume2, PlusCircle, Check } from 'lucide-react';
import { AudioEngine } from '../../audio/AudioEngine';
import { InstrumentChannel } from '../../types/audio';
import { AudioExporter, ExportAudioFormat } from '../../export/AudioExporter';

export interface SFXParams {
  waveform: 'square' | 'triangle' | 'sine' | 'noise';
  startFreq: number; // Hz
  endFreq: number; // Hz
  duration: number; // seconds
  attack: number; // seconds
  decay: number; // seconds
  punch: number; // volume punch
}

interface ProceduralSFXGeneratorProps {
  onAddChannel?: (channel: InstrumentChannel) => void;
}

export const ProceduralSFXGenerator: React.FC<ProceduralSFXGeneratorProps> = ({
  onAddChannel
}) => {
  const [params, setParams] = useState<SFXParams>({
    waveform: 'square',
    startFreq: 440,
    endFreq: 880,
    duration: 0.25,
    attack: 0.005,
    decay: 0.2,
    punch: 1.0
  });

  const [exportFormat, setExportFormat] = useState<ExportAudioFormat>('wav');
  const [isExporting, setIsExporting] = useState(false);
  const [addedToRack, setAddedToRack] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioEngine = AudioEngine.getInstance();

  // Render Oscilloscope / Waveform Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // CRT Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center baseline
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Waveform Trace
    ctx.strokeStyle = '#38bdf8'; // Glowing cyan
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = w;
    for (let i = 0; i < points; i++) {
      const progress = i / points;
      const t = progress * params.duration;
      const currentFreq = params.startFreq * Math.pow(Math.max(1, params.endFreq) / Math.max(1, params.startFreq), progress);

      let val = 0;
      if (params.waveform === 'noise') {
        val = (Math.sin(i * 12.9898 + currentFreq) * 43758.5453) % 1;
      } else if (params.waveform === 'square') {
        val = Math.sin(2 * Math.PI * currentFreq * t) >= 0 ? 1 : -1;
      } else if (params.waveform === 'triangle') {
        val = 2 * Math.abs(2 * (t * currentFreq - Math.floor(t * currentFreq + 0.5))) - 1;
      } else {
        val = Math.sin(2 * Math.PI * currentFreq * t);
      }

      // Envelope amplitude calculation
      let env = 1;
      if (t < params.attack) {
        env = t / Math.max(0.001, params.attack);
      } else {
        const decayProgress = (t - params.attack) / Math.max(0.001, params.decay);
        env = Math.max(0, 1 - decayProgress);
      }

      const amp = val * env * params.punch * 0.85;
      const y = h / 2 - (amp * (h / 2 - 8));

      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // Frequency & Duration text overlay
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${params.startFreq} Hz → ${params.endFreq} Hz (${params.duration}s)`, 10, 16);
    ctx.fillText(`Wave: ${params.waveform.toUpperCase()}`, w - 110, 16);
  }, [params]);

  const playSFX = (p: SFXParams) => {
    audioEngine.resumeContext();
    const ctx = audioEngine.ctx;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(p.punch * 0.8, now + p.attack);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + p.duration);

    masterGain.connect(audioEngine.masterGain);

    if (p.waveform === 'noise') {
      const bufferSize = Math.floor(ctx.sampleRate * p.duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.max(20, p.startFreq), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, p.endFreq), now + p.duration);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start(now);
      noise.stop(now + p.duration + 0.05);
    } else {
      const osc = ctx.createOscillator();
      osc.type = p.waveform;
      osc.frequency.setValueAtTime(Math.max(20, p.startFreq), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.endFreq), now + p.duration);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + p.duration + 0.05);
    }
  };

  // Preset Generators
  const generateJump = () => {
    const p: SFXParams = {
      waveform: 'square',
      startFreq: 180,
      endFreq: 640,
      duration: 0.22,
      attack: 0.005,
      decay: 0.18,
      punch: 0.9
    };
    setParams(p);
    playSFX(p);
  };

  const generateLaser = () => {
    const p: SFXParams = {
      waveform: 'square',
      startFreq: 880,
      endFreq: 110,
      duration: 0.16,
      attack: 0.002,
      decay: 0.14,
      punch: 0.95
    };
    setParams(p);
    playSFX(p);
  };

  const generateCoin = () => {
    const p: SFXParams = {
      waveform: 'triangle',
      startFreq: 987.77, // B5
      endFreq: 1318.51, // E6
      duration: 0.28,
      attack: 0.005,
      decay: 0.25,
      punch: 0.85
    };
    setParams(p);
    playSFX(p);
  };

  const generateExplosion = () => {
    const p: SFXParams = {
      waveform: 'noise',
      startFreq: 800,
      endFreq: 40,
      duration: 0.45,
      attack: 0.005,
      decay: 0.42,
      punch: 1.0
    };
    setParams(p);
    playSFX(p);
  };

  const generatePowerup = () => {
    const p: SFXParams = {
      waveform: 'square',
      startFreq: 261.63, // C4
      endFreq: 1046.50, // C6
      duration: 0.38,
      attack: 0.01,
      decay: 0.32,
      punch: 0.9
    };
    setParams(p);
    playSFX(p);
  };

  const generateHit = () => {
    const p: SFXParams = {
      waveform: 'square',
      startFreq: 320,
      endFreq: 60,
      duration: 0.12,
      attack: 0.002,
      decay: 0.1,
      punch: 0.95
    };
    setParams(p);
    playSFX(p);
  };

  const generateTextBeep = () => {
    const p: SFXParams = {
      waveform: 'triangle',
      startFreq: 330,
      endFreq: 330,
      duration: 0.04,
      attack: 0.002,
      decay: 0.035,
      punch: 0.7
    };
    setParams(p);
    playSFX(p);
  };

  const randomize = () => {
    const waveforms: ('square' | 'triangle' | 'sine' | 'noise')[] = ['square', 'triangle', 'sine', 'noise'];
    const p: SFXParams = {
      waveform: waveforms[Math.floor(Math.random() * waveforms.length)],
      startFreq: Math.floor(100 + Math.random() * 1200),
      endFreq: Math.floor(40 + Math.random() * 1200),
      duration: parseFloat((0.08 + Math.random() * 0.4).toFixed(2)),
      attack: 0.005,
      decay: parseFloat((0.05 + Math.random() * 0.35).toFixed(2)),
      punch: 0.85
    };
    setParams(p);
    playSFX(p);
  };

  // Render procedural SFX with exact Web Audio parity (including dynamic lowpass filter on noise)
  const renderSFXToAudioBuffer = async (p: SFXParams, sampleRate: number = 44100): Promise<AudioBuffer> => {
    const totalDuration = p.duration + 0.04;
    const totalSamples = Math.max(128, Math.ceil(totalDuration * sampleRate));
    const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, 0);
    masterGain.gain.linearRampToValueAtTime(Math.min(1.0, p.punch * 0.8), p.attack);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, p.duration);
    masterGain.connect(offlineCtx.destination);

    if (p.waveform === 'noise') {
      const bufferSize = Math.floor(sampleRate * p.duration);
      const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = offlineCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.max(20, p.startFreq), 0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, p.endFreq), p.duration);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start(0);
      noise.stop(p.duration + 0.02);
    } else {
      const osc = offlineCtx.createOscillator();
      osc.type = p.waveform;
      osc.frequency.setValueAtTime(Math.max(20, p.startFreq), 0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.endFreq), p.duration);

      osc.connect(masterGain);
      osc.start(0);
      osc.stop(p.duration + 0.02);
    }

    return await offlineCtx.startRendering();
  };

  // Export procedural SFX in WAV or OGG Vorbis
  const handleExportSFX = async (format: ExportAudioFormat = exportFormat) => {
    try {
      setIsExporting(true);
      const buffer = await renderSFXToAudioBuffer(params);
      const blob = await AudioExporter.audioBufferToExportBlob(
        buffer,
        format,
        0,
        0,
        120,
        `SFX ${params.waveform.toUpperCase()}`,
        0.85
      );
      AudioExporter.downloadBlob(blob, `sfx_${params.waveform}_${Date.now()}.${format}`);
    } catch (err) {
      console.error('Failed to export SFX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Send SFX as new channel to project rack
  const handleSendToChannelRack = () => {
    if (!onAddChannel) return;

    const presetType = params.waveform === 'square' ? 'pulse_50' : params.waveform;
    const sweepSemitones = Math.round((params.endFreq - params.startFreq) / 40);

    const newChannel: InstrumentChannel = {
      id: `ch_sfx_${Date.now()}`,
      name: `SFX ${params.waveform.toUpperCase()}`,
      color: '#f59e0b',
      type: 'chip_synth',
      preset: presetType,
      volume: 0.7,
      pan: 0,
      mute: false,
      solo: false,
      octaveOffset: 0,
      attack: params.attack,
      decay: params.decay,
      sustain: 0.05,
      release: 0.1,
      sweepAmount: sweepSemitones
    };

    onAddChannel(newChannel);
    setAddedToRack(true);
    setTimeout(() => setAddedToRack(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 p-6 overflow-y-auto text-gray-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
            <Sparkles size={20} />
            Procedural Retro SFX Generator
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Instant Game Boy & Undertale 8-bit sound effects (sfxr / ChipTone style)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => playSFX(params)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-lg shadow transition-colors"
          >
            <Play size={14} fill="white" />
            Audition
          </button>
          {onAddChannel && (
            <button
              onClick={handleSendToChannelRack}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs rounded-lg shadow transition-all ${
                addedToRack
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {addedToRack ? <Check size={14} /> : <PlusCircle size={14} />}
              <span>{addedToRack ? 'Added to Rack!' : 'Send to Channel Rack'}</span>
            </button>
          )}
          {/* Export Format Selector and Action */}
          <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800">
            <button
              type="button"
              onClick={() => setExportFormat('wav')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                exportFormat === 'wav'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              WAV
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('ogg')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                exportFormat === 'ogg'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              OGG
            </button>
          </div>

          <button
            onClick={() => handleExportSFX(exportFormat)}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold text-xs rounded-lg shadow transition-colors cursor-pointer"
            title={`Export retro sound effect as .${exportFormat}`}
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>{isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Waveform Oscilloscope Display */}
      <div className="my-5 rounded-xl overflow-hidden border border-gray-800 shadow-inner bg-gray-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={140}
          className="w-full h-36 block"
        />
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        <button onClick={generateJump} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          🚀 Jump
        </button>
        <button onClick={generateLaser} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          🔫 Laser
        </button>
        <button onClick={generateCoin} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          🪙 Coin
        </button>
        <button onClick={generateExplosion} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          💥 Explosion
        </button>
        <button onClick={generatePowerup} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          ⚡ Powerup
        </button>
        <button onClick={generateHit} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          ⚔️ Hit / Hurt
        </button>
        <button onClick={generateTextBeep} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-mono text-xs text-center border border-gray-700 hover:border-indigo-500 transition-colors">
          💬 NPC Beep
        </button>
        <button onClick={randomize} className="p-3 bg-indigo-900/60 hover:bg-indigo-800/80 rounded-lg font-mono text-xs text-center border border-indigo-500/60 transition-colors text-indigo-200">
          🎲 Randomize
        </button>
      </div>

      {/* Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-950 p-6 rounded-xl border border-gray-800">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Waveform</label>
          <div className="grid grid-cols-4 gap-2">
            {(['square', 'triangle', 'sine', 'noise'] as const).map(w => (
              <button
                key={w}
                onClick={() => setParams({ ...params, waveform: w })}
                className={`py-2 text-xs font-mono rounded-lg uppercase transition-colors ${
                  params.waveform === w ? 'bg-indigo-600 text-white font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Start Frequency</span>
              <span className="font-mono text-indigo-400">{params.startFreq} Hz</span>
            </div>
            <input
              type="range"
              min="40"
              max="2000"
              value={params.startFreq}
              onChange={e => setParams({ ...params, startFreq: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>End Frequency (Slide)</span>
              <span className="font-mono text-indigo-400">{params.endFreq} Hz</span>
            </div>
            <input
              type="range"
              min="20"
              max="2000"
              value={params.endFreq}
              onChange={e => setParams({ ...params, endFreq: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Total Duration</span>
              <span className="font-mono text-indigo-400">{params.duration}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.5"
              step="0.01"
              value={params.duration}
              onChange={e => setParams({ ...params, duration: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Attack Time</span>
              <span className="font-mono text-indigo-400">{params.attack}s</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.2"
              step="0.001"
              value={params.attack}
              onChange={e => setParams({ ...params, attack: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Decay Time</span>
              <span className="font-mono text-indigo-400">{params.decay}s</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="1.2"
              step="0.01"
              value={params.decay}
              onChange={e => setParams({ ...params, decay: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Volume Punch</span>
              <span className="font-mono text-indigo-400">{params.punch}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={params.punch}
              onChange={e => setParams({ ...params, punch: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
