import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import useCaptureGuard from '../hooks/useCaptureGuard.js';
import { apiToggleLike, apiDeletePost } from '../lib/api.js';

export default function PostCard({ post, onDelete }) {
  const session      = useAuthStore((s) => s.session);

  const [sparks,  setSparks]  = useState(post.sparks ?? post.likes_count ?? 0);
  const [liked,   setLiked]   = useState(post.likedByMe || false);
  const [errMsg,  setErrMsg]  = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);
  const { hide } = useCaptureGuard();

  const isOwner = session?.id === post.user_id;

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  async function onSpark() {
    try {
      const result = await apiToggleLike(post.id);
      setLiked(result.liked);
      setSparks((n) => result.liked ? n + 1 : Math.max(0, n - 1));
    } catch {}
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    setDeleting(true);
    setMenuOpen(false);
    try {
      await apiDeletePost(post.id);
      onDelete?.(post.id);
    } catch (err) {
      setErrMsg(err.message || 'No se pudo eliminar.');
      setDeleting(false);
    }
  }

  return (
    <article
      className="mx-4 mb-4 max-w-full overflow-hidden rounded-card bg-aura-surface p-3 no-capture"
      aria-label={`Publicación de ${post.handle}`}
    >
      {/* Header */}
      <header className="flex items-center gap-2">
        <Link to={`/profile/${post.user_id}`} className="shrink-0" aria-label={`Perfil de ${post.handle}`}>
          <PostAvatar avatarUrl={post.avatar_url} handle={post.handle} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${post.user_id}`} className="truncate text-sm font-semibold hover:text-aura-cyan">
              {post.handle}
            </Link>
            {post.isPrivate && <span className="text-aura-cyan text-xs">🔒</span>}
          </div>
          <span className="text-[11px] text-aura-text-2">{post.timestamp}</span>
        </div>

        {/* Menú de opciones */}
        <div className="relative" ref={menuRef}>
          <button
            aria-label="Más opciones"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full px-2 py-1 text-aura-text-2 hover:text-white hover:bg-white/10 transition"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-card border border-white/10 bg-aura-surface shadow-lg py-1">
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-4 py-2 text-left text-sm text-aura-error hover:bg-white/5 disabled:opacity-50"
                >
                  {deleting ? 'Eliminando…' : 'Eliminar publicación'}
                </button>
              )}
              {!isOwner && (
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-2 text-left text-sm text-aura-text-2 hover:bg-white/5"
                >
                  Reportar contenido
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Media */}
      {post.image_url && (
        <div className="relative mt-3 w-full max-w-full overflow-hidden rounded-card bg-black">
          <img
            src={resolveMediaUrl(post.image_url)}
            alt=""
            className="block h-auto max-h-[420px] w-full max-w-full object-contain md:max-h-[520px]"
          />
          {hide && (
            <div className="absolute inset-0 z-[3] grid place-items-center bg-aura-bg/95 text-aura-text-2 text-xs">
              Contenido oculto temporalmente
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={onSpark}
          className={`flex items-center gap-1 text-sm transition ${liked ? 'text-aura-cyan' : 'text-aura-cyan/90'}`}
          aria-pressed={liked}
        >
          <span>⚡</span><span>{sparks} Chispas</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-aura-text-2">
          <span>💬</span><span>{post.comments}</span>
        </button>
        <button className="ml-auto text-sm text-aura-text-2" aria-label="Compartir">↗️</button>
      </div>

      {errMsg && <p role="alert" className="mt-2 text-center text-[11px] text-aura-error">{errMsg}</p>}
      <p className="mt-2 text-sm leading-relaxed">{renderCaption(post.caption)}</p>
    </article>
  );
}

function resolveMediaUrl(url) {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('/') ? url : `/${url}`;
}

function renderCaption(text) {
  if (!text) return null;
  return text.split(/(\s+)/).map((tok, i) =>
    /^#\w+/.test(tok)
      ? <span key={i} className="text-aura-purple">{tok}</span>
      : <span key={i}>{tok}</span>
  );
}

function PostAvatar({ avatarUrl, handle }) {
  if (avatarUrl) {
    const src = resolveMediaUrl(avatarUrl);
    return (
      <span className="h-8 w-8 rounded-full overflow-hidden shrink-0">
        <img src={src} alt={handle} className="w-full h-full object-cover" />
      </span>
    );
  }
  const initial = String(handle || '?').replace('@', '').charAt(0).toUpperCase() || '?';
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-aura-purple/25 text-xs font-semibold text-aura-cyan shrink-0">
      {initial}
    </span>
  );
}
