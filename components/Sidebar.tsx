
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  LogOut, 
  Moon,
  Sun,
  Layout,
  FileText,
  MoreVertical,
  BookOpen,
  Key,
  PanelLeftClose,
  BookMarked,
  Cpu,
  Download
} from 'lucide-react';
import { ViewState, User, Draft } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  drafts: Draft[];
  activeDraftId?: string;
  onSelectDraft: (draft: Draft) => void;
  onNewDraft: () => void;
  onDeleteDraft: (id: string) => void;
  onOpenKeyDialog: () => void;
  onToggleCollapse?: () => void;
  onOpenStyleMemory?: () => void;
  styleMemoryCount?: number;
  onOpenEngineSettings?: () => void;
  hasApiKey?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  user, 
  onLogout,
  isDarkMode,
  toggleTheme,
  drafts,
  activeDraftId,
  onSelectDraft,
  onNewDraft,
  onDeleteDraft,
  onOpenKeyDialog,
  onToggleCollapse,
  onOpenStyleMemory,
  styleMemoryCount,
  onOpenEngineSettings,
  hasApiKey
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className={`w-16 md:w-64 border-r h-full flex flex-col justify-between transition-all duration-300 z-40 ${
      isDarkMode ? 'bg-zinc-950 border-zinc-900 text-zinc-300' : 'bg-white border-gray-100 text-gray-700 shadow-xl'
    }`}>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('editor')}>
            <Logo size={36} />
            <div className="hidden md:flex flex-col">
              <h1 className={`font-black text-base tracking-tight leading-none ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>SpellTamil</h1>
              <span className="text-[10px] font-tamil opacity-60 leading-tight">தமிழ் பிழை திருத்தி</span>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="பக்கப்பட்டையை சுருக்கு (Collapse Sidebar)"
              className="hidden md:flex p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        <div className="px-4 mb-6">
          <button
            onClick={onNewDraft}
            className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow-xl shadow-black/5"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="hidden md:block">New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1">
          <div className="hidden md:flex items-center justify-between mb-3 ml-2 pr-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Recent Docs</p>
          </div>
          {drafts.map((draft) => (
            <div key={draft.id} className="relative group/item">
              <button
                onClick={() => onSelectDraft(draft)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  activeDraftId === draft.id && currentView === 'editor'
                    ? (isDarkMode ? 'bg-zinc-900 text-purple-400' : 'bg-purple-50 text-purple-600')
                    : (isDarkMode ? 'hover:bg-zinc-900/50 text-zinc-500' : 'hover:bg-gray-50 text-gray-400')
                }`}
              >
                <FileText size={16} className={`shrink-0 ${activeDraftId === draft.id ? 'text-purple-500' : 'opacity-40'}`} />
                <span className="hidden md:block truncate text-left flex-1 font-tamil">{draft.title}</span>
              </button>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === draft.id ? null : draft.id);
                  }}
                  className={`hidden md:block p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-opacity ${menuOpenId === draft.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}
                >
                  <MoreVertical size={14} />
                </button>
                {menuOpenId === draft.id && (
                  <div className={`absolute right-0 top-full mt-2 w-32 rounded-2xl border shadow-2xl z-50 py-2 animate-in zoom-in-95 fade-in duration-200 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-100'}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDraft(draft.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-50 dark:border-zinc-900 space-y-1">
        {onOpenStyleMemory && (
          <button
            onClick={onOpenStyleMemory}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isDarkMode ? 'hover:bg-zinc-900 text-purple-400' : 'hover:bg-purple-50 text-purple-700'
            }`}
          >
            <BookMarked size={18} />
            <span className="hidden md:flex flex-1 items-center justify-between font-tamil">
              <span>சொல் மெம்மரி (Style Rules)</span>
              {styleMemoryCount !== undefined && styleMemoryCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-purple-600 text-white font-mono font-black">
                  {styleMemoryCount}
                </span>
              )}
            </span>
          </button>
        )}
        {onOpenEngineSettings && (
          <button
            onClick={onOpenEngineSettings}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isDarkMode ? 'hover:bg-zinc-900 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-700'
            }`}
          >
            <Cpu size={18} />
            <span className="hidden md:flex flex-1 items-center justify-between font-tamil">
              <span>ஆய்வு என்ஜின் (Engine)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] bg-indigo-600 text-white font-mono font-bold">
                v3.5
              </span>
            </span>
          </button>
        )}

        <button
          onClick={() => setView('gallery')}
          className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentView === 'gallery' 
              ? (isDarkMode ? 'bg-zinc-900 text-blue-400 shadow-inner' : 'bg-blue-50 text-blue-600')
              : (isDarkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-gray-50')
          }`}
        >
          <BookOpen size={18} />
          <span className="hidden md:block">Word Gallery</span>
        </button>

        <button
          onClick={() => setView('trash')}
          className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentView === 'trash' 
              ? (isDarkMode ? 'bg-zinc-900 text-red-400 shadow-inner' : 'bg-red-50 text-red-600')
              : (isDarkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-gray-50')
          }`}
        >
          <Trash2 size={18} />
          <span className="hidden md:block">Trash Bin</span>
        </button>

        <button
          onClick={onOpenKeyDialog}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isDarkMode ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-gray-50 text-gray-500'
          }`}
          title={hasApiKey ? 'Custom Gemini API Key is configured' : 'API Key is required in Settings'}
        >
          <div className="flex items-center gap-3">
            <Key size={18} className={hasApiKey ? 'text-emerald-500' : 'text-amber-500'} />
            <span className="hidden md:block">API Key Settings</span>
          </div>
          <span className={`hidden md:inline-block text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
            hasApiKey 
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
          }`}>
            {hasApiKey ? 'Active' : 'Set Key'}
          </span>
        </button>

        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isDarkMode ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-gray-50 text-gray-500'
          }`}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="hidden md:block">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          <LogOut size={18} />
          <span className="hidden md:block">Logout</span>
        </button>

        {user && (
          <div className="pt-4 flex items-center gap-3 px-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-purple-400' : 'bg-white border-gray-100 text-purple-600 shadow-sm'
            }`}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden md:block truncate">
              <p className="text-[11px] font-black truncate leading-tight">{user.name}</p>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Free Plan</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
