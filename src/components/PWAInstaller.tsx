'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';

export default function PWAInstaller() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredRef = useRef<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [iosStep, setIosStep] = useState(0);

  const checkStandalone = useCallback(() => {
    if (typeof window === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iosStandalone = (window.navigator as any).standalone === true;
    const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
    return iosStandalone || mediaStandalone;
  }, []);

  // Android native install
  const triggerAndroidInstall = useCallback(async () => {
    if (deferredRef.current) {
      try {
        deferredRef.current.prompt();
        const choice = await deferredRef.current.userChoice;
        if (choice.outcome === 'accepted') {
          setShowBanner(false);
        }
      } catch {
        // prompt already used
      }
      deferredRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

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

    // Android / Chrome: capture the install prompt
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e;

      // Auto-show banner for Android users
      const dismissed = localStorage.getItem('atsc-pwa-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    // iOS: auto-show guide on first visit
    if (isIosDevice) {
      const iosSeen = localStorage.getItem('atsc-ios-guide-seen');
      if (!iosSeen) {
        setTimeout(() => {
          setShowIosGuide(true);
        }, 1500);
      }
    }

    // Custom trigger from Footer button
    const customTrigger = () => {
      if (checkStandalone()) return;
      if (deferredRef.current) {
        triggerAndroidInstall();
      } else if (isIosDevice) {
        setIosStep(0);
        setShowIosGuide(true);
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener('trigger-pwa-install', customTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('trigger-pwa-install', customTrigger);
    };
  }, [checkStandalone, triggerAndroidInstall]);

  function handleInstallClick() {
    if (deferredRef.current) {
      triggerAndroidInstall();
    } else if (isIos) {
      setIosStep(0);
      setShowIosGuide(true);
      setShowBanner(false);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    try {
      localStorage.setItem('atsc-pwa-dismissed', Date.now().toString());
    } catch {
      // Ignore
    }
  }

  function handleCloseIosGuide() {
    setShowIosGuide(false);
    setShowBanner(false);
    try {
      localStorage.setItem('atsc-ios-guide-seen', '1');
    } catch {
      // Ignore
    }
  }

  if (isStandalone) return null;

  const iosSteps = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M12 2.25v12m0-12l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Tocá el botón Compartir',
      description: 'En la barra inferior de Safari, buscá el ícono de compartir (un cuadrado con una flecha hacia arriba).',
      color: 'blue',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Agregar a Inicio',
      description: 'Deslizá hacia abajo en el menú y tocá "Agregar a pantalla de inicio".',
      color: 'rose',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: '¡Confirmá y listo!',
      description: 'Tocá "Agregar" en la esquina superior derecha. La app se instalará en tu pantalla de inicio.',
      color: 'emerald',
    },
  ];

  return (
    <>
      {/* ━━━ Android / Chrome Install Banner ━━━ */}
      {showBanner && (
        <aside
          role="region"
          aria-label="Instalación de la app"
          className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto"
          style={{ animation: 'slideUp .4s cubic-bezier(.22,1,.36,1) both' }}
        >
          <div className="bg-[var(--bg-surface-elevated)]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-white/10 relative">
                <Image
                  src="/apple-touch-icon.png"
                  alt="Andes Talleres App"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-[var(--text-primary)] truncate">
                  📲 Instalá la App
                </div>
                <div className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                  Accedé rápido a tus entradas desde tu celular
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95"
                style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
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

      {/* ━━━ iOS Full-Screen Installation Guide ━━━ */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-guide-title"
          className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-md"
          style={{ animation: 'fadeIn .3s ease both' }}
        >
          {/* Top close button */}
          <div className="flex justify-end p-4">
            <button
              onClick={handleCloseIosGuide}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-all active:scale-90"
              aria-label="Cerrar guía"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
            {/* App icon */}
            <div
              className="w-20 h-20 rounded-[22px] overflow-hidden shadow-2xl mb-4 border-2 border-white/20"
              style={{ animation: 'bounceIn .6s cubic-bezier(.22,1,.36,1) both' }}
            >
              <Image
                src="/apple-touch-icon.png"
                alt="ATSC App"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 id="ios-guide-title" className="text-white font-black text-xl text-center mb-1">
              Instalá ATSC Entradas
            </h2>
            <p className="text-white/60 text-sm text-center mb-8 max-w-xs">
              Agregá la app a tu pantalla de inicio para acceder rápido a tus entradas
            </p>

            {/* Step cards */}
            <div className="w-full max-w-sm space-y-3">
              {iosSteps.map((step, i) => {
                const isActive = i === iosStep;
                const isPast = i < iosStep;
                const colorMap: Record<string, string> = {
                  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-400',
                  rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/40 text-rose-400',
                  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-400',
                };
                const activeColors = colorMap[step.color] || colorMap.blue;

                return (
                  <div
                    key={i}
                    className={`
                      relative rounded-2xl p-4 border transition-all duration-500
                      ${isActive
                        ? `bg-gradient-to-r ${activeColors}`
                        : isPast
                          ? 'bg-white/5 border-white/10 opacity-50'
                          : 'bg-white/5 border-white/10 opacity-40'
                      }
                    `}
                    style={{
                      animation: `slideUp .4s cubic-bezier(.22,1,.36,1) ${i * 0.1}s both`,
                    }}
                    onClick={() => setIosStep(i)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Step number */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm
                        ${isActive
                          ? 'bg-white/20 text-white'
                          : isPast
                            ? 'bg-emerald-500/30 text-emerald-400'
                            : 'bg-white/10 text-white/50'
                        }
                      `}>
                        {isPast ? '✓' : i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm">
                          {step.title}
                        </div>
                        {isActive && (
                          <p
                            className="text-white/70 text-xs mt-1 leading-relaxed"
                            style={{ animation: 'fadeIn .3s ease both' }}
                          >
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Icon on active step */}
                      {isActive && (
                        <div
                          className="flex-shrink-0 text-white/80"
                          style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                        >
                          {step.icon}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next / Done button */}
            <div className="mt-8 w-full max-w-sm">
              {iosStep < iosSteps.length - 1 ? (
                <button
                  onClick={() => setIosStep(iosStep + 1)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={handleCloseIosGuide}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
                >
                  ¡Entendido, voy a instalarlo! ✨
                </button>
              )}
            </div>
          </div>

          {/* Bottom arrow pointing to Safari share button */}
          {iosStep === 0 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-white/50 text-[11px] font-semibold mb-1">
                El botón está acá abajo ↓
              </span>
              <div
                className="text-blue-400 text-3xl"
                style={{ animation: 'bounceArrow 1s ease-in-out infinite' }}
              >
                ↓
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━ CSS Animations ━━━ */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(244,63,94,0.2); }
        }
      `}</style>
    </>
  );
}
