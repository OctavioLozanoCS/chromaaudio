import React, { useState } from 'react';
import { Download, X, Layers, Music, Disc, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { ProjectState, Pattern } from '../../types/audio';
import { AudioExporter } from '../../export/AudioExporter';

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
      setExportStatus('Synthesizing full multi-track song offline...');
      const blob = await AudioExporter.renderSongToWav(project);
      const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_song.wav`;
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

  // 2. Export Active Pattern
  const handleExportPattern = async () => {
    try {
      setIsExporting(true);
      setExportStatus(`Synthesizing pattern "${activePattern.name}" offline...`);
      const blob = await AudioExporter.renderPatternToWav(project, activePattern);
      const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_${activePattern.name.toLowerCase().replace(/\s+/g, '_')}.wav`;
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

  // 3. Export Stems (Batch individual WAV files)
  const handleExportStems = async () => {
    try {
      setIsExporting(true);
      const activeChannels = project.channels.filter(ch => !ch.mute);
      for (let i = 0; i < activeChannels.length; i++) {
        const ch = activeChannels[i];
        setExportStatus(`Rendering stem ${i + 1}/${activeChannels.length}: ${ch.name}...`);
        const blob = await AudioExporter.renderChannelStem(project, ch.id, 'song');
        const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_stem_${ch.name.toLowerCase().replace(/\s+/g, '_')}.wav`;
        AudioExporter.downloadBlob(blob, filename);
        // Short pause between downloads to let browser handle files
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-gray-100 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Game Audio Exporter</h2>
              <p className="text-xs text-gray-400">16-bit 44.1kHz PCM WAV with GameMaker & Godot Loop Tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Loop Tag Metadata Banner */}
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs font-mono flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span>RIFF 'smpl' LOOP TAGS:</span>
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
            GameMaker's <code className="text-gray-400">audio_play_sound</code> and Godot's audio stream player read these sample points for seamless zero-gap looping.
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
        <div className="flex flex-col gap-3">
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
                  Export Full Song Arrangement (.wav)
                </div>
                <div className="text-xs text-gray-400">
                  Renders all timeline tracks, clips, and looped sections into a master track.
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-emerald-400" />
          </button>

          {/* Option 2: Active Pattern */}
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
                  Export Active Pattern "{activePattern.name}" (.wav)
                </div>
                <div className="text-xs text-gray-400">
                  Quick export of the currently active piano roll pattern ({activePattern.lengthSteps} steps).
                </div>
              </div>
            </div>
            <Download size={16} className="text-gray-500 group-hover:text-indigo-400" />
          </button>

          {/* Option 3: Individual Channel Stems */}
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
                  Export Individual Stems ({project.channels.filter(c => !c.mute).length} Channels)
                </div>
                <div className="text-xs text-gray-400">
                  Renders each channel as a separate isolated WAV for dynamic in-game layered music.
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
