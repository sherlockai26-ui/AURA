import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function inStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function onIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
}

export default function PwaBar() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall,    setShowInstall]    = useState(false);
  const [showIOS,        setShowIOS]        = useState(false);

  const {
    needRefresh:  [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (inStandalone()) return;
    if (onIOS()) { setShowIOS(true); return; }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
  }

  // Aviso de actualización — prioridad máxima
  if (needRefresh) {
    return (
      <Banner>
        <p className="text-sm text-white flex-1">Hay una nueva versión de AURA.</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 rounded-pill bg-aura-cyan px-3 py-1.5 text-xs font-semibold text-aura-bg"
        >
          Actualizar
        </button>
      </Banner>
    );
  }

  // iOS — instrucciones manuales
  if (showIOS) {
    return (
      <Banner onClose={() => setShowIOS(false)}>
        <div>
          <p className="text-sm font-semibold text-white">Instala AURA</p>
          <p className="text-xs text-aura-text-2 mt-0.5">
            En Safari: Compartir → Agregar a pantalla de inicio
          </p>
        </div>
      </Banner>
    );
  }

  // Android / Chrome / Edge — prompt nativo
  if (showInstall) {
    return (
      <Banner onClose={() => setShowInstall(false)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instala AURA</p>
          <p className="text-xs text-aura-text-2 mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-pill bg-aura-cyan px-3 py-1.5 text-xs font-semibold text-aura-bg"
        >
          Instalar
        </button>
      </Banner>
    );
  }

  return null;
}

function Banner({ children, onClose }) {
  return (
    <div className="fixed bottom-[84px] left-0 right-0 z-50 px-4 md:left-[240px] lg:left-[260px] lg:right-[300px] xl:right-[340px]">
      <div
        className="mx-auto max-w-[480px] flex items-center gap-3 rounded-card border border-white/10 bg-aura-surface px-4 py-3 shadow-glow-purple"
        style={{ borderColor: 'rgba(157,78,221,0.3)' }}
      >
        {children}
        {onClose && (
          <button onClick={onClose} className="shrink-0 text-aura-text-2 text-lg leading-none px-1" aria-label="Cerrar">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
