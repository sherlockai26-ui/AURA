import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function VideoLlamadaMatch() {
  const { matchId }    = useParams();
  const navigate       = useNavigate();
  const activeMatch    = useAuthStore((s) => s.activeMatch);
  const setActiveMatch = useAuthStore((s) => s.setActiveMatch);
  const spendSpark     = useAuthStore((s) => s.spendSpark);
  const sparks         = useAuthStore((s) => s.sparks);

  const initialSecs = (activeMatch?.videoCallMinutesLeft ?? 8) * 60;
  const [timeLeft, setTimeLeft]   = useState(initialSecs);
  const [muted, setMuted]         = useState(false);
  const [camOff, setCamOff]       = useState(false);
  const [expired, setExpired]     = useState(false);
  const [extMsg, setExtMsg]       = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (expired) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setExpired(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [expired]);

  function extend(minutes, cost) {
    if (!spendSpark(cost)) { setExtMsg(`Sin Chispas suficientes (necesitas ${cost} ⚡)`); return; }
    setTimeLeft((t) => t + minutes * 60);
    setExpired(false);
    setExtMsg(`+${minutes} min añadidos`);
    setTimeout(() => setExtMsg(''), 2500);
    if (activeMatch) {
      setActiveMatch({ ...activeMatch, videoCallMinutesLeft: Math.floor((timeLeft + minutes * 60) / 60) });
    }
  }

  function endCall() {
    navigate(-1);
  }

  const pct = initialSecs > 0 ? (timeLeft / initialSecs) * 100 : 0;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-black text-white select-none">

      {/* Barra superior */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-5">
        {/* Temporizador digital */}
        <div
          className="rounded-full bg-black/60 px-4 py-1.5 font-mono text-lg font-bold backdrop-blur"
          style={{ color: expired ? '#FF4D6D' : '#00F5D4', textShadow: expired ? '0 0 8px #FF4D6D' : '0 0 8px #00F5D4' }}
        >
          {fmt(timeLeft)}
        </div>

        {/* Barra de progreso circular mini */}
        <div className="relative" style={{ width: 36, height: 36 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={pct > 30 ? '#00F5D4' : '#FF4D6D'}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </div>

        {/* Captura bloqueada */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontSize: 10, color: '#B0B0B0' }}>Captura bloqueada</span>
        </div>
      </div>

      {/* Dos mitades de video */}
      <div className="flex flex-1 flex-col">
        {/* Video remoto (partner) */}
        <VideoPane
          label={activeMatch?.otherNickname ?? 'Conexión…'}
          color="#9D4EDD"
          topHalf
          camOff={false}
        />
        {/* Video propio */}
        <VideoPane
          label="Tú"
          color="#00F5D4"
          topHalf={false}
          camOff={camOff}
        />
      </div>

      {/* Controles inferiores */}
      <div className="relative z-20 flex flex-col gap-3 bg-gradient-to-t from-black/90 to-transparent px-6 pb-8 pt-4">

        {extMsg && (
          <p className="text-center text-sm font-semibold text-aura-cyan">{extMsg}</p>
        )}

        {/* Botones de extensión */}
        <div className="flex gap-2 justify-center">
          <ExtBtn label="+15 min" cost={100} onClick={() => extend(15, 100)} disabled={sparks < 100} />
          <ExtBtn label="+30 min" cost={180} onClick={() => extend(30, 180)} disabled={sparks < 180} />
        </div>

        {/* Controles de llamada */}
        <div className="flex items-center justify-center gap-5">
          <ControlBtn
            active={muted}
            onClick={() => setMuted((v) => !v)}
            icon={muted ? '🔇' : '🎤'}
            label={muted ? 'Activar mic' : 'Silenciar'}
          />
          {/* Colgar */}
          <button
            type="button"
            onClick={endCall}
            className="grid place-items-center rounded-full bg-aura-error transition hover:opacity-80 active:scale-90"
            style={{ width: 60, height: 60, fontSize: 24, boxShadow: '0 0 16px rgba(255,77,109,0.5)' }}
            aria-label="Terminar llamada"
          >
            📵
          </button>
          <ControlBtn
            active={camOff}
            onClick={() => setCamOff((v) => !v)}
            icon={camOff ? '📷' : '📸'}
            label={camOff ? 'Activar cam' : 'Apagar cam'}
          />
        </div>
      </div>

      {/* Overlay de tiempo agotado */}
      {expired && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/80 px-8 text-center backdrop-blur-sm">
          <p className="text-4xl">⏱️</p>
          <h2 className="text-xl font-semibold">Tiempo de videollamada agotado</h2>
          <p className="text-sm text-aura-text-2">¿Extender la llamada?</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <ExtBtn label="+15 min" cost={100} onClick={() => extend(15, 100)} disabled={sparks < 100} big />
            <ExtBtn label="+30 min" cost={180} onClick={() => extend(30, 180)} disabled={sparks < 180} big />
          </div>
          <button
            type="button"
            onClick={endCall}
            className="text-sm text-aura-text-2 underline"
          >
            Terminar llamada
          </button>
        </div>
      )}

    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────── */

function VideoPane({ label, color, topHalf, camOff }) {
  return (
    <div
      className="relative flex flex-1 items-center justify-center overflow-hidden"
      style={{
        background: camOff
          ? '#1F2833'
          : `radial-gradient(ellipse at center, ${color}18 0%, #0B0C10 70%)`,
        borderBottom: topHalf ? '1px solid rgba(255,255,255,0.05)' : undefined,
      }}
    >
      {/* Silueta */}
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: 80, height: 80,
          background: camOff ? '#2a2a2a' : `${color}22`,
          border: `2px solid ${color}44`,
        }}
      >
        <span style={{ fontSize: 36 }}>{camOff ? '🚫' : '👤'}</span>
      </div>

      {/* Etiqueta */}
      <div
        className="absolute bottom-3 left-4 rounded-full bg-black/60 px-3 py-1 backdrop-blur"
        style={{ fontSize: 12 }}
      >
        {label}
      </div>
    </div>
  );
}

function ExtBtn({ label, cost, onClick, disabled, big }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-pill border border-aura-purple bg-transparent font-semibold tracking-wide text-white transition hover:shadow-glow-purple active:scale-[.98] disabled:opacity-40 ${big ? 'w-full py-3 text-sm' : 'px-4 py-2 text-xs'}`}
    >
      {label} <span className="text-aura-cyan">({cost} ⚡)</span>
    </button>
  );
}

function ControlBtn({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 transition active:scale-90"
    >
      <div
        className="grid place-items-center rounded-full transition"
        style={{
          width: 48, height: 48, fontSize: 22,
          background: active ? 'rgba(255,77,109,0.2)' : 'rgba(255,255,255,0.1)',
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 9, color: '#B0B0B0' }}>{label}</span>
    </button>
  );
}
