import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuthStore } from '../lib/store.js';

export default function MiNido() {
  const navigate       = useNavigate();
  const user           = useAuthStore((s) => s.user);
  const profileData    = useAuthStore((s) => s.profileData);
  const setProfileData = useAuthStore((s) => s.setProfileData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) { setReady(true); return; }
    const unsub = onSnapshot(
      doc(db, 'profiles', user.uid),
      (snap) => { setProfileData(snap.exists() ? snap.data() : null); setReady(true); },
      () => setReady(true)
    );
    return unsub;
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {!ready && <p className="text-center text-aura-text-2 text-sm">Cargando…</p>}

      {ready && !user && (
        <p className="text-center text-aura-text-2 text-sm">Inicia sesión para ver tu Nido.</p>
      )}

      {ready && user && !profileData && (
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

      {ready && profileData && (
        <div className="rounded-card border border-white/10 bg-aura-surface p-5 flex flex-col gap-3">
          {profileData.photoURL && (
            <img
              src={profileData.photoURL}
              alt="Foto del Nido"
              className="w-20 h-20 rounded-full object-cover self-center"
            />
          )}
          <div>
            <p className="text-xs text-aura-text-2 mb-1">Nombre</p>
            <p className="font-medium">{profileData.displayName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-aura-text-2 mb-1">Bio</p>
            <p className="text-sm text-white/80 whitespace-pre-line">{profileData.bio || '—'}</p>
          </div>
          {profileData.tags?.length > 0 && (
            <div>
              <p className="text-xs text-aura-text-2 mb-2">Etiquetas</p>
              <div className="flex flex-wrap gap-2">
                {profileData.tags.map((tag) => (
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
