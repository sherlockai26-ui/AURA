import { useCallback, useEffect, useRef, useState } from 'react';
import TopHeader from '../components/TopHeader.jsx';
import StatusBox from '../components/StatusBox.jsx';
import QuickAccessRow from '../components/QuickAccessRow.jsx';
import StoriesRow from '../components/StoriesRow.jsx';
import PostCard from '../components/PostCard.jsx';
import { apiGetPosts, apiCreatePost, apiUploadImage } from '../lib/api.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function normalizePost(p) {
  return {
    id:         p.id,
    user_id:    p.user_id,
    handle:     p.handle || p.display_name || 'anon',
    caption:    p.content || '',
    image_url:  p.image_url || null,
    sparks:     Number(p.likes_count  || p.sparks  || 0),
    comments:   Number(p.comments_count || p.comments || 0),
    likedByMe:  p.liked_by_me || false,
    timestamp:  p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : p.timestamp || '',
    cursor:     p.created_at || null,
    avatar_url: p.avatar_url || null,
    isPrivate:  p.isPrivate || false,
  };
}

export default function Feed() {
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [cursor,   setCursor]   = useState(null);
  const [hasMore,  setHasMore]  = useState(true);
  const [composer, setComposer] = useState(false);
  const [composerImageUrl, setComposerImageUrl] = useState('');
  const sentinelRef = useRef(null);

  function openComposer(imageUrl = '') {
    setComposerImageUrl(imageUrl || '');
    setComposer(true);
  }

  async function loadPosts(cur) {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetPosts({ cursor: cur, scope: 'circle' });
      const normalized = (Array.isArray(data) ? data : []).map(normalizePost);
      setPosts((prev) => cur ? [...prev, ...normalized] : normalized);
      setHasMore(normalized.length >= 10);
      if (normalized.length > 0) setCursor(normalized[normalized.length - 1].cursor);
    } catch (err) {
      setError(err.message || 'Error al cargar el feed.');
      if (!cur) setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    loadPosts(cursor);
  }, [loading, hasMore, cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '600px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div>
      <TopHeader />
      <StatusBox onOpenComposer={openComposer} />
      <QuickAccessRow />
      <StoriesRow />

      <div className="mt-4 w-full max-w-2xl mx-auto overflow-x-hidden">
        {error && !loading && (
          <div className="mx-4 mb-4 rounded-card border border-aura-error/40 bg-aura-surface px-4 py-4 text-center">
            <p className="text-sm text-aura-error mb-2">{error}</p>
            <button
              type="button"
              onClick={() => loadPosts(null)}
              className="text-xs text-aura-cyan hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && !loading && posts.length === 0 && (
          <p className="py-12 text-center text-sm text-aura-text-2">
            Aún no hay contenido en tu círculo
          </p>
        )}

        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}

        <div ref={sentinelRef} className="py-6 text-center text-xs text-aura-text-2">
          {loading ? 'Cargando…' : hasMore ? '' : posts.length > 0 ? '· · ·' : ''}
        </div>
      </div>

      {composer && (
        <PostComposer
          initialImageUrl={composerImageUrl}
          onClose={() => {
            setComposer(false);
            setComposerImageUrl('');
          }}
          onPosted={(newPost) => setPosts((prev) => [normalizePost(newPost), ...prev])}
        />
      )}
    </div>
  );
}

function PostComposer({ initialImageUrl = '', onClose, onPosted }) {
  const [text,     setText]     = useState('');
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [file,     setFile]     = useState(null);
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() && !imageUrl && !file) return;
    setSending(true);
    setError('');
    try {
      let finalImageUrl = imageUrl;
      if (file) {
        const uploaded = await apiUploadImage(file);
        finalImageUrl = uploaded.url;
      }
      const post = await apiCreatePost({ content: text.trim(), image_url: finalImageUrl });
      onPosted(post);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo publicar.');
    } finally {
      setSending(false);
    }
  }

  function onFileChange(e) {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;
    if (!IMAGE_TYPES.includes(nextFile.type)) {
      setError('Usa una imagen JPG, PNG o WebP.');
      e.target.value = '';
      return;
    }
    if (nextFile.size > MAX_IMAGE_BYTES) {
      setError('La imagen debe pesar máximo 5 MB.');
      e.target.value = '';
      return;
    }
    setFile(nextFile);
    setImageUrl('');
    setError('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4">
      <form onSubmit={submit} className="w-full max-w-[480px] rounded-card bg-aura-surface border border-white/10 p-4">
        <h2 className="mb-3 font-semibold text-white">Nueva publicación</h2>
        <textarea
          autoFocus
          className="w-full h-28 resize-none rounded-card bg-aura-bg px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple"
          placeholder="¿Qué está pasando en tu nido?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        {imageUrl && (
          <div className="mt-3 overflow-hidden rounded-card border border-white/10 bg-aura-bg">
            <img src={imageUrl} alt="" className="block max-h-[260px] w-full object-contain" />
          </div>
        )}
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-card border border-white/10 bg-aura-bg px-4 py-3 text-sm text-aura-text-2">
          <span className="truncate">{file ? file.name : imageUrl ? 'Cambiar imagen' : 'Agregar imagen'}</span>
          <span className="text-aura-cyan">Elegir</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onFileChange}
          />
        </label>
        {error && <p className="mt-1 text-xs text-aura-error">{error}</p>}
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-pill border border-white/15 py-3 text-sm text-aura-text-2">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sending || (!text.trim() && !imageUrl && !file)}
            className="flex-[2] rounded-pill bg-aura-cyan py-3 text-sm font-semibold uppercase text-aura-bg disabled:opacity-50"
          >
            {sending ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
}
