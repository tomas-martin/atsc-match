'use client';

import { useEffect, useState } from 'react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not previously dismissed
      const wasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!wasDismissed) {
        setShowInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowInstall(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', '1');
  }

  if (!showInstall || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto animate-fade-in-up">
      <div className="glass-card p-4 flex items-center gap-3 shadow-2xl border-blue-bright/30">
        <div className="text-3xl">📱</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Instalá la app</div>
          <div className="text-xs text-gray-blue">
            Accedé rápido a tus entradas sin conexión
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            className="text-xs text-gray-blue hover:text-white transition-colors px-2 py-1"
            onClick={handleDismiss}
          >
            No
          </button>
          <button
            className="btn-primary !w-auto !min-h-0 !py-2 !px-4 text-xs"
            onClick={handleInstall}
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
