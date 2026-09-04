import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Download, 
  Upload, 
  Sparkles, 
  Volume2, 
  PlusCircle, 
  Check, 
  Scissors, 
  MessageSquare, 
  RotateCcw,
  Sliders,
  Radio,
  Music,
  Bot,
  Zap
} from 'lucide-react';
import { 
  RetroVocalProcessor, 
  VOCAL_PRESETS, 
  VocalPresetId, 
  VocalFXParams 
} from '../../audio/RetroVocalProcessor';
import { SampleManager, playSampleVoice } from '../../audio/SampleVoice';
import { AudioExporter, ExportAudioFormat } from '../../export/AudioExporter';
import { InstrumentChannel } from '../../types/audio';

interface RetroVoiceLabProps {
  onAddChannel?: (channel: InstrumentChannel) => void;
}

const MINI_KEYBOARD_KEYS = [
  { midi: 60, name: 'C4', isBlack: false, keyLabel: 'A' },
  { midi: 61, name: 'C#', isBlack: true, keyLabel: 'W' },
  { midi: 62, name: 'D4', isBlack: false, keyLabel: 'S' },
  { midi: 63, name: 'D#', isBlack: true, keyLabel: 'E' },
  { midi: 64, name: 'E4', isBlack: false, keyLabel: 'D' },
  { midi: 65, name: 'F4', isBlack: false, keyLabel: 'F' },
  { midi: 66, name: 'F#', isBlack: true, keyLabel: 'T' },
  { midi: 67, name: 'G4', isBlack: false, keyLabel: 'G' },
  { midi: 68, name: 'G#', isBlack: true, keyLabel: 'Y' },
  { midi: 69, name: 'A4', isBlack: false, keyLabel: 'H' },
  { midi: 70, name: 'A#', isBlack: true, keyLabel: 'U' },
  { midi: 71, name: 'B4', isBlack: false, keyLabel: 'J' },
  { midi: 72, name: 'C5', isBlack: false, keyLabel: 'K' },
];

export const RetroVoiceLab: React.FC<RetroVoiceLabProps> = ({ onAddChannel }) => {
  const processor = RetroVocalProcessor.getInstance();

  // Audio Buffers
  const [rawBuffer, setRawBuffer] = useState<AudioBuffer | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [dialogueGrain, setDialogueGrain] = useState<AudioBuffer | null>(null);

  // Recording State & Meter
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState<number>(0);
  const recordIntervalRef = useRef<number | null>(null);
  const micAnalyserRef = useRef<{ analyser: AnalyserNode; animId: number } | null>(null);

  // Playback & Processing State
  const [isPlayingRaw, setIsPlayingRaw] = useState(false);
  const [isPlayingProcessed, setIsPlayingProcessed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportAudioFormat>('ogg');
  const [isExporting, setIsExporting] = useState(false);
  const [addedToRack, setAddedToRack] = useState(false);

  // Preset & Parameter State
  const [activePresetId, setActivePresetId] = useState<VocalPresetId>('flowery');
  const [params, setParams] = useState<VocalFXParams>(VOCAL_PRESETS.flowery.params);

  // Trimming State (in seconds)
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(1.4);
  const [isDraggingTrim, setIsDraggingTrim] = useState<'start' | 'end' | 'new' | null>(null);
  const dragAnchorRef = useRef<number>(0);

  // Mini Playable Keyboard State
  const [activeAuditionNotes, setActiveAuditionNotes] = useState<Set<number>>(new Set());
  const activeAuditionVoicesRef = useRef<Map<number, { stop: (rel?: number) => void }>>(new Map());

  // Interactive Dialogue Box State
  const [dialogueText, setDialogueText] = useState<string>(VOCAL_PRESETS.flowery.sampleQuote);
  const [animatedDialogue, setAnimatedDialogue] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const typingTimerRef = useRef<number | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with the procedural vocal demo buffer on mount so user can test immediately
  useEffect(() => {
    const demo = processor.generateDemoVocalBuffer();
    setRawBuffer(demo);
    setTrimStart(0);
    setTrimEnd(demo.duration);
  }, []);

  // Live microphone level meter during recording
  useEffect(() => {
    if (isRecording) {
      const stream = processor.getCurrentStream();
      if (stream) {
        try {
          const ctx = processor.getContext();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkLevel = () => {
            analyser.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const norm = (dataArray[i] - 128) / 128;
              sumSquares += norm * norm;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            setMicLevel(Math.min(100, Math.round(rms * 300)));
            micAnalyserRef.current!.animId = requestAnimationFrame(checkLevel);
          };
          micAnalyserRef.current = { analyser, animId: requestAnimationFrame(checkLevel) };
        } catch (e) {
          console.error('VU meter error:', e);
        }
      }
    } else {
      if (micAnalyserRef.current) {
        cancelAnimationFrame(micAnalyserRef.current.animId);
        micAnalyserRef.current = null;
      }
      setMicLevel(0);
    }
  }, [isRecording]);

  // Re-render processed buffer whenever rawBuffer, params, or trims change
  useEffect(() => {
    if (!rawBuffer) return;

    let isSubscribed = true;
    const updateProcessed = async () => {
      try {
        setIsProcessing(true);
        const processed = await processor.renderProcessedVocal(rawBuffer, params, trimStart, trimEnd);
        if (!isSubscribed) return;
        setProcessedBuffer(processed);
        
        // Extract isolated vowel grain for dialogue typewriter blips
        const grain = processor.extractDialogueGrain(processed, 0.055);
        setDialogueGrain(grain);
      } catch (err) {
        console.error('Failed to render processed vocal:', err);
      } finally {
        if (isSubscribed) setIsProcessing(false);
      }
    };

    const timeout = setTimeout(updateProcessed, 60);
    return () => {
      isSubscribed = false;
      clearTimeout(timeout);
    };
  }, [rawBuffer, params, trimStart, trimEnd]);

  // Waveform visualization on canvas
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
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!rawBuffer) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText('No audio loaded. Click "Record Voice" or "Load Demo Sample".', 20, h / 2 + 4);
      return;
    }

    const data = rawBuffer.getChannelData(0);
    const duration = rawBuffer.duration;
    const samplesPerPixel = Math.max(1, Math.floor(data.length / w));

    // Draw Raw Waveform (Dim Indigo)
    ctx.strokeStyle = '#3730a3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const idx = x * samplesPerPixel;
      let min = 1.0;
      let max = -1.0;
      for (let s = 0; s < samplesPerPixel; s++) {
        const val = data[idx + s] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = h / 2 - (max * (h / 2 - 10));
      const yMax = h / 2 - (min * (h / 2 - 10));
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();

    // Highlight Selected Trim Region
    const startX = (trimStart / duration) * w;
    const endX = (trimEnd / duration) * w;
    const trimW = Math.max(2, endX - startX);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.fillRect(startX, 0, trimW, h);

    // Draw Active Trim Region Waveform (Glowing Emerald / Cyan)
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = Math.floor(startX); x <= Math.ceil(endX); x++) {
      const idx = x * samplesPerPixel;
      let min = 1.0;
      let max = -1.0;
      for (let s = 0; s < samplesPerPixel; s++) {
        const val = data[idx + s] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = h / 2 - (max * (h / 2 - 10));
      const yMax = h / 2 - (min * (h / 2 - 10));
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();

    // Start / End Trim Handle Lines
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, h);
    ctx.stroke();

    // Start Handle Flag
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX + 8, 0);
    ctx.lineTo(startX, 12);
    ctx.fill();

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();

    // End Handle Flag
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX - 8, 0);
    ctx.lineTo(endX, 12);
    ctx.fill();

    // Waveform Info Text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`Raw: ${duration.toFixed(2)}s @ ${rawBuffer.sampleRate}Hz`, 12, 18);
    ctx.fillText(`Trim: ${(trimEnd - trimStart).toFixed(2)}s [${trimStart.toFixed(2)}s - ${trimEnd.toFixed(2)}s] (Drag on waveform to trim)`, 12, 34);
    if (processedBuffer) {
      ctx.fillText(`Processed: ${processedBuffer.duration.toFixed(2)}s | Pitch: ${params.pitchShift >= 0 ? '+' : ''}${params.pitchShift}st | Resample: ${params.resampleRate}Hz (${params.bitDepth}-bit)`, w - 400, 18);
    }
  }, [rawBuffer, processedBuffer, trimStart, trimEnd, params]);

  // Interactive Waveform Dragging
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rawBuffer || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = rawBuffer.duration;
    const clickTime = (x / rect.width) * duration;

    const startX = (trimStart / duration) * rect.width;
    const endX = (trimEnd / duration) * rect.width;

    if (Math.abs(x - startX) <= 12) {
      setIsDraggingTrim('start');
    } else if (Math.abs(x - endX) <= 12) {
      setIsDraggingTrim('end');
    } else {
      setIsDraggingTrim('new');
      dragAnchorRef.current = clickTime;
      setTrimStart(clickTime);
      setTrimEnd(Math.min(duration, clickTime + 0.08));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingTrim || !rawBuffer || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const duration = rawBuffer.duration;
    const currentTime = (x / rect.width) * duration;

    if (isDraggingTrim === 'start') {
      setTrimStart(Math.max(0, Math.min(trimEnd - 0.04, currentTime)));
    } else if (isDraggingTrim === 'end') {
      setTrimEnd(Math.max(trimStart + 0.04, Math.min(duration, currentTime)));
    } else if (isDraggingTrim === 'new') {
      const anchor = dragAnchorRef.current;
      if (currentTime >= anchor) {
        setTrimStart(anchor);
        setTrimEnd(Math.max(anchor + 0.04, Math.min(duration, currentTime)));
      } else {
        setTrimStart(Math.max(0, currentTime));
        setTrimEnd(anchor);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingTrim(null);
  };

  // Microphone Recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
      setIsRecording(false);
      try {
        const buffer = await processor.stopRecording();
        setRawBuffer(buffer);
        setTrimStart(0);
        setTrimEnd(buffer.duration);
      } catch (err) {
        console.error('Recording failed:', err);
        alert('Could not capture microphone audio.');
      }
    } else {
      try {
        await processor.startRecording();
        setIsRecording(true);
        setRecordingSeconds(0);
        recordIntervalRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 0.1);
        }, 100);
      } catch (err) {
        console.error('Mic access failed:', err);
        alert('Please allow microphone permissions to record your voice.');
      }
    }
  };

  // File Import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await processor.decodeAudioFile(file);
      setRawBuffer(buffer);
      setTrimStart(0);
      setTrimEnd(buffer.duration);
      e.target.value = '';
    } catch (err) {
      console.error('Failed to decode file:', err);
      alert('Could not decode audio file. Please choose a valid WAV, MP3, or OGG file.');
    }
  };

  // Load Built-in Voice Demo
  const handleLoadDemo = () => {
    const demo = processor.generateDemoVocalBuffer();
    setRawBuffer(demo);
    setTrimStart(0);
    setTrimEnd(demo.duration);
  };

  // Auditions
  const handlePlayRaw = () => {
    if (!rawBuffer) return;
    setIsPlayingRaw(true);
    const sliced = processor.sliceBuffer(rawBuffer, trimStart, trimEnd);
    processor.playBuffer(sliced, () => setIsPlayingRaw(false));
  };

  const handlePlayProcessed = () => {
    if (!processedBuffer) return;
    setIsPlayingProcessed(true);
    processor.playBuffer(processedBuffer, () => setIsPlayingProcessed(false));
  };

  // Preset Selection
  const handleSelectPreset = (id: VocalPresetId) => {
    setActivePresetId(id);
    const preset = VOCAL_PRESETS[id];
    setParams({ ...preset.params });
    setDialogueText(preset.sampleQuote);
  };

  // Mini Keyboard Audition
  const handleAuditionNoteOn = (midiNote: number) => {
    if (!processedBuffer) return;
    setActiveAuditionNotes(prev => new Set(prev).add(midiNote));
    const ctx = processor.getContext();
    const voice = playSampleVoice(ctx, ctx.destination, processedBuffer, midiNote, {
      velocity: 0.85,
      attack: 0.005,
      decay: 0.2,
      sustain: 0.7,
      release: 0.15
    });
    activeAuditionVoicesRef.current.set(midiNote, voice);
  };

  const handleAuditionNoteOff = (midiNote: number) => {
    setActiveAuditionNotes(prev => {
      const next = new Set(prev);
      next.delete(midiNote);
      return next;
    });
    const voice = activeAuditionVoicesRef.current.get(midiNote);
    if (voice) {
      voice.stop(0.12);
      activeAuditionVoicesRef.current.delete(midiNote);
    }
  };

  // Physical Keyboard listener for Mini Keyboard
  useEffect(() => {
    const keyMap: Record<string, number> = {
      KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64, KeyF: 65, KeyT: 66,
      KeyG: 67, KeyY: 68, KeyH: 69, KeyU: 70, KeyJ: 71, KeyK: 72
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const note = keyMap[e.code];
      if (note !== undefined && !activeAuditionNotes.has(note)) {
        handleAuditionNoteOn(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keyMap[e.code];
      if (note !== undefined) {
        handleAuditionNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [processedBuffer, activeAuditionNotes]);

  // Interactive Dialogue Typewriter Speaking
  const handleSpeakDialogue = () => {
    if (!dialogueGrain || isSpeaking) return;
    setIsSpeaking(true);
    setAnimatedDialogue('');

    let charIdx = 0;
    const fullText = dialogueText.trim() || VOCAL_PRESETS[activePresetId].sampleQuote;

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = window.setInterval(() => {
      if (charIdx >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setIsSpeaking(false);
        return;
      }

      const char = fullText[charIdx];
      setAnimatedDialogue(fullText.slice(0, charIdx + 1));

      // Trigger typewriter chirp on printable alphanumeric letters
      if (/[a-zA-Z0-9]/.test(char)) {
        processor.playDialogueChirp(dialogueGrain, activePresetId, 45);
      }

      charIdx++;
    }, 42);
  };

  // Keystroke test in dialogue box
  const handleDialogueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSpeakDialogue();
      return;
    }
    if (dialogueGrain && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
      processor.playDialogueChirp(dialogueGrain, activePresetId, 45);
    }
  };

  // Export processed audio
  const handleExportAudio = async () => {
    if (!processedBuffer) return;
    try {
      setIsExporting(true);
      const title = `ChromaAudio - ${VOCAL_PRESETS[activePresetId].name} Dialogue`;
      const blob = await AudioExporter.audioBufferToExportBlob(
        processedBuffer,
        exportFormat,
        0,
        0,
        120,
        title,
        0.85
      );
      AudioExporter.downloadBlob(blob, `voice_${activePresetId}_${Date.now()}.${exportFormat}`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export audio.');
    } finally {
      setIsExporting(false);
    }
  };

  // Send to Channel Rack as a playable Sampler Channel
  const handleSendToChannelRack = () => {
    if (!processedBuffer || !onAddChannel) return;

    const sampleId = `sample_voice_${Date.now()}`;
    SampleManager.registerSample(sampleId, processedBuffer);

    const newChannel: InstrumentChannel = {
      id: `ch_${Date.now()}`,
      name: `Voice: ${VOCAL_PRESETS[activePresetId].name}`,
      color: activePresetId === 'flowery' ? '#fbbf24' : activePresetId === 'jevil' ? '#c084fc' : activePresetId === 'queen' ? '#38bdf8' : activePresetId === 'spamton' ? '#f87171' : '#34d399',
      type: 'sample',
      preset: sampleId,
      volume: 0.85,
      pan: 0,
      mute: false,
      solo: false,
      octaveOffset: 0,
      attack: 0.005,
      decay: 0.2,
      sustain: 0.8,
      release: 0.12
    };

    onAddChannel(newChannel);
    setAddedToRack(true);
    setTimeout(() => setAddedToRack(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 p-5 overflow-y-auto text-gray-200 select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
            <Radio size={20} className="text-pink-500 animate-pulse" />
            Retro Vocal & Dialogue Lab
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Transform voice recordings into authentic Deltarune (Flowery, Jevil, Spamton, Queen) & SNES dialogue styles
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Record Button & Live VU Meter */}
          <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800">
            <button
              onClick={handleToggleRecord}
              className={`flex items-center gap-2 px-3 py-1.5 font-bold text-xs rounded-md shadow transition-all ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-red-700/80 hover:bg-red-600 text-white'
              }`}
            >
              {isRecording ? <Square size={13} fill="white" /> : <Mic size={13} />}
              <span>{isRecording ? `REC ${recordingSeconds.toFixed(1)}s` : 'Record Mic'}</span>
            </button>

            {isRecording && (
              <div className="flex items-center gap-0.5 px-2">
                {[20, 40, 60, 80, 100].map((threshold, idx) => (
                  <div
                    key={threshold}
                    className={`w-1.5 h-4 rounded-xs transition-all ${
                      micLevel >= threshold
                        ? idx >= 4 ? 'bg-rose-500 shadow-rose-500/50 shadow-sm' : idx >= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                        : 'bg-gray-800'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Import Button */}
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*,.wav,.mp3,.ogg"
            className="hidden"
            onChange={handleFileImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import an existing voice or speech recording (.wav, .mp3, .ogg)"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-lg border border-gray-700 transition-colors"
          >
            <Upload size={14} />
            <span>Import Audio</span>
          </button>

          {/* Load Voice Demo */}
          <button
            onClick={handleLoadDemo}
            title="Synthesize an instant vocal phrase demo to test the characters"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-indigo-200 text-xs font-semibold rounded-lg border border-indigo-900/60 transition-colors"
          >
            <Sparkles size={14} />
            <span>Load Demo</span>
          </button>

          <div className="h-5 w-px bg-gray-800 hidden sm:block" />

          {/* Audition Raw */}
          <button
            onClick={handlePlayRaw}
            disabled={!rawBuffer || isPlayingRaw}
            title="Audition clean input recording"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs font-semibold rounded-lg border border-gray-700 transition-colors"
          >
            <Play size={13} fill={isPlayingRaw ? 'white' : 'currentColor'} />
            <span>Audition Raw</span>
          </button>

          {/* Audition Processed */}
          <button
            onClick={handlePlayProcessed}
            disabled={!processedBuffer || isPlayingProcessed || isProcessing}
            title="Audition voice with retro character transformation applied"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-bold text-xs rounded-lg shadow transition-colors"
          >
            <Play size={13} fill="white" />
            <span>{isProcessing ? 'Rendering...' : 'Audition Processed'}</span>
          </button>

          {/* Send to Channel Rack */}
          {onAddChannel && (
            <button
              onClick={handleSendToChannelRack}
              disabled={!processedBuffer}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-lg shadow transition-all ${
                addedToRack
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white'
              }`}
            >
              {addedToRack ? <Check size={14} /> : <PlusCircle size={14} />}
              <span>{addedToRack ? 'Added to Rack!' : 'Send to Rack'}</span>
            </button>
          )}

          {/* Export Format Toggle & Button */}
          <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800">
            <button
              type="button"
              onClick={() => setExportFormat('ogg')}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                exportFormat === 'ogg' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              OGG
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('wav')}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                exportFormat === 'wav' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              WAV
            </button>
          </div>

          <button
            onClick={handleExportAudio}
            disabled={!processedBuffer || isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-bold text-xs rounded-lg shadow transition-colors"
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>Export {exportFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Waveform CRT Display & Interactive Direct Drag Trimming */}
      <div className="my-4">
        <div className="rounded-xl overflow-hidden border border-gray-800 shadow-inner bg-gray-950">
          <canvas
            ref={canvasRef}
            width={850}
            height={130}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full h-32 block cursor-ew-resize active:cursor-grabbing"
            title="Click and drag directly on the waveform to trim audio!"
          />
        </div>

        {/* Trim Sliders & Reset */}
        {rawBuffer && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2 px-3 py-2 text-xs font-mono text-gray-400 bg-gray-950/70 rounded-lg border border-gray-800">
            <div className="flex items-center gap-2">
              <Scissors size={14} className="text-indigo-400" />
              <span>Trim Start:</span>
              <input
                type="range"
                min="0"
                max={Math.max(0.1, trimEnd - 0.05)}
                step="0.01"
                value={trimStart}
                onChange={(e) => setTrimStart(Number(e.target.value))}
                className="w-28 sm:w-36 accent-emerald-500"
              />
              <span className="text-emerald-400 font-bold">{trimStart.toFixed(2)}s</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Trim End:</span>
              <input
                type="range"
                min={trimStart + 0.05}
                max={rawBuffer.duration}
                step="0.01"
                value={trimEnd}
                onChange={(e) => setTrimEnd(Number(e.target.value))}
                className="w-28 sm:w-36 accent-rose-500"
              />
              <span className="text-rose-400 font-bold">{trimEnd.toFixed(2)}s</span>
            </div>

            <button
              onClick={() => {
                setTrimStart(0);
                setTrimEnd(rawBuffer.duration);
              }}
              title="Reset trim to full sample"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Mini Playable Keyboard Preview (Test processed voice melodically!) */}
      <div className="mb-4 bg-gray-950 p-3 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs font-bold text-gray-400">
          <div className="flex items-center gap-2 text-indigo-400">
            <Music size={14} />
            <span>PLAYABLE VOICE INSTRUMENT PREVIEW (C4 - C5)</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
            Click keys or press [A, W, S, E, D, F, T, G, Y, H, U, J, K]
          </span>
        </div>

        <div className="flex justify-center items-stretch h-20 relative bg-gray-900 rounded-lg p-1 border border-gray-800 select-none">
          {MINI_KEYBOARD_KEYS.map((k) => {
            const isActive = activeAuditionNotes.has(k.midi);
            if (k.isBlack) {
              return (
                <button
                  key={k.midi}
                  onMouseDown={() => handleAuditionNoteOn(k.midi)}
                  onMouseUp={() => handleAuditionNoteOff(k.midi)}
                  onMouseLeave={() => handleAuditionNoteOff(k.midi)}
                  className={`w-6 sm:w-8 h-12 -mx-3 sm:-mx-4 z-10 rounded-b font-mono text-[9px] flex flex-col justify-end items-center pb-1 transition-all shadow-md ${
                    isActive
                      ? 'bg-indigo-500 text-white border-2 border-white'
                      : 'bg-gray-950 text-gray-400 border border-gray-800 hover:bg-gray-900'
                  }`}
                >
                  <span>{k.keyLabel}</span>
                </button>
              );
            }
            return (
              <button
                key={k.midi}
                onMouseDown={() => handleAuditionNoteOn(k.midi)}
                onMouseUp={() => handleAuditionNoteOff(k.midi)}
                onMouseLeave={() => handleAuditionNoteOff(k.midi)}
                className={`flex-1 min-w-[28px] max-w-[48px] h-full rounded-b font-mono text-[10px] flex flex-col justify-end items-center pb-1.5 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-inner'
                    : 'bg-gray-200 text-gray-800 hover:bg-white border-r border-gray-300 last:border-r-0'
                }`}
              >
                <span className="text-[8px] opacity-60 font-bold">{k.keyLabel}</span>
                <span className="font-bold">{k.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Character Preset Cards Grid */}
      <div className="mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
          Character Voice Presets ({Object.keys(VOCAL_PRESETS).length})
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {(Object.values(VOCAL_PRESETS) as typeof VOCAL_PRESETS[VocalPresetId][]).map(p => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                    : 'bg-gray-950 hover:bg-gray-800 border-gray-800 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{p.icon}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <div className="font-bold text-xs">{p.name}</div>
                <div className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                  {p.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Undertale / Deltarune Dialogue Box Simulator */}
      <div className="mb-5 bg-black p-4 rounded-xl border-2 border-white/80 shadow-2xl font-mono text-white">
        <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-2 text-yellow-300 font-bold">
            <MessageSquare size={14} />
            <span>DELTARUNE / UNDERTALE DIALOGUE SIMULATOR</span>
          </div>
          <span className="text-[11px] text-gray-400">Type or click Speak to test retro typewriter blips</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Character Avatar Icon */}
          <div className="w-16 h-16 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-4xl shadow-inner shrink-0">
            {VOCAL_PRESETS[activePresetId].icon}
          </div>

          {/* Dialogue Text Output / Input Box */}
          <div className="flex-1 w-full flex flex-col gap-2">
            <div className="min-h-[44px] p-2.5 bg-gray-950 rounded border border-gray-800 text-sm font-bold tracking-wide flex items-center">
              <span className="text-yellow-400 mr-2">*</span>
              <span className="text-gray-100">
                {isSpeaking ? animatedDialogue : dialogueText}
              </span>
              {isSpeaking && <span className="inline-block w-2 h-4 bg-yellow-400 ml-1 animate-pulse" />}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dialogueText}
                onChange={(e) => setDialogueText(e.target.value)}
                onKeyDown={handleDialogueKeyDown}
                placeholder="Type dialogue here (keystrokes trigger authentic character voice blips)..."
                className="flex-1 px-3 py-1.5 bg-gray-900 text-xs text-gray-200 rounded border border-gray-800 focus:outline-none focus:border-indigo-500 font-mono"
              />

              <button
                onClick={handleSpeakDialogue}
                disabled={!dialogueGrain || isSpeaking}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-950 font-extrabold text-xs rounded transition-colors uppercase tracking-wider shrink-0 cursor-pointer"
              >
                {isSpeaking ? 'Speaking...' : '▶ Speak'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tweakable DSP FX Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-950 p-5 rounded-xl border border-gray-800">
        {/* Column 1: Pitch & Speed */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider pb-1 border-b border-gray-800">
            <Sliders size={13} />
            <span>1. Pitch & Preamp Drive</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Pitch Shift (Varispeed)</span>
              <span className="font-mono text-indigo-400">
                {params.pitchShift >= 0 ? '+' : ''}{params.pitchShift} st
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.pitchShift}
              onChange={(e) => {
                const val = Number(e.target.value);
                setParams({
                  ...params,
                  pitchShift: val,
                  playbackRate: Math.pow(2, val / 12)
                });
              }}
              className="w-full accent-indigo-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Flowery: +4.5st | Jevil: +5.5st | Sans: -5st | Papyrus: +6st
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Warm Preamp Overdrive</span>
              <span className="font-mono text-indigo-400">{Math.round(params.drive * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.drive}
              onChange={(e) => setParams({ ...params, drive: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Soft-clipping saturation to mimic mic overloading
            </p>
          </div>
        </div>

        {/* Column 2: Vintage Sampler Resampling & Quantization */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider pb-1 border-b border-gray-800">
            <Radio size={13} />
            <span>2. Lo-Fi Sampler & Quantizer</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Clock Resample Rate</span>
              <span className="font-mono text-indigo-400">{params.resampleRate} Hz</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[8000, 11025, 16000, 22050, 32000, 44100].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setParams({ ...params, resampleRate: r })}
                  className={`py-1 rounded font-mono text-[11px] transition-colors ${
                    params.resampleRate === r
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {r >= 1000 ? `${r / 1000}k` : r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              8kHz: Sans/Amiga | 16kHz: Flowery/Jevil | 32kHz: SNES
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Bit Depth Quantization</span>
              <span className="font-mono text-indigo-400">{params.bitDepth}-bit</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              {[4, 6, 8, 10, 16].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setParams({ ...params, bitDepth: b })}
                  className={`py-1 rounded font-mono text-[11px] transition-colors ${
                    params.bitDepth === b
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {b}-bit
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              4-bit: SNES BRR | 6-bit: Spamton/Sans | 8-bit: Flowery
            </p>
          </div>
        </div>

        {/* Column 3: Nasal EQ & Special FX */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider pb-1 border-b border-gray-800">
            <Volume2 size={13} />
            <span>3. Nasal EQ & Special FX</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Nasal Presence Boost</span>
              <span className="font-mono text-indigo-400">+{params.presenceGain.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={params.presenceGain}
              onChange={(e) => setParams({ ...params, presenceGain: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Queen Ring Modulator */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-xs text-gray-300 font-semibold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!params.robotize}
                onChange={(e) => setParams({ ...params, robotize: e.target.checked })}
                className="rounded accent-indigo-500 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <Bot size={13} className="text-cyan-400" />
                Queen Robot Ring Mod
              </span>
            </label>
            {params.robotize && (
              <span className="text-[11px] font-mono text-cyan-400">{params.robotizeFreq || 105}Hz</span>
            )}
          </div>

          {/* Star Fox Radio Squelch */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300 font-semibold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!params.radioSquelch}
                onChange={(e) => setParams({ ...params, radioSquelch: e.target.checked })}
                className="rounded accent-indigo-500 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-amber-400" />
                Star Fox Radio Squelch
              </span>
            </label>
          </div>

          {/* Jevil Doubler Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300 font-semibold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.stereoDoubler}
                onChange={(e) => setParams({ ...params, stereoDoubler: e.target.checked })}
                className="rounded accent-indigo-500 w-4 h-4"
              />
              <span>Jevil Haas Doubler</span>
            </label>
            {params.stereoDoubler && (
              <span className="text-[11px] font-mono text-indigo-400">{params.doublerDelayMs}ms</span>
            )}
          </div>

          {/* Reverb / Echo */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>SNES Reverb / Echo</span>
              <span className="font-mono text-indigo-400">{Math.round(params.echoAmount * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={params.echoAmount}
              onChange={(e) => setParams({ ...params, echoAmount: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
