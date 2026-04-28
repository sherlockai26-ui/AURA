import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  likeVideo, fetchVideoComments, postVideoComment,
  deleteVideo, deleteVideoComment,
  updateVideoPrivacy, fetchVideoLikes, likeVideoComment,
} from '../lib/api.js';
import { useAuthStore } from '../lib/store.js';

export default function FlashVideoCard({ video, active, onEnded, onDeleted }) {
  const session         = useAuthStore((s) => s.session);
  const navigate        = useNavigate();
  const videoRef        = useRef(null);
  const menuRef         = useRef(null);

  const [liked,         setLiked]         = useState(video.liked);
  const [likesCount,    setLikesCount]     = useState(video.likes_count);
  const [commentsCount, setCommentsCount]  = useState(video.comments_count);
  const [privacy,       setPrivacy]        = useState(video.privacy || 'public');
  const [showComments,  setShowComments]   = useState(false);
  const [comments,      setComments]       = useState([]);
  const [commentText,   setCommentText]    = useState('');
  const [muted,         setMuted]          = useState(true);
  const [paused,        setPaused]         = useState(false);
  const [showMenu,      setShowMenu]       = useState(false);
  const [confirmDelete, setConfirmDelete]  = useState(false);
  const [showPrivacy,   setShowPrivacy]    = useState(false);
  const [showLikes,     setShowLikes]      = useState(false);
  const [likesList,     setLikesList]      = useState([]);
  const [toast,         setToast]          = useState('');

  const isOwner = session?.id === video.user_id;

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [showMenu]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) { el.play().catch(() => {}); setPaused(false); }
    else        { el.pause(); el.currentTime = 0; }
  }, [active]);

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPaused(false); }
    else           { el.pause(); setPaused(true); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  // ── Like video ────────────────────────────────────────────────────────
  async function handleLike() {
    const prev = { liked, likesCount };
    setLiked(!liked); setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    try {
      const data = await likeVideo(video.id);
      setLiked(data.liked); setLikesCount(data.likes_count);
    } catch {
      setLiked(prev.liked); setLikesCount(prev.likesCount);
    }
  }

  // ── Likes list ────────────────────────────────────────────────────────
  async function openLikes() {
    setShowLikes(true);
    try {
      const data = await fetchVideoLikes(video.id);
      setLikesList(data.users || []);
    } catch {}
  }

  // ── Comments ──────────────────────────────────────────────────────────
  async function openComments() {
    setShowComments(true);
    try {
      const data = await fetchVideoComments(video.id);
      setComments(data.comments || []);
    } catch {}
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const data = await postVideoComment(video.id, commentText.trim());
      setComments(prev => [...prev, data.comment]);
      setCommentsCount(c => c + 1);
      setCommentText('');
    } catch {}
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteVideoComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(c => Math.max(0, c - 1));
    } catch {}
  }

  async function handleCommentLike(commentId) {
    setComments(prev => prev.map(c =>
      c.id !== commentId ? c : {
        ...c,
        has_liked:   !c.has_liked,
        likes_count: c.has_liked ? c.likes_count - 1 : c.likes_count + 1,
      }
    ));
    try {
      const data = await likeVideoComment(commentId);
      setComments(prev => prev.map(c =>
        c.id !== commentId ? c : { ...c, has_liked: data.liked, likes_count: data.likes_count }
      ));
    } catch {}
  }

  // ── Privacy ────────────────────────────────────────────────────────────
  async function handlePrivacy(val) {
    try {
      await updateVideoPrivacy(video.id, val);
      setPrivacy(val);
    } catch {}
    setShowPrivacy(false);
  }

  // ── Delete video ──────────────────────────────────────────────────────
  async function handleDeleteVideo() {
    try { await deleteVideo(video.id); onDeleted?.(video.id); } catch {}
    setConfirmDelete(false);
  }

  // ── Share ──────────────────────────────────────────────────────────────
  async function handleShare() {
    const url   = `${window.location.origin}/flash?video=${video.id}`;
    const title = video.title || 'Video en AURA Flash';
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); showToast('Enlace copiado'); }
    catch { showToast('No se pudo copiar el enlace'); }
  }

  const avatar = video.avatar_url
    ? video.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(video.display_name || video.handle)}&background=1a1b1f&color=00F5D4&size=64`;

  return (
    <div className="relative w-full h-full flex-shrink-0 bg-black overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={video.video_url}
        loop muted={muted} playsInline
        onClick={togglePlay} onEnded={onEnded}
        className="w-full h-full object-cover"
      />

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          </div>
        </div>
      )}

      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* 3-dot menu (owner only) */}
      {isOwner && (
        <div ref={menuRef} className="absolute top-4 left-4 z-10">
          <button onClick={() => setShowMenu(m => !m)} className="text-[#B0B0B0] p-1" aria-label="Más opciones">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5"  r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {showMenu && (
            <div className="absolute top-8 left-0 w-48 bg-[#1F2833] rounded-xl shadow-xl overflow-hidden border border-white/10 z-20">
              <button onClick={() => { setShowMenu(false); setShowPrivacy(true); }}
                className="w-full text-left px-4 py-3 text-white text-sm hover:bg-white/10 transition">
                Editar privacidad
              </button>
              <button onClick={() => { setShowMenu(false); setConfirmDelete(true); }}
                className="w-full text-left px-4 py-3 text-[#FF4D6D] text-sm hover:bg-white/10 transition">
                Eliminar video
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={handleLike}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={liked ? '#FF4D6D' : 'none'} stroke={liked ? '#FF4D6D' : 'white'} strokeWidth="1.8">
              <path d="M12 21C12 21 3 14.5 3 8.5a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12.5-9 12.5Z" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={openLikes} className="text-white text-xs font-semibold">{likesCount}</button>
        </div>

        {/* Comments */}
        <button onClick={openComments} className="flex flex-col items-center gap-1">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M4 5h16v11H8l-4 4V5Z" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-xs font-semibold">{commentsCount}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/>
            <line x1="8.4" y1="10.9" x2="15.6" y2="6.1"/><line x1="8.4" y1="13.1" x2="15.6" y2="17.9"/>
          </svg>
          <span className="text-[#B0B0B0] text-xs">Compartir</span>
        </button>

        {/* Mute */}
        <button onClick={() => setMuted(m => !m)}>
          {muted ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round"/>
              <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round"/>
              <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Bottom user info */}
      <div className="absolute bottom-6 left-3 right-16 flex items-end gap-3">
        <img src={avatar} alt={video.handle} className="w-10 h-10 rounded-full border-2 border-white object-cover flex-shrink-0" />
        <div>
          <p className="text-white font-semibold text-sm leading-tight">@{video.handle}</p>
          {video.title && <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{video.title}</p>}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-black/80 text-white text-xs px-4 py-2 rounded-full pointer-events-none">
          {toast}
        </div>
      )}

      {/* ── Comments panel ── */}
      {showComments && (
        <div className="absolute inset-x-0 bottom-0 bg-aura-surface/95 backdrop-blur-md rounded-t-2xl max-h-[65%] flex flex-col z-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Comentarios</span>
            <button onClick={() => setShowComments(false)} className="text-white/60 text-xl leading-none">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {comments.length === 0 && (
              <p className="text-center text-white/40 text-sm py-6">Sin comentarios todavía.</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2 items-start">
                <img
                  src={c.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.handle)}&background=1a1b1f&color=00F5D4&size=40`}
                  alt={c.handle}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-aura-cyan text-xs font-semibold">@{c.handle} </span>
                  <span className="text-white/90 text-sm">{c.content}</span>
                </div>
                {/* Comment like */}
                <button onClick={() => handleCommentLike(c.id)} className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={c.has_liked ? '#FF4D6D' : 'none'} stroke={c.has_liked ? '#FF4D6D' : '#B0B0B0'} strokeWidth="2">
                    <path d="M12 21C12 21 3 14.5 3 8.5a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12.5-9 12.5Z" strokeLinejoin="round"/>
                  </svg>
                  {(c.likes_count || 0) > 0 && <span className="text-[10px] text-[#B0B0B0]">{c.likes_count}</span>}
                </button>
                {/* Delete comment */}
                {session?.id === c.user_id && (
                  <button onClick={() => handleDeleteComment(c.id)} className="flex-shrink-0 text-[#B0B0B0] hover:text-red-400 p-0.5 mt-0.5" aria-label="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="flex gap-2 px-4 py-3 border-t border-white/10">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Escribe un comentario…"
              className="flex-1 bg-white/10 text-white text-sm rounded-full px-4 py-2 outline-none placeholder-white/40"
            />
            <button type="submit" disabled={!commentText.trim()} className="text-aura-cyan font-semibold text-sm disabled:opacity-40">Enviar</button>
          </form>
        </div>
      )}

      {/* ── Likes list panel ── */}
      {showLikes && (
        <div className="absolute inset-x-0 bottom-0 bg-[#1F2833] rounded-t-2xl max-h-[60%] flex flex-col z-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Le gustó a</span>
            <button onClick={() => setShowLikes(false)} className="text-white/60 text-xl leading-none">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {likesList.length === 0 && (
              <p className="text-center text-white/40 text-sm py-6">Sin likes todavía.</p>
            )}
            {likesList.map(u => (
              <button
                key={u.id}
                onClick={() => { setShowLikes(false); navigate(`/profile/${u.id}`); }}
                className="flex items-center gap-3 w-full text-left"
              >
                <img
                  src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.handle)}&background=1a1b1f&color=00F5D4&size=40`}
                  alt={u.handle}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-white text-sm font-semibold">@{u.handle}</p>
                  {u.display_name && u.display_name !== u.handle && (
                    <p className="text-white/50 text-xs">{u.display_name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Privacy modal ── */}
      {showPrivacy && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="bg-[#1F2833] rounded-2xl p-6 mx-6 space-y-4 w-full max-w-xs">
            <p className="text-white font-semibold text-sm text-center">Privacidad del video</p>
            {[
              { val: 'public',  label: 'Público',           sub: 'Todos pueden verlo' },
              { val: 'exclude', label: 'Excluir usuarios',  sub: 'Próximamente disponible' },
              { val: 'private', label: 'Privado',           sub: 'Solo tú puedes verlo' },
            ].map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => val !== 'exclude' && handlePrivacy(val)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition ${
                  privacy === val ? 'border-aura-cyan bg-aura-cyan/10' : 'border-white/10 bg-white/5'
                } ${val === 'exclude' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-white/40 text-xs">{sub}</p>
                </div>
                {privacy === val && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00F5D4" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
            <button onClick={() => setShowPrivacy(false)} className="w-full py-2.5 rounded-full border border-white/20 text-white/70 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Confirm delete modal ── */}
      {confirmDelete && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="bg-[#1F2833] rounded-2xl p-6 mx-6 space-y-4 w-full max-w-xs">
            <p className="text-white font-semibold text-sm text-center">¿Eliminar este video?</p>
            <p className="text-white/50 text-xs text-center">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-full border border-white/20 text-white/70 text-sm">Cancelar</button>
              <button onClick={handleDeleteVideo} className="flex-1 py-2.5 rounded-full bg-[#FF4D6D] text-white font-semibold text-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
