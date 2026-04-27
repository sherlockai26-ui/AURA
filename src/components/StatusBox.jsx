import { useRef, useState } from 'react';
import { apiUploadImage } from '../lib/api.js';

export default function StatusBox({ onOpenComposer }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await apiUploadImage(file);
      onOpenComposer(data.url);
    } catch {
      onOpenComposer();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <section
      className="mx-4 mt-3 rounded-card bg-aura-surface p-3"
      aria-label="Compartir algo"
    >
      <button
        type="button"
        onClick={() => onOpenComposer()}
        className="block w-full text-left text-aura-text-2 rounded-card bg-aura-bg/60 px-3 py-3"
      >
        Comparte algo con tu pareja…
      </button>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex flex-1 items-center justify-center gap-2 py-2 text-aura-cyan disabled:opacity-50"
        >
          <span aria-hidden>📷</span>
          <span className="text-sm">{uploading ? 'Subiendo…' : 'Galería'}</span>
        </button>
        <span className="h-5 w-px bg-white/10" aria-hidden />
        <button
          type="button"
          onClick={() => onOpenComposer()}
          className="flex flex-1 items-center justify-center gap-2 py-2 text-aura-purple"
        >
          <span aria-hidden>🎥</span>
          <span className="text-sm">Cámara</span>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </section>
  );
}
