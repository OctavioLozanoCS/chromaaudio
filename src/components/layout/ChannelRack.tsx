import React from 'react';
import { InstrumentChannel } from '../../types/audio';
import { Plus, Volume2, VolumeX, Trash2 } from 'lucide-react';

interface ChannelRackProps {
  channels: InstrumentChannel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onUpdateChannel: (channel: InstrumentChannel) => void;
  onAddChannel: () => void;
  onDeleteChannel: (id: string) => void;
}

export const ChannelRack: React.FC<ChannelRackProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onUpdateChannel,
  onAddChannel,
  onDeleteChannel
}) => {
  return (
    <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full select-none z-20">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 bg-gray-950">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Channels</span>
        <button
          onClick={onAddChannel}
          title="Add New Channel"
          className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-medium transition-colors"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {channels.map((channel) => {
          const isSelected = channel.id === activeChannelId;

          return (
            <div
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gray-800 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-gray-950/70 border-gray-800/80 hover:bg-gray-800/60 hover:border-gray-700'
              }`}
            >
              {/* Header: Color Swatch + Name + Mute/Solo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: channel.color }}
                  />
                  <span className="text-xs font-bold text-gray-200 truncate">
                    {channel.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateChannel({ ...channel, mute: !channel.mute });
                    }}
                    className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition-colors ${
                      channel.mute ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateChannel({ ...channel, solo: !channel.solo });
                    }}
                    className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition-colors ${
                      channel.solo ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Preset Selector */}
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <select
                  value={channel.preset}
                  onChange={(e) => {
                    const preset = e.target.value;
                    const type = preset.startsWith('gm_') ? 'soundfont' : 'chip_synth';
                    onUpdateChannel({ ...channel, preset, type });
                  }}
                  className="w-full text-[11px] font-mono bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <optgroup label="Game Boy DMG Oscillators">
                    <option value="pulse_12">GB Pulse 12.5% (Sharp Lead)</option>
                    <option value="pulse_25">GB Pulse 25% (Classic Chiptune)</option>
                    <option value="pulse_50">GB Pulse 50% (Square Wave)</option>
                    <option value="pulse_75">GB Pulse 75% (Hollow Tone)</option>
                    <option value="wave_ram">GB Wave RAM (4-bit Warm Bass)</option>
                    <option value="noise">GB LFSR Noise (Hi-hat / Snare)</option>
                    <option value="triangle">NES Triangle (Warm Bass / Flute)</option>
                  </optgroup>
                  <optgroup label="GBA & Retro SoundFonts">
                    <option value="gm_grand_piano">🎹 GBA Grand Piano</option>
                    <option value="gm_romantic_strings">🎻 Touhou Romantic Strings</option>
                    <option value="gm_slap_bass">🎸 Funk Slap Bass</option>
                    <option value="gm_bright_brass">🎺 Toby Fox Bright Brass</option>
                    <option value="gm_overdrive_guitar">⚡ Megalovania Overdrive Lead</option>
                    <option value="gm_retro_choir">✨ 16-Bit Aahs Choir</option>
                    <option value="gm_gba_percussion">🥁 Retro 90s Drum Kit</option>
                  </optgroup>
                </select>
              </div>

              {/* Sliders: Vol & Pan */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-mono" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span>VOL</span>
                    <span>{Math.round(channel.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={channel.volume}
                    onChange={(e) => onUpdateChannel({ ...channel, volume: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-gray-800 rounded appearance-none accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="w-16">
                  <div className="flex justify-between mb-0.5">
                    <span>PAN</span>
                    <span>{channel.pan > 0 ? `R${Math.round(channel.pan * 100)}` : channel.pan < 0 ? `L${Math.round(-channel.pan * 100)}` : 'C'}</span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={channel.pan}
                    onChange={(e) => onUpdateChannel({ ...channel, pan: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-gray-800 rounded appearance-none accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
