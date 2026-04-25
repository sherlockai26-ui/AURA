import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';
import { CitaDobleIcon } from '../components/NavIcons.jsx';

export default function CitaDobleResultado() {
  const navigate      = useNavigate();
  const citaDoble     = useAuthStore((s) => s.citaDoble);
  const leaveSession  = useAuthStore((s) => s.leaveSession);

  const participants = (citaDoble?.participants ?? []).filter((p) => p.id !== 'me');
  const [connected, setConnected] = useState({});   // { [id]: 'pending' | 'sent' }

  function onConnect(p) {
    setConnected((prev) => ({ ...prev, [p.id]: 'sent' }));
  }

  function onNewSession() {
    leaveSession();
    navigate('/cita-doble', { replace: true });
  }

  function onHome() {
    leaveSession();
    navigate('/feed', { replace: true });
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <Particles />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* Ícono: 4 siluetas conectadas */}
          <div className="grid place-items-center rounded-full" style={{
            width: 80, height: 80,
            background: 'rgba(157,78,221,0.15)',
            border: '2px solid rgba(157,78,221,0.4)',
            boxShadow: '0 0 24px rgba(157,78,221,0.3)',
          }}>
            <CitaDobleIcon active size={36} />
          </div>
          <h1 className="text-2xl font-semibold tracking-wide">¡La Cita Doble ha terminado!</h1>
          <p className="max-w-xs text-sm text-aura-text-2">
            Fue un buen encuentro. ¿Quieres seguir la conversación en privado?
          </p>
        </div>

        {/* Lista de participantes */}
        {participants.length > 0 ? (
          <div className="mb-6 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-aura-text-2">Participantes</p>
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                status={connected[p.id]}
                onConnect={() => onConnect(p)}
              />
            ))}
          </div>
        ) : (
          <div className="mb-6 rounded-card border border-white/10 bg-aura-surface p-5 text-center">
            <p className="text-sm text-aura-text-2">Sin datos de participantes disponibles.</p>
          </div>
        )}

        {/* Nota de match individual */}
        <div className="mb-6 rounded-card border border-aura-cyan/20 bg-aura-cyan/5 px-4 py-3">
          <p className="text-xs text-aura-text-2">
            <span className="text-aura-cyan font-semibold">💡 Tip:</span>{' '}
            Si ambos se conectan, podrían iniciar un Match individual con 25 min de chat.
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            onClick={onNewSession}
            className="w-full rounded-pill bg-aura-purple py-4 font-semibold uppercase tracking-wider text-white shadow-glow-purple transition hover:opacity-90 active:scale-[.99]"
          >
            Nueva Cita Doble
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-pill border border-white/15 bg-transparent py-4 font-semibold tracking-wider text-aura-text-2 transition hover:border-white/30 hover:text-white active:scale-[.99]"
          >
            Volver al inicio
          </button>
        </div>

      </main>
    </div>
  );
}

/* ── ParticipantRow ──────────────────────────────────────────────── */
function ParticipantRow({ participant, status, onConnect }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-white/10 bg-aura-surface p-4">
      {/* Avatar */}
      <div
        className="grid shrink-0 place-items-center rounded-full"
        style={{
          width: 44, height: 44, fontSize: 20,
          background: `${participant.color}20`,
          border: `1.5px solid ${participant.color}66`,
        }}
      >
        {participant.emoji}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{participant.handle}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-aura-text-2 capitalize">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: participant.color }}
          />
          {participant.type}
        </p>
      </div>

      {/* Acción */}
      {status === 'sent' ? (
        <span className="shrink-0 text-xs text-aura-cyan font-medium">Solicitud enviada ✓</span>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="shrink-0 rounded-pill border px-3 py-1.5 text-xs font-semibold transition hover:shadow-glow-cyan active:scale-95"
          style={{
            borderColor: participant.color + '66',
            color: participant.color,
          }}
        >
          Conectar
        </button>
      )}
    </div>
  );
}
