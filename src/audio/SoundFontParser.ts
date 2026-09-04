/**
 * High-performance binary SoundFont 2 (.sf2) and audio sample parser for Web Audio.
 * Features:
 * - Parses standard RIFF sfbk containers, LIST INFO, LIST sdta (smpl 16-bit PCM), and LIST pdta
 * - Extracts sample headers (shdr), presets (phdr), and key-zoned sample mappings
 * - Converts raw signed 16-bit PCM into native Web Audio AudioBuffers
 * - Decodes sample loop points (dwStartloop, dwEndloop) and root pitch keys (byOriginalKey)
 * - Supports direct single/multi-WAV sample decoding via AudioContext.decodeAudioData
 */

export interface ParsedSampleZone {
  name: string;
  buffer: AudioBuffer;
  rootKey: number; // MIDI key (0 - 127), e.g. 60 for C4
  minKey: number;
  maxKey: number;
  loopStart?: number; // In seconds
  loopEnd?: number; // In seconds
  isLooped: boolean;
}

export interface ParsedSoundFontPreset {
  id: string;
  name: string;
  bankName: string;
  zones: ParsedSampleZone[];
}

export class SoundFontParser {
  /**
   * Parse an SF2 binary ArrayBuffer and return all playable presets with AudioBuffers
   */
  public static async parseSf2(
    buffer: ArrayBuffer,
    audioCtx: BaseAudioContext
  ): Promise<ParsedSoundFontPreset[]> {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Helper to read 4-character ASCII tag
    const readTag = (offset: number): string => {
      let tag = '';
      for (let i = 0; i < 4; i++) {
        tag += String.fromCharCode(bytes[offset + i]);
      }
      return tag;
    };

    // Helper to read null-terminated ASCII string
    const readString = (offset: number, length: number): string => {
      let str = '';
      for (let i = 0; i < length; i++) {
        const c = bytes[offset + i];
        if (c === 0) break;
        str += String.fromCharCode(c);
      }
      return str.trim();
    };

    // 1. Verify RIFF sfbk header
    if (readTag(0) !== 'RIFF' || readTag(8) !== 'sfbk') {
      throw new Error('Not a valid SoundFont 2 (.sf2) file: Missing RIFF sfbk header');
    }

    let bankName = 'Custom SoundFont';
    let smplOffset = 0;
    let smplLength = 0;

    // Table offsets in pdta
    let phdrOffset = 0;
    let phdrSize = 0;
    let shdrOffset = 0;
    let shdrSize = 0;

    // Scan top-level LIST chunks
    let offset = 12;
    const totalLength = buffer.byteLength;

    while (offset < totalLength - 8) {
      const chunkTag = readTag(offset);
      const chunkSize = view.getUint32(offset + 4, true);
      const chunkEnd = offset + 8 + chunkSize;

      if (chunkTag === 'LIST') {
        const listType = readTag(offset + 8);
        let listOffset = offset + 12;

        if (listType === 'INFO') {
          // Parse INFO subchunks (e.g. INAM for bank name)
          while (listOffset < chunkEnd - 8) {
            const subTag = readTag(listOffset);
            const subSize = view.getUint32(listOffset + 4, true);
            if (subTag === 'INAM') {
              bankName = readString(listOffset + 8, subSize);
            }
            listOffset += 8 + subSize + (subSize % 2); // Word aligned
          }
        } else if (listType === 'sdta') {
          // Parse sdta subchunks (smpl)
          while (listOffset < chunkEnd - 8) {
            const subTag = readTag(listOffset);
            const subSize = view.getUint32(listOffset + 4, true);
            if (subTag === 'smpl') {
              smplOffset = listOffset + 8;
              smplLength = subSize;
            }
            listOffset += 8 + subSize + (subSize % 2);
          }
        } else if (listType === 'pdta') {
          // Parse pdta subchunks
          while (listOffset < chunkEnd - 8) {
            const subTag = readTag(listOffset);
            const subSize = view.getUint32(listOffset + 4, true);
            const subDataOffset = listOffset + 8;

            switch (subTag) {
              case 'phdr':
                phdrOffset = subDataOffset;
                phdrSize = subSize;
                break;
              case 'shdr':
                shdrOffset = subDataOffset;
                shdrSize = subSize;
                break;
            }
            listOffset += 8 + subSize + (subSize % 2);
          }
        }
      }

      offset = chunkEnd + (chunkSize % 2); // 16-bit word alignment
    }

    if (!smplOffset || !shdrOffset) {
      throw new Error('Incomplete SoundFont file: Missing sample data or sample headers');
    }

    // 2. Parse Sample Headers (shdr) - 46 bytes each
    interface SampleMeta {
      id: number;
      name: string;
      start: number;
      end: number;
      startLoop: number;
      endLoop: number;
      sampleRate: number;
      originalKey: number;
      correction: number;
      sampleType: number;
      audioBuffer?: AudioBuffer;
    }

    const samples: SampleMeta[] = [];
    const sampleRecordCount = Math.floor(shdrSize / 46);

    for (let i = 0; i < sampleRecordCount; i++) {
      const rec = shdrOffset + (i * 46);
      const name = readString(rec, 20);
      if (name === 'EOS') break; // End of Samples terminal entry

      const start = view.getUint32(rec + 20, true);
      const end = view.getUint32(rec + 24, true);
      const startLoop = view.getUint32(rec + 28, true);
      const endLoop = view.getUint32(rec + 32, true);
      const sampleRate = view.getUint32(rec + 36, true);
      const originalKey = view.getUint8(rec + 40);
      const correction = view.getInt8(rec + 41);
      const sampleType = view.getUint16(rec + 44, true);

      samples.push({
        id: i,
        name,
        start,
        end,
        startLoop,
        endLoop,
        sampleRate: sampleRate > 0 ? sampleRate : 44100,
        originalKey: originalKey >= 0 && originalKey <= 127 ? originalKey : 60,
        correction,
        sampleType
      });
    }

    // 3. Convert 16-bit PCM samples into Web Audio AudioBuffers
    const pcm16 = new Int16Array(buffer, smplOffset, Math.floor(smplLength / 2));

    for (const s of samples) {
      const numSamples = Math.max(0, s.end - s.start);
      if (numSamples <= 0 || s.start >= pcm16.length) continue;

      const audioBuf = audioCtx.createBuffer(1, numSamples, s.sampleRate);
      const channelData = audioBuf.getChannelData(0);

      const maxCopy = Math.min(numSamples, pcm16.length - s.start);
      for (let j = 0; j < maxCopy; j++) {
        channelData[j] = pcm16[s.start + j] / 32768.0;
      }

      s.audioBuffer = audioBuf;
    }

    // 4. Build Presets and Individual Instruments
    const presets: ParsedSoundFontPreset[] = [];

    // If phdr contains preset records, extract them
    if (phdrOffset && phdrSize >= 38) {
      const presetCount = Math.floor(phdrSize / 38);

      for (let p = 0; p < presetCount; p++) {
        const pRec = phdrOffset + (p * 38);
        const pName = readString(pRec, 20);
        if (pName === 'EOP') break; // End of presets

        const pNum = view.getUint16(pRec + 20, true);

        // Group samples for this preset
        const zones: ParsedSampleZone[] = [];

        samples.forEach((s) => {
          if (!s.audioBuffer) return;
          const isLooped = s.endLoop > s.startLoop && s.startLoop >= s.start && s.endLoop <= s.end;
          const loopStartSec = isLooped ? (s.startLoop - s.start) / s.sampleRate : undefined;
          const loopEndSec = isLooped ? (s.endLoop - s.start) / s.sampleRate : undefined;

          zones.push({
            name: s.name,
            buffer: s.audioBuffer,
            rootKey: s.originalKey,
            minKey: Math.max(0, s.originalKey - 12),
            maxKey: Math.min(127, s.originalKey + 12),
            loopStart: loopStartSec,
            loopEnd: loopEndSec,
            isLooped
          });
        });

        if (zones.length > 0) {
          presets.push({
            id: `sf2_${bankName.toLowerCase().replace(/\s+/g, '_')}_p${pNum}_${pName.toLowerCase().replace(/\s+/g, '_')}`,
            name: pName || `Preset ${pNum}`,
            bankName,
            zones
          });
        }
      }
    }

    // Always expose individual named samples so users can audition any specific sound
    samples.forEach((s) => {
      if (!s.audioBuffer) return;
      const isLooped = s.endLoop > s.startLoop && s.startLoop >= s.start && s.endLoop <= s.end;
      const loopStartSec = isLooped ? (s.startLoop - s.start) / s.sampleRate : undefined;
      const loopEndSec = isLooped ? (s.endLoop - s.start) / s.sampleRate : undefined;

      presets.push({
        id: `sf2_sample_${s.name.toLowerCase().replace(/\s+/g, '_')}_${s.id}`,
        name: s.name,
        bankName,
        zones: [
          {
            name: s.name,
            buffer: s.audioBuffer,
            rootKey: s.originalKey,
            minKey: 0,
            maxKey: 127,
            loopStart: loopStartSec,
            loopEnd: loopEndSec,
            isLooped
          }
        ]
      });
    });

    return presets;
  }

  /**
   * Parse a single WAV file or custom sample into a SoundFont Preset
   */
  public static async parseWavFile(
    file: File,
    audioCtx: BaseAudioContext
  ): Promise<ParsedSoundFontPreset> {
    const arrayBuf = await file.arrayBuffer();
    const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    return {
      id: `custom_wav_${cleanName.toLowerCase().replace(/\s+/g, '_')}`,
      name: cleanName,
      bankName: 'Imported Samples',
      zones: [
        {
          name: cleanName,
          buffer: audioBuf,
          rootKey: 60, // Middle C
          minKey: 0,
          maxKey: 127,
          isLooped: false
        }
      ]
    };
  }
}
