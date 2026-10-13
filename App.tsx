
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileText, Trash2, Menu, Sparkles as SparklesIcon, X, BookOpen, Plus, Search, Eye, EyeOff, Check, Key, ShieldCheck, AlertCircle, RotateCcw, Loader2, HelpCircle } from 'lucide-react';
import { User, ViewState, Draft, CorrectionSuggestion, WordGallery, StyleMemory, DEFAULT_STYLE_MEMORY, EngineSettings, DEFAULT_ENGINE_SETTINGS, CheckProgress } from './types';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import SuggestionsPanel from './components/SuggestionsPanel';
import Auth from './components/Auth';
import StyleMemoryModal from './components/StyleMemoryModal';
import { EngineSettingsModal } from './components/EngineSettingsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Logo } from './components/Logo';
import { GeminiService } from './services/geminiService';
import { autoFormatTamilTypography } from './services/formatUtils';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<ViewState>('editor');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<CorrectionSuggestion[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  
  // History for Undo/Redo
  const [pastStates, setPastStates] = useState<string[]>([]);
  const [futureStates, setFutureStates] = useState<string[]>([]);
  const MAX_HISTORY = 50;

  // Responsive / Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('spelltamil_sidebar_collapsed') === 'true' : false;
  });
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestionsWidth, setSuggestionsWidth] = useState(420);
  const isResizing = useRef(false);

  const [wordGallery, setWordGallery] = useState<WordGallery>(() => {
    const saved = localStorage.getItem('spelltamil_gallery');
    return saved ? JSON.parse(saved) : { ignore: [], watch: [] };
  });

  const [styleMemory, setStyleMemory] = useState<StyleMemory>(() => {
    const saved = localStorage.getItem('spelltamil_style_memory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.preservedWords) && Array.isArray(parsed.customReplacements)) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_STYLE_MEMORY;
  });
  const [showStyleMemoryModal, setShowStyleMemoryModal] = useState(false);

  // Deep Linguistic Processing Engine Settings
  const [engineSettings, setEngineSettings] = useState<EngineSettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('spelltamil_engine_settings') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_ENGINE_SETTINGS;
  });
  const [showEngineSettingsModal, setShowEngineSettingsModal] = useState(false);
  const [checkProgress, setCheckProgress] = useState<CheckProgress | null>(null);

  const MAX_DAILY_USAGE = 500; // Increased for "Pro" feel
  const gemini = useMemo(() => new GeminiService(), []);
  const editorRef = useRef<{ focusOnText: (text: string) => void } | null>(null);

  const [drafts, setDrafts] = useState<Draft[]>(() => {
    const saved = localStorage.getItem('spelltamil_drafts');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'd1',
      title: 'Welcome Draft',
      content: 'மாணவர் பெயர் : Dominic\nபள்ளியின் பெயர் : ABC School\nபிரிவு : A\nசெயல்பாடு 1 : ஆமியின் கோழிக்குஞ்சுகள்\nஎண்ணி எழுதலாம்.',
      lastEdited: new Date().toLocaleTimeString(),
      wordCount: 0
    }];
  });

  const [trashDrafts, setTrashDrafts] = useState<Draft[]>(() => {
    const saved = localStorage.getItem('spelltamil_trash');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('spelltamil_drafts', JSON.stringify(drafts));
    localStorage.setItem('spelltamil_trash', JSON.stringify(trashDrafts));
    localStorage.setItem('spelltamil_gallery', JSON.stringify(wordGallery));
    localStorage.setItem('spelltamil_style_memory', JSON.stringify(styleMemory));
    localStorage.setItem('spelltamil_sidebar_collapsed', String(isSidebarCollapsed));
  }, [drafts, trashDrafts, wordGallery, styleMemory, isSidebarCollapsed]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (drafts.length > 0 && !activeDraft) {
      setActiveDraft(drafts[0]);
    } else if (drafts.length === 0) {
      setActiveDraft(null);
    }
  }, [drafts, activeDraft]);

  useEffect(() => {
    setPastStates([]);
    setFutureStates([]);
  }, [activeDraft?.id]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < 800) setSuggestionsWidth(newWidth);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  }, [handleMouseMove]);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  }, [handleMouseMove, stopResizing]);

  const handleSaveDraft = useCallback((id: string, content: string, skipHistory: boolean = false) => {
    const currentDraft = drafts.find(d => d.id === id);
    if (!currentDraft || currentDraft.content === content) return;

    if (!skipHistory) {
      setPastStates(prev => [currentDraft.content, ...prev].slice(0, MAX_HISTORY));
      setFutureStates([]);
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, content, lastEdited: now } : d));
    if (activeDraft?.id === id) {
      setActiveDraft(prev => prev ? { ...prev, content, lastEdited: now } : null);
    }
  }, [drafts, activeDraft]);

  const handleUpdateTitle = (id: string, title: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, title, lastEdited: now } : d));
    if (activeDraft?.id === id) {
      setActiveDraft(prev => prev ? { ...prev, title, lastEdited: now } : null);
    }
  };

  const handleCheckText = useCallback(async (text: string) => {
    // 0. Auto-format punctuation, spacing, quotes, and double spaces before proofreading
    const formatResult = autoFormatTamilTypography(text);
    const targetText = formatResult.formatted;

    if (formatResult.hasChanges && activeDraft) {
      handleSaveDraft(activeDraft.id, targetText);
    }

    if (usageCount >= MAX_DAILY_USAGE || !targetText.trim()) {
      setSuggestions([]);
      return;
    }

    if (!gemini.hasApiKey()) {
      setShowKeyDialog(true);
      return;
    }

    setIsChecking(true);
    setCheckProgress({
      stage: 'chunking',
      currentChunk: 0,
      totalChunks: 1,
      message: formatResult.hasChanges 
        ? 'நிறுத்தற்குறிகள் சீரமைக்கப்பட்டு ஆய்வு தொடங்குகிறது...' 
        : 'ஆய்வு தொடங்குகிறது...',
      percent: 5
    });
    if (window.innerWidth < 1280) setIsSuggestionsOpen(true);
    
    try {
      // 1. Get AI suggestions with deep chunking and user's persistent Style Memory rules
      const aiResults = await gemini.checkText(
        targetText, 
        "MAX", 
        styleMemory, 
        engineSettings,
        (progress) => setCheckProgress(progress)
      );
      
      // 2. Filter out ignored words
      let filteredResults = aiResults.filter(s => !wordGallery.ignore.includes(s.original));

      // 3. Scan for watched words
      const watchResults: CorrectionSuggestion[] = [];
      wordGallery.watch.forEach(word => {
        if (!word.trim()) return;
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedWord})`, 'gi');
        let match;
        while ((match = regex.exec(targetText)) !== null) {
          watchResults.push({
            id: `watch-${word}-${match.index}-${Date.now()}`,
            original: match[1],
            suggestion: match[1],
            type: 'WATCH',
            explanation: `கவனிக்கவும்: "${match[1]}" என்ற சொல் உங்கள் கண்காணிப்பு பட்டியலில் உள்ளது.`,
            repeatCount: 1
          });
        }
      });

      setSuggestions([...filteredResults, ...watchResults]);
      setUsageCount(prev => prev + 1);
    } catch (e: any) {
        console.error("Gemini Error:", e);
        const errMsg = e.message || '';
        if (errMsg.includes('quota') || errMsg.includes('API key') || errMsg.includes('key') || errMsg.includes('invalid') || errMsg.includes('missing')) {
          setShowKeyDialog(true);
        } else {
          alert(`Analysis Error: ${errMsg || 'An error occurred. Please check your API Key.'}`);
        }
    } finally {
        setIsChecking(false);
    }
  }, [gemini, usageCount, wordGallery.ignore, wordGallery.watch, styleMemory, engineSettings, activeDraft, handleSaveDraft]);

  const handleTranslate = useCallback(async (text: string, targetLang: string) => {
    if (usageCount >= MAX_DAILY_USAGE) return;

    if (!gemini.hasApiKey()) {
      setShowKeyDialog(true);
      return;
    }

    setIsChecking(true);
    try {
        const translated = await gemini.translateText(text, targetLang);
        if (activeDraft) {
          handleSaveDraft(activeDraft.id, translated);
          if (targetLang.toLowerCase() === 'tamil') handleCheckText(translated);
        }
    } catch (e: any) {
        console.error("Gemini Error:", e);
        const errMsg = e.message || '';
        if (errMsg.includes('quota') || errMsg.includes('API key') || errMsg.includes('key') || errMsg.includes('invalid') || errMsg.includes('missing')) {
          setShowKeyDialog(true);
        } else {
          alert(`Translation Error: ${errMsg || 'An error occurred. Please check your API Key.'}`);
        }
    } finally {
        setIsChecking(false);
    }
  }, [gemini, activeDraft, usageCount, handleCheckText, handleSaveDraft]);

  const handleUndo = useCallback(() => {
    if (pastStates.length === 0 || !activeDraft) return;
    const previous = pastStates[0];
    const rest = pastStates.slice(1);
    setFutureStates(prev => [activeDraft.content, ...prev]);
    setPastStates(rest);
    handleSaveDraft(activeDraft.id, previous, true);
  }, [pastStates, activeDraft]);

  const handleRedo = useCallback(() => {
    if (futureStates.length === 0 || !activeDraft) return;
    const next = futureStates[0];
    const rest = futureStates.slice(1);
    setPastStates(prev => [activeDraft.content, ...prev]);
    setFutureStates(rest);
    handleSaveDraft(activeDraft.id, next, true);
  }, [futureStates, activeDraft]);

  const handleAcceptSuggestion = (id: string, replaceAll: boolean = true) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion || !activeDraft) return;
    
    if (suggestion.type === 'WATCH') {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        return;
    }

    if (replaceAll) {
      // Replace all occurrences of this specific error across the document in one click
      const updatedContent = activeDraft.content.split(suggestion.original).join(suggestion.suggestion);
      handleSaveDraft(activeDraft.id, updatedContent);
      setSuggestions(prev => prev.filter(s => s.original.toLowerCase() !== suggestion.original.toLowerCase()));
    } else {
      // Replace single instance
      const idx = activeDraft.content.indexOf(suggestion.original);
      if (idx !== -1) {
        const updatedContent = activeDraft.content.substring(0, idx) + suggestion.suggestion + activeDraft.content.substring(idx + suggestion.original.length);
        handleSaveDraft(activeDraft.id, updatedContent);
      }
      setSuggestions(prev => prev.filter(s => s.id !== id));
    }
    setSelectedSuggestionId(null);
  };

  const handleIgnoreSuggestion = (id: string, ignoreAll: boolean = false) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    if (ignoreAll) {
      setSuggestions(prev => prev.filter(s => s.original.toLowerCase() !== suggestion.original.toLowerCase()));
    } else {
      setSuggestions(prev => prev.filter(s => s.id !== id));
    }
    if (selectedSuggestionId === id) setSelectedSuggestionId(null);
  };

  const handleFocusSuggestion = (suggestion: CorrectionSuggestion) => {
    setSelectedSuggestionId(suggestion.id);
    if (editorRef.current) editorRef.current.focusOnText(suggestion.original);
    if (window.innerWidth < 1280) setIsSuggestionsOpen(false);
  };

  const [customKeyInput, setCustomKeyInput] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('spelltamil_api_key')) || '';
  });
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const isKeyConfigured = Boolean(customKeyInput.trim() && customKeyInput.trim().length > 10);

  const handleTestKey = async () => {
    const key = customKeyInput.trim();
    if (!key || key.length < 10) {
      setTestResult({
        success: false,
        message: 'சோதிக்க சரியான Gemini API Key-ஐ உள்ளிடவும் (குறைந்தது 10 எழுத்துகள்).'
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const result = await gemini.testApiKey(key);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'சோதனை தோல்வியடைந்தது.'
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const openKeySelector = async () => {
    try {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
          setShowKeyDialog(false);
        } else {
          alert("AI Studio helper is only available in the workspace. Please paste your Gemini API Key manually.");
        }
    } catch (e) {
        console.error("Key selection failed");
    }
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = customKeyInput.trim();
    if (!cleanKey || cleanKey.length < 10) {
      alert("தயவுசெய்து சரியான Gemini API Key-ஐ உள்ளிடவும் (குறைந்தது 10 எழுத்துகள்).");
      return;
    }
    localStorage.setItem('spelltamil_api_key', cleanKey);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowKeyDialog(false);
    }, 1200);
  };

  const handleClearCustomKey = () => {
    localStorage.removeItem('spelltamil_api_key');
    setCustomKeyInput('');
    setTestResult(null);
    alert('API Key நீக்கப்பட்டது. செயலியைப் பயன்படுத்த API Key Settings-ல் உங்கள் சொந்த API Key-ஐ உள்ளிடவும்.');
    setShowKeyDialog(false);
  };

  if (!user) return <Auth onLogin={setUser} />;

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-all duration-700 ${isDarkMode ? 'bg-[#09090B] text-zinc-100' : 'bg-[#FAFAFA] text-gray-900'}`}>
      
      {/* Custom Key Dialog */}
      {showKeyDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
              <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-8 border border-zinc-100 dark:border-zinc-800 animate-in zoom-in duration-300 relative">
                <button 
                  onClick={() => setShowKeyDialog(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex justify-center mb-5">
                  <Logo size={60} />
                </div>
                
                <h2 className="text-xl font-black text-center mb-1 font-tamil">Gemini API Key அமைப்புகள்</h2>
                <div className="text-center mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                    isKeyConfigured 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isKeyConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {isKeyConfigured ? 'சொந்த API Key செயல்பாட்டில் உள்ளது (Active)' : 'API Key தேவை (Required)'}
                  </span>
                </div>
                <p className="text-xs text-center opacity-70 mb-5 font-tamil px-2 leading-relaxed">
                  டீபால்ட் சாவிகள் நீக்கப்பட்டுள்ளன. இங்கு நீங்கள் உள்ளிடும் தனிப்பயன் Gemini API Key மட்டுமே பாதுகாப்பாக உங்கள் உலாவியில் சேமிக்கப்பட்டு செயல்படும்.
                </p>

                <form onSubmit={handleSaveCustomKey} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">உங்கள் Gemini API Key</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={customKeyInput}
                        onChange={(e) => setCustomKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Test Key Section & Result */}
                  {testResult && (
                    <div className={`p-3 rounded-xl border text-xs font-tamil transition-all ${
                      testResult.success 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                    }`}>
                      <div className="flex items-start gap-2">
                        {testResult.success ? (
                          <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{testResult.message}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingKey || !customKeyInput.trim()}
                      className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 rounded-xl font-black uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center gap-2 font-tamil"
                      title="API Key மூலம் Gemini இணைப்பை உடனே சோதிக்கவும்"
                    >
                      {isTestingKey ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-purple-600 dark:text-purple-400" />
                          <span>சோதிக்கப்படுகிறது...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon size={15} className="text-purple-600 dark:text-purple-400" />
                          <span>இணைப்பைச் சோதி (Test Key)</span>
                        </>
                      )}
                    </button>

                    <div className="flex flex-1 gap-2">
                      {customKeyInput.trim() && (
                        <button
                          type="button"
                          onClick={handleClearCustomKey}
                          className="px-3.5 py-3 border border-red-200 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center font-bold"
                          title="Clear Key"
                        >
                          நீக்கு
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={saveSuccess}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase tracking-widest text-[11px] transition-colors shadow-lg shadow-purple-600/15 flex items-center justify-center gap-2"
                      >
                        {saveSuccess ? (
                          <>
                            <Check size={16} /> சேமிக்கப்பட்டது! (Saved)
                          </>
                        ) : (
                          "சேமிக்கவும் (Save)"
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {typeof window !== 'undefined' && (window as any).aistudio && (
                  <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button 
                      onClick={openKeySelector} 
                      className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={16} className="text-green-500" /> AI Studio Workspace Key
                    </button>
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-block text-[11px] font-bold text-purple-600 hover:underline font-tamil">
                    இலவச Google Gemini API Key பெற இங்கே சொடுக்கவும் →
                  </a>
                </div>
              </div>
          </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] lg:hidden backdrop-blur-md transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`fixed lg:relative h-full z-[70] transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'} ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
          user={user} 
          onLogout={() => setUser(null)}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          drafts={drafts}
          activeDraftId={activeDraft?.id}
          onSelectDraft={(d) => { setActiveDraft(d); setView('editor'); setIsSidebarOpen(false); }}
          onNewDraft={() => {
            const n = { id: `d${Date.now()}`, title: 'New Doc', content: '', lastEdited: new Date().toLocaleTimeString(), wordCount: 0 };
            setDrafts([n, ...drafts]); setActiveDraft(n); setView('editor'); setIsSidebarOpen(false);
          }}
          onDeleteDraft={(id) => {
            const d = drafts.find(x => x.id === id);
            if (d) { setTrashDrafts([d, ...trashDrafts]); setDrafts(drafts.filter(x => x.id !== id)); if (activeDraft?.id === id) setActiveDraft(null); }
          }}
          onOpenKeyDialog={() => setShowKeyDialog(true)}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onOpenStyleMemory={() => setShowStyleMemoryModal(true)}
          styleMemoryCount={styleMemory.preservedWords.length + styleMemory.customReplacements.length}
          onOpenEngineSettings={() => setShowEngineSettingsModal(true)}
          hasApiKey={isKeyConfigured}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="lg:hidden flex items-center justify-between p-3.5 sm:p-6 border-b dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-50">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 sm:p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 shadow-inner">
            <Menu size={18} />
          </button>
          <Logo size={28} showText isDarkMode={isDarkMode} />
          <div className="flex items-center gap-2">
            {activeDraft && currentView === 'editor' && (
              <button 
                onClick={() => handleCheckText(activeDraft.content)} 
                disabled={isChecking}
                title="சரிபார் (Check)"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-tamil text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-all"
              >
                {isChecking ? <RotateCcw size={12} className="animate-spin" /> : <SparklesIcon size={12} />}
                <span>{isChecking ? 'ஆராய்கிறது...' : 'சரிபார்'}</span>
              </button>
            )}
            <button onClick={() => setIsSuggestionsOpen(true)} className={`p-2 sm:p-3 rounded-2xl relative shadow-xl transition-all ${suggestions.length > 0 ? 'bg-purple-600 text-white scale-105' : 'bg-zinc-100 dark:bg-zinc-900'}`}>
              <SparklesIcon size={18} />
              {suggestions.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">{suggestions.length}</span>}
            </button>
          </div>
        </div>

        {currentView === 'editor' ? (
          activeDraft ? (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-hidden relative">
                <EditorArea 
                  ref={editorRef}
                  draft={activeDraft} 
                  onSave={handleSaveDraft}
                  onUpdateTitle={handleUpdateTitle}
                  onBack={() => setView('editor')}
                  onCheck={handleCheckText}
                  onTranslate={handleTranslate}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={pastStates.length > 0}
                  canRedo={futureStates.length > 0}
                  isDarkMode={isDarkMode}
                  isChecking={isChecking}
                  suggestions={suggestions}
                  watchList={wordGallery.watch}
                  selectedSuggestionId={selectedSuggestionId}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onToggleSidebarCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                  onOpenStyleMemory={() => setShowStyleMemoryModal(true)}
                  styleMemoryCount={styleMemory.preservedWords.length + styleMemory.customReplacements.length}
                />
              </div>

              <div 
                className={`hidden xl:flex h-full border-l dark:border-zinc-900 transition-all overflow-hidden print:hidden relative shadow-2xl`}
                style={{ width: `${suggestionsWidth}px` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-600/40 z-50 transition-colors" onMouseDown={startResizing} />
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <SuggestionsPanel 
                    suggestions={suggestions} 
                    isChecking={isChecking}
                    checkProgress={checkProgress}
                    onOpenEngineSettings={() => setShowEngineSettingsModal(true)}
                    onAccept={handleAcceptSuggestion}
                    onIgnore={handleIgnoreSuggestion}
                    onAlwaysIgnore={(word) => {
                        setWordGallery(prev => ({ ...prev, ignore: [...prev.ignore, word] }));
                        setSuggestions(prev => prev.filter(s => s.original !== word));
                    }}
                    onAcceptAll={() => {
                       let nc = activeDraft.content;
                       const repairable = suggestions.filter(s => s.type !== 'WATCH');
                       Array.from(new Set(repairable.map(s => s.original))).forEach(o => {
                          const s = repairable.find(x => x.original === o);
                          if (s) nc = nc.split(o).join(s.suggestion);
                       });
                       handleSaveDraft(activeDraft.id, nc); 
                       setSuggestions(suggestions.filter(s => s.type === 'WATCH'));
                    }}
                    onSelect={handleFocusSuggestion} 
                    isDarkMode={isDarkMode}
                    usageCount={usageCount} 
                    maxUsage={MAX_DAILY_USAGE} 
                    selectedId={selectedSuggestionId}
                  />
                </div>
              </div>

              {isSuggestionsOpen && (
                <>
                  <div className="fixed inset-0 bg-black/40 z-[80] xl:hidden backdrop-blur-md" onClick={() => setIsSuggestionsOpen(false)} />
                  <div className="fixed right-0 top-0 bottom-0 w-[88%] max-w-md z-[90] bg-white dark:bg-zinc-950 shadow-2xl xl:hidden flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                    <div className="flex-1 overflow-y-auto h-full">
                      <SuggestionsPanel 
                        suggestions={suggestions} 
                        isChecking={isChecking}
                        checkProgress={checkProgress}
                        onOpenEngineSettings={() => setShowEngineSettingsModal(true)}
                        onClose={() => setIsSuggestionsOpen(false)}
                        onAccept={handleAcceptSuggestion}
                        onIgnore={(id, ignoreAll) => {
                          handleIgnoreSuggestion(id, ignoreAll);
                          if (suggestions.length <= 1) setIsSuggestionsOpen(false);
                        }}
                        onAlwaysIgnore={(word) => {
                            setWordGallery(prev => ({ ...prev, ignore: [...prev.ignore, word] }));
                            setSuggestions(prev => prev.filter(s => s.original !== word));
                        }}
                        onAcceptAll={() => {
                           let nc = activeDraft.content;
                           const repairable = suggestions.filter(s => s.type !== 'WATCH');
                           Array.from(new Set(repairable.map(s => s.original))).forEach(o => {
                              const s = repairable.find(x => x.original === o);
                              if (s) nc = nc.split(o).join(s.suggestion);
                           });
                           handleSaveDraft(activeDraft.id, nc); 
                           setSuggestions(suggestions.filter(s => s.type === 'WATCH'));
                        }}
                        onSelect={handleFocusSuggestion} 
                        isDarkMode={isDarkMode}
                        usageCount={usageCount} 
                        maxUsage={MAX_DAILY_USAGE} 
                        selectedId={selectedSuggestionId}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
               <FileText size={120} strokeWidth={0.5} className="mb-8 text-purple-600" />
               <h2 className="text-3xl font-black mb-2">Clean Workspace</h2>
               <p className="text-sm font-bold opacity-60">Create a document to activate the AI Proofreader.</p>
            </div>
          )
        ) : currentView === 'gallery' ? (
          <div className="flex-1 p-10 sm:p-20 overflow-y-auto no-scrollbar">
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <header className="mb-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black mb-3">Linguistic Library</h2>
                    <p className="text-sm font-bold opacity-40 font-tamil tracking-wide">உங்கள் தனிப்பட்ட வார்த்தை தொகுப்பு மற்றும் கண்காணிப்பு மையம்.</p>
                </div>
                <div className="bg-purple-600/5 px-6 py-3 rounded-2xl border border-purple-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Sync Status: Active</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className={`p-10 rounded-[3rem] border shadow-2xl flex flex-col ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                  <div className="mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2">Ignore Library</h3>
                    <p className="text-[11px] opacity-40 font-bold font-tamil leading-relaxed">இந்த வார்த்தைகள் பிழைகளாகக் கருதப்படாது.</p>
                  </div>

                  <div className="flex gap-3 mb-8">
                    <input 
                      type="text" 
                      placeholder="Add word..."
                      onKeyDown={(e) => { 
                          const target = e.target as HTMLInputElement;
                          if (e.key === 'Enter' && target.value.trim()) { 
                            setWordGallery(prev => ({ ...prev, ignore: [...prev.ignore, target.value.trim()] }));
                            target.value = '';
                          } 
                      }}
                      className={`flex-1 px-5 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-purple-500/10 font-tamil text-sm transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
                    />
                    <button className="p-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={20} /></button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                    {wordGallery.ignore.map(word => (
                      <div key={word} className={`flex items-center justify-between px-6 py-4 rounded-2xl border font-tamil text-sm group ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                        <span className="font-bold">{word}</span>
                        <button onClick={() => setWordGallery(prev => ({ ...prev, ignore: prev.ignore.filter(w => w !== word) }))} className="text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><X size={16} strokeWidth={3} /></button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-10 rounded-[3rem] border shadow-2xl flex flex-col ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                  <div className="mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2">Watch Library</h3>
                    <p className="text-[11px] opacity-40 font-bold font-tamil leading-relaxed">முக்கிய வார்த்தை கண்காணிப்பு எச்சரிக்கைகளை அமைத்தல்.</p>
                  </div>

                   <div className="flex gap-3 mb-8">
                    <input 
                      type="text" 
                      placeholder="Add word..."
                      onKeyDown={(e) => { 
                          const target = e.target as HTMLInputElement;
                          if (e.key === 'Enter' && target.value.trim()) { 
                            setWordGallery(prev => ({ ...prev, watch: [...prev.watch, target.value.trim()] }));
                            target.value = '';
                          } 
                      }}
                      className={`flex-1 px-5 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-blue-500/10 font-tamil text-sm transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
                    />
                    <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={20} /></button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                    {wordGallery.watch.map(word => (
                      <div key={word} className={`flex items-center justify-between px-6 py-4 rounded-2xl border font-tamil text-sm group ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                        <span className="font-bold">{word}</span>
                        <button onClick={() => setWordGallery(prev => ({ ...prev, watch: prev.watch.filter(w => w !== word) }))} className="text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><X size={16} strokeWidth={3} /></button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-10 sm:p-20 overflow-y-auto no-scrollbar">
             {currentView === 'trash' && (
               <div className="max-w-5xl mx-auto">
                 <h2 className="text-4xl font-black mb-16">Archived Documents</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trashDrafts.length === 0 && <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-10 border-4 border-dashed rounded-[4rem]"><Trash2 size={80} className="mb-6" /><p className="font-black uppercase tracking-widest text-lg">Empty Archive</p></div>}
                    {trashDrafts.map(d => (
                      <div key={d.id} className="p-8 rounded-[3rem] border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl group transition-all hover:scale-[1.02]">
                          <h3 className="font-black mb-6 text-sm font-tamil">{d.title}</h3>
                          <div className="flex gap-4">
                             <button onClick={() => { setDrafts([d, ...drafts]); setTrashDrafts(trashDrafts.filter(x => x.id !== d.id)); }} className="flex-1 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Restore</button>
                             <button onClick={() => setTrashDrafts(trashDrafts.filter(x => x.id !== d.id))} className="px-6 py-3 text-rose-500 rounded-2xl border border-rose-500/10 hover:bg-rose-500/5 transition-colors"><Trash2 size={16} /></button>
                          </div>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      <StyleMemoryModal
        isOpen={showStyleMemoryModal}
        onClose={() => setShowStyleMemoryModal(false)}
        styleMemory={styleMemory}
        onSave={(newMemory) => {
          setStyleMemory(newMemory);
          localStorage.setItem('spelltamil_style_memory', JSON.stringify(newMemory));
        }}
        isDarkMode={isDarkMode}
      />

      <EngineSettingsModal
        isOpen={showEngineSettingsModal}
        onClose={() => setShowEngineSettingsModal(false)}
        settings={engineSettings}
        onSave={(newSettings) => {
          setEngineSettings(newSettings);
          localStorage.setItem('spelltamil_engine_settings', JSON.stringify(newSettings));
        }}
        isDarkMode={isDarkMode}
      />

      <PWAInstallPrompt isDarkMode={isDarkMode} />
    </div>
  );
};

export default App;
