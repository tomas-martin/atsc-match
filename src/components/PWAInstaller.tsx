'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PWAInstaller() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      return isIosStandalone || isMediaStandalone;
    };

    if (checkStandalone()) {
      // Already installed as PWA!
      queueMicrotask(() => setIsStandalone(true));
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    queueMicrotask(() => setIsIos(isIosDevice));

    // Register Service Worker in production
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('SW registration failed:', err);
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => r.unregister());
        });
        if ('caches' in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      }
    }

    // Android / Chrome PWA prompt listener
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('atsc-pwa-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    // Custom trigger from any button on the site
    const customTriggerHandler = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else if (isIosDevice) {
        setShowIosModal(true);
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener('trigger-pwa-install', customTriggerHandler);

    // Show banner after 2 seconds on mobile if not dismissed
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('atsc-pwa-dismissed');
      if (!dismissed && !checkStandalone()) {
        setShowBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('trigger-pwa-install', customTriggerHandler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Generic browser instructions
      setShowIosModal(true);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    // Don't show again for 7 days
    try {
      localStorage.setItem('atsc-pwa-dismissed', Date.now().toString());
    } catch {
      // Ignore
    }
  }

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Bottom App Installation Banner */}
      {showBanner && (
        <aside
          role="region"
          aria-label="Instalación de la app"
          className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto animate-fade-in-up"
        >
          <div className="bg-[var(--bg-surface-elevated)]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-white/10 relative">
                <Image
                  src="/apple-touch-icon.png"
                  alt="Andes Talleres App"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-[var(--text-primary)] truncate">
                  Instalá ATSC Entradas
                </div>
                <div className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                  Accedé rápido a tus pases sin conexión
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors text-sm"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Installation Guide Modal */}
      {showIosModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/10">
                <Image
                  src="/apple-touch-icon.png"
                  alt="ATSC App"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 id="ios-modal-title" className="font-black text-lg text-[var(--text-primary)]">
                Instalá la App en tu Celular
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Llevá tus entradas en la pantalla de inicio con acceso instantáneo.
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-[var(--text-primary)] mb-6 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)]">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                  1
                </div>
                <div>
                  Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari{' '}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                    ⎙ / ⎋
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                  2
                </div>
                <div>
                  Deslizá hacia abajo y seleccioná{' '}
                  <strong>&quot;Agregar a pantalla de inicio&quot;</strong>{' '}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                    ➕
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                  3
                </div>
                <div>
                  Tocá <strong>&quot;Agregar&quot;</strong> en la esquina superior derecha. ¡Listo!
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosModal(false);
                setShowBanner(false);
              }}
              className="btn-primary"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
