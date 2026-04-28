import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchConfidants, apiRemoveConfidant, apiAddConfidant, apiFetchFriends } from '../lib/api.js';

export default function Confidentes() {
  const navigate = useNavigate();
  const [confidants, setConfidants] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    Promise.allSettled([apiFetchConfidants(), apiFetchFriends()])
      .then(([confRes, friendRes]) => {
        if (confRes.status === 'fulfilled') setConfidants(Array.isArray(confRes.value) ? confRes.value : []);
        if (friendRes.status === 'fulfilled') setFriends(Array.isArray(friendRes.value) ? friendRes.value : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const confIds = new Set(confidants.map(c => c.user_id));
  const eligible = friends.filter(f => !confIds.has(f.user_id));

  async function add(userId) {
    setActing(userId);
    try {
      await apiAddConfidant(userId);
      const friend = friends.find(f => f.user_id === userId);
      if (friend) setConfidants(prev => [...prev, { ...friend, user_id: userId }]);
    } catch {}
    setActing(null);
  }

  async function remove(userId) {
    setActing(userId);
    try {
      await apiRemoveConfidant(userId);
      setConfidants(prev => prev.filter(c => c.user_id !== userId));
    } catch {}
    setActing(null);
  }

  function Row({ person, action, actionLabel, actionClass }) {
    const av = person.avatar_url
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.handle)}&background=1a1b1f&color=9D4EDD&size=40`;
    return (
      <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
        <img src={av} alt={person.handle} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">@{person.handle}</p>
          {person.display_name && person.display_name !== person.handle && (
            <p className="text-xs text-white/50 truncate">{person.display_name}</p>
          )}
        </div>
        <button
          onClick={() => action(person.user_id)}
          disabled={acting === person.user_id}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition disabled:opacity-50 ${actionClass}`}
        >
          {acting === person.user_id ? '…' : actionLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8 text-white">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-lg text-white/50 hover:text-white">←</button>
        <span className="font-bold">Confidentes</span>
      </div>

      {loading && <p className="text-center text-white/40 text-sm py-12">Cargando…</p>}

      {!loading && (
        <div className="px-4 py-3">
          <p className="text-xs text-white/40 mb-4">
            Los confidentes pueden ver tus historias marcadas como "Solo confidentes".
          </p>

          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
            Mis confidentes ({confidants.length})
          </p>
          {confidants.length === 0 && (
            <p className="text-white/40 text-sm py-4">Sin confidentes todavía.</p>
          )}
          {confidants.map(c => (
            <Row
              key={c.user_id}
              person={c}
              action={remove}
              actionLabel="Quitar"
              actionClass="border-white/20 text-white/50 hover:border-red-500/50 hover:text-red-400"
            />
          ))}

          {eligible.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                Agregar amigos ({eligible.length})
              </p>
              {eligible.map(f => (
                <Row
                  key={f.user_id}
                  person={f}
                  action={add}
                  actionLabel="+ Confidente"
                  actionClass="border-aura-purple/40 text-aura-purple bg-aura-purple/10 hover:bg-aura-purple/20"
                />
              ))}
            </div>
          )}

          {eligible.length === 0 && confidants.length === 0 && friends.length === 0 && (
            <p className="text-center text-white/40 text-sm py-8">Agrega amigos primero para poder tener confidentes.</p>
          )}
        </div>
      )}
    </div>
  );
}
