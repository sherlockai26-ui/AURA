import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchFriendRequests, apiAcceptFriendRequest, apiDeclineFriendRequest } from '../lib/api.js';

export default function SolicitudesAmistad() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    apiFetchFriendRequests()
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const received = requests.filter(r => r.direction === 'received');
  const sent     = requests.filter(r => r.direction === 'sent');

  async function accept(requestId) {
    setActing(requestId);
    try {
      await apiAcceptFriendRequest(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch {}
    setActing(null);
  }

  async function decline(requestId) {
    setActing(requestId);
    try {
      await apiDeclineFriendRequest(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch {}
    setActing(null);
  }

  function Avatar({ handle, avatar_url }) {
    const src = avatar_url
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&background=1a1b1f&color=00F5D4&size=40`;
    return <img src={src} alt={handle} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }

  return (
    <div className="pb-8 text-white">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-lg text-white/50 hover:text-white">←</button>
        <span className="font-bold">Solicitudes de amistad</span>
      </div>

      {loading && <p className="text-center text-white/40 text-sm py-12">Cargando…</p>}

      {!loading && (
        <div className="px-4 py-3">
          {received.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Recibidas ({received.length})</p>
              {received.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                  <Avatar handle={r.handle} avatar_url={r.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">@{r.handle}</p>
                    {r.display_name && r.display_name !== r.handle && (
                      <p className="text-xs text-white/50 truncate">{r.display_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => accept(r.id)}
                      disabled={acting === r.id}
                      className="text-xs bg-aura-cyan text-aura-bg font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      {acting === r.id ? '…' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => decline(r.id)}
                      disabled={acting === r.id}
                      className="text-xs border border-white/20 text-white/60 px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sent.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Enviadas ({sent.length})</p>
              {sent.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                  <Avatar handle={r.handle} avatar_url={r.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">@{r.handle}</p>
                    <p className="text-xs text-white/40">Pendiente</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {received.length === 0 && sent.length === 0 && (
            <p className="text-center text-white/40 text-sm py-12">Sin solicitudes pendientes.</p>
          )}
        </div>
      )}
    </div>
  );
}
