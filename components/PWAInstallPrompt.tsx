import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, MonitorCheck, Sparkles, Check } from 'lucide-react';
import { Logo } from './Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  isDarkMode: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ isDarkMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('SpellTamil PWA successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled || isDismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      {/* PWA Floating Install Pill / Toast */}
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div 
          className={`flex items-center gap-3 p-3.5 pr-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
            isDarkMode 
              ? 'bg-zinc-900/95 border-purple-500/30 text-zinc-100 shadow-purple-950/40' 
              : 'bg-white/95 border-purple-200 text-zinc-900 shadow-purple-500/15'
          }`}
        >
          <Logo size={42} />

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight">SpellTamil App</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500">
                PWA
              </span>
            </div>
            <p className="text-[11px] font-tamil opacity-70">
              கணினி / மொபைலில் செயலியை நிறுவவும்
            </p>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-black tracking-wide shadow-md shadow-purple-600/30 transition-all font-tamil"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>நிறுவு (Install)</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="மூடு"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <Logo size={44} showText isDarkMode={isDarkMode} />
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-xl opacity-60 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="font-bold text-base font-tamil mb-2">iPhone / iPad-ல் நிறுவும் முறை:</h3>
            <ol className="text-xs space-y-2 opacity-80 font-tamil list-decimal list-inside leading-relaxed mb-6">
              <li>Safari உலாவியின் கீழே உள்ள <strong>பகிர் (Share)</strong> பொத்தானைத் தொடவும்.</li>
              <li>கீழே உருட்டி <strong>'முகப்புத் திரையில் சேர்' (Add to Home Screen)</strong> என்பதைத் தேர்ந்தெடுக்கவும்.</li>
              <li>மேலே வலதுபுறத்தில் உள்ள <strong>'சேர்' (Add)</strong> என்பதை அழுத்தவும்.</li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
            >
              சரி, புரிந்தது
            </button>
          </div>
        </div>
      )}
    </>
  );
};
