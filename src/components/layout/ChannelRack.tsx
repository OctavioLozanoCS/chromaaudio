import React, { useRef, useState, useEffect } from 'react';
import { InstrumentChannel, Pattern, InstrumentType } from '../../types/audio';
import { Plus, Volume2, VolumeX, Trash2, Upload, Music, Sparkles, Eraser } from 'lucide-react';
import { AudioEngine } from '../../audio/AudioEngine';
import { ParsedSoundFontPreset } from '../../audio/SoundFontParser';

interface ChannelRackProps {
  channels: InstrumentChannel[];
  activeChannelId: string;
  patterns?: Pattern[];
  activePatternId?: string;
  onSelectChannel: (id: string) => void;
  onUpdateChannel: (channel: InstrumentChannel) => void;
  onExclusiveSoloChannel?: (id: string) => void;
  onAddChannel: () => void;
  onDeleteChannel: (id: string) => void;
  onClearChannelNotes?: (channelId: string, patternId?: string) => void;
}

export const ChannelRack: React.FC<ChannelRackProps> = ({
  channels,
  activeChannelId,
  patterns,
  activePatternId,
  onSelectChannel,
  onUpdateChannel,
  onExclusiveSoloChannel,
  onAddChannel,
  onDeleteChannel,
  onClearChannelNotes
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioEngine = AudioEngine.getInstance();
  const [customPresets, setCustomPresets] = useState<ParsedSoundFontPreset[]>(() => 
    audioEngine.soundFontManager.getCustomPresets()
  );
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [openMenuChannelId, setOpenMenuChannelId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuChannelId(null);
    };
    if (openMenuChannelId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [openMenuChannelId]);

  useEffect(() => {
    const unsub = audioEngine.soundFontManager.onPresetsChanged(() => {
      setCustomPresets(audioEngine.soundFontManager.getCustomPresets());
    });
    return unsub;
  }, [audioEngine]);

  const handlePresetChange = (channel: InstrumentChannel, newPreset: string) => {
    const type: InstrumentType = (newPreset.startsWith('gm_') || newPreset.startsWith('sf2_') || newPreset.startsWith('custom_wav_'))
      ? 'soundfont'
      : (newPreset.startsWith('fm_') ? 'fm_synth' : 'chip_synth');

    const updatedChannel: InstrumentChannel = {
      ...channel,
      preset: newPreset,
      type
    };

    // 1. Select this channel as the active channel
    onSelectChannel(channel.id);

    // 2. Update channel in project state
    onUpdateChannel(updatedChannel);

    // 3. Immediately stop ringing voices and update audio engine channels
    audioEngine.stopAllVoices();
    audioEngine.updateChannels(channels.map(c => c.id === channel.id ? updatedChannel : c));

    // 4. Play an instant audition preview note (C4 = 60) for 350ms
    try {
      audioEngine.triggerNoteOn(updatedChannel, 60, 0.85);
      setTimeout(() => {
        audioEngine.triggerNoteOff(updatedChannel, 60, 0.08);
      }, 350);
    } catch {}
  };

  const handleSoundFontImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportMessage(`Importing ${file.name}...`);
      const loaded = await audioEngine.soundFontManager.importSoundFontFile(file);
      setImportMessage(`Loaded ${loaded.length} instrument(s) from ${file.name}!`);
      setTimeout(() => setImportMessage(null), 3500);

      // Auto-assign first imported instrument to currently selected channel and audition it
      if (loaded.length > 0) {
        const activeCh = channels.find(c => c.id === activeChannelId) || channels[0];
        if (activeCh) {
          handlePresetChange(activeCh, loaded[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setImportMessage(`Import failed: ${err.message}`);
      setTimeout(() => setImportMessage(null), 4000);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full select-none z-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSoundFontImport}
        accept=".sf2,.wav,.wave,.mp3,.ogg"
        className="hidden"
      />

      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 bg-gray-950">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Channels</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import SoundFont 2 (.sf2) or WAV Sample"
            className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white border border-gray-700 rounded font-medium transition-colors"
          >
            <Upload size={12} />
            <span>SF2 / Sample</span>
          </button>
          <button
            onClick={onAddChannel}
            title="Add New Channel"
            className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-medium transition-colors"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="px-3 py-1.5 bg-indigo-950 border-b border-indigo-800/60 text-[11px] font-mono text-indigo-300 truncate">
          {importMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {channels.map((channel) => {
          const isSelected = channel.id === activeChannelId;
          const activePattern = patterns?.find(p => p.id === activePatternId) || patterns?.[0];
          const activeNoteCount = activePattern?.notesByChannel[channel.id]?.length || 0;
          const otherPatterns = (patterns || []).filter(p => p.id !== activePattern?.id);
          const totalNotesAllPatterns = (patterns || []).reduce(
            (sum, p) => sum + (p.notesByChannel[channel.id]?.length || 0), 0
          );

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
              {/* Header: Color Swatch + Name + Note Count + Clear/Mute/Solo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: channel.color }}
                  />
                  <span className="text-xs font-bold text-gray-200 truncate">
                    {channel.name}
                  </span>
                  <span
                    title={`${activeNoteCount} note(s) in active pattern "${activePattern?.name || 'Pattern'}"`}
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 transition-colors ${
                      activeNoteCount > 0
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 font-semibold'
                        : 'text-gray-600 border-gray-800'
                    }`}
                  >
                    {activeNoteCount}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Clear Channel Notes Button & Dropdown */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setOpenMenuChannelId(openMenuChannelId === channel.id ? null : channel.id);
                      }}
                      title={`Clear notes in any pattern... (${activeNoteCount} notes in current pattern)`}
                      className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition-all ${
                        openMenuChannelId === channel.id
                          ? 'bg-red-600 text-white shadow-sm'
                          : (activeNoteCount > 0
                              ? 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-300'
                              : 'bg-gray-800 text-gray-600 hover:text-gray-400')
                      }`}
                    >
                      <Eraser size={11} />
                    </button>

                    {/* Clear Notes Popover Menu */}
                    {openMenuChannelId === channel.id && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 py-1 text-xs font-mono">
                        <div className="px-2.5 py-1 text-[10px] text-gray-400 font-bold border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
                          <span>CLEAR NOTES</span>
                          <span className="text-indigo-400 truncate max-w-[90px]">{channel.name}</span>
                        </div>

                        {/* Current Pattern */}
                        {activePattern && (
                          <button
                            onClick={() => {
                              onClearChannelNotes?.(channel.id, activePattern.id);
                              setOpenMenuChannelId(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200 hover:text-red-300 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Eraser size={11} className="text-red-400 shrink-0" />
                              <span className="truncate">Current: {activePattern.name}</span>
                            </div>
                            <span className={`text-[10px] px-1 rounded ${activeNoteCount > 0 ? 'bg-indigo-900/60 text-indigo-300 font-semibold' : 'text-gray-500'}`}>
                              {activeNoteCount}
                            </span>
                          </button>
                        )}

                        {/* Other Patterns (if any) */}
                        {otherPatterns.length > 0 && (
                          <>
                            <div className="px-2.5 py-0.5 text-[9px] text-gray-500 uppercase font-semibold mt-1 border-t border-gray-800 bg-gray-950/30">
                              In Other Patterns:
                            </div>
                            {otherPatterns.map(pat => {
                              const count = pat.notesByChannel[channel.id]?.length || 0;
                              return (
                                <button
                                  key={pat.id}
                                  onClick={() => {
                                    onClearChannelNotes?.(channel.id, pat.id);
                                    setOpenMenuChannelId(null);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-300 hover:text-red-300 transition-colors"
                                >
                                  <span className="truncate ml-4">{pat.name}</span>
                                  <span className={`text-[10px] px-1 rounded ${count > 0 ? 'bg-indigo-900/40 text-indigo-300' : 'text-gray-500'}`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </>
                        )}

                        {/* Clear across all patterns */}
                        {patterns && patterns.length > 1 && (
                          <div className="border-t border-gray-800 mt-1 pt-1">
                            <button
                              onClick={() => {
                                if (confirm(`Clear all ${totalNotesAllPatterns} notes across ALL ${patterns.length} patterns for ${channel.name}?`)) {
                                  onClearChannelNotes?.(channel.id, 'all');
                                }
                                setOpenMenuChannelId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-red-500/20 flex items-center justify-between text-red-400 font-semibold transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <Trash2 size={11} className="text-red-400" />
                                <span>Clear All Patterns</span>
                              </div>
                              <span className="text-[10px] text-red-300 font-semibold">
                                {totalNotesAllPatterns}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                      if ((e.ctrlKey || e.altKey || e.metaKey) && onExclusiveSoloChannel) {
                        onExclusiveSoloChannel(channel.id);
                      } else {
                        onUpdateChannel({ ...channel, solo: !channel.solo });
                      }
                    }}
                    title="Solo Channel (Ctrl+Click for Exclusive Solo)"
                    className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition-all ${
                      channel.solo ? 'bg-amber-500 text-black font-extrabold shadow-sm shadow-amber-500/40 scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
                  onChange={(e) => handlePresetChange(channel, e.target.value)}
                  className="w-full text-[11px] font-mono bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {customPresets.length > 0 && (
                    <optgroup label={`📦 Imported Instruments (${customPresets.length})`}>
                      {customPresets.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="⚡ FM Synthesis (Sega Genesis / Industrial)">
                    <option value="fm_solid_bass">⚡ Sega Solid Bass (YM2612)</option>
                    <option value="fm_metallic_growl">🦾 Industrial Grinding Mech Bass</option>
                    <option value="fm_industrial_lead">⚡ Alien Machine FM Lead</option>
                    <option value="fm_metallic_chime">🔔 Metallic Anvil & Chime</option>
                    <option value="fm_electric_piano">🎹 Vintage FM Electric Piano (DX7)</option>
                    <option value="fm_dark_drone">🕳️ Deep Industrial Sub Drone</option>
                  </optgroup>
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
