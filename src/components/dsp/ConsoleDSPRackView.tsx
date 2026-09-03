import React from 'react';
import { DSPConfig } from '../../types/audio';
import { Sliders, Radio, Activity, Waves } from 'lucide-react';

interface ConsoleDSPRackViewProps {
  dsp: DSPConfig;
  onUpdateDSP: (dsp: DSPConfig) => void;
}

export const ConsoleDSPRackView: React.FC<ConsoleDSPRackViewProps> = ({
  dsp,
  onUpdateDSP
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-900 p-6 overflow-y-auto text-gray-200 select-none">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
            <Sliders size={20} />
            Vintage Console DSP Rack
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Authentic Game Boy Advance, Nintendo DS, and SNES hardware downsamplers and spatial effects
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
          <span className="text-xs font-semibold text-gray-400">DSP MASTER:</span>
          <button
            onClick={() => onUpdateDSP({ ...dsp, enabled: !dsp.enabled })}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              dsp.enabled ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {dsp.enabled ? 'ENGAGED' : 'BYPASSED'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* 1. GBA / DS Resampler & Bitcrusher */}
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-sky-400">
              <Radio size={16} />
              GBA / DS Resampler
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800">
              Hardware Clock
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1.5">Sample Rate Decimation</label>
              <select
                value={dsp.resampleRate}
                onChange={(e) => onUpdateDSP({ ...dsp, resampleRate: parseInt(e.target.value) })}
                className="w-full text-xs font-mono bg-gray-900 border border-gray-800 rounded px-2.5 py-2 text-gray-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value={8000}>8,000 Hz (Lo-Fi Gritty)</option>
                <option value={16000}>16,000 Hz (Classic GBA Mid)</option>
                <option value={18157}>18,157 Hz (Native GBA DirectSound)</option>
                <option value={22050}>22,050 Hz (Retro Standard)</option>
                <option value={32000}>32,000 Hz (Native Nintendo DS)</option>
                <option value={44100}>44,100 Hz (Clean Modern CD)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1.5">Bit Depth Quantization</label>
              <select
                value={dsp.bitDepth}
                onChange={(e) => onUpdateDSP({ ...dsp, bitDepth: parseInt(e.target.value) })}
                className="w-full text-xs font-mono bg-gray-900 border border-gray-800 rounded px-2.5 py-2 text-gray-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value={4}>4-Bit (Nintendo DS ADPCM Crunch)</option>
                <option value={8}>8-Bit (GBA DirectSound Signed PCM)</option>
                <option value={12}>12-Bit (Early 90s Vintage Sampler)</option>
                <option value={16}>16-Bit (Clean Unquantized)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. SNES / PS1 Console Reverb */}
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
              <Waves size={16} />
              SNES / PSX Reverb
            </h3>
            <button
              onClick={() => onUpdateDSP({ ...dsp, reverbEnabled: !dsp.reverbEnabled })}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                dsp.reverbEnabled ? 'bg-amber-600 text-black' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {dsp.reverbEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                <span>Mix (Wet / Dry)</span>
                <span className="text-amber-300">{Math.round(dsp.reverbWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={dsp.reverbWet}
                onChange={(e) => onUpdateDSP({ ...dsp, reverbWet: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-800 rounded appearance-none accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                <span>Room Decay</span>
                <span className="text-amber-300">{dsp.reverbDecay.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.5"
                step="0.1"
                value={dsp.reverbDecay}
                onChange={(e) => onUpdateDSP({ ...dsp, reverbDecay: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-800 rounded appearance-none accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Master Resonant Analog Filter */}
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Activity size={16} />
              Resonant Lowpass Filter
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Warm Tone
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                <span>Cutoff Frequency</span>
                <span className="text-emerald-300">{dsp.filterCutoff} Hz</span>
              </div>
              <input
                type="range"
                min="400"
                max="20000"
                step="200"
                value={dsp.filterCutoff}
                onChange={(e) => onUpdateDSP({ ...dsp, filterCutoff: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-800 rounded appearance-none accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                <span>Resonance (Q)</span>
                <span className="text-emerald-300">{dsp.filterResonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.5"
                value={dsp.filterResonance}
                onChange={(e) => onUpdateDSP({ ...dsp, filterResonance: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-800 rounded appearance-none accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
