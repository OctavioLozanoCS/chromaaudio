import React, { useState, useEffect, useRef } from 'react';
import { ProjectState, InstrumentChannel, NoteEvent, TimelineTrack, TimelineClip, Pattern, DSPConfig } from './types/audio';
import { createDefaultProject } from './audio/defaultProject';
import { AudioEngine } from './audio/AudioEngine';
import { TypingKeyboardMapper } from './components/pianoroll/TypingKeyboardMapper';
import { TopBar } from './components/layout/TopBar';
import { ChannelRack } from './components/layout/ChannelRack';
import { PianoRollCanvas } from './components/pianoroll/PianoRollCanvas';
import { PlaylistTimeline } from './components/timeline/PlaylistTimeline';
import { ProceduralSFXGenerator } from './components/sfx/ProceduralSFXGenerator';
import { RetroVoiceLab } from './components/voice/RetroVoiceLab';
import { ConsoleDSPRackView } from './components/dsp/ConsoleDSPRackView';
import { AudioExporter } from './export/AudioExporter';
import { ExportModal } from './components/export/ExportModal';

export const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>(() => createDefaultProject());
  const [activeChannelId, setActiveChannelId] = useState<string>(project.channels[0].id);
  const [activeTab, setActiveTab] = useState<'pianoroll' | 'timeline' | 'sfx' | 'dsp' | 'voice'>('pianoroll');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackMode, setPlaybackMode] = useState<'pattern' | 'song'>('pattern');
  const [typingOctave, setTypingOctave] = useState<number>(4);
  const [activeKeyboardNotes, setActiveKeyboardNotes] = useState<Set<number>>(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const audioEngine = AudioEngine.getInstance();
  const keyboardMapperRef = useRef<TypingKeyboardMapper | null>(null);

  // Sync project, channels, tracks, and DSP with the AudioEngine
  useEffect(() => {
    audioEngine.updateProject(project);
    audioEngine.updateChannels(project.channels);
    audioEngine.updateTracks(project.tracks);
  }, [project, audioEngine]);

  useEffect(() => {
    audioEngine.dspRack.updateConfig(project.dsp);
  }, [project.dsp, audioEngine]);

  // Subscribe to playback changes
  useEffect(() => {
    const unsub = audioEngine.onPlaybackChange((playing) => {
      setIsPlaying(playing);
    });
    return unsub;
  }, [audioEngine]);

  // Active channel reference
  const activeChannel = project.channels.find(c => c.id === activeChannelId) || project.channels[0];

  // Initialize Typing Keyboard to Piano Mapper (FL Studio Ergonomics)
  useEffect(() => {
    keyboardMapperRef.current = new TypingKeyboardMapper(
      (midiNote) => {
        setActiveKeyboardNotes(prev => new Set(prev).add(midiNote));
        const ch = project.channels.find(c => c.id === activeChannelId) || project.channels[0];
        audioEngine.triggerNoteOn(ch, midiNote, 0.85);
      },
      (midiNote) => {
        setActiveKeyboardNotes(prev => {
          const next = new Set(prev);
          next.delete(midiNote);
          return next;
        });
        const ch = project.channels.find(c => c.id === activeChannelId) || project.channels[0];
        audioEngine.triggerNoteOff(ch, midiNote);
      },
      (newOctave) => {
        setTypingOctave(newOctave);
      }
    );

    // Release all active visual notes when window blurs
    const handleWindowBlur = () => {
      setActiveKeyboardNotes(new Set());
      keyboardMapperRef.current?.releaseAllNotes();
    };

    // Global Spacebar Play/Pause listener
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (audioEngine.isPlaying) {
          audioEngine.stop();
        } else {
          audioEngine.play(project, playbackMode);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      keyboardMapperRef.current?.destroy();
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [project, activeChannelId, playbackMode, audioEngine]);

  // Transport handlers
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
    } else {
      audioEngine.play(project, playbackMode);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
  };

  // Pattern note handlers
  const activePattern = project.patterns.find(p => p.id === project.activePatternId) || project.patterns[0];
  const activeNotes = activePattern.notesByChannel[activeChannelId] || [];

  const handleAddNote = (newNote: NoteEvent) => {
    const updatedNotes = [...activeNotes, newNote];
    const updatedPattern = {
      ...activePattern,
      notesByChannel: {
        ...activePattern.notesByChannel,
        [activeChannelId]: updatedNotes
      }
    };
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === activePattern.id ? updatedPattern : p)
    }));
  };

  const handleBatchUpdateNotes = (updatedNotes: NoteEvent[]) => {
    const updatedPattern = {
      ...activePattern,
      notesByChannel: {
        ...activePattern.notesByChannel,
        [activeChannelId]: updatedNotes
      }
    };
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === activePattern.id ? updatedPattern : p)
    }));
  };

  const handleApplyFullArrangement = (notesByChannel: Record<string, NoteEvent[]>) => {
    const updatedPattern = {
      ...activePattern,
      notesByChannel: {
        ...activePattern.notesByChannel,
        ...notesByChannel
      }
    };
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === activePattern.id ? updatedPattern : p)
    }));
  };

  const handleApplyMultiPatternIntroLoop = (
    introNotesByChannel: Record<string, NoteEvent[]>,
    loopNotesByChannel: Record<string, NoteEvent[]>,
    styleName: string
  ) => {
    const timestamp = Date.now();
    const introPatternId = `pat_intro_${timestamp}`;
    const loopPatternId = `pat_loop_${timestamp}`;

    const introPattern: Pattern = {
      id: introPatternId,
      name: `${styleName} - Intro`,
      lengthSteps: 64,
      notesByChannel: introNotesByChannel
    };

    const loopPattern: Pattern = {
      id: loopPatternId,
      name: `${styleName} - Loop`,
      lengthSteps: 64,
      notesByChannel: loopNotesByChannel
    };

    // Track 0: Intro (0-64), Loop (64-128), Loop Repeat (128-192)
    const clipIntro: TimelineClip = {
      id: `clip_${timestamp}_intro`,
      trackIndex: 0,
      startStep: 0,
      lengthSteps: 64,
      patternId: introPatternId,
      name: `${styleName} - Intro`,
      color: '#f59e0b',
      muted: false
    };

    const clipLoop1: TimelineClip = {
      id: `clip_${timestamp}_loop1`,
      trackIndex: 0,
      startStep: 64,
      lengthSteps: 64,
      patternId: loopPatternId,
      name: `${styleName} - Loop`,
      color: '#6366f1',
      muted: false
    };

    const clipLoop2: TimelineClip = {
      id: `clip_${timestamp}_loop2`,
      trackIndex: 0,
      startStep: 128,
      lengthSteps: 64,
      patternId: loopPatternId,
      name: `${styleName} - Loop (2)`,
      color: '#818cf8',
      muted: false
    };

    const updatedPatterns = [...project.patterns, introPattern, loopPattern];
    const updatedClips = [...project.timelineClips, clipIntro, clipLoop1, clipLoop2];

    setProject(prev => ({
      ...prev,
      patterns: updatedPatterns,
      activePatternId: loopPatternId,
      timelineClips: updatedClips,
      loopStartStep: 64,
      loopLengthSteps: 64
    }));

    audioEngine.updateProject({
      ...project,
      patterns: updatedPatterns,
      activePatternId: loopPatternId,
      timelineClips: updatedClips,
      loopStartStep: 64,
      loopLengthSteps: 64
    });
  };

  const handleUpdateNote = (updatedNote: NoteEvent) => {
    const updatedNotes = activeNotes.map(n => n.id === updatedNote.id ? updatedNote : n);
    const updatedPattern = {
      ...activePattern,
      notesByChannel: {
        ...activePattern.notesByChannel,
        [activeChannelId]: updatedNotes
      }
    };
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === activePattern.id ? updatedPattern : p)
    }));
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = activeNotes.filter(n => n.id !== noteId);
    const updatedPattern = {
      ...activePattern,
      notesByChannel: {
        ...activePattern.notesByChannel,
        [activeChannelId]: updatedNotes
      }
    };
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === activePattern.id ? updatedPattern : p)
    }));
  };

  const handleUpdateVelocity = (noteId: string, velocity: number) => {
    const updatedNotes = activeNotes.map(n => n.id === noteId ? { ...n, velocity } : n);
    const updatedPattern = {
      ...activePattern,
      notesByChannel: {
        ...activePattern.notesByChannel,
        [activeChannelId]: updatedNotes
      }
    };
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === activePattern.id ? updatedPattern : p)
    }));
  };

  const handleClearChannelNotes = (channelId: string, patternId?: string) => {
    const targetPatternId = patternId || project.activePatternId;

    setProject(prev => {
      let updatedPatterns: Pattern[];
      if (patternId === 'all') {
        updatedPatterns = prev.patterns.map(p => ({
          ...p,
          notesByChannel: {
            ...p.notesByChannel,
            [channelId]: []
          }
        }));
      } else {
        updatedPatterns = prev.patterns.map(p => {
          if (p.id !== targetPatternId) return p;
          return {
            ...p,
            notesByChannel: {
              ...p.notesByChannel,
              [channelId]: []
            }
          };
        });
      }

      const updatedProject = {
        ...prev,
        patterns: updatedPatterns
      };

      audioEngine.updateProject(updatedProject);
      return updatedProject;
    });
  };

  // Channel management
  const handleUpdateChannel = (updated: InstrumentChannel) => {
    setProject(prev => ({
      ...prev,
      channels: prev.channels.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const handleExclusiveSoloChannel = (channelId: string) => {
    setProject(prev => {
      const targetCh = prev.channels.find(c => c.id === channelId);
      const isAlreadyOnlySoloed = targetCh?.solo && prev.channels.every(c => c.id === channelId || !c.solo);

      return {
        ...prev,
        channels: prev.channels.map(c => ({
          ...c,
          solo: isAlreadyOnlySoloed ? false : c.id === channelId
        }))
      };
    });
  };

  const handleAddChannel = (customChannel?: InstrumentChannel) => {
    const newId = customChannel?.id || `ch_${Date.now()}`;
    const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#c084fc', '#f87171'];
    const newChannel: InstrumentChannel = customChannel || {
      id: newId,
      name: `Channel ${project.channels.length + 1}`,
      color: colors[project.channels.length % colors.length],
      type: 'chip_synth',
      preset: 'pulse_50',
      volume: 0.8,
      pan: 0,
      mute: false,
      solo: false,
      octaveOffset: 0,
      attack: 0.01,
      decay: 0.15,
      sustain: 0.6,
      release: 0.15
    };
    setProject(prev => ({
      ...prev,
      channels: [...prev.channels, newChannel]
    }));
    setActiveChannelId(newId);
  };

  const handleDeleteChannel = (id: string) => {
    if (project.channels.length <= 1) return;
    setProject(prev => ({
      ...prev,
      channels: prev.channels.filter(c => c.id !== id)
    }));
    if (activeChannelId === id) {
      setActiveChannelId(project.channels[0].id);
    }
  };

  // Pattern Management
  const handleSelectActivePattern = (patternId: string) => {
    setProject(prev => ({ ...prev, activePatternId: patternId }));
  };

  const handleCreatePattern = () => {
    const newId = `pat_${Date.now()}`;
    const newName = `Pattern ${project.patterns.length + 1}`;
    const newPattern: Pattern = {
      id: newId,
      name: newName,
      lengthSteps: 64,
      notesByChannel: {}
    };
    setProject(prev => ({
      ...prev,
      patterns: [...prev.patterns, newPattern],
      activePatternId: newId
    }));
  };

  const handleDuplicatePattern = (patternId: string) => {
    const target = project.patterns.find(p => p.id === patternId);
    if (!target) return;
    const newId = `pat_${Date.now()}`;
    const newName = `${target.name} (Copy)`;
    const newPattern: Pattern = {
      ...target,
      id: newId,
      name: newName,
      notesByChannel: JSON.parse(JSON.stringify(target.notesByChannel))
    };
    setProject(prev => ({
      ...prev,
      patterns: [...prev.patterns, newPattern],
      activePatternId: newId
    }));
  };

  const handleRenamePattern = (patternId: string, newName: string) => {
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => p.id === patternId ? { ...p, name: newName } : p),
      timelineClips: prev.timelineClips.map(c => c.patternId === patternId ? { ...c, name: newName } : c)
    }));
  };

  const handleDeletePattern = (patternId: string) => {
    if (project.patterns.length <= 1) return;
    const remaining = project.patterns.filter(p => p.id !== patternId);
    setProject(prev => ({
      ...prev,
      patterns: remaining,
      activePatternId: prev.activePatternId === patternId ? remaining[0].id : prev.activePatternId,
      timelineClips: prev.timelineClips.filter(c => c.patternId !== patternId)
    }));
  };

  // Project serialization handlers
  const handleNewProject = () => {
    if (confirm('Create a new blank project? Any unsaved changes will be lost.')) {
      audioEngine.stop();
      const freshProject = createDefaultProject();
      freshProject.name = `New Project ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      freshProject.patterns = [
        {
          id: 'pat_1',
          name: 'Pattern 1',
          lengthSteps: 64,
          notesByChannel: {}
        }
      ];
      freshProject.timelineClips = [
        {
          id: 'clip_1',
          trackIndex: 0,
          startStep: 0,
          lengthSteps: 64,
          patternId: 'pat_1',
          name: 'Pattern 1',
          color: '#4f46e5',
          muted: false
        }
      ];
      freshProject.loopStartStep = 0;
      freshProject.loopLengthSteps = 64;
      setProject(freshProject);
      setActiveChannelId(freshProject.channels[0].id);
      audioEngine.updateProject(freshProject);
      audioEngine.updateChannels(freshProject.channels);
    }
  };

  const handleChangeProjectName = (name: string) => {
    setProject(prev => ({ ...prev, name }));
  };

  const handleSaveProject = () => {
    AudioExporter.saveProjectFile(project);
  };

  const handleLoadProjectFile = async (file: File) => {
    try {
      const loaded = await AudioExporter.loadProjectFile(file);
      setProject(loaded);
      setActiveChannelId(loaded.channels[0]?.id || 'ch_lead_gb');
      audioEngine.currentBpm = loaded.bpm;
      audioEngine.updateChannels(loaded.channels);
      audioEngine.dspRack.updateConfig(loaded.dsp);
    } catch (err: any) {
      alert(`Could not load project: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-gray-100 font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
      <TopBar
        isPlaying={isPlaying}
        bpm={project.bpm}
        playbackMode={playbackMode}
        activeTab={activeTab}
        snapGrid={project.snapGrid}
        scaleRoot={project.scaleRoot}
        scaleMode={project.scaleMode}
        typingOctave={typingOctave}
        projectName={project.name}
        onChangeProjectName={handleChangeProjectName}
        onNewProject={handleNewProject}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onChangeBpm={(bpm) => {
          setProject(prev => ({ ...prev, bpm }));
          audioEngine.currentBpm = bpm;
        }}
        onToggleMode={(mode) => {
          setPlaybackMode(mode);
          if (isPlaying) {
            audioEngine.stop();
            audioEngine.play(project, mode);
          }
        }}
        onSelectTab={setActiveTab}
        onChangeSnap={(snap) => setProject(prev => ({ ...prev, snapGrid: snap }))}
        onChangeScaleRoot={(root) => setProject(prev => ({ ...prev, scaleRoot: root }))}
        onChangeScaleMode={(mode) => setProject(prev => ({ ...prev, scaleMode: mode }))}
        onSaveProject={handleSaveProject}
        onLoadProjectFile={handleLoadProjectFile}
        onExportWav={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Channel Rack */}
        <ChannelRack
          channels={project.channels}
          activeChannelId={activeChannelId}
          patterns={project.patterns}
          activePatternId={project.activePatternId}
          onSelectChannel={setActiveChannelId}
          onUpdateChannel={handleUpdateChannel}
          onExclusiveSoloChannel={handleExclusiveSoloChannel}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
          onClearChannelNotes={handleClearChannelNotes}
        />

        {/* Center / Right Panel: Active Tab View */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950">
          {activeTab === 'pianoroll' && (
            <PianoRollCanvas
              channel={activeChannel}
              notes={activeNotes}
              lengthSteps={activePattern.lengthSteps}
              scaleRoot={project.scaleRoot}
              scaleMode={project.scaleMode}
              snapGrid={project.snapGrid}
              activeKeyboardNotes={activeKeyboardNotes}
              typingOctave={typingOctave}
              bpm={project.bpm}
              channels={project.channels}
              patterns={project.patterns}
              activePatternId={project.activePatternId}
              dsp={project.dsp}
              onChangeBpm={(bpm) => {
                setProject(prev => ({ ...prev, bpm }));
                audioEngine.currentBpm = bpm;
              }}
              onChangeScaleRoot={(root) => setProject(prev => ({ ...prev, scaleRoot: root }))}
              onChangeScaleMode={(mode) => setProject(prev => ({ ...prev, scaleMode: mode }))}
              onUpdateDSP={(dsp) => setProject(prev => ({ ...prev, dsp: { ...prev.dsp, ...dsp } }))}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onUpdateVelocity={handleUpdateVelocity}
              onBatchUpdateNotes={handleBatchUpdateNotes}
              onClearChannelNotes={handleClearChannelNotes}
              onApplyFullArrangement={handleApplyFullArrangement}
              onApplyMultiPatternIntroLoop={handleApplyMultiPatternIntroLoop}
            />
          )}

          {activeTab === 'timeline' && (
            <PlaylistTimeline
              tracks={project.tracks}
              clips={project.timelineClips}
              patterns={project.patterns}
              activePatternId={project.activePatternId}
              loopStartStep={project.loopStartStep}
              loopLengthSteps={project.loopLengthSteps}
              onUpdateTracks={(tracks) => setProject(prev => ({ ...prev, tracks }))}
              onUpdateClips={(clips) => setProject(prev => ({ ...prev, timelineClips: clips }))}
              onUpdateLoop={(start, length) => setProject(prev => ({ ...prev, loopStartStep: start, loopLengthSteps: length }))}
              onSelectActivePattern={handleSelectActivePattern}
              onCreatePattern={handleCreatePattern}
              onDuplicatePattern={handleDuplicatePattern}
              onRenamePattern={handleRenamePattern}
              onDeletePattern={handleDeletePattern}
            />
          )}

          {activeTab === 'sfx' && (
            <ProceduralSFXGenerator onAddChannel={handleAddChannel} />
          )}

          {activeTab === 'voice' && (
            <RetroVoiceLab onAddChannel={handleAddChannel} />
          )}

          {activeTab === 'dsp' && (
            <ConsoleDSPRackView
              dsp={project.dsp}
              onUpdateDSP={(dsp) => setProject(prev => ({ ...prev, dsp }))}
            />
          )}
        </main>
      </div>

      {/* Game Audio Exporter Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        project={project}
        activePattern={activePattern}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default App;
