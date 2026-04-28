import { useEffect, useRef, useState } from 'react';
import { likeVideo, fetchVideoComments, postVideoComment, deleteVideo, deleteVideoComment } from '../lib/api.js';
import { useAuthStore } from '../lib/store.js';

export default function FlashVideoCard({ video, active, onEnded, onDeleted }) {
  const session         = useAuthStore((s) => s.session);
  const videoRef        = useRef(null);
  const [liked,         setLiked]         = useState(video.liked);
  const [likesCount,    setLikesCount]     = useState(video.likes_count);
  const [commentsCount, setCommentsCount]  = useState(video.comments_count);
  const [showComments,  setShowComments]   = useState(false);
  const [comments,      setComments]       = useState([]);
  const [commentText,   setCommentText]    = useState('');
  const [muted,         setMuted]          = useState(true);
  const [paused,        setPaused]         = useState(false);
  const [confirmDelete, setConfirmDelete]  = useState(false);

  const isOwner = session?.id === video.user_id;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      el.play().catch(() => {});
      setPaused(false);
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [active]);

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPaused(false); }
    else           { el.pause(); setPaused(true); }
  }

  async function handleLike() {
    const prev = { liked, likesCount };
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    try {
      const data = await likeVideo(video.id);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch {
      setLiked(prev.liked);
      setLikesCount(prev.likesCount);
    }
  }

  async function openComments() {
    setShowComments(true);
    try {
      const data = await fetchVideoComments(video.id);
      setComments(data.comments);
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

  async function handleDeleteVideo() {
    try {
      await deleteVideo(video.id);
      setConfirmDelete(false);
      onDeleted?.(video.id);
    } catch {}
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
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        onEnded={onEnded}
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

      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Delete button — only for video owner */}
      {isOwner && (
        <button
          onClick={() => setConfirmDelete(true)}
          className="absolute top-4 left-4 z-10 text-[#B0B0B0] p-1"
          aria-label="Eliminar video"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <svg width="28" height="28" viewBox="0 0 24 24" fill={liked ? '#FF4D6D' : 'none'} stroke={liked ? '#FF4D6D' : 'white'} strokeWidth="1.8">
            <path d="M12 21C12 21 3 14.5 3 8.5a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12.5-9 12.5Z" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-xs font-semibold">{likesCount}</span>
        </button>

        {/* Comments */}
        <button onClick={openComments} className="flex flex-col items-center gap-1">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M4 5h16v11H8l-4 4V5Z" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-xs font-semibold">{commentsCount}</span>
        </button>

        {/* Mute */}
        <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-1">
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

      {/* Bottom user info + title */}
      <div className="absolute bottom-6 left-3 right-16 flex items-end gap-3">
        <img src={avatar} alt={video.handle} className="w-10 h-10 rounded-full border-2 border-white object-cover flex-shrink-0" />
        <div>
          <p className="text-white font-semibold text-sm leading-tight">@{video.handle}</p>
          {video.title && <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{video.title}</p>}
        </div>
      </div>

      {/* Comments panel */}
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
                {session?.id === c.user_id && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="flex-shrink-0 text-[#B0B0B0] hover:text-red-400 p-0.5 mt-0.5"
                    aria-label="Eliminar comentario"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M9 6V4h6v2"/>
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

      {/* Confirm delete video modal */}
      {confirmDelete && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="bg-[#1F2833] rounded-2xl p-6 mx-6 space-y-4 w-full max-w-xs">
            <p className="text-white font-semibold text-sm text-center">¿Eliminar este video?</p>
            <p className="text-white/50 text-xs text-center">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-full border border-white/20 text-white/70 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVideo}
                className="flex-1 py-2.5 rounded-full bg-[#FF4D6D] text-white font-semibold text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
