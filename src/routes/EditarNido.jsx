import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { uploadImage } from '../lib/uploadImage.js';
import { useAuthStore } from '../lib/store.js';

export default function EditarNido() {
  const navigate       = useNavigate();
  const user           = useAuthStore((s) => s.user);
  const profileData    = useAuthStore((s) => s.profileData);
  const setProfileData = useAuthStore((s) => s.setProfileData);

  const [displayName, setDisplayName] = useState('');
  const [bio,         setBio]         = useState('');
  const [tagsRaw,     setTagsRaw]     = useState('');
  const [photoURL,    setPhotoURL]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const fileRef = useRef(null);

  // Suscripción realtime al perfil
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'profiles', user.uid),
      (snap) => setProfileData(snap.exists() ? snap.data() : null),
      () => {}
    );
    return unsub;
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-rellenar form cuando el perfil cambia
  useEffect(() => {
    if (!profileData) return;
    setDisplayName(profileData.displayName || '');
    setBio(profileData.bio || '');
    setTagsRaw((profileData.tags || []).join(', '));
    setPhotoURL(profileData.photoURL || '');
  }, [profileData]);

  async function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file, `profiles/${user.uid}/avatar`);
      setPhotoURL(url);
      await setDoc(doc(db, 'profiles', user.uid), { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      setError('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

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

      {/* Foto de perfil */}
      <div className="flex flex-col items-center gap-3 mb-5">
        {photoURL
          ? <img src={photoURL} alt="Foto" className="w-24 h-24 rounded-full object-cover" />
          : <div className="w-24 h-24 rounded-full bg-aura-surface flex items-center justify-center text-3xl">🏠</div>
        }
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs text-aura-cyan hover:underline disabled:opacity-50"
        >
          {uploading ? 'Subiendo…' : 'Cambiar foto'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
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
          disabled={saving || uploading}
          className="w-full rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition active:scale-[.99] disabled:opacity-60 hover:opacity-90"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
