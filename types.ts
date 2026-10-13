
export type CorrectionType = 'SPELLING' | 'GRAMMAR' | 'WATCH' | 'CONTEXT' | 'CLARITY' | 'IMPROVEMENT';

export interface CorrectionSuggestion {
  id: string;
  original: string;
  suggestion: string;
  type: CorrectionType;
  explanation: string;
  repeatCount?: number; // How many times this word repeats across the document
  chunkIndex?: number;  // Chunk in which it was detected
}

export type EngineMode = 'DEEP_CHUNKS' | 'FAST_SINGLE_PASS';
export type ChunkingStrategy = 'AUTO' | 'SLIDING_WINDOW' | 'QUESTIONS' | 'PARAGRAPHS';

export interface EngineSettings {
  mode: EngineMode;
  chunkingStrategy: ChunkingStrategy;
  checkSpelling: boolean;
  checkGrammarSandhi: boolean;
  checkContext: boolean;
  checkImprovements: boolean;
  autoGroupRepeated: boolean;
  windowSize?: number;
  overlapSize?: number;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  mode: 'DEEP_CHUNKS',
  chunkingStrategy: 'AUTO',
  checkSpelling: true,
  checkGrammarSandhi: true,
  checkContext: true,
  checkImprovements: true,
  autoGroupRepeated: true,
  windowSize: 750,
  overlapSize: 200,
};

export interface CheckProgress {
  stage: 'idle' | 'chunking' | 'analyzing' | 'deduping' | 'complete';
  currentChunk: number;
  totalChunks: number;
  message: string;
  percent: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type ViewState = 'drafts' | 'subscription' | 'trash' | 'account' | 'editor' | 'gallery';

export interface Draft {
  id: string;
  title: string;
  content: string;
  lastEdited: string;
  wordCount: number;
}

export interface WordGallery {
  ignore: string[];
  watch: string[];
}

export interface StyleMemoryRule {
  id: string;
  from: string; // The word to match and replace (e.g., "தயாரியுங்கள்")
  to: string;   // The mandatory target word (e.g., "தயார் செய்க")
  note?: string; // Optional explanation/context
}

export interface StyleMemory {
  preservedWords: string[]; // Whitelist / do not change (e.g., "தயார் செய்க")
  customReplacements: StyleMemoryRule[]; // Mandatory transformations
}

export const DEFAULT_STYLE_MEMORY: StyleMemory = {
  preservedWords: [
    "தயார் செய்க",
    "எழுதுக",
    "குறிப்பிடுக",
    "விவரிக்குக",
    "விடை தருக",
    "பட்டியலிடுக"
  ],
  customReplacements: [
    {
      id: "rule-1",
      from: "தயாரியுங்கள்",
      to: "தயார் செய்க",
      note: "வினா நடையில் 'தயார் செய்க' என அமைய வேண்டும்"
    },
    {
      id: "rule-2",
      from: "எழுதுங்கள்",
      to: "எழுதுக",
      note: "வினா நடையில் 'எழுதுக' என அமைய வேண்டும்"
    },
    {
      id: "rule-3",
      from: "குறிப்பிடுங்கள்",
      to: "குறிப்பிடுக",
      note: "வினா நடையில் 'குறிப்பிடுக' என அமைய வேண்டும்"
    },
    {
      id: "rule-4",
      from: "விவரியுங்கள்",
      to: "விவரிக்குக",
      note: "வினா நடையில் 'விவரிக்குக' என அமைய வேண்டும்"
    }
  ]
};
