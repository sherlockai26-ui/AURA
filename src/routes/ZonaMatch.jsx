import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiMatchCandidates, apiMatchLike, apiMatchPass, apiMatchList } from '../lib/api.js';

const FILTERS = ['Intereses', 'Edad', 'Online ahora'];

export default function ZonaMatch() {
  const navigate = useNavigate();
  const sparks   = useAuthStore((s) => s.sparks);

  const [deck,        setDeck]        = useState([]);
  const [matches,     setMatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [direction,   setDirection]   = useState(null);
  const [matchResult, setMatchResult] = useState(null); // { candidate, conversationId }
  const [activeFilter, setActiveFilter] = useState(null);
  const [toast,       setToast]       = useState('');
  const [view,        setView]        = useState('deck'); // 'deck' | 'matches'

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  async function loadCandidates() {
    setLoading(true);
    setError('');
    try {
      const data = await apiMatchCandidates();
      setDeck(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la Zona de Match.');
      setDeck([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMatches() {
    try {
      const data = await apiMatchList();
      setMatches(Array.isArray(data) ? data : []);
    } catch {
      setMatches([]);
    }
  }

  useEffect(() => {
    loadCandidates();
    loadMatches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = deck[0];

  function advance(dir) {
    setDirection(dir);
    setTimeout(() => {
      setDeck((d) => d.slice(1));
      setDirection(null);
    }, 340);
  }

  async function onLike() {
    if (!current) return;
    try {
      const result = await apiMatchLike(current.id);
      if (result.isMatch) {
        setMatchResult({ candidate: current, conversationId: result.conversationId });
        setDeck((d) => d.slice(1));
        loadMatches();
      } else {
        advance('right');
        showToast('Me Gusta enviado 💜');
      }
    } catch (err) {
      showToast(err.message || 'Error al enviar like.');
    }
  }

  async function onPass() {
    if (!current) return;
    advance('left');
    try { await apiMatchPass(current.id); } catch {}
  }

  function onStartChat(conversationId) {
    setMatchResult(null);
    if (conversationId) {
      navigate(`/messages?conv=${conversationId}`);
    } else {
      navigate('/messages');
    }
  }

  function onDismissMatch() {
    setMatchResult(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col bg-aura-bg text-white" style={{ minHeight: 'calc(100dvh - 80px)' }}>
        <MatchHeader sparks={sparks} view={view} setView={setView} />
        <div className="flex flex-1 items-center justify-center text-aura-text-2 text-sm">
          Cargando perfiles…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-aura-bg text-white" style={{ minHeight: 'calc(100dvh - 80px)' }}>
        <MatchHeader sparks={sparks} view={view} setView={setView} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-aura-error text-sm">{error}</p>
          <button onClick={loadCandidates} className="text-sm text-aura-cyan hover:underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-aura-bg text-white" style={{ minHeight: 'calc(100dvh - 80px)' }}>
      <MatchHeader sparks={sparks} view={view} setView={setView} />

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(activeFilter === f ? null : f)}
            className={`shrink-0 rounded-pill border px-4 py-1.5 text-xs font-medium transition ${
              activeFilter === f
                ? 'border-aura-cyan bg-aura-cyan/15 text-aura-cyan'
                : 'border-white/15 text-aura-text-2'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {view === 'matches' ? (
        <MatchesList matches={matches} onOpenChat={(convId) => navigate(`/messages?conv=${convId}`)} />
      ) : (
        <>
          {/* Stack de tarjetas */}
          <div className="relative mx-5 flex-1" style={{ minHeight: 380 }}>
            {deck.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-card border border-white/10 bg-aura-surface text-center px-6">
                <span style={{ fontSize: 48 }}>∅</span>
                <p className="text-white font-semibold">Aún no hay personas disponibles. Invita amigos para crear comunidad.</p>
                <button onClick={loadCandidates} className="text-xs text-aura-cyan hover:underline mt-1">
                  Actualizar
                </button>
              </div>
            ) : (
              deck.slice(0, 3).map((candidate, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={candidate.id}
                    className="absolute inset-0 overflow-hidden rounded-card"
                    style={{
                      zIndex: 10 - idx,
                      transform: isTop && direction
                        ? `translateX(${direction === 'right' ? 110 : -110}%) rotate(${direction === 'right' ? 12 : -12}deg)`
                        : `scale(${1 - idx * 0.038}) translateY(${idx * 11}px)`,
                      opacity: isTop && direction ? 0 : 1 - idx * 0.1,
                      transition: isTop ? 'transform 0.34s cubic-bezier(.4,0,.2,1), opacity 0.34s ease' : 'none',
                      pointerEvents: isTop ? 'auto' : 'none',
                    }}
                  >
                    {isTop ? <ProfileCard candidate={candidate} /> : <div className="h-full bg-aura-surface" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Botones */}
          {deck.length > 0 && (
            <div className="flex items-center justify-center gap-4 px-5 py-5">
              <ActionBtn onClick={onPass} icon="✕" label="Pasar" color="#B0B0B0" bgColor="rgba(176,176,176,0.1)" size={54} />
              <ActionBtn onClick={onLike} icon="❤️" label="Me Gusta" sublabel="Gratis" color="#FF4D6D" bgColor="rgba(255,77,109,0.12)" size={54} />
            </div>
          )}
        </>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-pill bg-aura-surface/95 px-5 py-2.5 text-sm font-medium shadow-glow-purple backdrop-blur"
          style={{ border: '1px solid rgba(157,78,221,0.3)' }}
        >
          {toast}
        </div>
      )}

      {matchResult && (
        <MatchOverlay
          candidate={matchResult.candidate}
          conversationId={matchResult.conversationId}
          onStartChat={onStartChat}
          onDismiss={onDismissMatch}
        />
      )}
    </div>
  );
}

/* ── MatchHeader ──────────────────────────────────────────────────── */

function MatchHeader({ sparks, view, setView }) {
  return (
    <header className="flex items-center gap-3 px-5 pt-5 pb-3">
      <div className="flex items-center gap-2 flex-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00F5D4" strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 12a7 7 0 0 0 6 6.93" /><path d="M5 12a7 7 0 0 1 6-6.93" />
          <path d="M19 12a7 7 0 0 1-6 6.93" /><path d="M19 12a7 7 0 0 0-6-6.93" />
          <circle cx="12" cy="12" r="1.5" fill="#00F5D4" stroke="none" />
        </svg>
        <h1 className="text-lg font-semibold tracking-wide">Zona de Match</h1>
      </div>
      <button
        type="button"
        onClick={() => setView((v) => v === 'deck' ? 'matches' : 'deck')}
        className={`text-xs rounded-pill border px-3 py-1.5 transition ${
          view === 'matches'
            ? 'border-aura-cyan text-aura-cyan'
            : 'border-white/15 text-aura-text-2'
        }`}
      >
        {view === 'matches' ? 'Explorar' : 'Mis Matches'}
      </button>
      <div className="flex items-center gap-1 rounded-pill border border-white/10 px-3 py-1.5 text-xs">
        <span>⚡</span><span className="text-aura-cyan">{sparks}</span>
      </div>
    </header>
  );
}

/* ── MatchesList ──────────────────────────────────────────────────── */

function MatchesList({ matches, onOpenChat }) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span style={{ fontSize: 40 }}>∅</span>
        <p className="text-white font-semibold">Todavía no tienes matches reales.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 px-5 py-2 overflow-y-auto">
      {matches.map((m) => (
        <div key={m.match_id} className="flex items-center gap-3 rounded-card bg-aura-surface p-3 border border-white/10">
          <CandidateAvatar candidate={{ id: m.other_id, handle: m.other_handle, avatar_url: m.other_avatar }} size={44} />
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${m.other_id}`} className="font-semibold text-sm hover:text-aura-cyan">
              {m.other_name || m.other_handle}
            </Link>
            <p className="text-xs text-aura-text-2">@{m.other_handle}</p>
          </div>
          {m.conversation_id && (
            <button
              type="button"
              onClick={() => onOpenChat(m.conversation_id)}
              className="rounded-pill border border-aura-cyan/60 px-3 py-1.5 text-xs text-aura-cyan"
            >
              Chat
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── ProfileCard ──────────────────────────────────────────────────── */

function ProfileCard({ candidate }) {
  return (
    <div className="flex h-full flex-col bg-aura-surface">
      <div
        className="relative flex flex-[3] items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(157,78,221,0.2) 0%, #0B0C10 70%)' }}
      >
        <CandidateAvatar candidate={candidate} size={110} />
      </div>
      <div className="flex flex-[2] flex-col justify-between p-4">
        <div>
          <Link to={`/profile/${candidate.id}`} className="text-lg font-bold hover:text-aura-cyan">
            {candidate.display_name || candidate.handle}
          </Link>
          <p className="text-xs text-aura-text-2 mb-1">@{candidate.handle}</p>
          {candidate.bio && (
            <p className="text-sm text-aura-text-2 line-clamp-3">{candidate.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── CandidateAvatar ──────────────────────────────────────────────── */

function CandidateAvatar({ candidate, size = 48 }) {
  if (candidate.avatar_url) {
    const src = candidate.avatar_url.startsWith('http')
      ? candidate.avatar_url
      : candidate.avatar_url;
    return (
      <span
        className="rounded-full overflow-hidden shrink-0 block"
        style={{ width: size, height: size }}
      >
        <img src={src} alt={candidate.handle} className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <div
      className="rounded-full grid place-items-center shrink-0"
      style={{
        width: size, height: size,
        background: 'rgba(157,78,221,0.2)',
        border: '2px solid #9D4EDD',
        boxShadow: '0 0 24px rgba(157,78,221,0.35)',
        fontSize: size * 0.45,
      }}
    >
      👤
    </div>
  );
}

/* ── ActionBtn ────────────────────────────────────────────────────── */

function ActionBtn({ onClick, icon, label, sublabel, color, bgColor, size = 54 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition"
      aria-label={label}
    >
      <div
        className="grid place-items-center rounded-full transition hover:scale-110 active:scale-95"
        style={{
          width: size, height: size,
          fontSize: size * 0.45,
          background: bgColor,
          border: `1.5px solid ${color}44`,
          boxShadow: `0 0 14px ${color}22`,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 10, color: '#B0B0B0' }}>{label}</span>
      {sublabel && <span style={{ fontSize: 9, color }}>{sublabel}</span>}
    </button>
  );
}

/* ── MatchOverlay ─────────────────────────────────────────────────── */

function MatchOverlay({ candidate, conversationId, onStartChat, onDismiss }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/85 px-8 text-center backdrop-blur-md">
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 64 }}>
        <div style={{
          position: 'absolute', left: 8,
          width: 52, height: 52, borderRadius: '50%',
          border: '2.5px solid #9D4EDD', boxShadow: '0 0 16px rgba(157,78,221,0.6)',
          animation: 'matchLeft 0.6s ease-out forwards',
        }} />
        <div style={{
          position: 'absolute', right: 8,
          width: 52, height: 52, borderRadius: '50%',
          border: '2.5px solid #00F5D4', boxShadow: '0 0 16px rgba(0,245,212,0.6)',
          animation: 'matchRight 0.6s ease-out forwards',
        }} />
        <style>{`
          @keyframes matchLeft  { 0%{left:8px}  100%{left:34px} }
          @keyframes matchRight { 0%{right:8px} 100%{right:34px} }
        `}</style>
      </div>

      <div>
        <p className="text-3xl font-bold text-aura-cyan" style={{ textShadow: '0 0 16px rgba(0,245,212,0.5)' }}>
          ¡Es un Match!
        </p>
        <p className="mt-2 text-aura-text-2">
          Tú y <span className="text-white font-semibold">{candidate.display_name || candidate.handle}</span> se gustaron.
        </p>
      </div>

      {conversationId && (
        <button
          type="button"
          onClick={() => onStartChat(conversationId)}
          className="w-full max-w-xs rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition hover:opacity-90 active:scale-[.99]"
        >
          Abrir Chat
        </button>
      )}

      <button type="button" onClick={onDismiss} className="text-sm text-aura-text-2 underline">
        Seguir explorando
      </button>
    </div>
  );
}
