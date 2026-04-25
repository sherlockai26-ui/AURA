import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuthStore } from '../lib/store.js';

export default function EditarNido() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);

  const [displayName, setDisplayName] = useState('');
  const [bio,         setBio]         = useState('');
  const [tagsRaw,     setTagsRaw]     = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'profiles', user.uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setDisplayName(d.displayName || '');
        setBio(d.bio || '');
        setTagsRaw((d.tags || []).join(', '));
      })
      .catch(() => null);
  }, [user]);

  async function onSave(e) {
    e.preventDefault();
    if (!user) { setError('No hay sesión activa.'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      await setDoc(
        doc(db, 'profiles', user.uid),
        { displayName: displayName.trim(), bio: bio.trim(), tags, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-aura-text-2 hover:text-white transition text-lg"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Editar Nido</h1>
      </div>

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-aura-text-2 mb-1">Nombre del Nido</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="¿Cómo se llama tu nido?"
            maxLength={60}
            className="w-full rounded-card bg-aura-surface px-4 py-4 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
          />
        </div>

        <div>
          <label className="block text-xs text-aura-text-2 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuéntales algo a los demás…"
            maxLength={300}
            rows={4}
            className="w-full rounded-card bg-aura-surface px-4 py-3 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-aura-text-2 mb-1">Etiquetas (separadas por coma)</label>
          <input
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="viajes, café, senderismo…"
            className="w-full rounded-card bg-aura-surface px-4 py-4 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
          />
        </div>

        {error && (
          <p role="alert" className="text-center text-aura-error text-sm">{error}</p>
        )}
        {success && (
          <p className="text-center text-aura-cyan text-sm">Cambios guardados correctamente.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition active:scale-[.99] disabled:opacity-60 hover:opacity-90"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
