
import { GoogleGenAI, Type } from "@google/genai";
import { CorrectionSuggestion, StyleMemory, EngineSettings, CheckProgress, DEFAULT_ENGINE_SETTINGS } from "../types";

export interface TextChunk {
  index: number;
  text: string;
  startIndex: number;
  endIndex?: number;
  label: string;
  coreText?: string;
  prefixOverlap?: string;
  suffixOverlap?: string;
}

/**
 * Intelligent Sliding Window text chunker:
 * Segments document into overlapping linguistic windows, ensuring context overlap between
 * adjacent segments so Gemini preserves sentence structure, subject-predicate agreements,
 * and Sandhi rules across split points.
 */
export function splitTextWithSlidingWindow(
  text: string,
  windowSize = 750,
  overlapSize = 200
): TextChunk[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= windowSize) {
    return [{ 
      index: 0, 
      text: trimmed, 
      coreText: trimmed, 
      startIndex: 0, 
      endIndex: trimmed.length, 
      label: 'முழு ஆவணம்' 
    }];
  }

  // 1. Break into natural linguistic sentence/line units with character offsets
  // Tamil sentence terminators: . ? ! । or paragraph breaks (\n\n) or newlines (\n)
  const boundaryRegex = /([.?!।]+(?:\s+|\n+)|(?:\n\s*\n+)|(?:\n+))/g;
  const units: { text: string; start: number; end: number }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boundaryRegex.exec(trimmed)) !== null) {
    const end = match.index + match[0].length;
    const unitText = trimmed.slice(lastIndex, end);
    if (unitText.trim()) {
      units.push({ text: unitText, start: lastIndex, end });
    }
    lastIndex = end;
  }

  if (lastIndex < trimmed.length) {
    const rem = trimmed.slice(lastIndex);
    if (rem.trim()) {
      units.push({ text: rem, start: lastIndex, end: trimmed.length });
    }
  }

  // Fallback: If no punctuation boundaries found, split by space tokens
  if (units.length <= 1) {
    const words = trimmed.split(/(\s+)/);
    let cur = 0;
    units.length = 0;
    let wordBuf = '';
    let bufStart = 0;
    for (const w of words) {
      wordBuf += w;
      if (wordBuf.length >= 100 && /\s$/.test(w)) {
        units.push({ text: wordBuf, start: bufStart, end: cur + w.length });
        bufStart = cur + w.length;
        wordBuf = '';
      }
      cur += w.length;
    }
    if (wordBuf) {
      units.push({ text: wordBuf, start: bufStart, end: trimmed.length });
    }
  }

  // 2. Build sliding windows with context overlap
  const chunks: TextChunk[] = [];
  let i = 0;
  let chunkCount = 1;

  while (i < units.length) {
    const windowStartUnit = i;
    let currentLength = 0;
    let j = i;

    // Collect units up to windowSize
    while (j < units.length && (currentLength < windowSize || j === i)) {
      currentLength += units[j].text.length;
      j++;
    }
    const windowEndUnit = j;

    const coreStartIdx = units[windowStartUnit].start;
    const coreEndIdx = units[windowEndUnit - 1].end;
    const coreText = trimmed.slice(coreStartIdx, coreEndIdx);

    // Prefix overlap: previous units before windowStartUnit, up to overlapSize
    let prefixOverlap = '';
    if (windowStartUnit > 0) {
      let pLen = 0;
      let pIdx = windowStartUnit - 1;
      const pParts: string[] = [];
      while (pIdx >= 0 && pLen < overlapSize) {
        pParts.unshift(units[pIdx].text);
        pLen += units[pIdx].text.length;
        pIdx--;
      }
      prefixOverlap = pParts.join('').trim();
    }

    // Suffix overlap: subsequent units after windowEndUnit, up to overlapSize
    let suffixOverlap = '';
    if (windowEndUnit < units.length) {
      let sLen = 0;
      let sIdx = windowEndUnit;
      const sParts: string[] = [];
      while (sIdx < units.length && sLen < overlapSize) {
        sParts.push(units[sIdx].text);
        sLen += units[sIdx].text.length;
        sIdx++;
      }
      suffixOverlap = sParts.join('').trim();
    }

    chunks.push({
      index: chunks.length,
      text: coreText,
      coreText: coreText,
      startIndex: coreStartIdx,
      endIndex: coreEndIdx,
      prefixOverlap,
      suffixOverlap,
      label: `சாளரப் பகுதி ${chunkCount++}`
    });

    if (windowEndUnit >= units.length) {
      break;
    }

    // Advance sliding window with step size preserving overlapSize
    let overlapAccum = 0;
    let nextStart = windowEndUnit;
    while (nextStart > windowStartUnit + 1 && overlapAccum < overlapSize) {
      nextStart--;
      overlapAccum += units[nextStart].text.length;
    }
    if (nextStart <= windowStartUnit) {
      nextStart = windowStartUnit + 1;
    }
    i = nextStart;
  }

  return chunks.length > 0 
    ? chunks 
    : [{ index: 0, text: trimmed, coreText: trimmed, startIndex: 0, endIndex: trimmed.length, label: 'முழு ஆவணம்' }];
}

/**
 * Intelligent Tamil text chunker with Sliding Window and Context Overlap:
 * Preserves sentence structure and cross-boundary linguistic cohesion across all modes.
 */
export function splitTextIntoLinguisticChunks(
  text: string, 
  strategy: ChunkingStrategy = 'AUTO',
  options: { windowSize?: number; overlapSize?: number } = {}
): TextChunk[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length < 350) {
    return [{ index: 0, text: trimmed, coreText: trimmed, startIndex: 0, endIndex: trimmed.length, label: 'முழு ஆவணம்' }];
  }

  const { windowSize = 750, overlapSize = 200 } = options;

  // Dedicated Sliding Window strategy
  if (strategy === 'SLIDING_WINDOW') {
    return splitTextWithSlidingWindow(trimmed, windowSize, overlapSize);
  }

  // Regex to detect numbered questions or sections (e.g., 1. , 2) , வினா 1 , கேள்வி 1 , அ) , ஆ) )
  const questionPattern = /(?:^|\n)\s*(?:(?:\d+|[ivx]+)[\.\)]|வினா\s*\d+|கேள்வி\s*\d+|[அஆஇஈஉஊஎஏஐஒஓஔ][\)\.]|\([0-9a-zA-Zஅ-ஔ]\))/;
  const hasQuestions = questionPattern.test(trimmed);

  if ((strategy === 'QUESTIONS' || strategy === 'AUTO') && hasQuestions) {
    // Split into question blocks
    const lines = trimmed.split('\n');
    const rawBlocks: { text: string; start: number }[] = [];
    let currentBlock: string[] = [];
    let currentStart = 0;
    let runningIndex = 0;

    for (const line of lines) {
      const isQuestionStart = questionPattern.test(line);
      if (isQuestionStart && currentBlock.length > 0 && currentBlock.join('\n').length >= 200) {
        const blockText = currentBlock.join('\n').trim();
        if (blockText) {
          rawBlocks.push({ text: blockText, start: currentStart });
        }
        currentStart = runningIndex;
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
      runningIndex += line.length + 1; // +1 for \n
    }

    if (currentBlock.length > 0) {
      const blockText = currentBlock.join('\n').trim();
      if (blockText) {
        rawBlocks.push({ text: blockText, start: currentStart });
      }
    }

    if (rawBlocks.length > 0) {
      // Add sliding context overlap across question blocks
      return rawBlocks.map((block, idx) => {
        let prefixOverlap = '';
        if (idx > 0) {
          const prevText = rawBlocks[idx - 1].text;
          prefixOverlap = prevText.slice(Math.max(0, prevText.length - overlapSize)).trim();
        }
        let suffixOverlap = '';
        if (idx < rawBlocks.length - 1) {
          const nextText = rawBlocks[idx + 1].text;
          suffixOverlap = nextText.slice(0, Math.min(nextText.length, overlapSize)).trim();
        }

        return {
          index: idx,
          text: block.text,
          coreText: block.text,
          startIndex: block.start,
          endIndex: block.start + block.text.length,
          prefixOverlap,
          suffixOverlap,
          label: `வினா / பகுதி ${idx + 1}`
        };
      });
    }
  }

  // If strategy is AUTO and no questions, use sliding window
  if (strategy === 'AUTO') {
    return splitTextWithSlidingWindow(trimmed, windowSize, overlapSize);
  }

  // PARAGRAPHS strategy with sliding context overlap
  const rawParagraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim());
  const paraBlocks: { text: string; start: number }[] = [];
  let buffer = '';
  let bufferStart = 0;
  let runningIdx = 0;

  for (const para of rawParagraphs) {
    if (buffer && (buffer.length + para.length > windowSize)) {
      paraBlocks.push({ text: buffer.trim(), start: bufferStart });
      bufferStart = runningIdx;
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
    runningIdx += para.length + 2;
  }

  if (buffer.trim()) {
    paraBlocks.push({ text: buffer.trim(), start: bufferStart });
  }

  // Add sliding context overlap across paragraph blocks
  const chunks: TextChunk[] = paraBlocks.map((b, idx) => {
    let prefixOverlap = '';
    if (idx > 0) {
      const prev = paraBlocks[idx - 1].text;
      prefixOverlap = prev.slice(Math.max(0, prev.length - overlapSize)).trim();
    }
    let suffixOverlap = '';
    if (idx < paraBlocks.length - 1) {
      const next = paraBlocks[idx + 1].text;
      suffixOverlap = next.slice(0, Math.min(next.length, overlapSize)).trim();
    }

    return {
      index: idx,
      text: b.text,
      coreText: b.text,
      startIndex: b.start,
      endIndex: b.start + b.text.length,
      prefixOverlap,
      suffixOverlap,
      label: `பத்திப் பகுதி ${idx + 1}`
    };
  });

  return chunks.length > 0 
    ? chunks 
    : [{ index: 0, text: trimmed, coreText: trimmed, startIndex: 0, endIndex: trimmed.length, label: 'பகுதி 1' }];
}

export function countWordOccurrences(fullText: string, searchWord: string): number {
  if (!searchWord || !searchWord.trim()) return 0;
  const escaped = searchWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const regex = new RegExp(escaped, 'g');
    const matches = fullText.match(regex);
    return matches ? matches.length : 0;
  } catch (e) {
    return 0;
  }
}

const SYSTEM_INSTRUCTION = `
You are the world's most advanced Tamil computational linguistic agent, specialized in flawless academic and professional Tamil proofreading.
Your goal is to perform deep contextual analysis, sentence-by-sentence or question-by-question, in sequential order, and detect ALL issues. Do not limit the count; find every issue present in the document.

Analyze and classify mistakes into these 5 precise categories:
1. SPELLING (எழுத்துப்பிழை): Any typo, spelling error, missing letter, wrong vowel mark, or non-standard character.
2. GRAMMAR (இலக்கணப்பிழை):
   - Sandhi rules (சந்திப்பிழை / வலிமிகும், வலிமிகா இடங்கள்: e.g., க், ச், த், ப் placement).
   - Subject-verb agreement (திணை, பால், எண், இடம், கால வழுக்கள்).
   - Case markers and incorrect word combinations.
3. CONTEXT (கருத்துப்பிழை): Contextual/factual errors where a word is spelled right but makes no sense in the sentence, or logical/meaning conflicts in questions or statements.
4. CLARITY (கருத்து செரிவு): Wordy sentences, redundant phrasing, formatting inconsistencies, or lack of readability.
5. IMPROVEMENT (வாக்கிய மேம்பாடு): Vocabulary enhancement, modern/professional phrasing, or stylistic upgrades to make the Tamil prose sound elegant and high-quality.

Strict Rules:
- Go line-by-line or question-by-question sequentially from beginning to end.
- Keep the original text fragment precise (ideally 1 to 3 words) so it can be uniquely matched and highlighted in the editor.
- The explanation must be in rich, helpful, professional Tamil, explaining the grammatical rule or contextual reason clearly.
- Provide the corrected version in the "suggestion" field.
- If there are multiple errors on the same line, list them as separate suggestions in chronological order.
- Respect and strictly honor the user's custom style memory rules and preserved words. Never suggest changing a word that the user has explicitly designated to be preserved.

Output JSON Format:
{
  "suggestions": [
    {
      "original": "exact original text",
      "suggestion": "corrected text",
      "type": "SPELLING" | "GRAMMAR" | "CONTEXT" | "CLARITY" | "IMPROVEMENT",
      "explanation": "concise reasoning in Tamil"
    }
  ]
}
`;

const TRANSLATE_INSTRUCTION = `
You are an elite multilingual translator specializing in professional translations between English, Hindi, Malayalam, and Tamil.
Produce a natural, culturally accurate translation. Maintain all formatting.
`;

export const DEFAULT_MODEL = "gemini-3.8-flash";

export class GeminiService {
  getApiKey(): string {
    const storedKey = typeof window !== 'undefined' ? window.localStorage.getItem('spelltamil_api_key') : null;
    if (storedKey && storedKey.trim() && storedKey !== 'undefined' && storedKey !== 'null' && storedKey.trim().length > 10) {
      return storedKey.trim();
    }
    // Only API key from API Key Settings is allowed. Default/fallback credentials are removed.
    return '';
  }

  hasApiKey(): boolean {
    const key = this.getApiKey();
    return !!key && key.length > 10;
  }

  private getAI(customKey?: string) {
    const apiKey = customKey || this.getApiKey();
    if (!apiKey) {
      throw new Error("API Key காணப்படவில்லை. தயவுசெய்து API Key Settings-ல் உங்கள் சொந்த Gemini API Key-ஐ உள்ளிடவும்.");
    }
    return new GoogleGenAI({ 
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async testApiKey(keyToTest?: string): Promise<{ success: boolean; message: string; modelName?: string }> {
    const key = (keyToTest || this.getApiKey()).trim();
    if (!key || key.length < 10) {
      return { success: false, message: "சரியான API Key உள்ளிடப்படவில்லை (குறைந்தது 10 எழுத்துகள் தேவை)." };
    }
    try {
      const ai = this.getAI(key);
      const res = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: "வணக்கம்! ஒரே ஒரு வார்த்தையில் 'சரி' என பதிலளிக்கவும்.",
      });
      const responseText = res.text?.trim() || "";
      return { 
        success: true, 
        message: `API Key வெற்றிகரமாக இணைக்கப்பட்டது! AI பதில்: "${responseText || 'சரி'}"`,
        modelName: DEFAULT_MODEL
      };
    } catch (err: any) {
      console.error("API Key test failed:", err);
      let errMsg = err?.message || "இணைப்பில் பிழை ஏற்பட்டது";
      if (errMsg.includes("API key not valid") || errMsg.includes("INVALID_ARGUMENT") || errMsg.includes("API_KEY_INVALID")) {
        errMsg = "உள்ளிட்ட API Key தவறானது அல்லது செல்லுபடியாகாதது. தயவுசெய்து சரியான கீ-ஐ உள்ளிடவும்.";
      } else if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
        errMsg = "இந்த API Key-க்கான ஒதுக்கீடு (Quota) தீர்ந்துவிட்டது.";
      }
      return { success: false, message: errMsg };
    }
  }

  async checkText(
    text: string, 
    sensitivity: string = "MAX", 
    styleMemory?: StyleMemory,
    engineSettings: EngineSettings = DEFAULT_ENGINE_SETTINGS,
    onProgress?: (progress: CheckProgress) => void
  ): Promise<CorrectionSuggestion[]> {
    if (!text.trim() || text.length < 2) return [];

    let customRulesPrompt = '';
    if (styleMemory) {
      const preservedList = (styleMemory.preservedWords || []).filter(w => w.trim());
      const replacementsList = (styleMemory.customReplacements || []).filter(r => r.from.trim() && r.to.trim());

      if (preservedList.length > 0 || replacementsList.length > 0) {
        customRulesPrompt += `\n\nUSER'S PERMANENT STYLE MEMORY RULES (MANDATORY):\n`;
        if (preservedList.length > 0) {
          customRulesPrompt += `1. PRESERVED PHRASES (DO NOT modify or suggest alternatives for these phrases under any circumstance):\n${preservedList.map(w => `- "${w}"`).join('\n')}\n`;
        }
        if (replacementsList.length > 0) {
          customRulesPrompt += `2. MANDATORY STYLE REPLACEMENTS:\n${replacementsList.map(r => `- "${r.from}" must be changed to "${r.to}" (${r.note || ''})`).join('\n')}\n`;
        }
      }
    }

    const ai = this.getAI();

    // Determine chunks to process using Sliding Window strategy with context overlap
    const isDeepMode = engineSettings.mode === 'DEEP_CHUNKS';
    const chunks = isDeepMode 
      ? splitTextIntoLinguisticChunks(text, engineSettings.chunkingStrategy, {
          windowSize: engineSettings.windowSize,
          overlapSize: engineSettings.overlapSize
        })
      : [{ index: 0, text: text, coreText: text, startIndex: 0, label: 'முழு ஆவணம்' }];

    onProgress?.({
      stage: 'chunking',
      currentChunk: 0,
      totalChunks: chunks.length,
      message: `${chunks.length} நகரும் சாளரப் பகுதிகளாகப் (Sliding Windows) பிரிக்கப்பட்டு, சூழல் இணைப்புடன் ஆழமான ஆய்வு தொடங்குகிறது...`,
      percent: 10
    });

    const allRawSuggestions: CorrectionSuggestion[] = [];

    // Helper to analyze a single chunk
    const analyzeChunk = async (chunk: TextChunk, idx: number): Promise<CorrectionSuggestion[]> => {
      // Build sliding window context overlap block to preserve sentence structure across split points
      let contextOverlapBlock = '';
      if (chunk.prefixOverlap || chunk.suffixOverlap) {
        contextOverlapBlock = `
=== SLIDING WINDOW CONTEXT OVERLAP (நகரும் சாளர சூழல் இணைப்பு) ===
The document is processed using a Sliding Window strategy with context overlap between segments to preserve sentence structures, subject-predicate agreement, and Sandhi rules across split points.
${chunk.prefixOverlap ? `[முந்தைய பகுதியின் இறுதி சூழல் / Previous Context Overlap]: "...${chunk.prefixOverlap}"\n` : ''}
${chunk.suffixOverlap ? `[அடுத்த பகுதியின் தொடக்க சூழல் / Next Context Overlap]: "${chunk.suffixOverlap}..."\n` : ''}
Context Rule: Use this context overlap to evaluate sentence structure, boundary Sandhi rules (சந்திப் பிழைகள்), and grammatical coherence across split points. Report all errors found in the Core Segment below.
==================================================================
`;
      }

      const prompt = `This is ${chunk.label} (Part ${idx + 1} of ${chunks.length}) of the Tamil document.
Examine this text thoroughly with microscopic accuracy. Find ALL issues without skipping any. Pay deep attention to:
1. SPELLING (எழுத்துப்பிழை, குறில்/நெடில், மெய்/உயிர்மெய், பிழையான எழுத்துக்கள்)
2. GRAMMAR (சந்திப்பிழை: வலிமிகும் / வலிமிகா இடங்கள், திணை, பால், எண், இடம், கால வழுக்கள்)
3. CONTEXT (கருத்துப்பிழை: வினா அமைப்புப் பிழை, முரண்பட்ட பொருள், வினா அல்லது வாக்கியக் கருத்துப் பிழை)
4. CLARITY (கருத்து செரிவு: தேவையற்ற சொற்கள், குழப்பமான நடை)
5. IMPROVEMENT (வாக்கிய மேம்பாடு: முறையான சொல் பயன்பாடு)
${customRulesPrompt}
${contextOverlapBlock}

--- முதன்மை ஆய்வுப் பகுதி (Core Segment to Check) ---
${chunk.coreText || chunk.text}`;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["SPELLING", "GRAMMAR", "CONTEXT", "CLARITY", "IMPROVEMENT"] },
                    explanation: { type: Type.STRING }
                  },
                  required: ["original", "suggestion", "type", "explanation"]
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{"suggestions":[]}');
      return (parsed.suggestions || []).map((s: any, subIndex: number) => ({
        ...s,
        id: `sugg-c${idx}-${subIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        chunkIndex: idx
      }));
    };

    try {
      // Process chunks sequentially to give reliable progress updates and avoid rate limits
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        onProgress?.({
          stage: 'analyzing',
          currentChunk: i + 1,
          totalChunks: chunks.length,
          message: `${chunk.label} ஆராயப்படுகிறது (${i + 1}/${chunks.length})... எழுத்துப்பிழை மற்றும் கருத்துப்பிழை பரிசோதனை`,
          percent: Math.round(15 + ((i + 1) / chunks.length) * 70)
        });

        try {
          const chunkSuggestions = await analyzeChunk(chunk, i);
          allRawSuggestions.push(...chunkSuggestions);
        } catch (chunkErr) {
          console.warn(`Chunk ${i} analysis failed, continuing:`, chunkErr);
        }
      }

      onProgress?.({
        stage: 'deduping',
        currentChunk: chunks.length,
        totalChunks: chunks.length,
        message: 'மீண்டும் மீண்டும் வரும் தவறுகள் ஆவணம் முழுவதும் கணக்கிடப்படுகின்றன...',
        percent: 90
      });

      // 1. Deduplicate suggestions that match the same original & suggestion
      const uniqueMap = new Map<string, CorrectionSuggestion>();
      for (const item of allRawSuggestions) {
        const key = `${item.original.trim().toLowerCase()}:::${item.suggestion.trim().toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { ...item });
        }
      }
      let suggestions: CorrectionSuggestion[] = Array.from(uniqueMap.values());

      // 2. Scan entire document for repeat occurrences of each identified error
      suggestions = suggestions.map(s => {
        const occurrences = countWordOccurrences(text, s.original);
        return {
          ...s,
          repeatCount: Math.max(occurrences, 1)
        };
      });

      // 3. Post-Processing with User Style Memory
      if (styleMemory) {
        const preserved = (styleMemory.preservedWords || []).map(p => p.trim().toLowerCase()).filter(Boolean);
        const replacements = styleMemory.customReplacements || [];

        // Filter out suggestions on preserved phrases
        if (preserved.length > 0) {
          suggestions = suggestions.filter(s => {
            const orig = s.original.trim().toLowerCase();
            return !preserved.some(p => orig === p || p.includes(orig) || orig.includes(p));
          });
        }

        // Enforce custom replacement rules
        replacements.forEach(rule => {
          if (!rule.from.trim() || !rule.to.trim()) return;
          const fromWord = rule.from.trim();
          const toWord = rule.to.trim();

          const occurrences = countWordOccurrences(text, fromWord);
          if (occurrences > 0) {
            const existingIdx = suggestions.findIndex(s => s.original.toLowerCase() === fromWord.toLowerCase());
            if (existingIdx !== -1) {
              suggestions[existingIdx].suggestion = toWord;
              suggestions[existingIdx].type = 'IMPROVEMENT';
              suggestions[existingIdx].explanation = rule.note || `சொல் பாணி நினைவக விதிப்படி "${toWord}" என மாற்ற வேண்டும்.`;
              suggestions[existingIdx].repeatCount = occurrences;
            } else {
              suggestions.push({
                id: `style-rule-${rule.id}-${Date.now()}`,
                original: fromWord,
                suggestion: toWord,
                type: 'IMPROVEMENT',
                explanation: rule.note || `சொல் பாணி நினைவக விதிப்படி "${toWord}" என மாற்ற வேண்டும்.`,
                repeatCount: occurrences
              });
            }
          }
        });
      }

      // 4. Filter according to EngineSettings categories
      suggestions = suggestions.filter(s => {
        if (s.type === 'SPELLING' && !engineSettings.checkSpelling) return false;
        if (s.type === 'GRAMMAR' && !engineSettings.checkGrammarSandhi) return false;
        if (s.type === 'CONTEXT' && !engineSettings.checkContext) return false;
        if ((s.type === 'IMPROVEMENT' || s.type === 'CLARITY') && !engineSettings.checkImprovements) return false;
        return true;
      });

      // 5. Sort sequentially based on order of appearance in the original text
      suggestions.sort((a, b) => {
        const idxA = text.indexOf(a.original);
        const idxB = text.indexOf(b.original);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      onProgress?.({
        stage: 'complete',
        currentChunk: chunks.length,
        totalChunks: chunks.length,
        message: `ஆய்வு நிறைவடைந்தது! ${suggestions.length} திருத்தங்கள் கண்டறியப்பட்டன.`,
        percent: 100
      });

      return suggestions;
    } catch (error) {
      console.error("Analysis failure:", error);
      throw error;
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text.trim()) return "";
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Translate to ${targetLanguage}:\n\n${text}`,
        config: {
          systemInstruction: TRANSLATE_INSTRUCTION,
        }
      });
      return response.text?.trim() || text;
    } catch (error) {
      console.error("Translation failure:", error);
      throw error;
    }
  }
}
