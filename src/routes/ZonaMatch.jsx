import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { mockSingles } from '../lib/data.js';

// Filtros disponibles
const FILTERS = ['Intereses', 'Edad', 'Online ahora'];

export default function ZonaMatch() {
  const navigate           = useNavigate();
  const sparks             = useAuthStore((s) => s.sparks);
  const spendSpark         = useAuthStore((s) => s.spendSpark);
  const dailyLikesRemain   = useAuthStore((s) => s.dailyLikesRemaining);
  const decrementLikes     = useAuthStore((s) => s.decrementLikes);
  const setActiveMatch     = useAuthStore((s) => s.setActiveMatch);

  const [deck, setDeck]             = useState([...mockSingles]);
  const [direction, setDirection]   = useState(null); // 'right' | 'left'
  const [matchResult, setMatchResult] = useState(null); // { profile }
  const [activeFilter, setActiveFilter] = useState(null);
  const [toast, setToast]           = useState('');

  const current = deck[0];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  function advance(dir) {
    setDirection(dir);
    setTimeout(() => {
      setDeck((d) => d.slice(1));
      setDirection(null);
    }, 340);
  }

  function onLike() {
    if (!current) return;
    if (dailyLikesRemain <= 0) {
      if (!spendSpark(15)) { showToast('Sin Chispas suficientes (15 ⚡)'); return; }
      showToast('Chispa usada (15 ⚡)');
    } else {
      decrementLikes();
    }
    // Demo: 65% probabilidad de match mutuo
    if (Math.random() > 0.35) {
      setMatchResult({ profile: current });
    } else {
      advance('right');
      showToast('Me Gusta enviado 💜');
    }
  }

  function onPass() {
    if (!current) return;
    advance('left');
  }

  function onSuperMatch() {
    if (!current) return;
    if (!spendSpark(75)) { showToast('Sin Chispas suficientes (75 ⚡)'); return; }
    setMatchResult({ profile: current });
    showToast('⚡ Super Match activado');
  }

  function onStartChat() {
    const profile = matchResult.profile;
    const match = {
      matchId: `match-${profile.id}-${Date.now()}`,
      otherUserId: profile.id,
      otherNickname: profile.apodo,
      chatExpiresAt: Date.now() + 25 * 60 * 1000,
      videoCallMinutesLeft: 8,
      daysLeft: 3,
      giftVideoUsed: false,
    };
    setActiveMatch(match);
    setMatchResult(null);
    navigate(`/zona-match/chat/${match.matchId}`);
  }

  function onDismissMatch() {
    setMatchResult(null);
    advance('right');
  }

  return (
    <div className="flex flex-col bg-aura-bg text-white" style={{ minHeight: 'calc(100dvh - 80px)' }}>

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 flex-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00F5D4" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 12a7 7 0 0 0 6 6.93" />
            <path d="M5 12a7 7 0 0 1 6-6.93" />
            <path d="M19 12a7 7 0 0 1-6 6.93" />
            <path d="M19 12a7 7 0 0 0-6-6.93" />
            <circle cx="12" cy="12" r="1.5" fill="#00F5D4" stroke="none" />
          </svg>
          <h1 className="text-lg font-semibold tracking-wide">Zona de Match</h1>
        </div>
        {/* Contador de Me Gusta */}
        <div className="flex items-center gap-1.5 rounded-pill border border-white/10 px-3 py-1.5">
          <span style={{ fontSize: 14 }}>❤️</span>
          <span style={{ fontSize: 12, color: dailyLikesRemain > 0 ? '#00F5D4' : '#FF4D6D' }}>
            {dailyLikesRemain}/5 hoy
          </span>
        </div>
        {/* Saldo */}
        <div className="flex items-center gap-1 rounded-pill border border-white/10 px-3 py-1.5" style={{ fontSize: 12 }}>
          <span>⚡</span>
          <span className="text-aura-cyan">{sparks}</span>
        </div>
      </header>

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
                : 'border-white/15 text-aura-text-2 hover:border-white/30'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Stack de tarjetas */}
      <div className="relative mx-5 flex-1" style={{ minHeight: 380 }}>
        {deck.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-card border border-white/10 bg-aura-surface text-center px-6">
            <span style={{ fontSize: 48 }}>✨</span>
            <p className="text-white font-semibold">Has visto todos los perfiles</p>
            <p className="text-sm text-aura-text-2">Vuelve mañana para nuevas conexiones.</p>
          </div>
        ) : (
          deck.slice(0, 3).map((profile, idx) => {
            const isTop = idx === 0;
            return (
              <div
                key={profile.id}
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
                {isTop ? (
                  <ProfileCard profile={profile} />
                ) : (
                  <div className="h-full bg-aura-surface" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Botones de acción */}
      {deck.length > 0 && (
        <div className="flex items-center justify-center gap-4 px-5 py-5">
          {/* Pasar */}
          <ActionBtn
            onClick={onPass}
            icon="✕"
            label="Pasar"
            color="#B0B0B0"
            bgColor="rgba(176,176,176,0.1)"
            size={54}
          />
          {/* Super Match */}
          <ActionBtn
            onClick={onSuperMatch}
            icon="⚡"
            label="Super Match"
            sublabel="75 ⚡"
            color="#FFD700"
            bgColor="rgba(255,215,0,0.12)"
            size={46}
            disabled={sparks < 75}
          />
          {/* Me Gusta */}
          <ActionBtn
            onClick={onLike}
            icon="❤️"
            label="Me Gusta"
            sublabel={dailyLikesRemain > 0 ? 'Gratis' : '15 ⚡'}
            color="#FF4D6D"
            bgColor="rgba(255,77,109,0.12)"
            size={54}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-pill bg-aura-surface/95 px-5 py-2.5 text-sm font-medium shadow-glow-purple backdrop-blur"
          style={{ border: '1px solid rgba(157,78,221,0.3)' }}
        >
          {toast}
        </div>
      )}

      {/* Overlay de Match */}
      {matchResult && (
        <MatchOverlay
          profile={matchResult.profile}
          onStartChat={onStartChat}
          onDismiss={onDismissMatch}
        />
      )}

    </div>
  );
}

/* ── ProfileCard ─────────────────────────────────────────────────── */

function ProfileCard({ profile }) {
  return (
    <div className="flex h-full flex-col bg-aura-surface">
      {/* Avatar grande */}
      <div
        className="relative flex flex-[3] items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${profile.seed % 2 === 0 ? 'rgba(157,78,221,0.25)' : 'rgba(0,245,212,0.2)'} 0%, #0B0C10 70%)`,
        }}
      >
        {/* Indicador online */}
        {profile.online && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-pill bg-black/60 px-2.5 py-1 backdrop-blur"
            style={{ fontSize: 10 }}
          >
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
            <span className="text-white/90">Online</span>
          </div>
        )}

        {/* Silueta con glow */}
        <div
          className="grid place-items-center rounded-full"
          style={{
            width: 110, height: 110,
            background: profile.seed % 2 === 0 ? 'rgba(157,78,221,0.2)' : 'rgba(0,245,212,0.15)',
            border: `2px solid ${profile.seed % 2 === 0 ? '#9D4EDD' : '#00F5D4'}`,
            boxShadow: `0 0 28px ${profile.seed % 2 === 0 ? 'rgba(157,78,221,0.4)' : 'rgba(0,245,212,0.35)'}`,
            fontSize: 48,
          }}
        >
          👤
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-[2] flex-col justify-between p-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-bold">{profile.apodo}</h2>
            <span className="text-aura-text-2 text-sm">{profile.edad} años</span>
          </div>
          <p className="mt-1 text-sm text-aura-text-2 line-clamp-2">{profile.bio}</p>
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill border border-aura-purple/40 px-2.5 py-0.5 text-xs text-aura-text-2"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ActionBtn ───────────────────────────────────────────────────── */

function ActionBtn({ onClick, icon, label, sublabel, color, bgColor, size = 54, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 transition disabled:opacity-35"
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

/* ── MatchOverlay ────────────────────────────────────────────────── */

function MatchOverlay({ profile, onStartChat, onDismiss }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/85 px-8 text-center backdrop-blur-md">

      {/* Animación de anillos uniéndose */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 64 }}>
        <div style={{
          position: 'absolute', left: 8,
          width: 52, height: 52, borderRadius: '50%',
          border: '2.5px solid #9D4EDD',
          boxShadow: '0 0 16px rgba(157,78,221,0.6)',
          animation: 'matchLeft 0.6s ease-out forwards',
        }} />
        <div style={{
          position: 'absolute', right: 8,
          width: 52, height: 52, borderRadius: '50%',
          border: '2.5px solid #00F5D4',
          boxShadow: '0 0 16px rgba(0,245,212,0.6)',
          animation: 'matchRight 0.6s ease-out forwards',
        }} />
        <style>{`
          @keyframes matchLeft  { 0%{left:8px}   100%{left:34px} }
          @keyframes matchRight { 0%{right:8px}  100%{right:34px} }
        `}</style>
      </div>

      <div>
        <p className="text-3xl font-bold text-aura-cyan" style={{ textShadow: '0 0 16px rgba(0,245,212,0.5)' }}>
          ¡Es un Match!
        </p>
        <p className="mt-2 text-aura-text-2">
          Tú y <span className="text-white font-semibold">{profile.apodo}</span> se gustaron.
        </p>
        <p className="mt-1 text-xs text-aura-text-2">
          Tienes <span className="text-aura-cyan">25 minutos</span> para conectar.
        </p>
      </div>

      <button
        type="button"
        onClick={onStartChat}
        className="w-full max-w-xs rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition hover:opacity-90 active:scale-[.99]"
      >
        Iniciar Chat de 25 min
      </button>

      <button
        type="button"
        onClick={onDismiss}
        className="text-sm text-aura-text-2 underline"
      >
        Seguir explorando
      </button>

    </div>
  );
}
