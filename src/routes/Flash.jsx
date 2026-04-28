import { useEffect, useRef, useState } from 'react';
import { fetchVideos, uploadVideo } from '../lib/api.js';
import FlashVideoCard from '../components/FlashVideoCard.jsx';

export default function Flash() {
  const [videos,      setVideos]      = useState([]);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [showUpload,  setShowUpload]  = useState(false);
  const containerRef  = useRef(null);
  const observerRef   = useRef(null);
  const cardRefs      = useRef([]);

  useEffect(() => { loadVideos(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVideos(p) {
    setLoading(true);
    try {
      const data = await fetchVideos(p, 10);
      setVideos(prev => p === 1 ? data.videos : [...prev, ...data.videos]);
      setPage(p);
      setHasMore(data.videos.length === 10);
    } catch {}
    setLoading(false);
  }

  // Intersection Observer to track active video
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target);
            if (idx !== -1) setActiveIdx(idx);
          }
        });
      },
      { threshold: 0.6 }
    );
    cardRefs.current.forEach(el => { if (el) observerRef.current.observe(el); });
    return () => observerRef.current?.disconnect();
  }, [videos]);

  // Load more when near last video
  useEffect(() => {
    if (!hasMore || loading) return;
    if (activeIdx >= videos.length - 2) loadVideos(page + 1);
  }, [activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnded() {
    const nextEl = cardRefs.current[activeIdx + 1];
    if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white/50 text-sm">
        Cargando Flash…
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <p className="text-white/50 text-sm">Sin videos todavía.</p>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-aura-cyan text-black font-semibold rounded-full px-6 py-2 text-sm"
        >
          + Subir video
        </button>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={v => { setVideos([v]); setShowUpload(false); }} />}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
      >
        {videos.map((video, idx) => (
          <div
            key={video.id}
            ref={el => { cardRefs.current[idx] = el; }}
            className="w-full"
            style={{ height: '100dvh', scrollSnapAlign: 'start' }}
          >
            <FlashVideoCard
              video={video}
              active={idx === activeIdx}
              onEnded={handleEnded}
              onDeleted={id => setVideos(prev => prev.filter(v => v.id !== id))}
            />
          </div>
        ))}
        {loading && (
          <div className="w-full flex items-center justify-center py-6 bg-black">
            <span className="text-white/40 text-sm">Cargando más…</span>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={() => setShowUpload(true)}
        className="absolute top-4 right-4 z-10 bg-aura-cyan/90 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-lg"
        aria-label="Subir video"
      >
        +
      </button>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={v => {
            setVideos(prev => [v, ...prev]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

function UploadModal({ onClose, onUploaded }) {
  const [file,        setFile]        = useState(null);
  const [title,       setTitle]       = useState('');
  const [error,       setError]       = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const videoPreviewRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!['video/mp4', 'video/quicktime', 'video/mpeg'].includes(f.type)) {
      setError('Solo se permiten archivos MP4.');
      return;
    }
    setFile(f);
    setError('');
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  function handleMetadata() {
    const dur = videoPreviewRef.current?.duration;
    if (dur && dur > 120) {
      setError('El video supera los 120 segundos.');
      setFile(null);
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('video', file);
      if (title) form.append('title', title);
      const dur = videoPreviewRef.current?.duration;
      if (dur) form.append('duration', Math.round(dur));
      const data = await uploadVideo(form);
      onUploaded(data.video);
    } catch (err) {
      setError(err.message || 'Error al subir el video.');
    }
    setUploading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-aura-surface rounded-t-2xl p-5 pb-8 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Subir video Flash</h2>
          <button onClick={onClose} className="text-white/60 text-2xl leading-none">&times;</button>
        </div>

        {previewUrl && (
          <video
            ref={videoPreviewRef}
            src={previewUrl}
            controls
            muted
            onLoadedMetadata={handleMetadata}
            className="w-full rounded-xl max-h-48 object-contain bg-black"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-white/60 text-xs">Video MP4 (máx. 120 seg)</span>
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={handleFile}
              className="mt-1 block w-full text-sm text-white/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-aura-cyan/20 file:text-aura-cyan file:text-xs cursor-pointer"
            />
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            maxLength={200}
            className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none placeholder-white/40"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-aura-cyan text-black font-bold rounded-full py-3 text-sm disabled:opacity-40"
          >
            {uploading ? 'Subiendo…' : 'Publicar'}
          </button>
        </form>
      </div>
    </div>
  );
}
