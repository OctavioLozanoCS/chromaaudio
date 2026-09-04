import React, { useState } from 'react';
import { Download, X, Layers, Music, Disc, CheckCircle2, Loader2, Sparkles, Scissors, Repeat } from 'lucide-react';
import { ProjectState, Pattern } from '../../types/audio';
import { AudioExporter, ExportAudioFormat } from '../../export/AudioExporter';

interface ExportModalProps {
  isOpen: boolean;
  project: ProjectState;
  activePattern: Pattern;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  project,
  activePattern,
  onClose
}) => {
  const [format, setFormat] = useState<ExportAudioFormat>('wav');
  const [oggQuality, setOggQuality] = useState<number>(0.85);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const secondsPerStep = (60.0 / project.bpm) / 4.0;
  const loopStartSample = Math.floor(project.loopStartStep * secondsPerStep * 44100);
  const loopLengthSamples = Math.floor(project.loopLengthSteps * secondsPerStep * 44100);

  // 1. Export Full Song
  const handleExportSong = async () => {
    try {
      setIsExporting(true);
      setExportStatus(`Synthesizing full multi-track song offline (${format.toUpperCase()})...`);
      const blob = await AudioExporter.renderSong(project, format, 44100, oggQuality);
      const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_song.${format}`;
      AudioExporter.downloadBlob(blob, filename);
      setExportStatus(`Exported ${filename} successfully!`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setExportStatus(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Split Intro & Loop Files
  const handleExportSplitIntroLoop = async () => {
    try {
      setIsExporting(true);
      setExportStatus(`Rendering separate Intro & Loop ${format.toUpperCase()} files...`);
      const result = await AudioExporter.renderIntroAndLoop(project, format, 44100, oggQuality);
      const baseName = project.name.toLowerCase().replace(/\s+/g, '_');

      if (result.hasIntro && result.introBlob) {
        AudioExporter.downloadBlob(result.introBlob, `${baseName}_intro.${format}`);
        await new Promise(r => setTimeout(r, 300));
      }
      AudioExporter.downloadBlob(result.loopBlob, `${baseName}_loop.${format}`);

      setExportStatus(
        result.hasIntro
          ? `Exported ${baseName}_intro.${format} and ${baseName}_loop.${format} successfully!`
          : `Loop starts at step 0: Exported ${baseName}_loop.${format} successfully!`
      );
      setTimeout(() => setExportStatus(null), 3500);
    } catch (err: any) {
      console.error(err);
      setExportStatus(`Split export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Export Seamless Loop with Tail Spillover
  const handleExportSeamlessLoop = async () => {
    try {
      setIsExporting(true);
      setExportStatus(`Synthesizing seamless loop with acoustic tail spillover (${format.toUpperCase()})...`);
      const blob = await AudioExporter.renderSeamlessLoopWithTail(project, format, 44100, oggQuality);
      const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_seamless_loop.${format}`;
      AudioExporter.downloadBlob(blob, filename);
      setExportStatus(`Exported ${filename} (zero-gap tail spillover) successfully!`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setExportStatus(`Seamless loop export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Export Active Pattern
  const handleExportPattern = async () => {
    try {
      setIsExporting(true);
      setExportStatus(`Synthesizing pattern "${activePattern.name}" offline (${format.toUpperCase()})...`);
      const blob = await AudioExporter.renderPattern(project, activePattern, format, 44100, oggQuality);
      const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_${activePattern.name.toLowerCase().replace(/\s+/g, '_')}.${format}`;
      AudioExporter.downloadBlob(blob, filename);
      setExportStatus(`Exported ${filename} successfully!`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setExportStatus(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Export Stems (Batch individual files)
  const handleExportStems = async () => {
    try {
      setIsExporting(true);
      const activeChannels = project.channels.filter(ch => !ch.mute);
      for (let i = 0; i < activeChannels.length; i++) {
        const ch = activeChannels[i];
        setExportStatus(`Rendering stem ${i + 1}/${activeChannels.length}: ${ch.name} (${format.toUpperCase()})...`);
        const blob = await AudioExporter.renderChannelStem(project, ch.id, 'song', format, 44100, oggQuality);
        const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_stem_${ch.name.toLowerCase().replace(/\s+/g, '_')}.${format}`;
        AudioExporter.downloadBlob(blob, filename);
        await new Promise(r => setTimeout(r, 400));
      }
      setExportStatus(`Exported ${activeChannels.length} stems successfully!`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setExportStatus(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Game Audio Exporter</h2>
              <p className="text-xs text-gray-400">
                {format === 'wav'
                  ? '16-bit 44.1kHz PCM WAV with GameMaker & Godot Loop Tags'
                  : 'Ogg Vorbis Compressed Audio with GameMaker & Godot Vorbis Comments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Toggle */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 px-0.5">
            <span>Audio Format:</span>
            <span className="text-[11px] font-mono text-gray-500">
              {format === 'wav' ? 'Uncompressed / Instant Playback' : 'Compressed / Streaming Ready'}
            </span>
          </div>
          <div className="grid grid-cols-2 p-1 bg-gray-950 rounded-xl border border-gray-800 gap-1.5">
            <button
              type="button"
              onClick={() => setFormat('wav')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                format === 'wav'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
              }`}
            >
              <span>WAV (.wav)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${format === 'wav' ? 'bg-emerald-700/80 text-emerald-100' : 'bg-gray-800 text-gray-400'}`}>
                16-bit PCM
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('ogg')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                format === 'ogg'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
              }`}
            >
              <span>OGG (.ogg)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${format === 'ogg' ? 'bg-cyan-700/80 text-cyan-100' : 'bg-gray-800 text-gray-400'}`}>
                Vorbis Stream
              </span>
            </button>
          </div>
        </div>

        {/* OGG Vorbis Quality Selector */}
        {format === 'ogg' && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-950/70 rounded-xl border border-gray-800 text-xs">
            <span className="text-gray-400 font-medium">Vorbis Quality:</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              {[
                { label: 'Standard (0.6)', val: 0.6 },
                { label: 'High (0.85)', val: 0.85 },
                { label: 'Studio (1.0)', val: 1.0 }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setOggQuality(opt.val)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    oggQuality === opt.val
                      ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loop Tag Metadata Banner */}
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs font-mono flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span>
              {format === 'wav' ? "RIFF 'smpl' LOOP TAGS:" : "VORBIS COMMENT LOOP TAGS:"}
            </span>
            <span className="text-emerald-400 font-bold">EMBEDDED NATIVELY</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
            <div>
              <span className="text-gray-500">LOOPSTART: </span>
              <span className="text-amber-400 font-semibold">{loopStartSample.toLocaleString()} samples</span>
            </div>
            <div>
              <span className="text-gray-500">LOOPLENGTH: </span>
              <span className="text-amber-400 font-semibold">{loopLengthSamples.toLocaleString()} samples</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500">
            {format === 'wav'
              ? "GameMaker's audio_play_sound and Godot's audio stream player read these sample points for seamless zero-gap looping."
              : "GameMaker's audio_play_sound and Godot read these Vorbis comment tags for seamless streaming background music."}
          </p>
        </div>

        {/* Status indicator */}
        {exportStatus && (
          <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-300">
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            <span>{exportStatus}</span>
          </div>
        )}

        {/* Export Options */}
        <div className="flex flex-col gap-2.5">
          {/* Option 1: Full Song Arrangement */}
          <button
            onClick={handleExportSong}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/80 hover:border-emerald-500/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <Music size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                  Export Full Song Arrangement (.{format})
                </div>
                <div className="text-xs text-gray-400">
                  Renders entire song with embedded {format === 'wav' ? "RIFF 'smpl'" : "Vorbis Comment"} loop metadata for GameMaker & Godot.
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-emerald-400" />
          </button>

          {/* Option 2: Split Intro & Loop Files */}
          <button
            onClick={handleExportSplitIntroLoop}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/80 hover:border-amber-500/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Scissors size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                  <span>Export Split Intro & Loop {format.toUpperCase()}s</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">Game Ready</span>
                </div>
                <div className="text-xs text-gray-400">
                  Exports <code className="text-amber-300">intro.{format}</code> (0 to {project.loopStartStep}) and <code className="text-amber-300">loop.{format}</code> ({project.loopLengthSteps} steps) for engines requiring two-part transitions.
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-amber-400" />
          </button>

          {/* Option 3: Seamless Loop (Tail Spillover) */}
          <button
            onClick={handleExportSeamlessLoop}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/80 hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                <Repeat size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                  <span>Export Seamless Loop (Tail Spillover)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">Zero Seam</span>
                </div>
                <div className="text-xs text-gray-400">
                  Folds trailing reverb/delay ring from the end back into the start for zero audible seams (.{format}).
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-cyan-400" />
          </button>

          {/* Option 4: Active Pattern */}
          <button
            onClick={handleExportPattern}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/80 hover:border-indigo-500/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                <Disc size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">
                  Export Active Pattern "{activePattern.name}" (.{format})
                </div>
                <div className="text-xs text-gray-400">
                  Quick export of the currently active piano roll pattern ({activePattern.lengthSteps} steps).
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-indigo-400" />
          </button>

          {/* Option 5: Individual Channel Stems */}
          <button
            onClick={handleExportStems}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/80 hover:border-purple-500/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                <Layers size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-purple-300 transition-colors">
                  Export Individual Stems ({project.channels.filter(c => !c.mute).length} Channels) (.{format})
                </div>
                <div className="text-xs text-gray-400">
                  Renders each channel as a separate isolated file for dynamic in-game layered music.
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-purple-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
