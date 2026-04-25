import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuthStore } from '../lib/store.js';

export default function MiNido() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDoc(doc(db, 'profiles', user.uid))
      .then((snap) => setProfile(snap.exists() ? snap.data() : null))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Mi Nido</h1>
        <button
          type="button"
          onClick={() => navigate('/nido/editar')}
          className="rounded-pill bg-aura-purple px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Editar
        </button>
      </div>

      {loading && <p className="text-center text-aura-text-2 text-sm">Cargando…</p>}

      {!loading && !user && (
        <p className="text-center text-aura-text-2 text-sm">Inicia sesión para ver tu Nido.</p>
      )}

      {!loading && user && !profile && (
        <div className="rounded-card border border-white/10 bg-aura-surface p-6 text-center">
          <p className="text-aura-text-2 text-sm mb-4">Tu Nido aún no tiene perfil.</p>
          <button
            type="button"
            onClick={() => navigate('/nido/editar')}
            className="rounded-pill bg-aura-cyan px-6 py-3 text-sm font-semibold text-aura-bg shadow-glow-cyan transition hover:opacity-90"
          >
            Crear perfil
          </button>
        </div>
      )}

      {!loading && profile && (
        <div className="rounded-card border border-white/10 bg-aura-surface p-5 flex flex-col gap-3">
          <div>
            <p className="text-xs text-aura-text-2 mb-1">Nombre</p>
            <p className="font-medium">{profile.displayName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-aura-text-2 mb-1">Bio</p>
            <p className="text-sm text-white/80 whitespace-pre-line">{profile.bio || '—'}</p>
          </div>
          {profile.tags?.length > 0 && (
            <div>
              <p className="text-xs text-aura-text-2 mb-2">Etiquetas</p>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-aura-purple/60 px-3 py-0.5 text-xs text-aura-purple"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
