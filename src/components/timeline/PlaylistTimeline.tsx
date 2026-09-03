import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TimelineClip, TimelineTrack, Pattern } from '../../types/audio';
import { AudioEngine } from '../../audio/AudioEngine';
import { 
  Volume2, VolumeX, Headphones, Scissors, MoveRight, 
  Plus, Copy, Trash2, Edit2, RotateCcw, Sparkles, Layers 
} from 'lucide-react';

interface PlaylistTimelineProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  patterns: Pattern[];
  activePatternId: string;
  loopStartStep: number;
  loopLengthSteps: number;
  onUpdateTracks: (tracks: TimelineTrack[]) => void;
  onUpdateClips: (clips: TimelineClip[]) => void;
  onUpdateLoop: (start: number, length: number) => void;
  onSelectActivePattern: (patternId: string) => void;
  onCreatePattern: () => void;
  onDuplicatePattern: (patternId: string) => void;
  onRenamePattern: (patternId: string, newName: string) => void;
  onDeletePattern: (patternId: string) => void;
}

export const PlaylistTimeline: React.FC<PlaylistTimelineProps> = ({
  tracks,
  clips,
  patterns,
  activePatternId,
  loopStartStep,
  loopLengthSteps,
  onUpdateTracks,
  onUpdateClips,
  onUpdateLoop,
  onSelectActivePattern,
  onCreatePattern,
  onDuplicatePattern,
  onRenamePattern,
  onDeletePattern
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const trackHeaderWidth = 150;
  const trackHeight = 48;
  const rulerHeight = 32;
  const [stepWidth, setStepWidth] = useState<number>(8); // 8px per 16th step (128px per bar)
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  const [playheadStep, setPlayheadStep] = useState<number>(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(1400);

  // Interaction dragging state
  const isDragging = useRef<boolean>(false);
  const dragType = useRef<'move' | 'resize' | 'loop_start' | 'loop_end' | null>(null);
  const draggedClip = useRef<TimelineClip | null>(null);
  const dragStartOffset = useRef<{ x: number; originalStart: number; originalTrack: number; originalLen: number }>({
    x: 0, originalStart: 0, originalTrack: 0, originalLen: 64
  });

  const audioEngine = AudioEngine.getInstance();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      if (container.clientWidth > 0) {
        setCanvasWidth(container.clientWidth);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const unsub = audioEngine.onStepChange((step) => {
      setPlayheadStep(step);
    });
    return unsub;
  }, [audioEngine]);

  const maxSteps = 384; // 24 bars timeline view

  // Render Timeline Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Top Time Ruler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(trackHeaderWidth, 0, width - trackHeaderWidth, rulerHeight);

    // Loop Region Overlay on Ruler
    const loopX1 = trackHeaderWidth + loopStartStep * stepWidth - scrollLeft;
    const loopX2 = trackHeaderWidth + (loopStartStep + loopLengthSteps) * stepWidth - scrollLeft;

    if (loopX2 > trackHeaderWidth && loopX1 < width) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; // Radiant Amber loop zone
      ctx.fillRect(Math.max(trackHeaderWidth, loopX1), 0, Math.min(width, loopX2) - Math.max(trackHeaderWidth, loopX1), height);

      // Loop start & end markers on ruler
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(loopX1, 0, 4, rulerHeight);
      ctx.fillRect(loopX2 - 4, 0, 4, rulerHeight);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText('LOOP START', loopX1 + 6, 12);
      ctx.fillText('LOOP END', loopX2 - 54, 12);
    }

    // Ruler Bars and Step Ticks
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';

    for (let s = 0; s <= maxSteps; s += 4) {
      const x = trackHeaderWidth + s * stepWidth - scrollLeft;
      if (x < trackHeaderWidth || x > width) continue;

      const isBar = s % 16 === 0;
      const barNum = Math.floor(s / 16) + 1;

      ctx.beginPath();
      ctx.moveTo(x, isBar ? 0 : rulerHeight / 2);
      ctx.lineTo(x, rulerHeight);
      ctx.stroke();

      if (isBar) {
        ctx.fillText(`BAR ${barNum}`, x + 4, 24);
      }
    }

    // 2. Draw Track Lanes & Grid
    tracks.forEach((track, idx) => {
      const y = rulerHeight + idx * trackHeight;
      const isEven = idx % 2 === 0;

      // Track Lane Background
      ctx.fillStyle = isEven ? '#0a0d14' : '#0f141f';
      ctx.fillRect(trackHeaderWidth, y, width - trackHeaderWidth, trackHeight);

      // Horizontal Track Separator
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trackHeaderWidth, y + trackHeight);
      ctx.lineTo(width, y + trackHeight);
      ctx.stroke();

      // Vertical Bar Grid Lines
      for (let s = 0; s <= maxSteps; s += 16) {
        const x = trackHeaderWidth + s * stepWidth - scrollLeft;
        if (x < trackHeaderWidth || x > width) continue;

        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + trackHeight);
        ctx.stroke();
      }
    });

    // 3. Draw Pattern & Audio Clips
    clips.forEach(clip => {
      const y = rulerHeight + clip.trackIndex * trackHeight;
      const x = trackHeaderWidth + clip.startStep * stepWidth - scrollLeft;
      const w = clip.lengthSteps * stepWidth;

      if (x + w < trackHeaderWidth || x > width || y + trackHeight < 0 || y > height) return;

      const isSelected = selectedClipId === clip.id;
      const pattern = patterns.find(p => p.id === clip.patternId);
      const clipName = clip.name || pattern?.name || 'Pattern';

      // Clip Box Body
      const gradient = ctx.createLinearGradient(x, y, x, y + trackHeight);
      gradient.addColorStop(0, isSelected ? '#6366f1' : '#3730a3');
      gradient.addColorStop(1, isSelected ? '#4338ca' : '#1e1b4b');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y + 2, w - 2, trackHeight - 4, 4);
      ctx.fill();

      // Clip Border
      ctx.strokeStyle = isSelected ? '#a5b4fc' : '#4f46e5';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Mini Note Preview Blocks inside clip
      if (pattern) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const patLen = pattern.lengthSteps || 64;
        const noteScaleY = (trackHeight - 16) / 48;

        Object.values(pattern.notesByChannel).forEach(channelNotes => {
          channelNotes.forEach(n => {
            const repetitions = Math.ceil(clip.lengthSteps / patLen);
            for (let r = 0; r < repetitions; r++) {
              const miniStep = r * patLen + n.step;
              if (miniStep < clip.lengthSteps) {
                const nx = x + miniStep * stepWidth;
                const nw = Math.max(3, n.duration * stepWidth - 1);
                const ny = y + trackHeight - 6 - ((n.note % 48) * noteScaleY);
                if (nx + nw <= x + w - 2) {
                  ctx.fillRect(nx, ny, nw, 2.5);
                }
              }
            }
          });
        });
      }

      // Clip Title Banner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(clipName, x + 6, y + 15);

      // Right edge resize handle
      ctx.fillStyle = isSelected ? '#c7d2fe' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + w - 5, y + 6, 2, trackHeight - 12);
    });

    // 4. Synchronized Playhead Line
    const playheadX = trackHeaderWidth + playheadStep * stepWidth - scrollLeft;
    if (playheadX >= trackHeaderWidth && playheadX <= width) {
      ctx.save();
      ctx.strokeStyle = '#ef4444'; // Red Playhead
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead triangle marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [
    tracks, clips, patterns, selectedClipId, playheadStep, loopStartStep, loopLengthSteps,
    stepWidth, scrollLeft, maxSteps, trackHeaderWidth, trackHeight, rulerHeight
  ]);

  useEffect(() => {
    render();
  }, [render]);

  // Slice selected clip at playhead (REAPER style 'S' key)
  const handleSliceClip = useCallback(() => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    const sliceStep = Math.floor(playheadStep);
    if (sliceStep <= clip.startStep || sliceStep >= clip.startStep + clip.lengthSteps) return;

    const firstHalfLen = sliceStep - clip.startStep;
    const secondHalfLen = clip.lengthSteps - firstHalfLen;

    const firstHalf: TimelineClip = {
      ...clip,
      lengthSteps: firstHalfLen
    };

    const secondHalf: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startStep: sliceStep,
      lengthSteps: secondHalfLen
    };

    onUpdateClips(clips.map(c => c.id === clip.id ? firstHalf : c).concat(secondHalf));
  }, [selectedClipId, clips, playheadStep, onUpdateClips]);

  // Keyboard Shortcuts (REAPER style 'S' for slice, Delete/Backspace for erase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 's' || e.key === 'S') {
        handleSliceClip();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          onUpdateClips(clips.filter(c => c.id !== selectedClipId));
          setSelectedClipId(null);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      isDragging.current = false;
      dragType.current = null;
      draggedClip.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleSliceClip, selectedClipId, clips, onUpdateClips]);

  // Canvas Mouse Down: Scrubbing, Clip Selection, Moving, Resizing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (x < trackHeaderWidth) return;

    // Click on Top Ruler: Scrub Playhead or Drag Loop
    if (y < rulerHeight) {
      const rawStep = (x - trackHeaderWidth + scrollLeft) / stepWidth;
      audioEngine.currentStep = Math.max(0, Math.floor(rawStep));
      setPlayheadStep(audioEngine.currentStep);
      return;
    }

    const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
    if (trackIndex < 0 || trackIndex >= tracks.length) return;

    const clickedStep = Math.max(0, Math.floor((x - trackHeaderWidth + scrollLeft) / stepWidth));
    const barSnappedStep = Math.floor(clickedStep / 16) * 16;

    // Check if clicked an existing clip
    const clickedClip = clips.find(c => 
      c.trackIndex === trackIndex && 
      clickedStep >= c.startStep && 
      clickedStep < c.startStep + c.lengthSteps
    );

    // Right-click: Delete clip instantly (FL Studio Ergonomics)
    if (e.button === 2) {
      if (clickedClip) {
        onUpdateClips(clips.filter(c => c.id !== clickedClip.id));
        if (selectedClipId === clickedClip.id) setSelectedClipId(null);
      }
      return;
    }

    // Left-click on existing clip
    if (clickedClip) {
      setSelectedClipId(clickedClip.id);
      draggedClip.current = clickedClip;
      isDragging.current = true;

      const clipPixelX = trackHeaderWidth + clickedClip.startStep * stepWidth - scrollLeft;
      const clipPixelW = clickedClip.lengthSteps * stepWidth;
      const isNearRightEdge = (x - clipPixelX) > (clipPixelW - 12);

      dragType.current = isNearRightEdge ? 'resize' : 'move';
      dragStartOffset.current = {
        x,
        originalStart: clickedClip.startStep,
        originalTrack: clickedClip.trackIndex,
        originalLen: clickedClip.lengthSteps
      };
    } else {
      // Place new pattern block on timeline
      const pat = patterns.find(p => p.id === activePatternId) || patterns[0];
      const newClip: TimelineClip = {
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        trackIndex,
        startStep: barSnappedStep,
        lengthSteps: pat.lengthSteps || 64,
        patternId: pat.id,
        name: pat.name,
        color: '#4f46e5',
        muted: false
      };
      onUpdateClips([...clips, newClip]);
      setSelectedClipId(newClip.id);
    }
  };

  // Canvas Mouse Move: Drag to move or stretch clip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !draggedClip.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (dragType.current === 'resize') {
      const stepDelta = Math.round(((x - dragStartOffset.current.x) / stepWidth) / 16) * 16;
      const newLen = Math.max(16, dragStartOffset.current.originalLen + stepDelta);
      if (newLen !== draggedClip.current.lengthSteps) {
        onUpdateClips(clips.map(c => c.id === draggedClip.current?.id ? { ...c, lengthSteps: newLen } : c));
      }
    } else if (dragType.current === 'move') {
      const stepDelta = Math.round(((x - dragStartOffset.current.x) / stepWidth) / 16) * 16;
      const newStart = Math.max(0, dragStartOffset.current.originalStart + stepDelta);
      const newTrack = Math.max(0, Math.min(tracks.length - 1, Math.floor((y - rulerHeight) / trackHeight)));

      if (newStart !== draggedClip.current.startStep || newTrack !== draggedClip.current.trackIndex) {
        onUpdateClips(clips.map(c => c.id === draggedClip.current?.id ? { ...c, startStep: newStart, trackIndex: newTrack } : c));
      }
    }
  };

  const handleCanvasMouseUp = () => {
    isDragging.current = false;
    dragType.current = null;
    draggedClip.current = null;
  };

  // Add new track
  const handleAddTrack = () => {
    const newTrack: TimelineTrack = {
      id: `track_${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      color: '#6366f1',
      volume: 1.0,
      pan: 0,
      mute: false,
      solo: false
    };
    onUpdateTracks([...tracks, newTrack]);
  };

  // Set Loop Presets
  const setLoopBars = (bars: number) => {
    onUpdateLoop(0, bars * 16);
  };

  const handleLoopAll = () => {
    let max = 64;
    clips.forEach(c => {
      const end = c.startStep + c.lengthSteps;
      if (end > max) max = end;
    });
    onUpdateLoop(0, max);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 select-none overflow-hidden text-gray-200">
      {/* Pattern Selector & Timeline Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs gap-4 z-20">
        {/* Pattern Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-mono text-gray-400 font-semibold mr-1 flex items-center gap-1">
            <Layers size={13} className="text-indigo-400" />
            PATTERNS:
          </span>
          {patterns.map((pat, idx) => {
            const isActive = pat.id === activePatternId;
            return (
              <div
                key={pat.id}
                onClick={() => onSelectActivePattern(pat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border-gray-700'
                }`}
              >
                <span>{pat.name}</span>
                {isActive && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt('Rename pattern:', pat.name);
                        if (newName) onRenamePattern(pat.id, newName);
                      }}
                      title="Rename Pattern"
                      className="p-0.5 hover:bg-indigo-700 rounded"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePattern(pat.id);
                      }}
                      title="Duplicate Pattern"
                      className="p-0.5 hover:bg-indigo-700 rounded"
                    >
                      <Copy size={11} />
                    </button>
                    {patterns.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete pattern "${pat.name}"?`)) {
                            onDeletePattern(pat.id);
                          }
                        }}
                        title="Delete Pattern"
                        className="p-0.5 hover:bg-indigo-700 rounded text-red-300 hover:text-red-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={onCreatePattern}
            title="Create New Pattern"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 font-mono text-xs border border-gray-700 hover:border-indigo-500 transition-colors ml-1"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        </div>

        {/* Loop Controls & Slicing */}
        <div className="flex items-center gap-2">
          {/* Quick Loop Bar Presets */}
          <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800 font-mono text-[10px]">
            <span className="text-gray-500 px-1.5 font-semibold">LOOP:</span>
            <button onClick={() => setLoopBars(2)} className="px-2 py-0.5 rounded hover:bg-gray-800 text-gray-300">2B</button>
            <button onClick={() => setLoopBars(4)} className="px-2 py-0.5 rounded hover:bg-gray-800 text-gray-300">4B</button>
            <button onClick={() => setLoopBars(8)} className="px-2 py-0.5 rounded hover:bg-gray-800 text-gray-300">8B</button>
            <button onClick={handleLoopAll} className="px-2 py-0.5 rounded hover:bg-gray-800 text-amber-400 font-bold">ALL</button>
          </div>

          <button
            onClick={handleSliceClip}
            title="Slice Selected Clip at Playhead (S)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-indigo-300 rounded-lg border border-gray-700 hover:border-indigo-500 text-xs font-semibold transition-colors"
          >
            <Scissors size={13} />
            <span>Slice (S)</span>
          </button>

          <button
            onClick={handleAddTrack}
            title="Add New Timeline Track"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
          >
            <Plus size={13} />
            <span>Track</span>
          </button>
        </div>
      </div>

      {/* Main Playlist View: Left Track Headers + Right Timeline Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track Headers Column (REAPER Style) */}
        <div 
          className="flex flex-col border-r border-gray-800 bg-gray-900 z-10 shadow-lg"
          style={{ width: trackHeaderWidth }}
        >
          <div 
            className="flex items-center justify-between px-3 border-b border-gray-800 bg-gray-950 text-xs font-mono text-gray-400"
            style={{ height: rulerHeight }}
          >
            <span>TRACKS</span>
            <span className="text-[10px] text-gray-500">{tracks.length} Total</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="flex flex-col justify-center px-3 border-b border-gray-800/80 bg-gray-900 hover:bg-gray-850 transition-colors"
                style={{ height: trackHeight }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate text-gray-200">{track.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const updated = tracks.map((t, i) => i === idx ? { ...t, mute: !t.mute } : t);
                        onUpdateTracks(updated);
                      }}
                      title="Mute Track"
                      className={`p-1 rounded ${track.mute ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      {track.mute ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button
                      onClick={() => {
                        const updated = tracks.map((t, i) => i === idx ? { ...t, solo: !t.solo } : t);
                        onUpdateTracks(updated);
                      }}
                      title="Solo Track"
                      className={`p-1 rounded ${track.solo ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      <Headphones size={12} />
                    </button>
                  </div>
                </div>

                {/* Track Volume Slider */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={track.volume}
                    onChange={(e) => {
                      const updated = tracks.map((t, i) => i === idx ? { ...t, volume: parseFloat(e.target.value) } : t);
                      onUpdateTracks(updated);
                    }}
                    className="w-full accent-indigo-500 h-1 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-gray-400 w-6 text-right">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-x-auto overflow-y-hidden bg-gray-950"
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={rulerHeight + tracks.length * trackHeight}
            className="cursor-pointer block"
            onContextMenu={e => e.preventDefault()}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
        </div>
      </div>
    </div>
  );
};
