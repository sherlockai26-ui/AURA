import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiGetMessages, apiSendMessage } from '../lib/api.js';

function fmt(s) {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

export default function ChatTemporal() {
  const { matchId }    = useParams();
  const navigate       = useNavigate();
  const session        = useAuthStore((s) => s.session);
  const activeMatch    = useAuthStore((s) => s.activeMatch);
  const setActiveMatch = useAuthStore((s) => s.setActiveMatch);
  const clearMatch     = useAuthStore((s) => s.clearActiveMatch);
  const spendSpark     = useAuthStore((s) => s.spendSpark);
  const sparks         = useAuthStore((s) => s.sparks);

  const match        = activeMatch;
  const otherName    = match?.otherNickname ?? 'Chat de match';
  const giftVideoUsed = match?.giftVideoUsed ?? false;
  const daysLeft     = match?.daysLeft ?? 3;

  const initSecs = () => {
    if (!match?.chatExpiresAt) return 25 * 60;
    return Math.max(0, Math.floor((match.chatExpiresAt - Date.now()) / 1000));
  };

  const [timeLeft, setTimeLeft]     = useState(initSecs);
  const [expired, setExpired]       = useState(timeLeft === 0);
  const [messages, setMessages]     = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [msgError, setMsgError]     = useState('');
  const [sending, setSending]       = useState(false);
  const [draft, setDraft]           = useState('');
  const [extMsg, setExtMsg]         = useState('');
  const bottomRef                   = useRef(null);
  const inputRef                    = useRef(null);
  const timerRef                    = useRef(null);

  // Arranque del temporizador
  useEffect(() => {
    if (expired) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setExpired(true); clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [expired]);

  // Auto-scroll al fondo cuando llegan mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    let pollId;

    async function load() {
      if (!matchId) return;
      try {
        const data = await apiGetMessages(matchId);
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
          setMsgError('');
        }
      } catch (err) {
        if (!cancelled) setMsgError(err.message || 'No se pudieron cargar los mensajes.');
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    }

    load();
    pollId = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, [matchId]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const content = draft.trim();
    setSending(true);
    setMsgError('');
    try {
      await apiSendMessage(matchId, content);
      setDraft('');
      const data = await apiGetMessages(matchId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsgError(err.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  function extend(seconds, cost) {
    if (!spendSpark(cost)) { setExtMsg(`Sin saldo (necesitas ${cost} ⚡)`); return; }
    const addedLabel = seconds >= 86400 ? `${seconds / 86400}d` : seconds >= 3600 ? `${seconds / 3600}h` : `${seconds / 60}m`;
    setTimeLeft((t) => t + seconds);
    setExpired(false);
    setExtMsg(`+${addedLabel} añadido ✓`);
    setTimeout(() => setExtMsg(''), 2500);
    if (match) {
      setActiveMatch({ ...match, chatExpiresAt: Date.now() + (timeLeft + seconds) * 1000 });
    }
  }

  function goVideoCall() {
    if (match) setActiveMatch({ ...match, giftVideoUsed: true });
    navigate(`/zona-match/llamada/${matchId}`);
  }

  function onExpireLeave() {
    clearMatch();
    navigate('/zona-match/expirado', { replace: true });
  }

  function onFusion() {
    navigate(`/zona-match/fusion/${matchId}`);
  }

  const pct = match?.chatExpiresAt
    ? Math.max(0, (match.chatExpiresAt - Date.now()) / (25 * 60 * 1000)) * 100
    : (timeLeft / (25 * 60)) * 100;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-aura-bg text-white">

      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/5 bg-aura-bg/95 px-4 py-3 sticky top-0 z-20 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="shrink-0 rounded-full p-2 text-aura-text-2 hover:text-white transition"
        >
          ←
        </button>

        {/* Avatar mini */}
        <div
          className="grid shrink-0 place-items-center rounded-full"
          style={{ width: 38, height: 38, background: 'rgba(157,78,221,0.2)', border: '1.5px solid #9D4EDD', fontSize: 18 }}
        >
          👤
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{otherName}</p>
          <p className="text-[10px] text-aura-text-2">Chat temporal · {daysLeft} día{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}</p>
        </div>

        {/* Temporizador + anillo */}
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <div className="relative" style={{ width: 40, height: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke={pct > 30 ? '#00F5D4' : '#FF4D6D'}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - Math.min(pct, 100) / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center font-mono"
              style={{ fontSize: 8, color: pct > 30 ? '#00F5D4' : '#FF4D6D' }}
            >
              {fmt(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-2">

        {/* Banner de videollamada regalo */}
        {!giftVideoUsed && (
          <button
            type="button"
            onClick={goVideoCall}
            className="mb-4 w-full rounded-card border border-aura-cyan/30 bg-aura-cyan/10 px-4 py-3 text-left transition hover:bg-aura-cyan/15 active:scale-[.99]"
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 22 }}>🎁</span>
              <div>
                <p className="text-sm font-semibold text-aura-cyan">Videollamada de 8 min — gratis</p>
                <p className="text-xs text-aura-text-2">Regalo de AURA. Válido las próximas 24 h.</p>
              </div>
              <span className="ml-auto text-aura-cyan">→</span>
            </div>
          </button>
        )}

        {loadingMsgs && (
          <p className="py-6 text-center text-xs text-aura-text-2">Cargando mensajes…</p>
        )}
        {msgError && !loadingMsgs && (
          <p className="py-6 text-center text-xs text-aura-error">{msgError}</p>
        )}
        {!loadingMsgs && !msgError && messages.length === 0 && (
          <p className="py-6 text-center text-xs text-aura-text-2">Sin mensajes aún.</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} viewerId={session?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Botones de extensión de tiempo */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
        <ExtChip label="+1h"    cost={50}  onClick={() => extend(3600,     50)}  disabled={sparks < 50} />
        <ExtChip label="+24h"   cost={200} onClick={() => extend(86400,   200)}  disabled={sparks < 200} />
        <ExtChip label="+3 días" cost={400} onClick={() => extend(259200, 400)}  disabled={sparks < 400} />
        <ExtChip label="Fusión Dúo 🔗" cost={300} onClick={onFusion} disabled={sparks < 300} highlight />
      </div>

      {extMsg && (
        <p className="px-4 text-center text-xs text-aura-cyan">{extMsg}</p>
      )}

      {/* Input de mensaje */}
      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 border-t border-white/5 bg-aura-surface/80 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe algo…"
          className="flex-1 rounded-pill bg-aura-bg px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple transition"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-full bg-aura-purple p-3 transition disabled:opacity-40 hover:opacity-90 active:scale-90"
          aria-label="Enviar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22 11 13 2 9l20-7Z" />
          </svg>
        </button>
      </form>

      {/* Overlay de tiempo expirado */}
      {expired && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/80 px-8 text-center backdrop-blur-sm">
          <p style={{ fontSize: 48 }}>⏳</p>
          <h2 className="text-xl font-semibold">El tiempo terminó</h2>
          <p className="text-sm text-aura-text-2">¿Quieres extender la conversación?</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <ExtChip label="+1h"    cost={50}  onClick={() => extend(3600,     50)}  disabled={sparks < 50}  big />
            <ExtChip label="+24h"   cost={200} onClick={() => extend(86400,   200)}  disabled={sparks < 200} big />
            <ExtChip label="+3 días" cost={400} onClick={() => extend(259200, 400)} disabled={sparks < 400} big />
          </div>
          <button
            type="button"
            onClick={onExpireLeave}
            className="text-sm text-aura-text-2 underline"
          >
            No, terminar aquí
          </button>
        </div>
      )}

    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────── */

function MessageBubble({ msg, viewerId }) {
  const isMe = msg.sender_id ? msg.sender_id === viewerId : msg.from === 'me';
  const text = msg.content || msg.text || '';
  return (
    <div className={`mb-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[75%] rounded-card px-4 py-2.5 text-sm leading-snug"
        style={{
          background: isMe ? '#9D4EDD' : '#1F2833',
          borderBottomRightRadius: isMe ? 4 : undefined,
          borderBottomLeftRadius:  isMe ? undefined : 4,
        }}
      >
        {!isMe && msg.handle && (
          <Link to={`/profile/${msg.sender_id}`} className="mb-0.5 block text-[10px] text-aura-cyan hover:underline">
            @{msg.handle}
          </Link>
        )}
        {text}
      </div>
    </div>
  );
}

function ExtChip({ label, cost, onClick, disabled, highlight, big }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-pill border font-semibold transition active:scale-[.97] disabled:opacity-40 ${
        highlight
          ? 'border-aura-cyan text-aura-cyan hover:bg-aura-cyan/10'
          : 'border-white/20 text-white hover:border-white/40'
      } ${big ? 'w-full py-3 text-sm' : 'px-3 py-1.5 text-xs'}`}
    >
      {label} <span className="text-aura-cyan">({cost} ⚡)</span>
    </button>
  );
}
