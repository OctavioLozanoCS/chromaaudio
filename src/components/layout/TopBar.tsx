import React, { useRef } from 'react';
import { Play, Square, Download, Save, FolderOpen, Volume2, Sparkles, Sliders, Music, Layers, FilePlus, Edit2, Mic } from 'lucide-react';
import { NOTE_NAMES, SCALES } from '../pianoroll/ScaleEngine';

interface TopBarProps {
  isPlaying: boolean;
  bpm: number;
  playbackMode: 'pattern' | 'song';
  activeTab: 'pianoroll' | 'timeline' | 'sfx' | 'dsp' | 'voice';
  snapGrid: number;
  scaleRoot: number;
  scaleMode: string;
  typingOctave: number;
  projectName?: string;
  onChangeProjectName?: (name: string) => void;
  onNewProject?: () => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onChangeBpm: (bpm: number) => void;
  onToggleMode: (mode: 'pattern' | 'song') => void;
  onSelectTab: (tab: 'pianoroll' | 'timeline' | 'sfx' | 'dsp' | 'voice') => void;
  onChangeSnap: (snap: number) => void;
  onChangeScaleRoot: (root: number) => void;
  onChangeScaleMode: (mode: string) => void;
  onSaveProject: () => void;
  onLoadProjectFile: (file: File) => void;
  onExportWav: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isPlaying,
  bpm,
  playbackMode,
  activeTab,
  snapGrid,
  scaleRoot,
  scaleMode,
  typingOctave,
  projectName,
  onChangeProjectName,
  onNewProject,
  onTogglePlay,
  onStop,
  onChangeBpm,
  onToggleMode,
  onSelectTab,
  onChangeSnap,
  onChangeScaleRoot,
  onChangeScaleMode,
  onSaveProject,
  onLoadProjectFile,
  onExportWav
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProjectFile(file);
      e.target.value = ''; // Reset so same file can be selected again
    }
  };
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-800 text-gray-200 select-none shadow-md z-30">
      {/* Brand & Transport */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-indigo-500/30 shadow-lg">
            <Music size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">ChromaAudio</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">Studio</span>

          {projectName && (
            <div 
              onClick={() => {
                const newName = prompt('Rename project:', projectName);
                if (newName && onChangeProjectName) onChangeProjectName(newName);
              }}
              title="Click to rename project"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 ml-2 bg-gray-900 hover:bg-gray-800 rounded-lg border border-gray-800 text-xs font-mono text-gray-300 cursor-pointer transition-colors"
            >
              <span>{projectName}</span>
              <Edit2 size={11} className="text-gray-500" />
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gray-800" />

        {/* Transport */}
        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button
            onClick={onTogglePlay}
            title="Play / Pause (Space)"
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 shadow-md'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
          >
            <Play size={14} fill={isPlaying ? 'white' : 'currentColor'} />
            <span>{isPlaying ? 'PLAYING' : 'PLAY'}</span>
          </button>

          <button
            onClick={onStop}
            title="Stop Playback"
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Square size={14} fill="currentColor" />
          </button>

          {/* Mode: Pattern vs Song */}
          <div className="flex bg-gray-950 rounded p-0.5 border border-gray-800 text-[11px] font-mono">
            <button
              onClick={() => onToggleMode('pattern')}
              className={`px-2 py-1 rounded transition-colors ${
                playbackMode === 'pattern' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              PAT
            </button>
            <button
              onClick={() => onToggleMode('song')}
              className={`px-2 py-1 rounded transition-colors ${
                playbackMode === 'song' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              SONG
            </button>
          </div>
        </div>

        {/* BPM Selector */}
        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-lg border border-gray-800">
          <span className="text-[11px] font-mono text-gray-400">BPM</span>
          <input
            type="number"
            min="40"
            max="260"
            value={bpm}
            onChange={(e) => onChangeBpm(Math.max(40, Math.min(260, parseInt(e.target.value) || 120)))}
            className="w-12 bg-transparent text-xs font-mono font-bold text-indigo-400 focus:outline-none"
          />
        </div>

        {/* Snap Selector */}
        <div className="flex items-center gap-1.5 bg-gray-900 px-2 py-1 rounded-lg border border-gray-800 text-xs">
          <span className="text-[10px] font-mono text-gray-400">SNAP</span>
          <select
            value={snapGrid}
            onChange={(e) => onChangeSnap(parseFloat(e.target.value))}
            className="bg-transparent text-xs font-mono text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value={4} className="bg-gray-900">1/4 (Beat)</option>
            <option value={2} className="bg-gray-900">1/8 (Step)</option>
            <option value={1} className="bg-gray-900">1/16 (16th)</option>
            <option value={0.5} className="bg-gray-900">1/32 (32nd)</option>
          </select>
        </div>

        {/* Scale Highlighting Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 text-xs">
          <span className="text-[10px] font-mono text-indigo-400">KEY</span>
          <select
            value={scaleRoot}
            onChange={(e) => onChangeScaleRoot(parseInt(e.target.value))}
            className="bg-transparent text-xs font-mono text-gray-200 focus:outline-none cursor-pointer"
          >
            {NOTE_NAMES.map((n, i) => (
              <option key={n} value={i} className="bg-gray-900">{n}</option>
            ))}
          </select>

          <select
            value={scaleMode}
            onChange={(e) => onChangeScaleMode(e.target.value)}
            className="bg-transparent text-xs font-mono text-gray-300 focus:outline-none cursor-pointer"
          >
            {Object.values(SCALES).map(s => (
              <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Tabs: Views */}
      <div className="flex items-center bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-medium">
        <button
          onClick={() => onSelectTab('pianoroll')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'pianoroll' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Music size={14} />
          <span>Piano Roll</span>
        </button>

        <button
          onClick={() => onSelectTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'timeline' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers size={14} />
          <span>Arranger</span>
        </button>

        <button
          onClick={() => onSelectTab('sfx')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'sfx' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles size={14} />
          <span>SFX Lab</span>
        </button>

        <button
          onClick={() => onSelectTab('voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'voice' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Mic size={14} />
          <span>Voice Lab</span>
        </button>

        <button
          onClick={() => onSelectTab('dsp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'dsp' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders size={14} />
          <span>Console DSP</span>
        </button>
      </div>

      {/* Right Controls: Octave Indicator & Project Actions */}
      <div className="flex items-center gap-3">
        {/* Typing Keyboard Octave hint */}
        <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-gray-900 rounded-lg border border-gray-800 text-[11px] font-mono text-gray-400">
          <span>PIANO:</span>
          <span className="text-emerald-400 font-bold">C{typingOctave}</span>
          <span className="text-gray-500 text-[9px]">(Z/X)</span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".chroma,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {onNewProject && (
          <button
            onClick={onNewProject}
            title="Create New Blank Audio Project"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded transition-colors"
          >
            <FilePlus size={14} />
            <span className="hidden sm:inline">New</span>
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Open .chroma Project File"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded transition-colors"
        >
          <FolderOpen size={14} />
          <span className="hidden sm:inline">Open</span>
        </button>

        <button
          onClick={onSaveProject}
          title="Save .chroma Project File"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded transition-colors"
        >
          <Save size={14} />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={onExportWav}
          title="Export CD-Quality 16-bit WAV with Loop Tags"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded shadow-md transition-all"
        >
          <Download size={14} />
          <span>Export WAV</span>
        </button>
      </div>
    </header>
  );
};
