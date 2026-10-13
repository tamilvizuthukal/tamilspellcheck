import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight, 
  BookMarked,
  Sparkles,
  Info
} from 'lucide-react';
import { StyleMemory, DEFAULT_STYLE_MEMORY } from '../types';

interface StyleMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleMemory: StyleMemory;
  onSave: (newMemory: StyleMemory) => void;
  isDarkMode: boolean;
}

const StyleMemoryModal: React.FC<StyleMemoryModalProps> = ({
  isOpen,
  onClose,
  styleMemory,
  onSave,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'preserve' | 'replace'>('preserve');
  
  // State for adding preserved phrase
  const [newPreserveWord, setNewPreserveWord] = useState('');
  
  // State for adding replacement rule
  const [fromWord, setFromWord] = useState('');
  const [toWord, setToWord] = useState('');
  const [ruleNote, setRuleNote] = useState('');

  if (!isOpen) return null;

  const handleAddPreserveWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const word = newPreserveWord.trim();
    if (!word) return;
    if (styleMemory.preservedWords.some(w => w.toLowerCase() === word.toLowerCase())) {
      setNewPreserveWord('');
      return;
    }
    const updated = {
      ...styleMemory,
      preservedWords: [...styleMemory.preservedWords, word]
    };
    onSave(updated);
    setNewPreserveWord('');
  };

  const handleRemovePreserveWord = (word: string) => {
    const updated = {
      ...styleMemory,
      preservedWords: styleMemory.preservedWords.filter(w => w !== word)
    };
    onSave(updated);
  };

  const handleAddReplacement = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const from = fromWord.trim();
    const to = toWord.trim();
    if (!from || !to) return;

    const newRule = {
      id: `rule-${Date.now()}`,
      from,
      to,
      note: ruleNote.trim() || `வினா பாணிப்படி "${to}" என மாற்றுதல்`
    };

    const updated = {
      ...styleMemory,
      customReplacements: [
        ...styleMemory.customReplacements.filter(r => r.from.toLowerCase() !== from.toLowerCase()),
        newRule
      ]
    };
    onSave(updated);
    setFromWord('');
    setToWord('');
    setRuleNote('');
  };

  const handleRemoveReplacement = (id: string) => {
    const updated = {
      ...styleMemory,
      customReplacements: styleMemory.customReplacements.filter(r => r.id !== id)
    };
    onSave(updated);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('சொல் பாணி மெம்மரியை இயல்பு நிலைக்கு மீட்டமைக்க வேண்டுமா? (Reset to default rules?)')) {
      onSave(DEFAULT_STYLE_MEMORY);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-100 bg-gray-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
              <BookMarked size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight font-tamil flex items-center gap-2">
                சொல் பாணி & மெம்மரி விதிகள்
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">
                  Style Memory
                </span>
              </h2>
              <p className="text-xs opacity-50 font-tamil">
                வார்த்தைகளை மாற்றாமல் வைத்திருக்கவும், விருப்பப்படி மாற்றவும் நிலையான விதிகள்
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`px-6 pt-3 flex border-b gap-4 text-xs font-bold font-tamil ${
          isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-gray-100 bg-gray-50/30'
        }`}>
          <button
            onClick={() => setActiveTab('preserve')}
            className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'preserve'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-black'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <ShieldCheck size={16} />
            <span>அப்படியே பயன்படுத்து (மாற்றாதே)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 font-mono">
              {styleMemory.preservedWords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('replace')}
            className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'replace'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-black'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <Sparkles size={16} />
            <span>சொல் மாற்றும் விதிகள்</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 font-mono">
              {styleMemory.customReplacements.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'preserve' ? (
            <div className="space-y-5">
              {/* Info banner */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-purple-50/50 border-purple-100 text-purple-950'
              }`}>
                <Info size={18} className="shrink-0 text-purple-500 mt-0.5" />
                <div className="font-tamil">
                  <p className="font-bold">மாற்றக்கூடாத சொற்கள் (Whitelist / Preserve List):</p>
                  <p className="opacity-80 mt-0.5">
                    இங்கு உள்ள சொற்களை AI ஒருபோதும் தவறாகக் கருதாது; மேலும் அவற்றுக்கு மாற்றுப் பரிந்துரைகளையும் (Optimization) அளிக்காது.
                    உதாரணம்: <span className="font-bold text-purple-600 dark:text-purple-400">"தயார் செய்க"</span> என நீங்கள் உள்ளிட்டால், AI அதை <span className="line-through opacity-70">"தயாரிக்கவும்"</span> என மாற்றாது.
                  </p>
                </div>
              </div>

              {/* Add Preserved Word Input */}
              <form onSubmit={handleAddPreserveWord} className="flex gap-2">
                <input
                  type="text"
                  value={newPreserveWord}
                  onChange={(e) => setNewPreserveWord(e.target.value)}
                  placeholder="மாற்றக்கூடாத சொல் அல்லது தொடர் உள்ளிடுக (எ.கா: தயார் செய்க)..."
                  className={`flex-1 px-4 py-2.5 text-xs font-tamil rounded-xl border outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newPreserveWord.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold font-tamil flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Plus size={16} />
                  <span>சேர்</span>
                </button>
              </form>

              {/* Word Chips */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-3">
                  பாதுகாக்கப்பட்ட சொற்கள் ({styleMemory.preservedWords.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {styleMemory.preservedWords.map((word) => (
                    <div
                      key={word}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-tamil transition-all ${
                        isDarkMode 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-purple-500/50' 
                          : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-purple-500/50 shadow-xs'
                      }`}
                    >
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreserveWord(word)}
                        title="நீக்கு"
                        className="opacity-40 hover:opacity-100 hover:text-rose-500 p-0.5 rounded transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {styleMemory.preservedWords.length === 0 && (
                    <p className="text-xs opacity-40 font-tamil italic py-4">
                      எந்த சொல்லும் சேர்க்கப்படவில்லை. மேலே உள்ள பெட்டியில் சொல்லை உள்ளிட்டு சேர்க்கலாம்.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Info banner */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-purple-50/50 border-purple-100 text-purple-950'
              }`}>
                <Info size={18} className="shrink-0 text-purple-500 mt-0.5" />
                <div className="font-tamil">
                  <p className="font-bold">விருப்ப சொல் மாற்றங்கள் (Enforced Transformations):</p>
                  <p className="opacity-80 mt-0.5">
                    உரையில் ஒரு குறிப்பிட்ட சொல் வந்தால், அதை நீங்கள் விரும்பும் சொல்லாக மட்டுமே AI பரிந்துரைக்கும்.
                    உதாரணம்: <span className="font-bold">தயாரியுங்கள்</span> வந்தால் <span className="font-bold text-purple-600 dark:text-purple-400">தயார் செய்க</span> என மாற்றவும்; <span className="font-bold">எழுதுங்கள்</span> வந்தால் <span className="font-bold text-purple-600 dark:text-purple-400">எழுதுக</span> என மாற்றவும்.
                  </p>
                </div>
              </div>

              {/* Add Rule Form */}
              <form onSubmit={handleAddReplacement} className={`p-4 rounded-2xl border space-y-3 ${
                isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-xs font-bold font-tamil">புதிய சொல் மாற்ற விதியைச் சேர்:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold opacity-60 mb-1 font-tamil">
                      இந்த சொல் வந்தால் (From)
                    </label>
                    <input
                      type="text"
                      value={fromWord}
                      onChange={(e) => setFromWord(e.target.value)}
                      placeholder="எ.கா: தயாரியுங்கள்"
                      className={`w-full px-3 py-2 text-xs font-tamil rounded-xl border outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold opacity-60 mb-1 font-tamil">
                      இப்படி மாற்ற வேண்டும் (To)
                    </label>
                    <input
                      type="text"
                      value={toWord}
                      onChange={(e) => setToWord(e.target.value)}
                      placeholder="எ.கா: தயார் செய்க"
                      className={`w-full px-3 py-2 text-xs font-tamil rounded-xl border outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ruleNote}
                    onChange={(e) => setRuleNote(e.target.value)}
                    placeholder="காரணம் / குறிப்பு (விருப்பப்பட்டால்: எ.கா. வினா நடையில் அமைய வேண்டும்)..."
                    className={`flex-1 px-3 py-2 text-xs font-tamil rounded-xl border outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!fromWord.trim() || !toWord.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold font-tamil flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Plus size={16} />
                    <span>விதியைச் சேர்</span>
                  </button>
                </div>
              </form>

              {/* Rules List */}
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest opacity-40">
                  செயலில் உள்ள விதிகள் ({styleMemory.customReplacements.length})
                </p>
                {styleMemory.customReplacements.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-tamil transition-all ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-bold text-rose-500 line-through opacity-80">{rule.from}</span>
                      <ArrowRight size={14} className="opacity-40 shrink-0" />
                      <span className="font-bold text-purple-600 dark:text-purple-400">{rule.to}</span>
                      {rule.note && (
                        <span className="text-[11px] opacity-50 truncate hidden sm:inline">
                          ({rule.note})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReplacement(rule.id)}
                      title="விதியை நீக்கு"
                      className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 text-zinc-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {styleMemory.customReplacements.length === 0 && (
                  <p className="text-xs opacity-40 font-tamil italic py-4">
                    எந்த விதியும் சேர்க்கப்படவில்லை.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${
          isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-100 bg-gray-50/50'
        }`}>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 font-tamil transition-colors"
          >
            <RotateCcw size={14} />
            <span>இயல்பு நிலைக்கு மீட்டமை (Reset)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold font-tamil transition-all shadow-md active:scale-95"
          >
            சேமித்து மூடு (Done)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleMemoryModal;
