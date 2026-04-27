import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiMe, apiUpdateProfile, apiUploadAvatar } from '../lib/api.js';

export default function EditarNido() {
  const navigate  = useNavigate();
  const session   = useAuthStore((s) => s.session);

  const [displayName, setDisplayName] = useState('');
  const [bio,         setBio]         = useState('');
  const [photoURL,    setPhotoURL]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    apiMe()
      .then((data) => {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setPhotoURL(data.avatar_url || '');
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = await apiUploadAvatar(file);
      setPhotoURL(data.url);
    } catch {
      setError('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await apiUpdateProfile({ display_name: displayName.trim(), bio: bio.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  const avatarSrc = photoURL
    ? (photoURL.startsWith('data:') || photoURL.startsWith('http') || photoURL.startsWith('/') ? photoURL : `/${photoURL}`)
    : null;

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
        {avatarSrc
          ? <img src={avatarSrc} alt="Foto" className="w-24 h-24 rounded-full object-cover" />
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
