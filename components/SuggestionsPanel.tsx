import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowDown, 
  Target,
  Check,
  EyeOff,
  Eye,
  Info,
  Copy,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { CorrectionSuggestion, CheckProgress } from '../types';

interface GroupedSuggestion extends CorrectionSuggestion {
  count: number;
}

interface SuggestionsPanelProps {
  suggestions: CorrectionSuggestion[];
  isChecking: boolean;
  onAccept: (id: string, replaceAll?: boolean) => void;
  onIgnore: (id: string, ignoreAll?: boolean) => void;
  onAlwaysIgnore?: (word: string) => void;
  onAcceptAll: () => void;
  onSelect: (s: CorrectionSuggestion) => void;
  isDarkMode: boolean;
  usageCount: number;
  maxUsage: number;
  selectedId: string | null;
  checkProgress?: CheckProgress | null;
  onOpenEngineSettings?: () => void;
  onClose?: () => void;
}

const CORRECTION_METADATA: Record<string, {
  label: string;
  headerBg: string;
  badgeColor: string;
  accentText: string;
  cardBg: string;
  iconColor: string;
}> = {
  SPELLING: {
    label: 'எழுத்துப்பிழை',
    headerBg: 'bg-rose-500/10 text-rose-600 border-rose-500/15 dark:text-rose-400',
    badgeColor: 'text-rose-600',
    accentText: 'text-rose-600',
    cardBg: 'bg-rose-50/40 border-rose-200/60 dark:bg-rose-500/10',
    iconColor: 'text-rose-500'
  },
  GRAMMAR: {
    label: 'இலக்கணப்பிழை',
    headerBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15 dark:text-emerald-400',
    badgeColor: 'text-emerald-600',
    accentText: 'text-zinc-600 dark:text-zinc-400',
    cardBg: 'bg-zinc-50/60 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800',
    iconColor: 'text-emerald-500'
  },
  CONTEXT: {
    label: 'கருத்துப்பிழை',
    headerBg: 'bg-amber-500/10 text-amber-600 border-amber-500/15 dark:text-amber-400',
    badgeColor: 'text-amber-600',
    accentText: 'text-amber-600',
    cardBg: 'bg-amber-50/40 border-amber-200/60 dark:bg-amber-500/10',
    iconColor: 'text-amber-500'
  },
  CLARITY: {
    label: 'கருத்து செரிவு',
    headerBg: 'bg-blue-500/10 text-blue-600 border-blue-500/15 dark:text-blue-400',
    badgeColor: 'text-blue-600',
    accentText: 'text-blue-600',
    cardBg: 'bg-blue-50/40 border-blue-200/60 dark:bg-blue-500/10',
    iconColor: 'text-blue-500'
  },
  IMPROVEMENT: {
    label: 'வாக்கிய மேம்பாடு',
    headerBg: 'bg-purple-500/10 text-purple-600 border-purple-500/15 dark:text-purple-400',
    badgeColor: 'text-purple-600',
    accentText: 'text-purple-600',
    cardBg: 'bg-purple-50/40 border-purple-200/60 dark:bg-purple-500/10',
    iconColor: 'text-purple-500'
  },
  WATCH: {
    label: 'கண்காணிப்பு',
    headerBg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/15 dark:text-cyan-400',
    badgeColor: 'text-cyan-600',
    accentText: 'text-cyan-600',
    cardBg: 'bg-cyan-50/40 border-cyan-200/60 dark:bg-cyan-500/10',
    iconColor: 'text-cyan-500'
  }
};

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ 
  suggestions, 
  isChecking, 
  onAccept, 
  onIgnore, 
  onAlwaysIgnore,
  onAcceptAll,
  onSelect,
  isDarkMode,
  usageCount,
  maxUsage,
  selectedId,
  checkProgress,
  onOpenEngineSettings,
  onClose
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SPELLING' | 'GRAMMAR' | 'CONTEXT' | 'CLARITY' | 'IMPROVEMENT'>('ALL');

  // Group suggestions by original text to count frequency and repeat occurrences
  const groupedSuggestions: GroupedSuggestion[] = suggestions.reduce((acc, current) => {
    const existing = acc.find(item => item.original.trim().toLowerCase() === current.original.trim().toLowerCase());
    const repeatCount = Math.max(current.repeatCount || 1, 1);
    if (existing) {
      existing.count = Math.max(existing.count, repeatCount);
    } else {
      acc.push({ ...current, count: repeatCount });
    }
    return acc;
  }, [] as GroupedSuggestion[]);

  // Filter based on active filter
  const filteredSuggestions = groupedSuggestions.filter(s => activeFilter === 'ALL' || s.type === activeFilter);

  const handleCopyAndSelect = (e: React.MouseEvent, s: CorrectionSuggestion) => {
    e.stopPropagation();
    navigator.clipboard.writeText(s.original);
    setCopiedId(s.id);
    onSelect(s);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCount = (type: string) => {
    return suggestions.filter(s => s.type === type).length;
  };

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${
      isDarkMode ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-zinc-800'
    }`}>
      {/* Sleek, Compact Header with Title replacing "திருத்தங்கள் (Corrections)" */}
      <div className="px-3.5 py-3 border-b border-zinc-200/70 dark:border-zinc-800/70 space-y-2.5 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between gap-2">
          {/* Main Title & Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-sm tracking-tight leading-tight font-tamil truncate">
                  ஆய்வு முடிவுகள்
                </h2>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full font-tamil shrink-0 ${
                  suggestions.length > 0 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {suggestions.length}
                </span>
              </div>
              <p className="text-[9px] opacity-45 font-bold uppercase tracking-wider font-tamil truncate">
                Linguistic Intelligence Engine
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {suggestions.length > 0 && (
              <button 
                onClick={onAcceptAll}
                title="அனைத்து பரிந்துரைகளையும் ஒரே கிளிக்கில் மாற்று"
                className="px-2 py-1 text-[10px] font-black rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all active:scale-95 font-tamil flex items-center gap-1"
              >
                <Check size={11} strokeWidth={3} />
                <span>அனைத்தும் மாற்று</span>
              </button>
            )}

            {onOpenEngineSettings && (
              <button
                onClick={onOpenEngineSettings}
                title="மேம்பட்ட ஆய்வு என்ஜின் அமைப்புகள்"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1 text-[10px] font-bold font-tamil shadow-xs"
              >
                <Cpu size={13} className="text-purple-600" />
                <span className="hidden sm:inline">என்ஜின்</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                title="பேனலை மூடு"
                className="p-1.5 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Compact Document Health Mini-Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold">
            <span className="opacity-45 uppercase tracking-wider font-mono">Document Health</span>
            <span className={suggestions.length > 5 ? 'text-rose-500 font-tamil' : 'text-emerald-600 dark:text-emerald-400 font-tamil'}>
              {suggestions.length === 0 ? '100% துல்லியம்' : `${suggestions.length} பிழைகள் கண்டறியப்பட்டன`}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-200/60 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-700 rounded-full ${
                suggestions.length > 10 ? 'bg-rose-500' : suggestions.length > 5 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(5, 100 - (suggestions.length * 5))}%` }}
            />
          </div>
        </div>

        {/* Compact Category Filters Bar */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { id: 'ALL', label: 'அனைத்தும்', count: suggestions.length, color: 'border-purple-500 text-purple-600 bg-purple-50/70 dark:bg-purple-950/40' },
            { id: 'SPELLING', label: 'எழுத்து', count: getCount('SPELLING'), color: 'border-rose-500 text-rose-600 bg-rose-50/70 dark:bg-rose-950/40' },
            { id: 'GRAMMAR', label: 'இலக்கணம்', count: getCount('GRAMMAR'), color: 'border-emerald-500 text-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40' },
            { id: 'CONTEXT', label: 'கருத்துப்பிழை', count: getCount('CONTEXT'), color: 'border-amber-500 text-amber-600 bg-amber-50/70 dark:bg-amber-950/40' },
            { id: 'CLARITY', label: 'செரிவு', count: getCount('CLARITY'), color: 'border-blue-500 text-blue-600 bg-blue-50/70 dark:bg-blue-950/40' },
            { id: 'IMPROVEMENT', label: 'மேம்பாடு', count: getCount('IMPROVEMENT'), color: 'border-purple-500 text-purple-600 bg-purple-50/70 dark:bg-purple-950/40' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${
                activeFilter === tab.id
                  ? `${tab.color} font-black border-current shadow-xs`
                  : isDarkMode
                    ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    : 'border-zinc-200/70 text-zinc-600 hover:bg-zinc-100/70'
              }`}
            >
              <span className="font-tamil">{tab.label}</span>
              {tab.count > 0 && (
                <span className="shrink-0 px-1 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-[8px] font-mono font-bold leading-none">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Suggestions List Area - Compact & Space-Efficient */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
        {/* Loading Progress State */}
        {isChecking && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-purple-500/20 bg-purple-50/20 dark:bg-purple-950/10">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 flex items-center justify-center">
                <Target size={24} className="animate-spin text-purple-600" />
              </div>
              <Sparkles size={14} className="absolute inset-0 m-auto text-purple-600 animate-pulse" />
            </div>

            <p className="text-xs font-black font-tamil text-purple-600 dark:text-purple-400 max-w-xs leading-snug">
              {checkProgress?.message || 'ஆழ்ந்த ஆய்வு என்ஜின் செயல்படுகிறது...'}
            </p>
            <p className="text-[9px] font-mono opacity-50 uppercase tracking-widest mt-1">
              Microscopic Linguistic Engine
            </p>

            {checkProgress && checkProgress.totalChunks > 0 && (
              <div className="w-full max-w-xs mt-3.5 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold opacity-75 font-tamil">
                  <span>சங்கு {checkProgress.currentChunk} / {checkProgress.totalChunks}</span>
                  <span>{checkProgress.percent}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(8, checkProgress.percent)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isChecking && filteredSuggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 size={30} className="text-emerald-500" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-bold font-tamil text-zinc-700 dark:text-zinc-300">
              {activeFilter === 'ALL' ? 'அனைத்து வார்த்தைகளும் சரியாக உள்ளன!' : 'இப்பிரிவில் பிழைகள் ஏதுமில்லை.'}
            </p>
            <p className="text-[10px] opacity-40 font-mono uppercase tracking-wider mt-1">
              Linguistic Harmony Achieved
            </p>
          </div>
        )}

        {/* Compact Suggestion Cards */}
        {!isChecking && filteredSuggestions.map((s) => {
          const meta = CORRECTION_METADATA[s.type] || CORRECTION_METADATA.SPELLING;
          const isSelected = selectedId === s.id;

          return (
            <div 
              key={s.id} 
              onClick={() => onSelect(s)}
              className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                isSelected 
                  ? 'ring-2 ring-purple-500 border-purple-500 shadow-md scale-[1.01]' 
                  : 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs'
              } ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-xs'}`}
            >
              {/* Header with Title and small Update & Skip buttons */}
              <div className={`px-3 py-1.5 border-b text-[10px] font-bold tracking-wider flex items-center justify-between font-tamil ${meta.headerBg}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black truncate">{meta.label}</span>
                  {s.count > 1 && (
                    <span 
                      title={`இப்பிழை ஆவணத்தில் ${s.count} இடங்களில் மீண்டும் வந்துள்ளது`}
                      className="bg-purple-600 text-white px-1.5 py-0.2 rounded-md text-[8px] flex items-center gap-0.5 font-bold shrink-0 shadow-xs"
                    >
                      <RotateCcw size={8} /> {s.count} முறை
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {s.type !== 'WATCH' ? (
                    <>
                      {/* Small Skip Button in Header */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onIgnore(s.id, s.count > 1); }}
                        title={s.count > 1 ? `அனைத்து ${s.count} இடங்களையும் தவிர் (Skip All)` : "ஸ்கிப் (தவிர்)"}
                        className="px-2 py-0.5 text-[9px] font-bold rounded-md border border-black/10 dark:border-white/10 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-zinc-600 dark:text-zinc-300 transition-all flex items-center gap-1 shadow-xs active:scale-95"
                      >
                        <X size={10} strokeWidth={2.5} />
                        <span>{s.count > 1 ? 'தவிர் (அனைத்தும்)' : 'ஸ்கிப்'}</span>
                      </button>

                      {/* Small Update Button in Header */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onAccept(s.id, true); }}
                        title={s.count > 1 ? `ஒரே கிளிக்கில் அனைத்து ${s.count} இடங்களிலும் "${s.suggestion}" என மாற்று` : `அப்டேட்: ${s.suggestion}`}
                        className="px-2.5 py-0.5 text-[9px] font-black rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 transition-all active:scale-95"
                      >
                        <Check size={10} strokeWidth={2.5} />
                        <span>{s.count > 1 ? `மாற்று (${s.count})` : 'அப்டேட்'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onIgnore(s.id); }}
                      title="விலக்கு (Dismiss)"
                      className="px-2 py-0.5 text-[9px] font-bold rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>விலக்கு</span>
                    </button>
                  )}

                  {s.type !== 'WATCH' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAlwaysIgnore?.(s.original); }}
                      title={`எப்போதும் "${s.original}" புறக்கணி`}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ml-0.5"
                    >
                      <EyeOff size={12} />
                    </button>
                  )}
                  {s.type === 'WATCH' ? <Eye size={12} className="text-cyan-500 ml-0.5" /> : <Info size={12} className="opacity-40 ml-0.5" />}
                </div>
              </div>

              {/* Compact Card Content */}
              <div className="p-2.5 space-y-2">
                <div className="space-y-1.5">
                  {/* Detection Item */}
                  <div 
                    onClick={(e) => handleCopyAndSelect(e, s)}
                    title={`கண்டறியப்பட்டது: ${s.original} (கிளிக் செய்தால் நகலெடுக்கப்படும் & மையப்படுத்தப்படும்)`}
                    className={`relative p-2 rounded-lg border flex items-center gap-2.5 transition-all active:scale-[0.99] ${meta.cardBg}`}
                  >
                    {copiedId === s.id && (
                      <div className="absolute inset-0 bg-zinc-900 text-white flex items-center justify-center rounded-lg animate-in fade-in zoom-in duration-150 z-10">
                        <span className="text-[9px] font-black uppercase tracking-wider">நகலெடுக்கப்பட்டது</span>
                      </div>
                    )}
                    
                    <div className="shrink-0 w-5 h-5 rounded-md bg-white dark:bg-zinc-900 border flex items-center justify-center shadow-xs">
                      {s.type === 'WATCH' ? <Info size={11} className="text-blue-500" /> : <X size={11} className="text-rose-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[8px] opacity-50 uppercase font-black tracking-wider leading-none mb-0.5">
                        <span>{s.type === 'WATCH' ? 'Contextual Term' : 'Detection'}</span>
                        <Copy size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className={`text-xs sm:text-sm font-bold truncate font-tamil leading-tight ${
                        s.type === 'WATCH' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : s.type === 'GRAMMAR' 
                            ? 'text-zinc-700 dark:text-zinc-300' 
                            : 'text-rose-600 line-through decoration-rose-500/40'
                      }`}>
                        {s.original}
                      </p>
                    </div>
                  </div>

                  {/* Optimization Box */}
                  {s.type !== 'WATCH' && (
                    <>
                      <div className="flex justify-center -my-1.5 opacity-25">
                        <ArrowDown size={11} />
                      </div>

                      {/* Optimization Box: Shows full text on hover & has title attribute & centers on screen when clicked */}
                      <div 
                        title={s.suggestion}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(s);
                        }}
                        className="group/opt relative p-2 rounded-lg border flex items-center gap-2.5 shadow-xs bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/45 hover:bg-emerald-500/10 transition-all cursor-pointer"
                      >
                        <div className="shrink-0 w-5 h-5 rounded-md bg-white dark:bg-zinc-900 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                          <Check size={11} className="text-emerald-500" strokeWidth={3} />
                        </div>

                        <div className="flex-1 min-w-0" title={s.suggestion}>
                          <div className="flex items-center justify-between text-[8px] opacity-60 uppercase font-black tracking-wider text-emerald-800 dark:text-emerald-300 leading-none mb-0.5" title={s.suggestion}>
                            <span title={s.suggestion}>Optimization</span>
                            <span className="text-[8px] text-emerald-600 dark:text-emerald-400 opacity-0 group-hover/opt:opacity-100 transition-opacity font-bold font-tamil">
                              முழுமை
                            </span>
                          </div>
                          <p 
                            className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate group-hover/opt:whitespace-normal group-hover/opt:break-words font-tamil leading-tight transition-all"
                            title={s.suggestion}
                          >
                            {s.suggestion}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Explanation */}
                {s.explanation && (
                  <div className="flex gap-2 px-1 pt-0.5">
                    <div className={`w-0.5 h-auto rounded-full shrink-0 ${s.type === 'WATCH' ? 'bg-blue-500/40' : 'bg-purple-500/40'}`} />
                    <p className="text-[10px] font-medium opacity-65 font-tamil leading-snug italic">
                      "{s.explanation}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slim, Minimal Footer */}
      <div className="px-3 py-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center shrink-0 bg-zinc-50/30 dark:bg-zinc-900/20">
        <div className="inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest opacity-40">
          <Sparkles size={8} /> 
          <span>Tamil Linguistic Engine Active</span>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsPanel;
