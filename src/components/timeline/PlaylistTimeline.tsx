import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TimelineClip, TimelineTrack, Pattern } from '../../types/audio';
import { AudioEngine } from '../../audio/AudioEngine';
import { 
  Volume2, VolumeX, Headphones, Scissors, Plus, Copy, Trash2, 
  Edit2, Layers, Pencil, Paintbrush, Eraser, ZoomIn, 
  ZoomOut, Maximize2, Magnet, ChevronsLeft, ChevronLeft, ChevronRight 
} from 'lucide-react';

export type ArrangerTool = 'draw' | 'paint' | 'slice' | 'erase' | 'mute';

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
  const scrollbarTrackRef = useRef<HTMLDivElement | null>(null);

  // Layout constants
  const trackHeaderWidth = 160;
  const trackHeight = 48;
  const rulerHeight = 32;

  // Viewport & Zoom state
  const [stepWidth, setStepWidth] = useState<number>(8); // px per 16th step (128px per bar at 8)
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [canvasWidth, setCanvasWidth] = useState<number>(1400);
  const [canvasHeight, setCanvasHeight] = useState<number>(400);

  // Arranger Tools & Settings
  const [activeTool, setActiveTool] = useState<ArrangerTool>('draw');
  const [snapSteps, setSnapSteps] = useState<number>(16); // Default 1 Bar snap
  const [followPlayhead, setFollowPlayhead] = useState<boolean>(true);

  // Interaction State
  const [playheadStep, setPlayheadStep] = useState<number>(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [hoverSliceInfo, setHoverSliceInfo] = useState<{ clipId: string; sliceStep: number; x: number; y: number; height: number } | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  // Dragging Refs
  const isDragging = useRef<boolean>(false);
  const dragType = useRef<'move' | 'resize' | 'loop_start' | 'loop_end' | 'scrub' | 'pan' | 'paint' | null>(null);
  const draggedClip = useRef<TimelineClip | null>(null);
  const dragStartOffset = useRef<{ x: number; y: number; originalStart: number; originalTrack: number; originalLen: number }>({
    x: 0, y: 0, originalStart: 0, originalTrack: 0, originalLen: 64
  });

  // Scrollbar Dragging Refs
  const isScrollbarDragging = useRef<boolean>(false);
  const scrollbarDragStartX = useRef<number>(0);
  const scrollbarDragStartScroll = useRef<number>(0);

  const audioEngine = AudioEngine.getInstance();

  // Dynamic song length: at least 64 bars (1024 steps), auto-expanding with room for composing
  const furthestClipStep = clips.reduce((max, c) => Math.max(max, c.startStep + c.lengthSteps), 0);
  const furthestLoopStep = loopStartStep + loopLengthSteps;
  const dynamicMaxSteps = Math.max(1024, Math.ceil((Math.max(furthestClipStep, furthestLoopStep) + 256) / 64) * 64);

  const maxScrollLeft = Math.max(0, dynamicMaxSteps * stepWidth - canvasWidth);
  const maxScrollTop = Math.max(0, tracks.length * trackHeight - (canvasHeight - rulerHeight));

  // Responsive Container Sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      if (container.clientWidth > 0) {
        setCanvasWidth(container.clientWidth);
      }
      if (container.clientHeight > 30) {
        setCanvasHeight(container.clientHeight - 28); // Account for 28px bottom scrollbar
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Listen to Audio Engine Playhead
  useEffect(() => {
    const unsub = audioEngine.onStepChange((step) => {
      setPlayheadStep(step);
    });
    return unsub;
  }, [audioEngine]);

  // Follow Playhead during playback
  useEffect(() => {
    if (!followPlayhead) return;
    const px = playheadStep * stepWidth;
    if (px > scrollLeft + canvasWidth - 120 || px < scrollLeft) {
      const target = Math.max(0, Math.min(maxScrollLeft, px - 64));
      setScrollLeft(target);
    }
  }, [playheadStep, followPlayhead, stepWidth, canvasWidth, maxScrollLeft, scrollLeft]);

  // Non-passive Wheel Listener for smooth horizontal navigation & cursor-centered zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom in/out centered around cursor
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const currentStepAtMouse = (mouseX + scrollLeft) / stepWidth;

        const zoomFactor = e.deltaY < 0 ? 1.2 : 0.833;
        const newStepWidth = Math.min(32, Math.max(2, Math.round(stepWidth * zoomFactor * 10) / 10));

        const newMaxScroll = Math.max(0, dynamicMaxSteps * newStepWidth - canvasWidth);
        const newScroll = Math.max(0, Math.min(newMaxScroll, currentStepAtMouse * newStepWidth - mouseX));

        setStepWidth(newStepWidth);
        setScrollLeft(newScroll);
      } else {
        // Panning navigation
        const isHorizontalWheel = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        if (isHorizontalWheel) {
          const delta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
          setScrollLeft(prev => Math.max(0, Math.min(maxScrollLeft, prev + delta)));
        } else {
          // If tracks overflow vertically, scroll lanes; otherwise, scroll horizontally
          if (maxScrollTop > 0) {
            setScrollTop(prev => Math.max(0, Math.min(maxScrollTop, prev + e.deltaY)));
          } else {
            setScrollLeft(prev => Math.max(0, Math.min(maxScrollLeft, prev + e.deltaY)));
          }
        }
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [scrollLeft, stepWidth, maxScrollLeft, maxScrollTop, dynamicMaxSteps, canvasWidth]);

  // Global Mouse Up & Window Mouse Move for Scrollbar Dragging
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isScrollbarDragging.current && scrollbarTrackRef.current) {
        const trackRect = scrollbarTrackRef.current.getBoundingClientRect();
        const deltaPx = e.clientX - scrollbarDragStartX.current;
        const scrollDelta = (deltaPx / trackRect.width) * (dynamicMaxSteps * stepWidth);
        const targetScroll = Math.max(0, Math.min(maxScrollLeft, scrollbarDragStartScroll.current + scrollDelta));
        setScrollLeft(targetScroll);
      }
    };

    const handleWindowMouseUp = () => {
      isScrollbarDragging.current = false;
      isDragging.current = false;
      dragType.current = null;
      draggedClip.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [maxScrollLeft, dynamicMaxSteps, stepWidth]);

  // Render Arranger Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Track Lanes & Horizontal Dividers
    tracks.forEach((track, idx) => {
      const y = rulerHeight + idx * trackHeight - scrollTop;
      if (y + trackHeight < rulerHeight || y > height) return;

      const isEven = idx % 2 === 0;

      // Track Lane Background
      ctx.fillStyle = isEven ? '#0a0d14' : '#0f141f';
      ctx.fillRect(0, y, width, trackHeight);

      // Horizontal Track Separator
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + trackHeight);
      ctx.lineTo(width, y + trackHeight);
      ctx.stroke();

      // Vertical Bar Grid Lines
      const startBarStep = Math.max(0, Math.floor(scrollLeft / (16 * stepWidth)) * 16);
      for (let s = startBarStep; s <= dynamicMaxSteps; s += 16) {
        const x = s * stepWidth - scrollLeft;
        if (x < 0 || x > width) continue;

        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + trackHeight);
        ctx.stroke();
      }
    });

    // 2. Draw Pattern & Audio Clips
    clips.forEach(clip => {
      const y = rulerHeight + clip.trackIndex * trackHeight - scrollTop;
      const x = clip.startStep * stepWidth - scrollLeft;
      const w = clip.lengthSteps * stepWidth;

      if (x + w < 0 || x > width || y + trackHeight < rulerHeight || y > height) return;

      const isSelected = selectedClipId === clip.id;
      const isMuted = clip.muted;
      const pattern = patterns.find(p => p.id === clip.patternId);
      const clipName = clip.name || pattern?.name || 'Pattern';

      // Clip Box Body
      const gradient = ctx.createLinearGradient(x, y, x, y + trackHeight);
      if (isMuted) {
        gradient.addColorStop(0, isSelected ? '#334155' : '#1e293b');
        gradient.addColorStop(1, isSelected ? '#1e293b' : '#0f172a');
      } else {
        gradient.addColorStop(0, isSelected ? '#6366f1' : '#3730a3');
        gradient.addColorStop(1, isSelected ? '#4338ca' : '#1e1b4b');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y + 2, w - 2, trackHeight - 4, 4);
      ctx.fill();

      // Muted Striped Overlay
      if (isMuted) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y + 2, w - 2, trackHeight - 4, 4);
        ctx.clip();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = 2;
        for (let hx = x - trackHeight; hx < x + w + trackHeight; hx += 14) {
          ctx.beginPath();
          ctx.moveTo(hx, y);
          ctx.lineTo(hx + trackHeight, y + trackHeight);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Clip Border
      ctx.strokeStyle = isMuted 
        ? (isSelected ? '#94a3b8' : '#475569') 
        : (isSelected ? '#a5b4fc' : '#4f46e5');
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Mini Note Preview Blocks inside clip
      if (pattern) {
        ctx.fillStyle = isMuted ? 'rgba(148, 163, 184, 0.2)' : 'rgba(255, 255, 255, 0.45)';
        const patLen = pattern.lengthSteps || 64;
        const noteScaleY = (trackHeight - 16) / 48;

        Object.values(pattern.notesByChannel).forEach(channelNotes => {
          channelNotes.forEach(n => {
            const repetitions = Math.ceil(clip.lengthSteps / patLen);
            for (let r = 0; r < repetitions; r++) {
              const miniStep = r * patLen + n.step;
              if (miniStep < clip.lengthSteps) {
                const nx = x + miniStep * stepWidth;
                const nw = Math.max(2, n.duration * stepWidth - 1);
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
      ctx.fillStyle = isMuted ? '#94a3b8' : '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const title = isMuted ? `[MUTED] ${clipName}` : clipName;
      ctx.fillText(title, x + 6, y + 15);

      // Right edge resize handle indicator (when unmuted)
      if (!isMuted) {
        ctx.fillStyle = isSelected ? '#c7d2fe' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + w - 5, y + 6, 2, trackHeight - 12);
      }
    });

    // 3. Draw Slice Tool Interactive Cutting Guide
    if (activeTool === 'slice' && hoverSliceInfo) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e'; // Razor Rose/Red
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverSliceInfo.x, hoverSliceInfo.y);
      ctx.lineTo(hoverSliceInfo.x, hoverSliceInfo.y + hoverSliceInfo.height);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Synchronized Playhead Line through Tracks
    const playheadX = playheadStep * stepWidth - scrollLeft;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.save();
      ctx.strokeStyle = '#ef4444'; // Red Playhead
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, rulerHeight);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Sticky Top Time Ruler (Drawn on top so it never scrolls out of view)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, rulerHeight);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerHeight);
    ctx.lineTo(width, rulerHeight);
    ctx.stroke();

    // Loop Region Overlay on Ruler
    const loopX1 = loopStartStep * stepWidth - scrollLeft;
    const loopX2 = (loopStartStep + loopLengthSteps) * stepWidth - scrollLeft;

    if (loopX2 > 0 && loopX1 < width) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.fillRect(Math.max(0, loopX1), 0, Math.min(width, loopX2) - Math.max(0, loopX1), rulerHeight);

      // Loop start marker
      if (loopX1 >= -10 && loopX1 <= width + 10) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(loopX1, 0, 4, rulerHeight);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillText('LOOP START', loopX1 + 6, 12);
      }

      // Loop end marker
      if (loopX2 >= -10 && loopX2 <= width + 10) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(loopX2 - 4, 0, 4, rulerHeight);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillText('LOOP END', loopX2 - 54, 12);
      }
    }

    // Ruler Bars & Sub-ticks
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';

    const barLabelInterval = stepWidth < 3 ? 8 : stepWidth < 6 ? 4 : stepWidth < 10 ? 2 : 1;
    const tickStep = stepWidth >= 10 ? 1 : stepWidth >= 5 ? 4 : 16;
    const startTick = Math.max(0, Math.floor(scrollLeft / (tickStep * stepWidth)) * tickStep);

    for (let s = startTick; s <= dynamicMaxSteps; s += tickStep) {
      const x = s * stepWidth - scrollLeft;
      if (x < 0 || x > width) continue;

      const isBar = s % 16 === 0;
      const isBeat = s % 4 === 0;

      ctx.beginPath();
      ctx.moveTo(x, isBar ? 0 : isBeat ? rulerHeight * 0.4 : rulerHeight * 0.7);
      ctx.lineTo(x, rulerHeight);
      ctx.stroke();

      if (isBar) {
        const barNum = Math.floor(s / 16) + 1;
        if (barNum % barLabelInterval === 1 || barLabelInterval === 1) {
          ctx.fillText(`BAR ${barNum}`, x + 4, 22);
        }
      }
    }

    // 6. Playhead Triangle Marker on Sticky Ruler
    if (playheadX >= -6 && playheadX <= width + 6) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, rulerHeight - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [
    tracks, clips, patterns, selectedClipId, playheadStep, loopStartStep, loopLengthSteps,
    stepWidth, scrollLeft, scrollTop, dynamicMaxSteps, trackHeight, rulerHeight,
    activeTool, hoverSliceInfo
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

  // Keyboard Shortcuts (Tools 1-5, Slice 'S', Delete/Backspace, Zoom, Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') setActiveTool('draw');
      else if (e.key === '2') setActiveTool('paint');
      else if (e.key === '3') setActiveTool('slice');
      else if (e.key === '4') setActiveTool('erase');
      else if (e.key === '5') setActiveTool('mute');
      else if (e.key === 's' || e.key === 'S') {
        handleSliceClip();
      } else if (e.key === 'm' || e.key === 'M') {
        if (selectedClipId) {
          onUpdateClips(clips.map(c => c.id === selectedClipId ? { ...c, muted: !c.muted } : c));
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          onUpdateClips(clips.filter(c => c.id !== selectedClipId));
          setSelectedClipId(null);
        }
      } else if (e.key === 'Home' || e.key === '0') {
        setScrollLeft(0);
        audioEngine.currentStep = 0;
        setPlayheadStep(0);
      } else if (e.key === '+' || e.key === '=') {
        setStepWidth(prev => Math.min(32, prev + 2));
      } else if (e.key === '-' || e.key === '_') {
        setStepWidth(prev => Math.max(2, prev - 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSliceClip, selectedClipId, clips, onUpdateClips, audioEngine]);

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Middle-click (1) or Alt+Left Click: Canvas Pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isDragging.current = true;
      dragType.current = 'pan';
      dragStartOffset.current = {
        x: e.clientX,
        y: e.clientY,
        originalStart: scrollLeft,
        originalTrack: scrollTop,
        originalLen: 0
      };
      setCursorStyle('grabbing');
      return;
    }

    // Click on Sticky Ruler (y < rulerHeight): Scrub Playhead or Drag Loop Markers
    if (y < rulerHeight) {
      const loopX1 = loopStartStep * stepWidth - scrollLeft;
      const loopX2 = (loopStartStep + loopLengthSteps) * stepWidth - scrollLeft;

      if (Math.abs(x - loopX1) <= 8) {
        isDragging.current = true;
        dragType.current = 'loop_start';
        return;
      }
      if (Math.abs(x - loopX2) <= 8) {
        isDragging.current = true;
        dragType.current = 'loop_end';
        return;
      }

      // Scrub Playhead
      const rawStep = Math.max(0, (x + scrollLeft) / stepWidth);
      const snapVal = snapSteps > 0 ? snapSteps : 1;
      const scrubStep = Math.round(rawStep / snapVal) * snapVal;
      audioEngine.currentStep = scrubStep;
      setPlayheadStep(scrubStep);
      isDragging.current = true;
      dragType.current = 'scrub';
      return;
    }

    // Click in Track Lanes Area
    const trackIndex = Math.floor((y - rulerHeight + scrollTop) / trackHeight);
    if (trackIndex < 0 || trackIndex >= tracks.length) return;

    const clickedStep = Math.max(0, (x + scrollLeft) / stepWidth);
    const snapVal = snapSteps > 0 ? snapSteps : 1;
    const snappedStep = Math.floor(clickedStep / snapVal) * snapVal;

    // Find clicked clip
    const clickedClip = clips.find(c => 
      c.trackIndex === trackIndex && 
      clickedStep >= c.startStep && 
      clickedStep < c.startStep + c.lengthSteps
    );

    // Right-Click: Instant Erase (FL Studio Ergonomics)
    if (e.button === 2) {
      if (clickedClip) {
        onUpdateClips(clips.filter(c => c.id !== clickedClip.id));
        if (selectedClipId === clickedClip.id) setSelectedClipId(null);
      }
      return;
    }

    // Handle Active Tool Actions
    if (activeTool === 'erase') {
      if (clickedClip) {
        onUpdateClips(clips.filter(c => c.id !== clickedClip.id));
        if (selectedClipId === clickedClip.id) setSelectedClipId(null);
      }
      return;
    }

    if (activeTool === 'mute') {
      if (clickedClip) {
        onUpdateClips(clips.map(c => c.id === clickedClip.id ? { ...c, muted: !c.muted } : c));
      }
      return;
    }

    if (activeTool === 'slice') {
      if (clickedClip) {
        const sliceStep = snapSteps > 0 ? Math.round(clickedStep / snapSteps) * snapSteps : Math.round(clickedStep);
        if (sliceStep > clickedClip.startStep && sliceStep < clickedClip.startStep + clickedClip.lengthSteps) {
          const firstHalfLen = sliceStep - clickedClip.startStep;
          const secondHalfLen = clickedClip.lengthSteps - firstHalfLen;

          const firstHalf: TimelineClip = { ...clickedClip, lengthSteps: firstHalfLen };
          const secondHalf: TimelineClip = {
            ...clickedClip,
            id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            startStep: sliceStep,
            lengthSteps: secondHalfLen
          };
          onUpdateClips(clips.map(c => c.id === clickedClip.id ? firstHalf : c).concat(secondHalf));
          setSelectedClipId(secondHalf.id);
        }
      }
      return;
    }

    if (activeTool === 'paint') {
      const pat = patterns.find(p => p.id === activePatternId) || patterns[0];
      const patLen = pat.lengthSteps || 64;

      if (!clickedClip) {
        const newClip: TimelineClip = {
          id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          trackIndex,
          startStep: snappedStep,
          lengthSteps: patLen,
          patternId: pat.id,
          name: pat.name,
          color: '#4f46e5',
          muted: false
        };
        onUpdateClips([...clips, newClip]);
        setSelectedClipId(newClip.id);
      }
      isDragging.current = true;
      dragType.current = 'paint';
      return;
    }

    // Default 'draw' tool
    if (clickedClip) {
      setSelectedClipId(clickedClip.id);
      draggedClip.current = clickedClip;
      isDragging.current = true;

      const clipPixelX = clickedClip.startStep * stepWidth - scrollLeft;
      const clipPixelW = clickedClip.lengthSteps * stepWidth;
      const isNearRightEdge = (x - clipPixelX) > (clipPixelW - 12);

      dragType.current = isNearRightEdge ? 'resize' : 'move';
      dragStartOffset.current = {
        x,
        y,
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
        startStep: snappedStep,
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

  // Canvas Mouse Move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Pan Dragging
    if (isDragging.current && dragType.current === 'pan') {
      const dx = e.clientX - dragStartOffset.current.x;
      const dy = e.clientY - dragStartOffset.current.y;
      setScrollLeft(Math.max(0, Math.min(maxScrollLeft, dragStartOffset.current.originalStart - dx)));
      setScrollTop(Math.max(0, Math.min(maxScrollTop, dragStartOffset.current.originalTrack - dy)));
      return;
    }

    // Scrubbing Playhead
    if (isDragging.current && dragType.current === 'scrub') {
      const rawStep = Math.max(0, (x + scrollLeft) / stepWidth);
      const snapVal = snapSteps > 0 ? snapSteps : 1;
      const scrubStep = Math.round(rawStep / snapVal) * snapVal;
      audioEngine.currentStep = scrubStep;
      setPlayheadStep(scrubStep);
      return;
    }

    // Loop Start Handle Dragging
    if (isDragging.current && dragType.current === 'loop_start') {
      const snapVal = snapSteps > 0 ? snapSteps : 1;
      const targetStep = Math.max(0, Math.round(((x + scrollLeft) / stepWidth) / snapVal) * snapVal);
      const currentEnd = loopStartStep + loopLengthSteps;
      if (targetStep < currentEnd) {
        onUpdateLoop(targetStep, currentEnd - targetStep);
      }
      return;
    }

    // Loop End Handle Dragging
    if (isDragging.current && dragType.current === 'loop_end') {
      const snapVal = snapSteps > 0 ? snapSteps : 1;
      const targetStep = Math.max(loopStartStep + snapVal, Math.round(((x + scrollLeft) / stepWidth) / snapVal) * snapVal);
      onUpdateLoop(loopStartStep, targetStep - loopStartStep);
      return;
    }

    // Painting Multiple Clips while dragging
    if (isDragging.current && dragType.current === 'paint') {
      const trackIndex = Math.floor((y - rulerHeight + scrollTop) / trackHeight);
      if (trackIndex >= 0 && trackIndex < tracks.length) {
        const clickedStep = Math.max(0, (x + scrollLeft) / stepWidth);
        const snapVal = snapSteps > 0 ? snapSteps : 16;
        const snappedStep = Math.floor(clickedStep / snapVal) * snapVal;
        const pat = patterns.find(p => p.id === activePatternId) || patterns[0];
        const patLen = pat.lengthSteps || 64;

        const overlaps = clips.some(c => 
          c.trackIndex === trackIndex &&
          Math.max(c.startStep, snappedStep) < Math.min(c.startStep + c.lengthSteps, snappedStep + patLen)
        );

        if (!overlaps) {
          const stampedClip: TimelineClip = {
            id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            trackIndex,
            startStep: snappedStep,
            lengthSteps: patLen,
            patternId: pat.id,
            name: pat.name,
            color: '#4f46e5',
            muted: false
          };
          onUpdateClips([...clips, stampedClip]);
        }
      }
      return;
    }

    // Resize Clip Dragging
    if (isDragging.current && dragType.current === 'resize' && draggedClip.current) {
      const snapVal = snapSteps > 0 ? snapSteps : 1;
      const stepDelta = Math.round(((x - dragStartOffset.current.x) / stepWidth) / snapVal) * snapVal;
      const newLen = Math.max(snapVal, dragStartOffset.current.originalLen + stepDelta);
      if (newLen !== draggedClip.current.lengthSteps) {
        onUpdateClips(clips.map(c => c.id === draggedClip.current?.id ? { ...c, lengthSteps: newLen } : c));
      }
      return;
    }

    // Move Clip Dragging
    if (isDragging.current && dragType.current === 'move' && draggedClip.current) {
      const snapVal = snapSteps > 0 ? snapSteps : 1;
      const stepDelta = Math.round(((x - dragStartOffset.current.x) / stepWidth) / snapVal) * snapVal;
      const newStart = Math.max(0, dragStartOffset.current.originalStart + stepDelta);
      const newTrack = Math.max(0, Math.min(tracks.length - 1, Math.floor((y - rulerHeight + scrollTop) / trackHeight)));

      if (newStart !== draggedClip.current.startStep || newTrack !== draggedClip.current.trackIndex) {
        onUpdateClips(clips.map(c => c.id === draggedClip.current?.id ? { ...c, startStep: newStart, trackIndex: newTrack } : c));
      }
      return;
    }

    // Non-dragging Cursor & Hover Guideline Updates
    if (y < rulerHeight) {
      const loopX1 = loopStartStep * stepWidth - scrollLeft;
      const loopX2 = (loopStartStep + loopLengthSteps) * stepWidth - scrollLeft;
      if (Math.abs(x - loopX1) <= 8 || Math.abs(x - loopX2) <= 8) {
        setCursorStyle('col-resize');
      } else {
        setCursorStyle('pointer');
      }
      setHoverSliceInfo(null);
      return;
    }

    const trackIndex = Math.floor((y - rulerHeight + scrollTop) / trackHeight);
    const clickedStep = Math.max(0, (x + scrollLeft) / stepWidth);
    const hoveredClip = clips.find(c => 
      c.trackIndex === trackIndex && 
      clickedStep >= c.startStep && 
      clickedStep < c.startStep + c.lengthSteps
    );

    if (activeTool === 'slice') {
      setCursorStyle('crosshair');
      if (hoveredClip) {
        const snapVal = snapSteps > 0 ? snapSteps : 1;
        const sliceStep = Math.round(clickedStep / snapVal) * snapVal;
        if (sliceStep > hoveredClip.startStep && sliceStep < hoveredClip.startStep + hoveredClip.lengthSteps) {
          setHoverSliceInfo({
            clipId: hoveredClip.id,
            sliceStep,
            x: sliceStep * stepWidth - scrollLeft,
            y: rulerHeight + hoveredClip.trackIndex * trackHeight - scrollTop,
            height: trackHeight
          });
          return;
        }
      }
      setHoverSliceInfo(null);
      return;
    }

    setHoverSliceInfo(null);

    if (activeTool === 'erase') {
      setCursorStyle('not-allowed');
      return;
    }

    if (activeTool === 'mute') {
      setCursorStyle('pointer');
      return;
    }

    if (activeTool === 'paint') {
      setCursorStyle('cell');
      return;
    }

    // Draw Tool Hover
    if (hoveredClip) {
      const clipPixelX = hoveredClip.startStep * stepWidth - scrollLeft;
      const clipPixelW = hoveredClip.lengthSteps * stepWidth;
      const isNearRight = (x - clipPixelX) > (clipPixelW - 12);
      setCursorStyle(isNearRight ? 'ew-resize' : 'grab');
    } else {
      setCursorStyle('default');
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

  // Fit Song to Viewport
  const handleFitToSong = () => {
    const furthest = Math.max(64, clips.reduce((max, c) => Math.max(max, c.startStep + c.lengthSteps), 0));
    const optimalStepWidth = Math.max(2, Math.min(24, Math.floor((canvasWidth - 80) / furthest)));
    setStepWidth(optimalStepWidth);
    setScrollLeft(0);
  };

  // Horizontal Scrollbar Drag Handlers
  const handleScrollbarThumbMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isScrollbarDragging.current = true;
    scrollbarDragStartX.current = e.clientX;
    scrollbarDragStartScroll.current = scrollLeft;
  };

  const handleScrollbarTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = scrollbarTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const clickPercent = (e.clientX - rect.left) / rect.width;
    const targetStep = clickPercent * dynamicMaxSteps;
    const targetScroll = Math.max(0, Math.min(maxScrollLeft, targetStep * stepWidth - canvasWidth / 2));
    setScrollLeft(targetScroll);
  };

  // Calculate Scrollbar Thumb Metrics
  const totalTimelineWidth = dynamicMaxSteps * stepWidth;
  const thumbWidthPercent = Math.min(100, Math.max(5, (canvasWidth / totalTimelineWidth) * 100));
  const maxThumbTravel = 100 - thumbWidthPercent;
  const thumbLeftPercent = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbTravel : 0;

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 select-none overflow-hidden text-gray-200">
      {/* Top Toolbar: Tools, Snap, Patterns, Quick Loops, Zoom, Track */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-xs gap-3 z-20 shrink-0">
        
        {/* Left Section: Tool Selector & Snap Grid */}
        <div className="flex items-center gap-2">
          {/* Tool Palette */}
          <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800 gap-0.5 shadow-inner">
            <button
              onClick={() => setActiveTool('draw')}
              title="Draw Tool (1 / P): Select, Move, Resize, Place"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTool === 'draw' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Pencil size={12} />
              <span className="hidden sm:inline">Draw</span>
            </button>
            <button
              onClick={() => setActiveTool('paint')}
              title="Paint Tool (2 / B): Drag to stamp patterns across bars"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTool === 'paint' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Paintbrush size={12} />
              <span className="hidden sm:inline">Paint</span>
            </button>
            <button
              onClick={() => setActiveTool('slice')}
              title="Slice Tool (3 / C): Click clip to split at snap grid"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTool === 'slice' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Scissors size={12} />
              <span className="hidden sm:inline">Slice</span>
            </button>
            <button
              onClick={() => setActiveTool('erase')}
              title="Erase Tool (4 / E): Click clip to delete"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTool === 'erase' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Eraser size={12} />
              <span className="hidden sm:inline">Erase</span>
            </button>
            <button
              onClick={() => setActiveTool('mute')}
              title="Mute Tool (5 / M): Click clip to toggle mute"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTool === 'mute' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <VolumeX size={12} />
              <span className="hidden sm:inline">Mute</span>
            </button>
          </div>

          {/* Snap Grid Selector */}
          <div className="flex items-center bg-gray-950 px-2 py-1 rounded-lg border border-gray-800 gap-1.5 shadow-inner">
            <Magnet size={12} className={snapSteps > 0 ? 'text-indigo-400' : 'text-gray-500'} />
            <select
              value={snapSteps}
              onChange={(e) => setSnapSteps(parseInt(e.target.value))}
              className="bg-transparent text-gray-300 font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value={16} className="bg-gray-900 text-gray-200">1 Bar (16)</option>
              <option value={8} className="bg-gray-900 text-gray-200">1/2 Bar (8)</option>
              <option value={4} className="bg-gray-900 text-gray-200">1/4 Bar (Beat / 4)</option>
              <option value={2} className="bg-gray-900 text-gray-200">1/8 Bar (2)</option>
              <option value={1} className="bg-gray-900 text-gray-200">1 Step (1)</option>
              <option value={0} className="bg-gray-900 text-gray-200">Free (Off)</option>
            </select>
          </div>
        </div>

        {/* Center Section: Pattern Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-xl">
          <span className="text-[11px] font-mono text-gray-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
            <Layers size={13} className="text-indigo-400" />
            PATTERNS:
          </span>
          {patterns.map((pat) => {
            const isActive = pat.id === activePatternId;
            return (
              <div
                key={pat.id}
                onClick={() => onSelectActivePattern(pat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer border transition-all shrink-0 ${
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 font-mono text-xs border border-gray-700 hover:border-indigo-500 transition-colors shrink-0"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        </div>

        {/* Right Section: Quick Loops, Slicing, and Track Add */}
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
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-indigo-300 rounded-lg border border-gray-700 hover:border-indigo-500 text-xs font-semibold transition-colors"
          >
            <Scissors size={12} />
            <span>Slice (S)</span>
          </button>

          <button
            onClick={handleAddTrack}
            title="Add New Timeline Track"
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
          >
            <Plus size={12} />
            <span>Track</span>
          </button>
        </div>
      </div>

      {/* Main Playlist View: Left Track Headers Column + Right Canvas Timeline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track Headers Column (REAPER / DAW Style) */}
        <div 
          className="flex flex-col border-r border-gray-800 bg-gray-900 z-10 shadow-lg shrink-0"
          style={{ width: trackHeaderWidth }}
        >
          {/* Track Header Corner (Aligned with Sticky Ruler) */}
          <div 
            className="flex items-center justify-between px-3 border-b border-gray-800 bg-gray-950 text-xs font-mono text-gray-400 shrink-0"
            style={{ height: rulerHeight }}
          >
            <span className="font-bold text-gray-300">TRACKS</span>
            <span className="text-[10px] text-gray-500">{tracks.length} Total</span>
          </div>

          {/* Track Controls List (synced with scrollTop) */}
          <div className="flex-1 overflow-hidden relative">
            <div 
              style={{ transform: `translateY(-${scrollTop}px)` }}
              className="transition-transform duration-75 ease-out"
            >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (e.ctrlKey || e.altKey || e.metaKey) {
                            const isAlreadyOnlySoloed = track.solo && tracks.every((t, i) => i === idx || !t.solo);
                            const updated = tracks.map((t, i) => ({
                              ...t,
                              solo: isAlreadyOnlySoloed ? false : i === idx
                            }));
                            onUpdateTracks(updated);
                          } else {
                            const updated = tracks.map((t, i) => i === idx ? { ...t, solo: !t.solo } : t);
                            onUpdateTracks(updated);
                          }
                        }}
                        title="Solo Track (Ctrl+Click for Exclusive Solo)"
                        className={`p-1 rounded transition-colors ${track.solo ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50' : 'text-gray-400 hover:text-gray-200'}`}
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
        </div>

        {/* Timeline Canvas & Horizontal Navigation Container */}
        <div 
          ref={containerRef}
          className="flex-1 flex flex-col overflow-hidden bg-gray-950 relative"
        >
          {/* Canvas Wrapper */}
          <div className="flex-1 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="block"
              style={{ cursor: cursorStyle }}
              onContextMenu={e => e.preventDefault()}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
          </div>

          {/* Horizontal Navigation & Zoom Bar */}
          <div className="h-7 bg-gray-900 border-t border-gray-800 flex items-center px-2 text-xs font-mono select-none gap-2 z-20 shrink-0">
            {/* Fast Bar Jump Controls */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  setScrollLeft(0);
                  audioEngine.currentStep = 0;
                  setPlayheadStep(0);
                }}
                title="Jump to Start (Bar 1 / Home)"
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setScrollLeft(prev => Math.max(0, prev - 16 * stepWidth))}
                title="Scroll Left 1 Bar"
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setScrollLeft(prev => Math.min(maxScrollLeft, prev + 16 * stepWidth))}
                title="Scroll Right 1 Bar"
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Draggable Full-Song Scrollbar Track */}
            <div 
              ref={scrollbarTrackRef}
              onClick={handleScrollbarTrackClick}
              className="flex-1 h-3.5 bg-gray-950 rounded-full border border-gray-800 relative cursor-pointer overflow-hidden shadow-inner"
            >
              {/* Loop Region Mini-Marker */}
              <div 
                className="absolute top-0 bottom-0 bg-amber-500/25 pointer-events-none"
                style={{
                  left: `${(loopStartStep / dynamicMaxSteps) * 100}%`,
                  width: `${(loopLengthSteps / dynamicMaxSteps) * 100}%`
                }}
              />
              {/* Playhead Mini-Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                style={{
                  left: `${(playheadStep / dynamicMaxSteps) * 100}%`
                }}
              />
              {/* Draggable Scroll Thumb */}
              <div 
                onMouseDown={handleScrollbarThumbMouseDown}
                className="absolute top-0.5 bottom-0.5 bg-indigo-600/70 hover:bg-indigo-500 rounded-full cursor-grab active:cursor-grabbing border border-indigo-400/40 transition-colors flex items-center justify-center"
                style={{
                  left: `${thumbLeftPercent}%`,
                  width: `${thumbWidthPercent}%`,
                  minWidth: '28px'
                }}
              >
                <div className="w-3 h-0.5 bg-white/40 rounded-full" />
              </div>
            </div>

            {/* Bar Position Readout & Zoom Controls */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
              <span className="font-semibold text-gray-300">
                BAR {Math.floor(scrollLeft / (16 * stepWidth)) + 1} - {Math.min(dynamicMaxSteps / 16, Math.floor((scrollLeft + canvasWidth) / (16 * stepWidth)) + 1)} of {dynamicMaxSteps / 16}
              </span>
              
              <div className="h-3 w-[1px] bg-gray-700 mx-1" />

              {/* Follow Playhead Toggle */}
              <button
                onClick={() => setFollowPlayhead(prev => !prev)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors font-semibold ${
                  followPlayhead ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Auto-scroll to follow playhead during playback"
              >
                Follow
              </button>

              <div className="h-3 w-[1px] bg-gray-700 mx-1" />

              {/* Zoom Controls */}
              <button
                onClick={() => setStepWidth(prev => Math.max(2, prev - 2))}
                title="Zoom Out (-)"
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <ZoomOut size={13} />
              </button>
              <button
                onClick={() => setStepWidth(8)}
                title="Reset Zoom (100%)"
                className="px-1.5 py-0.5 hover:bg-gray-800 rounded text-[10px] text-gray-300 hover:text-white font-mono"
              >
                {Math.round((stepWidth / 8) * 100)}%
              </button>
              <button
                onClick={() => setStepWidth(prev => Math.min(32, prev + 2))}
                title="Zoom In (+)"
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={handleFitToSong}
                title="Fit Song to Viewport"
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
