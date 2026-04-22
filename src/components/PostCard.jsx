import { useState } from 'react';
import { useAuthStore } from '../lib/store.js';
import useCaptureGuard from '../hooks/useCaptureGuard.js';

export default function PostCard({ post }) {
  const spendSpark = useAuthStore((s) => s.spendSpark);
  const identifier = useAuthStore((s) => s.identifier);
  const [sparks, setSparks] = useState(post.sparks);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState('');
  const { hide } = useCaptureGuard();

  function onSpark() {
    if (liked) return;
    const ok = spendSpark(1);
    if (!ok) {
      setError('Sin Chispas disponibles. Recarga en tu monedero.');
      setTimeout(() => setError(''), 2200);
      return;
    }
    setLiked(true);
    setSparks((n) => n + 1);
  }

  const captionNodes = renderCaption(post.caption);

  return (
    <article
      className="mx-4 mb-4 rounded-card bg-aura-surface p-3 no-capture"
      aria-label={`Publicación de ${post.handle}`}
    >
      {/* Header */}
      <header className="flex items-center gap-2">
        <Avatar seed={post.mediaSeed} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{post.handle}</span>
            {post.isPrivate && (
              <span className="text-aura-cyan text-xs" aria-label="Privado">🔒</span>
            )}
          </div>
          <span className="text-[11px] text-aura-text-2">{post.timestamp}</span>
        </div>
        <button aria-label="Más opciones" className="text-aura-text-2 px-2">⋯</button>
      </header>

      {/* Media con watermark y overlay anti-captura */}
      <div
        className="relative mt-3 overflow-hidden rounded-card media-watermark"
        data-watermark={`${post.handle} · ${identifier || ''}`}
        style={{ aspectRatio: '1 / 1' }}
      >
        <AbstractMedia seed={post.mediaSeed} />
        {hide && (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-aura-bg/95 text-aura-text-2 text-xs">
            Contenido oculto temporalmente
          </div>
        )}
        <span className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 rounded-pill bg-aura-bg/80 px-2 py-1 text-[10px] text-aura-cyan">
          <span aria-hidden>🔒</span> Captura bloqueada
        </span>
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={onSpark}
          className={`flex items-center gap-1 text-sm transition ${
            liked ? 'text-aura-cyan' : 'text-aura-cyan/90'
          }`}
          aria-pressed={liked}
        >
          <span aria-hidden>⚡</span>
          <span>{sparks} Chispas</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-aura-text-2">
          <span aria-hidden>💬</span>
          <span>{post.comments}</span>
        </button>
        <button className="ml-auto flex items-center gap-1 text-sm text-aura-text-2" aria-label="Compartir">
          <span aria-hidden>↗️</span>
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-center text-[11px] text-aura-error">
          {error}
        </p>
      )}

      <p className="mt-2 text-sm leading-relaxed text-white">{captionNodes}</p>
    </article>
  );
}

function renderCaption(text) {
  // Marca hashtags en púrpura.
  return text.split(/(\s+)/).map((tok, i) => {
    if (/^#\w+/.test(tok)) {
      return (
        <span key={i} className="text-aura-purple">
          {tok}
        </span>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

function Avatar({ seed }) {
  const a = ['#9D4EDD', '#00F5D4'];
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full overflow-hidden">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id={`pg${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={a[seed % 2]} />
            <stop offset="1" stopColor={a[(seed + 1) % 2]} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" fill="#0B0C10" />
        <circle cx="16" cy="12" r="5" fill={`url(#pg${seed})`} opacity="0.85" />
        <path d="M4 30 C 6 22, 26 22, 28 30 Z" fill={`url(#pg${seed})`} opacity="0.75" />
      </svg>
    </span>
  );
}

function AbstractMedia({ seed }) {
  // Siluetas entrelazadas abstractas, SIN rostros.
  const gid = `m${seed}`;
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={`${gid}-bg`} cx="30%" cy="20%" r="90%">
          <stop offset="0" stopColor="#2A1340" />
          <stop offset="1" stopColor="#0B0C10" />
        </radialGradient>
        <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9D4EDD" />
          <stop offset="1" stopColor="#00F5D4" />
        </linearGradient>
        <linearGradient id={`${gid}-b`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00F5D4" />
          <stop offset="1" stopColor="#9D4EDD" />
        </linearGradient>
        <filter id={`${gid}-glow`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="400" height="400" fill={`url(#${gid}-bg)`} />
      {/* Silueta 1 */}
      <path
        d="M120 280 C 100 220, 150 170, 170 220 C 180 250, 150 270, 120 280 Z"
        fill={`url(#${gid}-a)`}
        opacity="0.55"
        filter={`url(#${gid}-glow)`}
        transform={`rotate(${(seed * 13) % 60 - 30} 200 200)`}
      />
      {/* Silueta 2 */}
      <path
        d="M280 300 C 300 240, 250 180, 220 230 C 210 270, 240 300, 280 300 Z"
        fill={`url(#${gid}-b)`}
        opacity="0.55"
        filter={`url(#${gid}-glow)`}
        transform={`rotate(${-(seed * 11) % 50} 200 200)`}
      />
      {/* Trazos neón abstractos */}
      <path
        d="M60 340 Q 200 200 340 340"
        stroke={`url(#${gid}-a)`}
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M80 80 Q 200 260 320 80"
        stroke={`url(#${gid}-b)`}
        strokeWidth="2"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}
