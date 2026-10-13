import React from 'react';
import { 
  X, 
  Cpu, 
  Check, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  HelpCircle, 
  FileCheck2,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { EngineSettings, DEFAULT_ENGINE_SETTINGS } from '../types';

interface EngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSave: (settings: EngineSettings) => void;
  isDarkMode: boolean;
}

export const EngineSettingsModal: React.FC<EngineSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  isDarkMode
}) => {
  const [current, setCurrent] = React.useState<EngineSettings>(settings);

  React.useEffect(() => {
    setCurrent(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(current);
    onClose();
  };

  const handleReset = () => {
    setCurrent(DEFAULT_ENGINE_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
              <Cpu size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight font-tamil">மேம்பட்ட ஆய்வு என்ஜின் அமைப்புகள்</h2>
              <p className="text-xs opacity-60 font-tamil">துல்லியமான சங்குகளாக்கல் & பலமுறை திருத்தலைத் தவிர்த்தல்</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-tamil">
          {/* Engine Mode */}
          <section className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Layers size={14} /> ஆய்வு முறை (Processing Engine Mode)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => setCurrent(prev => ({ ...prev, mode: 'DEEP_CHUNKS' }))}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  current.mode === 'DEEP_CHUNKS'
                    ? 'border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600" />
                    <span className="font-bold text-sm">ஆழ்ந்த சங்கு ஆய்வு</span>
                  </div>
                  {current.mode === 'DEEP_CHUNKS' && <CheckCircle2 size={16} className="text-purple-600" />}
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600/10 text-purple-600 mb-2">பரிந்துரைக்கப்படுகிறது</span>
                <p className="text-xs opacity-70 leading-relaxed">
                  ஆவணத்தை வினாக்கள் அல்லது பத்திகளாகப் பிரித்து, ஒவ்வொரு பகுதிக்கும் முழு கவனம் செலுத்தி ஆராய்கிறது. 1 முறை சரிபார்த்தாலே அனைத்துத் தவறுகளும் கண்டுபிடிக்கப்படும்.
                </p>
              </div>

              <div 
                onClick={() => setCurrent(prev => ({ ...prev, mode: 'FAST_SINGLE_PASS' }))}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  current.mode === 'FAST_SINGLE_PASS'
                    ? 'border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-zinc-500" />
                    <span className="font-bold text-sm">விரைவு ஆய்வு</span>
                  </div>
                  {current.mode === 'FAST_SINGLE_PASS' && <CheckCircle2 size={16} className="text-purple-600" />}
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 mb-2">குறுகிய ஆவணங்களுக்கு</span>
                <p className="text-xs opacity-70 leading-relaxed">
                  முழு ஆவணத்தையும் ஒரே முறையில் விரைவாக சரிபார்க்கிறது. மிகக் குறைந்த நேரத்திற்கு உகந்தது.
                </p>
              </div>
            </div>
          </section>

          {/* Chunking Strategy */}
          {current.mode === 'DEEP_CHUNKS' && (
            <section className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <FileCheck2 size={14} /> சங்கு பிரிக்கும் உத்தி (Segmentation Strategy)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'AUTO', label: 'தானியங்கி', desc: 'வினா / நகரும் சாளரம்' },
                  { id: 'SLIDING_WINDOW', label: 'நகரும் சாளரம்', desc: 'சூழல் இணைப்பு (Overlap)' },
                  { id: 'QUESTIONS', label: 'வினா வாரியாக', desc: '1., 2., வினா 1...' },
                  { id: 'PARAGRAPHS', label: 'பத்தி வாரியாக', desc: 'பத்திகள் (~400 சொல்)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCurrent(prev => ({ ...prev, chunkingStrategy: opt.id as any }))}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      current.chunkingStrategy === opt.id
                        ? 'border-purple-600 bg-purple-600/10 font-bold text-purple-600 ring-2 ring-purple-600/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                <span className="font-bold text-purple-600 dark:text-purple-400">நகரும் சாளர உத்தி (Sliding Window):</span> எல்லைகளில் வாக்கிய அமைப்புகளோ சந்தி விதிகளோ சிதையாமல் இருக்க, அடுத்தடுத்த பகுதிகளுக்கு இடையே ~200 எழுத்துக்கள் சூழல் இணைப்புடன் (Context Overlap) ஆய்வு செய்யப்படுகிறது.
              </div>
            </section>
          )}

          {/* Categories to inspect */}
          <section className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sliders size={14} /> ஆய்வு செய்ய வேண்டிய பிழை வகைகள்
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { 
                  key: 'checkSpelling', 
                  label: 'எழுத்துப்பிழை (Spelling)', 
                  desc: 'குறில்/நெடில், மெய்/உயிர்மெய், பிழையான எழுத்துக்கள்' 
                },
                { 
                  key: 'checkGrammarSandhi', 
                  label: 'சந்திப்பிழை & இலக்கணம் (Sandhi & Grammar)', 
                  desc: 'வலிமிகும்/வலிமிகா இடங்கள், திணை, பால், கால வழுக்கள்' 
                },
                { 
                  key: 'checkContext', 
                  label: 'கருத்துப்பிழை (Context & Meaning)', 
                  desc: 'வினா அமைப்புப் பிழைகள், சொல் முரண்பாடுகள், பொருள் குழப்பம்' 
                },
                { 
                  key: 'checkImprovements', 
                  label: 'வாக்கிய மேம்பாடு (Style & Clarity)', 
                  desc: 'தேவையற்ற சொற்களை நீக்கி மெருகூட்டுதல்' 
                }
              ].map(cat => (
                <label 
                  key={cat.key}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                    (current as any)[cat.key] 
                      ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10' 
                      : 'border-zinc-200 dark:border-zinc-800 opacity-60'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={(current as any)[cat.key]}
                    onChange={(e) => setCurrent(prev => ({ ...prev, [cat.key]: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold leading-tight">{cat.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5 leading-snug">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Repeat grouping */}
          <section className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles size={14} /> மீண்டும் மீண்டும் வரும் தவறுகள் (Duplicate Prevention)
            </label>
            <label 
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                current.autoGroupRepeated 
                  ? 'border-purple-600/40 bg-purple-600/5 dark:bg-purple-600/10' 
                  : 'border-zinc-200 dark:border-zinc-800 opacity-60'
              }`}
            >
              <input 
                type="checkbox"
                checked={current.autoGroupRepeated}
                onChange={(e) => setCurrent(prev => ({ ...prev, autoGroupRepeated: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="text-xs font-bold leading-tight">ஒரே சொல்லுள்ள அனைத்து தவறுகளையும் கணக்கிட்டு ஒரே கிளிக்கில் மாற்றுதல்</div>
                <div className="text-[10px] opacity-60 mt-0.5 leading-snug">
                  ஒரு தவறு ஆவணத்தில் பல இடங்களில் வந்தால் (எ.கா. 3 இடங்களில்), அதைத் தனித்தனியாகத் திருத்தாமல் "அனைத்தையும் மாற்று (3)" என்ற ஒரே கிளிக்கில் மாற்றிவிடலாம்.
                </div>
              </div>
            </label>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 font-tamil">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw size={14} />
            <span>இயல்புநிலைக்கு மாற்று</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              ரத்து
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/25 transition-all"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>சேமி & பயன்படுத்து</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
