import { useState } from 'react';
import { useAuthStore } from '../lib/store.js';
import { CitaDobleIcon } from '../components/NavIcons.jsx';

export default function CitaDoblePortal() {
  const session         = useAuthStore((s) => s.session);
  const sparks          = useAuthStore((s) => s.sparks);
  const citaDoble       = useAuthStore((s) => s.citaDoble);

  const myType     = session?.mode === 'duo' ? 'duo' : 'single';
  const myHandle   = session?.handle ?? 'yo';
  const myLabel    = session?.display_name || session?.handle || 'Tú';

  const myParticipant = {
    id: 'me',
    type: myType,
    label: myLabel,
    handle: `@${myHandle}`,
    color: myType === 'duo' ? '#9D4EDD' : '#00F5D4',
    emoji: myType === 'duo' ? '👫' : '👤',
  };

  const freeToday   = citaDoble?.freeEntriesToday ?? 1;

  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast]      = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  }

  function onSearch() {
    setIsSearching(true);
    showToast('Aún no hay participantes reales disponibles para Cita Doble.');
  }

  function onCancel() {
    setIsSearching(false);
  }

  function onInvite() {
    showToast('Las invitaciones reales de Cita Doble aún no están conectadas.');
  }

  return (
    <div className="flex flex-col bg-aura-bg text-white" style={{ minHeight: 'calc(100dvh - 80px)' }}>

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-2">
        <CitaDobleIcon active size={26} />
        <div>
          <h1 className="text-lg font-semibold tracking-wide">Cita Doble</h1>
          <p className="text-xs text-aura-text-2">4 personas · 10 min gratis</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-pill border border-white/10 px-3 py-1.5">
          <span style={{ fontSize: 12 }}>⚡</span>
          <span className="text-aura-cyan" style={{ fontSize: 12 }}>{sparks}</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center px-5 pb-6 pt-2">

        {/* Tarjeta de entrada */}
        <div className="mb-6 w-full rounded-card border border-white/10 bg-aura-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Tu entrada hoy</p>
              <p className="mt-0.5 text-xs text-aura-text-2">
                {freeToday > 0 ? '1/1 gratis disponible' : 'Sin entrada gratuita disponible'}
              </p>
            </div>
            <div
              className="rounded-pill px-3 py-1.5 text-sm font-bold"
              style={{
                background: freeToday > 0 ? 'rgba(0,245,212,0.15)' : 'rgba(157,78,221,0.15)',
                color: freeToday > 0 ? '#00F5D4' : '#9D4EDD',
                border: `1px solid ${freeToday > 0 ? 'rgba(0,245,212,0.3)' : 'rgba(157,78,221,0.3)'}`,
              }}
            >
              {freeToday > 0 ? 'GRATIS' : 'NO DISP.'}
            </div>
          </div>
        </div>

        {/* Zona de búsqueda / animación */}
        <div className="relative mb-6 flex flex-col items-center justify-center" style={{ minHeight: 200 }}>
          {isSearching ? (
            <>
              {/* Anillos expansivos */}
              <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: '100%', height: '100%',
                      border: '1.5px solid rgba(157,78,221,0.35)',
                      animation: `ripple 2.4s ease-out ${i * 0.8}s infinite`,
                    }}
                  />
                ))}
                <div
                  className="relative z-10 grid place-items-center rounded-full"
                  style={{
                    width: 72, height: 72,
                    background: 'rgba(157,78,221,0.2)',
                    border: '2px solid #9D4EDD',
                    boxShadow: '0 0 20px rgba(157,78,221,0.4)',
                  }}
                >
                  <CitaDobleIcon active size={30} />
                </div>
              </div>
              <p className="mt-3 text-sm text-aura-cyan animate-pulse">Buscando participantes…</p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <CitaDobleIcon active={false} size={48} />
              <p className="text-sm text-aura-text-2">Esperando inicio de búsqueda</p>
            </div>
          )}
          <style>{`
            @keyframes ripple {
              0%   { transform: scale(0.5); opacity: 0.7; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `}</style>
        </div>

        {/* Grid de participantes (2×2) */}
        <div className="mb-6 grid w-full max-w-xs grid-cols-2 gap-3">
          {/* Mi slot (siempre presente) */}
          <ParticipantSlot participant={myParticipant} found label="Tú" />
          {/* Otros slots */}
          {Array.from({ length: 3 }, (_, i) => (
            <ParticipantSlot
              key={i}
              found={false}
              searching={isSearching}
            />
          ))}
        </div>

        {isSearching && (
          <p className="mb-4 text-center text-sm text-aura-text-2">
            Aún no hay participantes reales disponibles.
          </p>
        )}

        {/* Botones de acción */}
        <div className="flex w-full flex-col gap-3">
          {!isSearching ? (
            <>
              <button
                type="button"
                onClick={onSearch}
                className="w-full rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition hover:opacity-90 active:scale-[.99]"
              >
                Buscar Cita Doble
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onInvite}
                  className="flex-1 rounded-pill border border-aura-purple bg-transparent py-3 text-sm font-semibold text-white transition hover:shadow-glow-purple active:scale-[.99] disabled:opacity-40"
                >
                  Invitar a Cita
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-pill border border-aura-error/50 bg-transparent py-4 font-semibold tracking-wider text-aura-error transition hover:bg-aura-error/10 active:scale-[.99]"
            >
              Cancelar búsqueda
            </button>
          )}
        </div>

        {/* Nota informativa */}
        <p className="mt-5 text-center text-xs text-aura-text-2">
          <span className="text-aura-cyan">🔒</span> Capturas bloqueadas · Sala se autodestruye tras 24h inactiva
        </p>

      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-aura-surface/95 px-5 py-2.5 text-sm font-medium shadow-glow-purple backdrop-blur"
          style={{ border: '1px solid rgba(157,78,221,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

    </div>
  );
}

/* ── ParticipantSlot ─────────────────────────────────────────────── */
function ParticipantSlot({ participant, found, searching, label }) {
  if (!found) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-card border border-white/10 bg-aura-surface/40 py-5"
        style={{ minHeight: 100 }}
      >
        {searching ? (
          <>
            <div
              className="h-10 w-10 rounded-full border border-aura-purple/40 animate-pulse"
              style={{ background: 'rgba(157,78,221,0.1)' }}
            />
            <p className="text-xs text-aura-text-2">Buscando…</p>
          </>
        ) : (
          <>
            <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5" />
            <p className="text-xs text-aura-text-2">Libre</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-card border py-5 transition-all"
      style={{
        minHeight: 100,
        borderColor: `${participant.color}44`,
        background: `${participant.color}0D`,
      }}
    >
      <div className="relative">
        <div
          className="grid place-items-center rounded-full"
          style={{
            width: 40, height: 40, fontSize: 20,
            background: `${participant.color}22`,
            border: `1.5px solid ${participant.color}`,
          }}
        >
          {participant.emoji}
        </div>
        {/* Checkmark */}
        <div
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-green-500"
          style={{ width: 16, height: 16, fontSize: 9 }}
        >
          ✓
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: participant.color }}>
          {label ?? participant.handle}
        </p>
        <p className="text-[9px] text-aura-text-2 capitalize">{participant.type}</p>
      </div>
    </div>
  );
}
