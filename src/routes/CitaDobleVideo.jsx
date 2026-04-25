import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

const MAX_SECS = 3600;

function fmt(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function CitaDobleVideo() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const citaDoble     = useAuthStore((s) => s.citaDoble);
  const extendTime    = useAuthStore((s) => s.extendTime);
  const sparks        = useAuthStore((s) => s.sparks);

  const participants = citaDoble?.participants ?? [];
  const initSecs     = citaDoble?.timeRemaining ?? 600;

  const [timeLeft, setTimeLeft] = useState(initSecs);
  const [muted, setMuted]       = useState(false);
  const [camOff, setCamOff]     = useState(false);
  const [expired, setExpired]   = useState(false);
  const [extMsg, setExtMsg]     = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (expired) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setExpired(true); clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [expired]);

  function onExtend(seconds, cost) {
    if (!extendTime(seconds, cost)) { setExtMsg(`Sin Chispas (${cost} ⚡)`); return; }
    setTimeLeft((t) => Math.min(t + seconds, MAX_SECS));
    setExpired(false);
    setExtMsg(`+${seconds / 60} min añadidos ✓`);
    setTimeout(() => setExtMsg(''), 2500);
  }

  function onHangUp() {
    navigate(`/cita-doble/sala/${sessionId}`);
  }

  const pct = Math.max(0, (timeLeft / initSecs) * 100);
  const timerColor = pct > 30 ? '#00F5D4' : '#FF4D6D';
  const r = 14, circ = 2 * Math.PI * r;

  // Asegurar exactamente 4 cuadrantes (rellenar con placeholders si faltan)
  const slots = [
    ...participants.slice(0, 4),
    ...Array.from({ length: Math.max(0, 4 - participants.length) }, (_, i) => ({
      id: `empty-${i}`, type: 'empty', label: '—', handle: '', color: '#333', emoji: '👤',
    })),
  ];

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-black text-white select-none">

      {/* Barra superior */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-5">

        {/* Temporizador digital + anillo */}
        <div className="flex items-center gap-2">
          <div className="relative" style={{ width: 34, height: 34 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90">
              <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
              <circle
                cx="17" cy="17" r={r} fill="none"
                stroke={timerColor}
                strokeWidth="2.5"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - Math.min(pct, 100) / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          </div>
          <span
            className="font-mono text-xl font-bold"
            style={{ color: timerColor, textShadow: `0 0 10px ${timerColor}88` }}
          >
            {fmt(timeLeft)}
          </span>
        </div>

        {/* Captura bloqueada */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontSize: 10, color: '#B0B0B0' }}>Captura bloqueada</span>
        </div>
      </div>

      {/* Mosaico 2×2 */}
      <div className="mt-3 grid flex-1 grid-cols-2 gap-0.5">
        {slots.map((p, i) => {
          const isMyCam = p.id === 'me' && camOff;
          return (
            <VideoQuadrant
              key={p.id}
              participant={p}
              camOff={isMyCam}
              index={i}
            />
          );
        })}
      </div>

      {/* Controles inferiores */}
      <div className="relative z-20 flex flex-col gap-3 bg-gradient-to-t from-black to-transparent px-6 pb-8 pt-4">

        {extMsg && <p className="text-center text-sm font-semibold text-aura-cyan">{extMsg}</p>}

        {/* Botones de extensión */}
        <div className="flex justify-center gap-3">
          <ExtBtn label="+10 min" cost={80}  onClick={() => onExtend(600,  80)}  disabled={sparks < 80} />
          <ExtBtn label="+30 min" cost={200} onClick={() => onExtend(1800, 200)} disabled={sparks < 200} />
        </div>

        {/* Controles principales */}
        <div className="flex items-center justify-center gap-6">
          <CtrlBtn icon={muted ? '🔇' : '🎤'} label={muted ? 'Activar' : 'Silenciar'} onClick={() => setMuted((v) => !v)} />
          {/* Colgar */}
          <button
            type="button"
            onClick={onHangUp}
            className="grid place-items-center rounded-full bg-aura-error transition hover:opacity-80 active:scale-90"
            style={{ width: 58, height: 58, fontSize: 24, boxShadow: '0 0 16px rgba(255,77,109,0.5)' }}
            aria-label="Salir de llamada"
          >
            📵
          </button>
          <CtrlBtn icon={camOff ? '📷' : '📸'} label={camOff ? 'Activar cam' : 'Apagar cam'} onClick={() => setCamOff((v) => !v)} />
        </div>
      </div>

      {/* Overlay de tiempo agotado */}
      {expired && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/85 px-8 text-center backdrop-blur-sm">
          <p style={{ fontSize: 48 }}>⏱️</p>
          <h2 className="text-xl font-semibold">Tiempo agotado</h2>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <ExtBtn label="+10 min" cost={80}  onClick={() => onExtend(600,  80)}  disabled={sparks < 80}  big />
            <ExtBtn label="+30 min" cost={200} onClick={() => onExtend(1800, 200)} disabled={sparks < 200} big />
          </div>
          <button type="button" onClick={onHangUp} className="text-sm text-aura-text-2 underline">
            Terminar llamada
          </button>
        </div>
      )}

    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────── */

function VideoQuadrant({ participant, camOff }) {
  const isReal = participant.type !== 'empty';
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        background: camOff || !isReal
          ? '#111'
          : `radial-gradient(ellipse at 50% 60%, ${participant.color}18 0%, #050508 70%)`,
        minHeight: '28dvh',
      }}
    >
      {isReal ? (
        <>
          <div
            className="grid place-items-center rounded-full"
            style={{
              width: 56, height: 56, fontSize: 26,
              background: camOff ? '#2a2a2a' : `${participant.color}20`,
              border: `2px solid ${camOff ? '#333' : participant.color + '66'}`,
            }}
          >
            {camOff ? '🚫' : participant.emoji}
          </div>
          {/* Etiqueta con tipo */}
          <div
            className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur"
            style={{ fontSize: 10, color: participant.color }}
          >
            {participant.label}
            <span className="text-white/50 capitalize"> · {participant.type}</span>
          </div>
        </>
      ) : (
        <div className="text-aura-text-2" style={{ fontSize: 10 }}>—</div>
      )}
    </div>
  );
}

function ExtBtn({ label, cost, onClick, disabled, big }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-pill border border-aura-purple/50 font-semibold text-white transition hover:shadow-glow-purple active:scale-[.98] disabled:opacity-40 ${big ? 'w-full py-3 text-sm' : 'px-4 py-2 text-xs'}`}
    >
      {label} <span className="text-aura-cyan">({cost} ⚡)</span>
    </button>
  );
}

function CtrlBtn({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 transition active:scale-90">
      <div
        className="grid place-items-center rounded-full"
        style={{ width: 46, height: 46, fontSize: 20, background: 'rgba(255,255,255,0.1)' }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 9, color: '#B0B0B0' }}>{label}</span>
    </button>
  );
}
