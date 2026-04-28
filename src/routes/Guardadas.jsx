import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetSavedStories, apiUnsaveStory } from '../lib/api.js';

export default function Guardadas() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiGetSavedStories()
      .then(data => setStories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function unsave(storyId) {
    try {
      await apiUnsaveStory(storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
      if (selected?.id === storyId) setSelected(null);
    } catch {}
  }

  return (
    <div className="pb-8 text-white">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-lg text-white/50 hover:text-white">←</button>
        <span className="font-bold">Historias guardadas</span>
        {!loading && <span className="ml-auto text-xs text-white/40">{stories.length}</span>}
      </div>

      {loading && <p className="text-center text-white/40 text-sm py-12">Cargando…</p>}

      {!loading && stories.length === 0 && (
        <p className="text-center text-white/40 text-sm py-12">Sin historias guardadas.</p>
      )}

      {!loading && stories.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {stories.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="aspect-square overflow-hidden bg-aura-surface flex items-center justify-center"
            >
              {s.image_url
                ? <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                : <p className="text-[10px] text-white/60 text-center p-2 line-clamp-4">{s.content}</p>
              }
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
          onClick={() => setSelected(null)}
        >
          <article
            className="w-full max-w-[420px] rounded-card border border-white/10 bg-aura-surface overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {selected.image_url && (
              <img src={selected.image_url} alt="" className="max-h-[60dvh] w-full object-cover" />
            )}
            <div className="p-4">
              <p className="text-sm font-semibold text-white">@{selected.handle || ''}</p>
              {selected.content && (
                <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{selected.content}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 rounded-full border border-white/15 py-2.5 text-sm text-white/60"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => unsave(selected.id)}
                  className="flex-1 rounded-full border border-red-500/50 py-2.5 text-sm text-red-400"
                >
                  Quitar guardada
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
