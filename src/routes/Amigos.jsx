import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchFriends, apiRemoveFriend } from '../lib/api.js';

export default function Amigos() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    apiFetchFriends()
      .then(data => setFriends(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function removeFriend(userId) {
    setRemoving(userId);
    try {
      await apiRemoveFriend(userId);
      setFriends(prev => prev.filter(f => f.user_id !== userId));
    } catch {}
    setRemoving(null);
  }

  return (
    <div className="pb-8 text-white">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-lg text-white/50 hover:text-white">←</button>
        <span className="font-bold">Amigos</span>
        {!loading && <span className="ml-auto text-xs text-white/40">{friends.length}</span>}
      </div>

      {loading && <p className="text-center text-white/40 text-sm py-12">Cargando…</p>}

      {!loading && friends.length === 0 && (
        <p className="text-center text-white/40 text-sm py-12">Aún no tienes amigos en AURA.</p>
      )}

      <div className="divide-y divide-white/5 px-4">
        {friends.map(f => {
          const av = f.avatar_url
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.handle)}&background=1a1b1f&color=00F5D4&size=40`;
          return (
            <div key={f.user_id} className="flex items-center gap-3 py-3">
              <button onClick={() => navigate(`/profile/${f.user_id}`)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                <img src={av} alt={f.handle} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">@{f.handle}</p>
                  {f.display_name && f.display_name !== f.handle && (
                    <p className="text-xs text-white/50 truncate">{f.display_name}</p>
                  )}
                </div>
              </button>
              <button
                onClick={() => removeFriend(f.user_id)}
                disabled={removing === f.user_id}
                className="flex-shrink-0 text-xs text-white/40 border border-white/15 rounded-full px-3 py-1.5 hover:border-red-500/60 hover:text-red-400 transition disabled:opacity-50"
              >
                {removing === f.user_id ? '…' : 'Eliminar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
