import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

const MAX_SECS   = 3600; // 1 hora máximo
const REPLIES = [
  '¡Qué buena onda tienen! 😊',
  'Totalmente de acuerdo con eso.',
  'Jaja, igual aquí! 🙌',
  '¿Y de dónde son todos?',
  '¡Primera Cita Doble y ya me encanta! ✨',
  'Esto está mucho mejor de lo que esperaba.',
  'Hay una energía muy bonita en el grupo.',
];

function fmt(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function CitaDobleChat() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const citaDoble     = useAuthStore((s) => s.citaDoble);
  const extendTime    = useAuthStore((s) => s.extendTime);
  const leaveSession  = useAuthStore((s) => s.leaveSession);
  const sparks        = useAuthStore((s) => s.sparks);

  const participants  = citaDoble?.participants ?? [];
  const others        = participants.filter((p) => p.id !== 'me');
  const me            = participants.find((p) => p.id === 'me');

  const initSecs = citaDoble?.timeRemaining ?? 600;
  const [timeLeft, setTimeLeft]   = useState(initSecs);
  const [expired, setExpired]     = useState(false);
  const [messages, setMessages]   = useState(() => buildSeedMsgs(others));
  const [draft, setDraft]         = useState('');
  const [extMsg, setExtMsg]       = useState('');
  const timerRef  = useRef(null);
  const bottomRef = useRef(null);

  // Temporizador
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

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, pid: 'me', text: draft.trim() },
    ]);
    setDraft('');
    if (others.length === 0) return;
    const delay = 700 + Math.random() * 800;
    setTimeout(() => {
      const responder = others[Math.floor(Math.random() * others.length)];
      setMessages((prev) => [
        ...prev,
        { id: `m${Date.now()}`, pid: responder.id, text: REPLIES[Math.floor(Math.random() * REPLIES.length)] },
      ]);
    }, delay);
  }

  function onExtend(seconds, cost) {
    if (!extendTime(seconds, cost)) { setExtMsg(`Sin Chispas (${cost} ⚡ requeridos)`); return; }
    setTimeLeft((t) => Math.min(t + seconds, MAX_SECS));
    setExpired(false);
    const label = seconds === 600 ? '+10 min' : '+30 min';
    setExtMsg(`${label} añadidos ✓`);
    setTimeout(() => setExtMsg(''), 2500);
  }

  function goVideo() {
    navigate(`/cita-doble/llamada/${sessionId}`);
  }

  function onLeave() {
    leaveSession();
    navigate(`/cita-doble/resultado/${sessionId}`, { replace: true });
  }

  const pct = Math.max(0, (timeLeft / initSecs) * 100);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-aura-bg text-white">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/5 bg-aura-bg/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onLeave}
          aria-label="Salir"
          className="shrink-0 rounded-full p-2 text-aura-text-2 hover:text-white transition"
        >
          ←
        </button>

        {/* Mini avatares de los 4 participantes */}
        <div className="flex flex-1 items-center gap-1.5">
          {participants.map((p) => (
            <div
              key={p.id}
              className="relative grid place-items-center rounded-full"
              style={{
                width: 30, height: 30, fontSize: 14,
                background: `${p.color}22`,
                border: `1.5px solid ${p.color}`,
              }}
              title={p.handle}
            >
              {p.emoji}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-aura-bg bg-green-400"
                style={{ boxShadow: '0 0 5px rgba(74,222,128,0.7)' }}
              />
            </div>
          ))}
          <span className="ml-1 text-xs text-aura-text-2">Cita Doble</span>
        </div>

        {/* Temporizador con anillo */}
        <TimerRing timeLeft={timeLeft} pct={pct} />
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Banner de videollamada */}
        <button
          type="button"
          onClick={goVideo}
          className="mb-4 w-full rounded-card border border-aura-purple/30 bg-aura-purple/10 px-4 py-3 text-left transition hover:bg-aura-purple/15 active:scale-[.99]"
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 22 }}>🎬</span>
            <div>
              <p className="text-sm font-semibold text-aura-purple">Activar Videollamada grupal</p>
              <p className="text-xs text-aura-text-2">4 cuadrantes · máx 1 hora</p>
            </div>
            <span className="ml-auto text-aura-purple">→</span>
          </div>
        </button>

        {messages.map((msg) => (
          <GroupMessage key={msg.id} msg={msg} participants={participants} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Chips de extensión */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
        <ExtChip label="+10 min" cost={80}  onClick={() => onExtend(600,  80)}  disabled={sparks < 80} />
        <ExtChip label="+30 min" cost={200} onClick={() => onExtend(1800, 200)} disabled={sparks < 200} />
      </div>
      {extMsg && <p className="px-4 pb-1 text-center text-xs text-aura-cyan">{extMsg}</p>}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 border-t border-white/5 bg-aura-surface/80 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe algo al grupo…"
          className="flex-1 rounded-pill bg-aura-bg px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple transition"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-full bg-aura-purple p-3 transition disabled:opacity-40 hover:opacity-90 active:scale-90"
          aria-label="Enviar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9l20-7Z" />
          </svg>
        </button>
      </form>

      {/* Overlay de tiempo expirado */}
      {expired && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/85 px-8 text-center backdrop-blur-sm">
          <p style={{ fontSize: 48 }}>⏳</p>
          <h2 className="text-xl font-semibold">El tiempo terminó</h2>
          <p className="text-sm text-aura-text-2">¿Extender la Cita Doble?</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <ExtChip label="+10 min" cost={80}  onClick={() => onExtend(600,  80)}  disabled={sparks < 80}  big />
            <ExtChip label="+30 min" cost={200} onClick={() => onExtend(1800, 200)} disabled={sparks < 200} big />
          </div>
          <button type="button" onClick={onLeave} className="text-sm text-aura-text-2 underline">
            No, ver resultados
          </button>
        </div>
      )}

    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────── */

function TimerRing({ timeLeft, pct }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const color = pct > 30 ? '#00F5D4' : '#FF4D6D';
  return (
    <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(pct, 100) / 100)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono"
        style={{ fontSize: 8.5, color }}
      >
        {fmt(timeLeft)}
      </span>
    </div>
  );
}

function GroupMessage({ msg, participants }) {
  const isMe = msg.pid === 'me';
  const sender = participants.find((p) => p.id === msg.pid);
  return (
    <div className={`mb-3 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && sender && (
        <p className="mb-0.5 ml-1 text-[10px] font-semibold" style={{ color: sender.color }}>
          {sender.label} <span className="font-normal text-aura-text-2 capitalize">· {sender.type}</span>
        </p>
      )}
      <div
        className="max-w-[75%] rounded-card px-4 py-2.5 text-sm leading-snug"
        style={{
          background: isMe ? '#9D4EDD' : '#1F2833',
          borderBottomRightRadius: isMe ? 4 : undefined,
          borderBottomLeftRadius:  isMe ? undefined : 4,
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}

function ExtChip({ label, cost, onClick, disabled, big }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-pill border border-aura-purple/50 font-semibold text-white transition active:scale-[.97] disabled:opacity-40 hover:border-aura-purple ${big ? 'w-full py-3 text-sm' : 'px-3 py-1.5 text-xs'}`}
    >
      {label} <span className="text-aura-cyan">({cost} ⚡)</span>
    </button>
  );
}

function buildSeedMsgs(others) {
  const seeds = [
    '¡Hola a todos! Primera vez en Cita Doble 👋',
    '¡Qué buena energía tiene este grupo! 💜',
    'Feliz de estar aquí, ¿de dónde son? ✨',
  ];
  return others.slice(0, 3).map((p, i) => ({
    id: `seed-${i}`,
    pid: p.id,
    text: seeds[i] ?? seeds[0],
  }));
}
