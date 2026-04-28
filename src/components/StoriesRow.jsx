import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoryItem from './StoryItem.jsx';
import { apiCreateStory, apiGetStories, apiUploadImage } from '../lib/api.js';

function normalizeStory(story) {
  const handle = story.handle ? `@${String(story.handle).replace(/^@/, '')}` : '@';
  return {
    ...story,
    handle,
    userId: story.user_id,
    imageUrl: story.image_url || null,
    avatarUrl: story.avatar_url || null,
  };
}

export default function StoriesRow() {
  const [tab, setTab]             = useState('circle');
  const [stories, setStories]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [composer, setComposer]   = useState(false);
  const [selected, setSelected]   = useState(null);

  async function loadStories(nextTab = tab) {
    setLoading(true);
    setError('');
    try {
      const scope = nextTab === 'circle' ? 'circle' : 'all';
      const data = await apiGetStories(scope);
      setStories((Array.isArray(data) ? data : []).map(normalizeStory));
    } catch (err) {
      setStories([]);
      setError(err.message || 'No se pudieron cargar historias reales.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStories(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-label="Historias" className="mt-4">
      <div className="flex items-center gap-6 px-4">
        <TabBtn active={tab === 'circle'} onClick={() => setTab('circle')}>
          Tu Círculo
        </TabBtn>
        <TabBtn active={tab === 'explore'} onClick={() => setTab('explore')}>
          Explorar
        </TabBtn>
      </div>

      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
        <StoryItem
          handle="Crear"
          isCreate
          onClick={() => setComposer(true)}
        />
        {stories.map((s) => (
          <StoryItem
            key={s.id}
            handle={s.handle}
            unseen
            imageUrl={s.imageUrl}
            avatarUrl={s.avatarUrl}
            onClick={() => setSelected(s)}
          />
        ))}
        {!loading && !error && stories.length === 0 && (
          <div className="flex min-w-[180px] items-center text-xs text-aura-text-2">
            {tab === 'circle' ? 'Aún no hay historias en tu círculo.' : 'Aún no hay historias para explorar.'}
          </div>
        )}
        {loading && (
          <div className="flex min-w-[120px] items-center text-xs text-aura-text-2">
            Cargando…
          </div>
        )}
        {error && !loading && (
          <button
            type="button"
            onClick={() => loadStories(tab)}
            className="min-w-[180px] text-left text-xs text-aura-error"
          >
            {error}
          </button>
        )}
      </div>

      {composer && (
        <StoryComposer
          onClose={() => setComposer(false)}
          onCreated={(story) => {
            setStories((prev) => [normalizeStory(story), ...prev]);
            setComposer(false);
          }}
        />
      )}

      {selected && (
        <StoryViewer story={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative py-1 text-sm transition ${
        active ? 'text-white font-semibold' : 'text-aura-text-2'
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-aura-cyan shadow-glow-cyan" />
      )}
    </button>
  );
}

const PRIVACY_OPTS = [
  { value: 'global',     label: 'Global' },
  { value: 'circle',     label: 'Círculo' },
  { value: 'confidants', label: 'Confidentes' },
];

function StoryComposer({ onClose, onCreated }) {
  const [text,    setText]    = useState('');
  const [file,    setFile]    = useState(null);
  const [privacy, setPrivacy] = useState('global');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setSending(true);
    setError('');
    try {
      let imageUrl = null;
      if (file) {
        const uploaded = await apiUploadImage(file);
        imageUrl = uploaded.url;
      }
      const story = await apiCreateStory({ content: text.trim(), image_url: imageUrl, privacy });
      onCreated(story);
    } catch (err) {
      setError(err.message || 'No se pudo crear la historia.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4">
      <form onSubmit={submit} className="w-full max-w-[480px] rounded-card border border-white/10 bg-aura-surface p-4">
        <h2 className="mb-3 font-semibold text-white">Crear historia</h2>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={240}
          placeholder="Texto de tu historia"
          className="h-24 w-full resize-none rounded-card border border-transparent bg-aura-bg px-4 py-3 text-sm text-white outline-none placeholder-aura-text-2 focus:border-aura-purple"
        />
        <div className="mt-3 flex gap-2">
          {PRIVACY_OPTS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPrivacy(opt.value)}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold border transition ${privacy === opt.value ? 'border-aura-cyan text-aura-cyan bg-aura-cyan/10' : 'border-white/15 text-white/50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-card border border-white/10 bg-aura-bg px-4 py-3 text-sm text-aura-text-2">
          <span className="truncate">{file ? file.name : 'Subir imagen'}</span>
          <span className="text-aura-cyan">Elegir</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {error && <p className="mt-2 text-xs text-aura-error">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-pill border border-white/15 py-3 text-sm text-aura-text-2">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sending || (!text.trim() && !file)}
            className="flex-[2] rounded-pill bg-aura-cyan py-3 text-sm font-semibold uppercase text-aura-bg disabled:opacity-50"
          >
            {sending ? 'Creando…' : 'Crear historia'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StoryViewer({ story, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6" onClick={onClose}>
      <article
        className="w-full max-w-[420px] overflow-hidden rounded-card border border-white/10 bg-aura-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {story.imageUrl && (
          <img src={story.imageUrl} alt={story.handle} className="max-h-[60dvh] w-full object-cover" />
        )}
        <div className="p-4">
          <p className="text-sm font-semibold text-white">{story.display_name || story.handle}</p>
          {story.userId ? (
            <Link to={`/profile/${story.userId}`} onClick={onClose} className="text-xs text-aura-cyan hover:underline">
              {story.handle}
            </Link>
          ) : (
            <p className="text-xs text-aura-text-2">{story.handle}</p>
          )}
          {story.content && <p className="mt-3 whitespace-pre-wrap text-sm text-white">{story.content}</p>}
          <button type="button" onClick={onClose} className="mt-4 w-full rounded-pill border border-white/15 py-3 text-sm text-aura-text-2">
            Cerrar
          </button>
        </div>
      </article>
    </div>
  );
}
