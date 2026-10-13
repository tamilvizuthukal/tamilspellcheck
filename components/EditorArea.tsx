
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  RotateCcw,
  Languages,
  ChevronDown,
  Bold,
  Italic,
  Search as SearchIcon,
  Sparkles,
  X,
  ChevronUp,
  Undo2,
  Redo2,
  Pencil,
  Check,
  Type as TypeIcon,
  Globe,
  PanelLeftOpen,
  BookMarked,
  Wand2
} from 'lucide-react';
import { CorrectionSuggestion, Draft } from '../types';
import { autoFormatTamilTypography } from '../services/formatUtils';

interface EditorAreaProps {
  draft: Draft;
  onSave: (id: string, content: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onBack?: () => void;
  onCheck: (text: string) => void;
  onTranslate: (text: string, targetLang: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDarkMode: boolean;
  isChecking: boolean;
  suggestions: CorrectionSuggestion[];
  watchList: string[];
  selectedSuggestionId: string | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenStyleMemory?: () => void;
  styleMemoryCount?: number;
}

const LANGUAGES = [
  { code: 'English', name: 'ஆங்கிலம் (English)' },
  { code: 'Hindi', name: 'இந்தி (Hindi)' },
  { code: 'Malayalam', name: 'மலையாளம் (Malayalam)' },
  { code: 'Tamil', name: 'தமிழ் (Tamil)' },
];

const EditorArea = forwardRef(({ 
  draft, 
  onSave, 
  onUpdateTitle,
  onBack, 
  onCheck, 
  onTranslate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDarkMode, 
  isChecking,
  suggestions,
  watchList,
  selectedSuggestionId,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenStyleMemory,
  styleMemoryCount
}: EditorAreaProps, ref) => {
  const [content, setContent] = useState(draft.content);
  const [title, setTitle] = useState(draft.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(draft.title);
  
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [formatNotice, setFormatNotice] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const FONT_SIZES = Array.from({ length: 36 - 12 + 1 }, (_, i) => 12 + i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontSizeRef.current && !fontSizeRef.current.contains(event.target as Node)) {
        setShowFontSizeMenu(false);
      }
      if (translateRef.current && !translateRef.current.contains(event.target as Node)) {
        setShowTranslateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  /**
   * Centers the targeted word precisely in the vertical center of the textarea.
   * Uses live DOM measurement of the <mark> or an accurate mirror container.
   */
  const scrollToTarget = (index: number, length: number, targetWord?: string) => {
    if (!textareaRef.current || !highlightRef.current) return;
    const el = textareaRef.current;
    const hl = highlightRef.current;
    const containerHeight = el.clientHeight;

    // 1. Try finding the selected mark element in the live overlay
    let mark = hl.querySelector('[data-selected-mark="true"]') as HTMLElement | null;

    // If not tagged with data-selected-mark yet, search for matching mark by text
    if (!mark && targetWord) {
      const allMarks = Array.from(hl.querySelectorAll('mark'));
      mark = allMarks.find(m => m.textContent?.trim().toLowerCase() === targetWord.trim().toLowerCase()) || null;
    }

    if (mark) {
      const containerRect = el.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();
      const currentScroll = el.scrollTop;
      
      // Calculate absolute top position inside the scrollable area
      const relativeTop = markRect.top - containerRect.top;
      const absoluteTop = currentScroll + relativeTop;
      const markHeight = markRect.height || (fontSize * 1.8);
      
      // Center vertically: position so mark sits right in the middle
      const centeredScroll = Math.max(0, absoluteTop - (containerHeight / 2) + (markHeight / 2));

      el.scrollTop = centeredScroll;
      hl.scrollTop = centeredScroll;

      // Lock position across rendering ticks to prevent browser's native setSelectionRange scroll-to-bottom
      requestAnimationFrame(() => {
        el.scrollTop = centeredScroll;
        hl.scrollTop = centeredScroll;
      });
      setTimeout(() => {
        el.scrollTop = centeredScroll;
        hl.scrollTop = centeredScroll;
      }, 50);
      return;
    }

    // 2. Accurate mirror calculation with explicit computed styles
    try {
      const mirror = document.createElement('div');
      const computed = window.getComputedStyle(el);
      mirror.style.position = 'absolute';
      mirror.style.visibility = 'hidden';
      mirror.style.boxSizing = computed.boxSizing || 'border-box';
      mirror.style.width = `${el.clientWidth}px`;
      mirror.style.paddingTop = computed.paddingTop;
      mirror.style.paddingBottom = computed.paddingBottom;
      mirror.style.paddingLeft = computed.paddingLeft;
      mirror.style.paddingRight = computed.paddingRight;
      mirror.style.borderTopWidth = computed.borderTopWidth;
      mirror.style.borderBottomWidth = computed.borderBottomWidth;
      mirror.style.fontSize = computed.fontSize;
      mirror.style.lineHeight = computed.lineHeight;
      mirror.style.fontFamily = computed.fontFamily;
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordBreak = 'break-word';
      mirror.style.overflowWrap = 'break-word';
      mirror.style.tabSize = '4';
      mirror.style.top = '0';
      mirror.style.left = '0';

      const beforeSpan = document.createElement('span');
      beforeSpan.textContent = content.substring(0, index);
      const targetSpan = document.createElement('span');
      targetSpan.textContent = content.substring(index, index + length);

      mirror.appendChild(beforeSpan);
      mirror.appendChild(targetSpan);
      document.body.appendChild(mirror);

      const targetTop = targetSpan.offsetTop;
      const targetHeight = targetSpan.offsetHeight || (fontSize * 1.8);
      document.body.removeChild(mirror);

      const centeredScroll = Math.max(0, targetTop - (containerHeight / 2) + (targetHeight / 2));
      el.scrollTop = centeredScroll;
      hl.scrollTop = centeredScroll;

      requestAnimationFrame(() => {
        el.scrollTop = centeredScroll;
        hl.scrollTop = centeredScroll;
      });
      setTimeout(() => {
        el.scrollTop = centeredScroll;
        hl.scrollTop = centeredScroll;
      }, 50);
    } catch (e) {
      // Fallback
    }
  };

  const highlightIndex = (index: number, length: number, word?: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.focus({ preventScroll: true });
    el.setSelectionRange(index, index + length);
    
    // Smoothly scroll and center target in viewport
    scrollToTarget(index, length, word);
    
    // Secondary lock after browser finishes native caret positioning
    setTimeout(() => {
      scrollToTarget(index, length, word);
    }, 60);
    setTimeout(() => {
      scrollToTarget(index, length, word);
    }, 150);
  };

  useImperativeHandle(ref, () => ({
    focusOnText: (text: string) => {
      if (textareaRef.current) {
        const index = content.indexOf(text);
        if (index !== -1) {
          highlightIndex(index, text.length, text);
        }
      }
    }
  }));

  // Center on word whenever selectedSuggestionId changes
  useEffect(() => {
    if (!selectedSuggestionId) return;
    const sugg = suggestions.find(s => s.id === selectedSuggestionId);
    if (!sugg) return;
    const index = content.indexOf(sugg.original);
    if (index !== -1) {
      // Small tick to ensure React has rendered data-selected-mark="true"
      requestAnimationFrame(() => {
        highlightIndex(index, sugg.original.length, sugg.original);
      });
    }
  }, [selectedSuggestionId]);

  useEffect(() => {
    setContent(draft.content);
    setTitle(draft.title);
    setTempTitle(draft.title);
    setIsEditingTitle(false);
  }, [draft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) onRedo(); else onUndo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          onRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

  useEffect(() => {
    if (findText && findText.length > 0) {
      const indices: number[] = [];
      let idx = content.indexOf(findText);
      while (idx !== -1) {
        indices.push(idx);
        idx = content.indexOf(findText, idx + 1);
      }
      setMatchIndices(indices);
      if (indices.length > 0 && currentMatchIndex === -1) {
        setCurrentMatchIndex(0);
        highlightIndex(indices[0], findText.length);
      }
    } else {
      setMatchIndices([]);
      setCurrentMatchIndex(-1);
    }
  }, [findText, content]);

  const goToNextMatch = () => {
    if (matchIndices.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchIndices.length;
    setCurrentMatchIndex(nextIdx);
    highlightIndex(matchIndices[nextIdx], findText.length);
  };

  const goToPrevMatch = () => {
    if (matchIndices.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchIndices.length) % matchIndices.length;
    setCurrentMatchIndex(prevIdx);
    highlightIndex(matchIndices[prevIdx], findText.length);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onSave(draft.id, newContent);
    }, 1000);
  };

  const handleTitleSave = () => {
    const newTitle = tempTitle.trim() || 'Untitled draft';
    setTitle(newTitle);
    onUpdateTitle(draft.id, newTitle);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(title);
    setIsEditingTitle(false);
  };

  const handleFindReplace = (all: boolean = false) => {
    if (!findText) return;
    const newContent = all 
      ? content.split(findText).join(replaceText)
      : content.replace(findText, replaceText);
    setContent(newContent);
    onSave(draft.id, newContent);
  };

  /**
   * Handle Tab key in text editor:
   * - Inserts \t (tab character) at cursor position or selection
   * - Supports Shift+Tab to unindent
   */
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = textarea.value;

      // Handle Shift+Tab (Unindent)
      if (e.shiftKey) {
        const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;
        if (currentVal.startsWith('\t', lineStart)) {
          const updated = currentVal.substring(0, lineStart) + currentVal.substring(lineStart + 1);
          setContent(updated);
          onSave(draft.id, updated);
          requestAnimationFrame(() => {
            const newPos = Math.max(lineStart, start - 1);
            textarea.selectionStart = newPos;
            textarea.selectionEnd = Math.max(lineStart, end - 1);
          });
        } else if (currentVal.startsWith('    ', lineStart)) {
          const updated = currentVal.substring(0, lineStart) + currentVal.substring(lineStart + 4);
          setContent(updated);
          onSave(draft.id, updated);
          requestAnimationFrame(() => {
            const newPos = Math.max(lineStart, start - 4);
            textarea.selectionStart = newPos;
            textarea.selectionEnd = Math.max(lineStart, end - 4);
          });
        }
        return;
      }

      // Tab key: insert tab space (\t)
      const tabChar = '\t';
      const updated = currentVal.substring(0, start) + tabChar + currentVal.substring(end);
      setContent(updated);
      onSave(draft.id, updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabChar.length;
      });
    }
  };

  /**
   * Automatically format punctuation, spaces, and quotes before proofreading
   */
  const handleFormatAndCheck = () => {
    const result = autoFormatTamilTypography(content);
    let targetText = content;
    if (result.hasChanges) {
      targetText = result.formatted;
      setContent(result.formatted);
      onSave(draft.id, result.formatted);
      setFormatNotice('புள்ளிகள், காற்புள்ளிகள் மற்றும் மேற்கோள் குறிகள் சீரமைக்கப்பட்டன');
      setTimeout(() => setFormatNotice(null), 3500);
    }
    onCheck(targetText);
  };

  /**
   * Manual trigger for typography and spacing normalization
   */
  const handleManualFormat = () => {
    const result = autoFormatTamilTypography(content);
    if (result.hasChanges) {
      setContent(result.formatted);
      onSave(draft.id, result.formatted);
      setFormatNotice('நிறுத்தற்குறிகள் மற்றும் இடைவெளிகள் சீரமைக்கப்பட்டன!');
    } else {
      setFormatNotice('எழுத்துப் பிழையற்ற சரியான இடைவெளிகளுடன் உள்ளது!');
    }
    setTimeout(() => setFormatNotice(null), 3000);
  };

  const renderHighlightedContent = () => {
    const selectedSugg = suggestions.find(s => s.id === selectedSuggestionId);
    const selectedWord = selectedSugg?.original;

    const highlightWords: { text: string; type: string }[] = [];

    // 1. Add selected suggestion
    if (selectedWord) {
      highlightWords.push({ text: selectedWord, type: 'SELECTED' });
    }

    // 2. Add other suggestions
    suggestions.forEach(s => {
      if (s.original.trim() && s.id !== selectedSuggestionId) {
        // Only push if it doesn't match the selected word (to prevent duplicate highlight conflicts)
        if (s.original.toLowerCase() !== selectedWord?.toLowerCase()) {
          highlightWords.push({ text: s.original, type: s.type });
        }
      }
    });

    // 3. Add watchlist items
    watchList.forEach(w => {
      if (w.trim() && w.toLowerCase() !== selectedWord?.toLowerCase()) {
        highlightWords.push({ text: w, type: 'WATCH' });
      }
    });

    if (highlightWords.length === 0) return content;

    // Sort by length descending so that longer phrases are matched first in the regex
    const sortedWords = [...highlightWords].sort((a, b) => b.text.length - a.text.length);
    
    // Escape regex special characters
    const escapedWords = sortedWords.map(w => w.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    
    // Filter out duplicates in escapedWords to keep regex clean
    const uniqueEscapedWords = Array.from(new Set(escapedWords));
    if (uniqueEscapedWords.length === 0) return content;

    const regex = new RegExp(`(${uniqueEscapedWords.join('|')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, i) => {
      // Find the match in our sorted list (matching case-insensitively)
      const match = sortedWords.find(w => w.text.toLowerCase() === part.toLowerCase());
      if (match) {
        if (match.type === 'SELECTED') {
          return (
            <mark 
              key={i} 
              data-selected-mark="true"
              className="bg-purple-500/40 text-transparent border-b-2 border-purple-500 transition-all duration-300 rounded-sm"
            >
              {part}
            </mark>
          );
        }

        // Map other types to their styles
        let styleClass = '';
        let customBg = '';

        switch (match.type) {
          case 'SPELLING':
            styleClass = 'border-b-2 border-dashed border-rose-500';
            customBg = isDarkMode ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.12)';
            break;
          case 'GRAMMAR':
            styleClass = 'border-b-2 border-dashed border-emerald-500';
            customBg = isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)';
            break;
          case 'CONTEXT':
            styleClass = 'border-b-2 border-dashed border-amber-500';
            customBg = isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)';
            break;
          case 'CLARITY':
            styleClass = 'border-b-2 border-dashed border-blue-500';
            customBg = isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)';
            break;
          case 'IMPROVEMENT':
            styleClass = 'border-b-2 border-dashed border-purple-400';
            customBg = isDarkMode ? 'rgba(192, 132, 252, 0.25)' : 'rgba(192, 132, 252, 0.12)';
            break;
          case 'WATCH':
            styleClass = 'border-b-2 border-dashed border-cyan-500';
            customBg = isDarkMode ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.12)';
            break;
          default:
            styleClass = 'border-b-2 border-dashed border-rose-400';
            customBg = 'rgba(244, 63, 94, 0.1)';
        }

        return (
          <mark 
            key={i} 
            className={`text-transparent ${styleClass} transition-all duration-300 rounded-sm`}
            style={{ backgroundColor: customBg }}
          >
            {part}
          </mark>
        );
      }
      return <span key={i} className="text-transparent">{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 print:bg-white print:text-black ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F2F2F7] text-gray-900'}`}>
      <div className={`px-2.5 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between gap-1.5 sm:gap-4 sticky top-0 z-20 print:hidden ${isDarkMode ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-900' : 'bg-white/80 backdrop-blur-md border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {isSidebarCollapsed && onToggleSidebarCollapse && (
            <button 
              onClick={onToggleSidebarCollapse} 
              title="பக்கப்பட்டையை காட்டு (Expand Sidebar)"
              className={`p-1.5 sm:p-2 rounded-xl transition-all border shrink-0 ${
                isDarkMode 
                  ? 'hover:bg-zinc-900 border-zinc-800 text-purple-400' 
                  : 'hover:bg-gray-50 border-gray-200 text-purple-600 bg-white'
              }`}
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <input 
                autoFocus
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') handleTitleCancel(); }}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-lg border outline-none focus:ring-2 focus:ring-purple-500 transition-all font-tamil max-w-[100px] sm:max-w-[180px] ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}
              />
              <button onClick={handleTitleSave} className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-all shrink-0"><Check size={16} /></button>
              <button onClick={handleTitleCancel} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all shrink-0"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group cursor-pointer min-w-0" onClick={() => setIsEditingTitle(true)}>
              <h2 className="text-xs sm:text-sm font-black tracking-tight font-tamil truncate max-w-[70px] xs:max-w-[120px] sm:max-w-[180px]">{title}</h2>
              <Pencil size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden xs:flex items-center gap-0.5 sm:gap-1">
            <button disabled={!canUndo} onClick={onUndo} className={`p-1.5 sm:p-2 rounded-xl transition-all ${canUndo ? (isDarkMode ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-gray-50 text-gray-700') : 'opacity-20'}`} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
            <button disabled={!canRedo} onClick={onRedo} className={`p-1.5 sm:p-2 rounded-xl transition-all ${canRedo ? (isDarkMode ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-gray-50 text-gray-700') : 'opacity-20'}`} title="Redo (Ctrl+Y)"><Redo2 size={16} /></button>
          </div>
          
          {/* Style Memory Button */}
          {onOpenStyleMemory && (
            <button
              onClick={onOpenStyleMemory}
              title="சொல் பாணி & மெம்மரி விதிகள் (Style Memory)"
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold font-tamil transition-all shrink-0 ${
                isDarkMode 
                  ? 'hover:bg-zinc-900 text-purple-400 bg-purple-500/10' 
                  : 'hover:bg-purple-100/70 text-purple-700 bg-purple-50 border border-purple-100 shadow-xs'
              }`}
            >
              <BookMarked size={14} />
              <span className="hidden sm:inline">மெம்மரி</span>
              {styleMemoryCount !== undefined && styleMemoryCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-purple-600 text-white">
                  {styleMemoryCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden md:block relative" ref={fontSizeRef}>
            <button onClick={() => setShowFontSizeMenu(!showFontSizeMenu)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}>
              <TypeIcon size={15} />
              <span>{fontSize}px</span>
              <ChevronDown size={13} />
            </button>
            {showFontSizeMenu && (
              <div className={`absolute top-full left-0 mt-2 w-24 max-h-48 overflow-y-auto rounded-2xl border shadow-2xl z-50 py-2 no-scrollbar animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
                {FONT_SIZES.map(size => (
                  <button key={size} onClick={() => { setFontSize(size); setShowFontSizeMenu(false); }} className={`w-full px-4 py-1.5 text-xs text-left transition-all ${fontSize === size ? 'bg-purple-600 text-white font-bold' : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-50 text-gray-600')}`}>{size}px</button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block relative" ref={translateRef}>
            <button onClick={() => setShowTranslateMenu(!showTranslateMenu)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}>
              <Globe size={15} />
              <span>மொழிபெயர்ப்பு</span>
              <ChevronDown size={13} />
            </button>
            {showTranslateMenu && (
              <div className={`absolute top-full right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 py-2 no-scrollbar animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest opacity-30 border-b dark:border-zinc-800 mb-2">Target Language</p>
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang.code} 
                    onClick={() => { onTranslate(content, lang.code); setShowTranslateMenu(false); }} 
                    className={`w-full px-4 py-2.5 text-[11px] font-bold text-left transition-all font-tamil ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowFindReplace(!showFindReplace)} className={`hidden md:block p-2 rounded-xl transition-all ${showFindReplace ? 'bg-purple-600 text-white' : (isDarkMode ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-gray-50 text-gray-500')}`} title="கண்டுபிடி & மாற்று (Find & Replace)"><SearchIcon size={16} /></button>

          {/* Auto-Format Typography & Spacing Button */}
          <button
            onClick={handleManualFormat}
            title="நிறுத்தற்குறி, மேற்கோள் & இடைவெளி சீரமைப்பு (Auto-Format Spacing & Punctuation)"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold font-tamil transition-all shrink-0 active:scale-95 ${
              isDarkMode 
                ? 'hover:bg-teal-500/20 text-teal-400 bg-teal-500/10 border border-teal-500/20' 
                : 'hover:bg-teal-100 text-teal-700 bg-teal-50 border border-teal-200/60 shadow-xs'
            }`}
          >
            <Wand2 size={13} className="text-teal-500" />
            <span className="hidden sm:inline">சீரமை</span>
          </button>

          {/* CHECK BUTTON: Guaranteed prominent & visible in mobile portrait and landscape. Formats typography then checks */}
          <button 
            onClick={handleFormatAndCheck} 
            disabled={isChecking} 
            title="நிறுத்தற்குறிகள் சீரமைக்கப்பட்டு பிழைத்திருத்தம் செய்யப்படும்"
            className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isChecking 
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400' 
                : 'bg-purple-600 text-white shadow-purple-500/25 hover:bg-purple-700'
            }`}
          >
            {isChecking ? <RotateCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span className="font-tamil">{isChecking ? 'ஆராய்கிறது...' : 'சரிபார்'}</span>
          </button>
        </div>
      </div>

      {showFindReplace && (
        <div className={`px-4 py-2 border-b flex flex-wrap items-center gap-3 animate-in slide-in-from-top duration-300 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input type="text" placeholder="Find..." value={findText} onChange={(e) => setFindText(e.target.value)} className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`} />
            {matchIndices.length > 0 && (
              <div className="flex items-center gap-1 px-2 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                <span>{currentMatchIndex + 1} / {matchIndices.length}</span>
                <button onClick={goToPrevMatch} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"><ChevronUp size={14} /></button>
                <button onClick={goToNextMatch} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"><ChevronDown size={14} /></button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input type="text" placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`} />
            <div className="flex gap-1">
              <button onClick={() => handleFindReplace(false)} className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">Replace</button>
              <button onClick={() => handleFindReplace(true)} className="px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">All</button>
            </div>
          </div>
          <button onClick={() => setShowFindReplace(false)} className="p-1.5 opacity-40 hover:opacity-100 transition-opacity"><X size={18} /></button>
        </div>
      )}

      {/* Floating notice for automatic or manual typography/spacing fixes */}
      {formatNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 dark:bg-white/95 text-white dark:text-zinc-950 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold font-tamil animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md border border-white/10 dark:border-zinc-200">
          <Check size={14} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{formatNotice}</span>
        </div>
      )}

      <div className={`flex-1 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        {isChecking && (
          <div className={`absolute inset-0 z-30 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-500 ${isDarkMode ? 'bg-zinc-950/50' : 'bg-white/50'}`}>
             <div className={`p-8 rounded-[2.5rem] shadow-2xl border flex flex-col items-center gap-6 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-100 text-gray-900'}`}>
                <RotateCcw size={48} className="animate-spin text-purple-600" />
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-[0.2em] mb-2">AI Working</p>
                  <p className="text-[10px] font-bold opacity-40 font-tamil">தயவுசெய்து காத்திருக்கவும்...</p>
                </div>
             </div>
          </div>
        )}
        <div 
          ref={highlightRef} 
          className="absolute inset-0 p-8 sm:p-12 md:p-20 pointer-events-none whitespace-pre-wrap break-words font-tamil overflow-y-auto no-scrollbar" 
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.8', color: 'transparent', tabSize: 4, MozTabSize: 4 } as React.CSSProperties} 
          aria-hidden="true"
        >
          {renderHighlightedContent()}
        </div>
        <textarea 
          ref={textareaRef} 
          value={content} 
          onChange={handleContentChange} 
          onKeyDown={handleTextareaKeyDown} 
          onScroll={handleScroll} 
          className={`absolute inset-0 w-full h-full p-8 sm:p-12 md:p-20 resize-none outline-none font-tamil transition-colors duration-300 bg-transparent overflow-y-auto no-scrollbar ${isDarkMode ? 'text-zinc-100 selection:bg-purple-500/30' : 'text-gray-950 selection:bg-purple-100'}`} 
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.8', tabSize: 4, MozTabSize: 4, whiteSpace: 'pre-wrap' } as React.CSSProperties} 
          spellCheck={false} 
          placeholder="Start writing in Tamil..." 
        />
      </div>

      <div className={`px-6 py-2 border-t flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-40 print:hidden ${isDarkMode ? 'border-zinc-900' : 'border-gray-50'}`}>
        <div className="flex items-center gap-6"><span>{content.length} characters</span><span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span></div>
        <div className="flex items-center gap-4"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isChecking ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} /><span>{isChecking ? 'Processing' : 'Live Sync'}</span></div></div>
      </div>
    </div>
  );
});

export default EditorArea;
