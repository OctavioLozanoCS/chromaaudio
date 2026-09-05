/**
 * High-performance binary SoundFont 2 (.sf2) and audio sample parser for Web Audio.
 * Features:
 * - Parses standard RIFF sfbk containers, LIST INFO, LIST sdta (smpl 16-bit PCM), and LIST pdta
 * - Decodes complete SoundFont 2.04 generator hierarchy: phdr -> pbag -> pgen -> inst -> ibag -> igen -> shdr
 * - Correctly isolates instrument-specific sample zones (Piano, Strings, Brass, Drums, etc.) so each preset plays its true samples
 * - Converts raw signed 16-bit PCM into native Web Audio AudioBuffers with microtonal fine/coarse tuning
 * - Decodes sample loop points (dwStartloop, dwEndloop) and overriding root pitch keys
 * - Supports direct single/multi-WAV sample decoding via AudioContext.decodeAudioData
 */

export interface ParsedSampleZone {
  name: string;
  buffer: AudioBuffer;
  rootKey: number; // MIDI key (0 - 127), e.g. 60 for C4
  minKey: number;
  maxKey: number;
  correction?: number; // Pitch correction in cents
  loopStart?: number; // In seconds
  loopEnd?: number; // In seconds
  isLooped: boolean;
}

export interface ParsedSoundFontPreset {
  id: string;
  name: string;
  bankName: string;
  presetNum?: number;
  bankNum?: number;
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
    let phdrOffset = 0, phdrSize = 0;
    let pbagOffset = 0, pbagSize = 0;
    let pgenOffset = 0, pgenSize = 0;
    let instOffset = 0, instSize = 0;
    let ibagOffset = 0, ibagSize = 0;
    let igenOffset = 0, igenSize = 0;
    let shdrOffset = 0, shdrSize = 0;

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
              bankName = readString(listOffset + 8, subSize) || bankName;
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
          // Parse pdta subchunks: phdr, pbag, pgen, inst, ibag, igen, shdr
          while (listOffset < chunkEnd - 8) {
            const subTag = readTag(listOffset);
            const subSize = view.getUint32(listOffset + 4, true);
            const subDataOffset = listOffset + 8;

            switch (subTag) {
              case 'phdr': phdrOffset = subDataOffset; phdrSize = subSize; break;
              case 'pbag': pbagOffset = subDataOffset; pbagSize = subSize; break;
              case 'pgen': pgenOffset = subDataOffset; pgenSize = subSize; break;
              case 'inst': instOffset = subDataOffset; instSize = subSize; break;
              case 'ibag': ibagOffset = subDataOffset; ibagSize = subSize; break;
              case 'igen': igenOffset = subDataOffset; igenSize = subSize; break;
              case 'shdr': shdrOffset = subDataOffset; shdrSize = subSize; break;
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
    let pcm16: Int16Array;
    if (smplOffset % 2 === 0) {
      pcm16 = new Int16Array(buffer, smplOffset, Math.floor(smplLength / 2));
    } else {
      const copyBuf = buffer.slice(smplOffset, smplOffset + smplLength);
      pcm16 = new Int16Array(copyBuf, 0, Math.floor(smplLength / 2));
    }

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

    // 4. Parse Instrument Definitions (inst, ibag, igen)
    interface InstZoneMeta {
      sampleId: number;
      minKey: number;
      maxKey: number;
      rootKey?: number;
      correction?: number;
      isLooped?: boolean;
    }

    const instrumentZonesMap = new Map<number, InstZoneMeta[]>();

    if (instOffset && ibagOffset && igenOffset && instSize >= 22 && ibagSize >= 4 && igenSize >= 4) {
      const instCount = Math.floor(instSize / 22);
      const ibagCount = Math.floor(ibagSize / 4);
      const igenCount = Math.floor(igenSize / 4);

      // Read inst headers
      const instHeaders: { name: string; bagNdx: number }[] = [];
      for (let i = 0; i < instCount; i++) {
        const rec = instOffset + (i * 22);
        const name = readString(rec, 20);
        const bagNdx = view.getUint16(rec + 20, true);
        instHeaders.push({ name, bagNdx });
      }

      // Read ibag records (wInstGenNdx)
      const ibags: number[] = [];
      for (let i = 0; i < ibagCount; i++) {
        const rec = ibagOffset + (i * 4);
        ibags.push(view.getUint16(rec, true));
      }

      // Read igen records (oper, amount)
      const igens: { oper: number; amount: number }[] = [];
      for (let i = 0; i < igenCount; i++) {
        const rec = igenOffset + (i * 4);
        igens.push({
          oper: view.getUint16(rec, true),
          amount: view.getUint16(rec + 2, true)
        });
      }

      // For each instrument (excluding terminal EOI)
      for (let i = 0; i < instHeaders.length - 1; i++) {
        const bagStart = instHeaders[i].bagNdx;
        const bagEnd = Math.min(ibags.length, instHeaders[i + 1].bagNdx);
        const zones: InstZoneMeta[] = [];

        // Global instrument zone variables
        let globalMinKey = 0;
        let globalMaxKey = 127;
        let globalRootKey: number | undefined = undefined;
        let globalLooped: boolean | undefined = undefined;

        for (let b = bagStart; b < bagEnd; b++) {
          const genStart = ibags[b];
          const genEnd = b + 1 < ibags.length ? Math.min(igens.length, ibags[b + 1]) : igens.length;

          let sampleId: number | null = null;
          let minKey: number = globalMinKey;
          let maxKey: number = globalMaxKey;
          let rootKey: number | undefined = globalRootKey;
          let isLooped: boolean | undefined = globalLooped;
          let coarseTune = 0;
          let fineTune = 0;

          for (let g = genStart; g < genEnd; g++) {
            const gen = igens[g];
            switch (gen.oper) {
              case 53: // sampleID
                sampleId = gen.amount;
                break;
              case 43: // keyRange
                minKey = gen.amount & 0xFF;
                maxKey = (gen.amount >> 8) & 0xFF;
                break;
              case 58: // overridingRootKey
                rootKey = gen.amount & 0x7F;
                break;
              case 54: // sampleModes
                isLooped = (gen.amount & 0x03) === 1 || (gen.amount & 0x03) === 3;
                break;
              case 51: // coarseTune
                coarseTune = (gen.amount << 16) >> 16;
                break;
              case 52: // fineTune
                fineTune = (gen.amount << 16) >> 16;
                break;
            }
          }

          if (sampleId === null) {
            // Global bag sets defaults for subsequent zones in this instrument
            globalMinKey = minKey;
            globalMaxKey = maxKey;
            globalRootKey = rootKey;
            globalLooped = isLooped;
          } else if (sampleId >= 0 && sampleId < samples.length) {
            const totalCorrection = coarseTune * 100 + fineTune;
            zones.push({
              sampleId,
              minKey,
              maxKey,
              rootKey,
              correction: totalCorrection,
              isLooped
            });
          }
        }

        instrumentZonesMap.set(i, zones);
      }
    }

    // 5. Parse Presets (phdr, pbag, pgen)
    const presets: ParsedSoundFontPreset[] = [];

    if (phdrOffset && pbagOffset && pgenOffset && phdrSize >= 38 && pbagSize >= 4 && pgenSize >= 4) {
      const presetCount = Math.floor(phdrSize / 38);
      const pbagCount = Math.floor(pbagSize / 4);
      const pgenCount = Math.floor(pgenSize / 4);

      interface PhdrMeta {
        name: string;
        presetNum: number;
        bankNum: number;
        bagNdx: number;
      }
      const phdrs: PhdrMeta[] = [];
      for (let p = 0; p < presetCount; p++) {
        const rec = phdrOffset + (p * 38);
        const name = readString(rec, 20);
        const presetNum = view.getUint16(rec + 20, true);
        const bankNum = view.getUint16(rec + 22, true);
        const bagNdx = view.getUint16(rec + 24, true);
        phdrs.push({ name, presetNum, bankNum, bagNdx });
      }

      const pbags: number[] = [];
      for (let i = 0; i < pbagCount; i++) {
        const rec = pbagOffset + (i * 4);
        pbags.push(view.getUint16(rec, true));
      }

      const pgens: { oper: number; amount: number }[] = [];
      for (let i = 0; i < pgenCount; i++) {
        const rec = pgenOffset + (i * 4);
        pgens.push({
          oper: view.getUint16(rec, true),
          amount: view.getUint16(rec + 2, true)
        });
      }

      // For each preset (excluding terminal EOP)
      for (let p = 0; p < phdrs.length - 1; p++) {
        const phdr = phdrs[p];
        const bagStart = phdr.bagNdx;
        const bagEnd = Math.min(pbags.length, phdrs[p + 1].bagNdx);

        const presetZones: ParsedSampleZone[] = [];

        let globalMinKey = 0;
        let globalMaxKey = 127;

        for (let pb = bagStart; pb < bagEnd; pb++) {
          const genStart = pbags[pb];
          const genEnd = pb + 1 < pbags.length ? Math.min(pgens.length, pbags[pb + 1]) : pgens.length;

          let instIdx: number | null = null;
          let presetMinKey = globalMinKey;
          let presetMaxKey = globalMaxKey;

          for (let g = genStart; g < genEnd; g++) {
            const gen = pgens[g];
            if (gen.oper === 41) { // instrument
              instIdx = gen.amount;
            } else if (gen.oper === 43) { // keyRange
              presetMinKey = gen.amount & 0xFF;
              presetMaxKey = (gen.amount >> 8) & 0xFF;
            }
          }

          if (instIdx === null) {
            globalMinKey = presetMinKey;
            globalMaxKey = presetMaxKey;
          } else {
            // Copy zones from referenced instrument
            const iZones = instrumentZonesMap.get(instIdx) || [];
            iZones.forEach(iz => {
              const s = samples[iz.sampleId];
              if (!s || !s.audioBuffer) return;

              const effectiveMinKey = Math.max(presetMinKey, iz.minKey);
              const effectiveMaxKey = Math.min(presetMaxKey, iz.maxKey);
              if (effectiveMinKey > effectiveMaxKey) return;

              const loopActive = iz.isLooped !== undefined
                ? iz.isLooped
                : (s.endLoop > s.startLoop && s.startLoop >= s.start && s.endLoop <= s.end);
              const loopStartSec = loopActive ? (s.startLoop - s.start) / s.sampleRate : undefined;
              const loopEndSec = loopActive ? (s.endLoop - s.start) / s.sampleRate : undefined;

              const finalRootKey = iz.rootKey !== undefined ? iz.rootKey : s.originalKey;
              const finalCorrection = (s.correction || 0) + (iz.correction || 0);

              presetZones.push({
                name: s.name,
                buffer: s.audioBuffer,
                rootKey: finalRootKey,
                minKey: effectiveMinKey,
                maxKey: effectiveMaxKey,
                correction: finalCorrection,
                loopStart: loopStartSec,
                loopEnd: loopEndSec,
                isLooped: loopActive
              });
            });
          }
        }

        if (presetZones.length > 0) {
          const isDrums = phdr.bankNum === 128 || phdr.bankNum === 0x80;
          const numPrefix = `${phdr.presetNum.toString().padStart(3, '0')}: `;
          let displayName = phdr.name || `Preset ${phdr.presetNum}`;
          
          if (isDrums) {
            displayName = `🥁 ${displayName} (Drums)`;
          } else if (phdr.bankNum > 0) {
            displayName = `${numPrefix}${displayName} (Bank ${phdr.bankNum})`;
          } else {
            displayName = `${numPrefix}${displayName}`;
          }

          const cleanBank = bankName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const cleanName = (phdr.name || `p${phdr.presetNum}`).toLowerCase().replace(/[^a-z0-9]/g, '_');

          presets.push({
            id: `sf2_${cleanBank}_b${phdr.bankNum}_p${phdr.presetNum}_${cleanName}`,
            name: displayName,
            bankName,
            presetNum: phdr.presetNum,
            bankNum: phdr.bankNum,
            zones: presetZones
          });
        }
      }
    }

    // 6. Fallback for soundfonts without instrument chunks: expose individual samples
    if (presets.length === 0) {
      samples.forEach((s) => {
        if (!s.audioBuffer) return;
        const isLooped = s.endLoop > s.startLoop && s.startLoop >= s.start && s.endLoop <= s.end;
        const loopStartSec = isLooped ? (s.startLoop - s.start) / s.sampleRate : undefined;
        const loopEndSec = isLooped ? (s.endLoop - s.start) / s.sampleRate : undefined;

        presets.push({
          id: `sf2_sample_${s.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${s.id}`,
          name: s.name,
          bankName,
          zones: [
            {
              name: s.name,
              buffer: s.audioBuffer,
              rootKey: s.originalKey,
              minKey: 0,
              maxKey: 127,
              correction: s.correction,
              loopStart: loopStartSec,
              loopEnd: loopEndSec,
              isLooped
            }
          ]
        });
      });
    }

    // Sort presets: Bank 0 first (000 to 127), then variation banks, then drum kits
    presets.sort((a, b) => {
      const bankA = a.bankNum ?? 0;
      const bankB = b.bankNum ?? 0;
      if (bankA !== bankB) return bankA - bankB;
      const pA = a.presetNum ?? 0;
      const pB = b.presetNum ?? 0;
      return pA - pB;
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
