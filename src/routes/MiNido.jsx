import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiDeleteMe } from '../lib/api.js';

const NAV_ITEMS = [
  { icon: '🔒', label: 'Seguridad',           path: '/seguridad' },
  { icon: '⚡', label: 'Monedero · Chispas',  path: '/monedero' },
  { icon: '🔔', label: 'Notificaciones',       path: '/notificaciones' },
  { icon: '📋', label: 'Legal',                path: '/legal' },
];

export default function MiNido() {
  const navigate      = useNavigate();
  const session       = useAuthStore((s) => s.session);
  const profileData   = useAuthStore((s) => s.profileData);
  const logout        = useAuthStore((s) => s.logout);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const displayName = profileData?.displayName || session?.email || '—';
  const photoURL    = profileData?.photoURL || null;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setError('');
    try {
      await apiDeleteMe();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la cuenta.');
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      {/* Cabecera de perfil */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-20 h-20 rounded-full bg-aura-surface border border-white/20 overflow-hidden flex items-center justify-center">
          {photoURL
            ? <img src={photoURL} alt="perfil" className="w-full h-full object-cover" />
            : <span className="text-3xl">👤</span>
          }
        </div>
        <p className="text-lg font-semibold">{displayName}</p>
        <button
          type="button"
          onClick={() => navigate('/nido/editar')}
          className="rounded-full border border-aura-purple/60 px-5 py-1.5 text-xs font-semibold text-aura-purple hover:bg-aura-purple/10 transition"
        >
          Ver perfil completo
        </button>
      </div>

      {/* Opciones de configuración */}
      <div className="flex flex-col gap-2 mb-8">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className="flex items-center justify-between rounded-card border border-white/10 bg-aura-surface px-4 py-4 hover:border-aura-cyan/40 transition active:scale-[.99]"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className="text-aura-text-2 text-lg">›</span>
          </button>
        ))}
      </div>

      {/* Acciones de cuenta */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full border border-white/20 py-3 text-sm font-semibold text-aura-text-2 hover:border-white/40 transition"
        >
          CERRAR SESIÓN
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full rounded-full border border-red-500/40 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
        >
          ELIMINAR CUENTA
        </button>
      </div>

      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="rounded-card bg-aura-surface border border-white/10 p-6 max-w-sm w-full flex flex-col gap-4">
            <p className="text-center font-semibold">¿Estás seguro?</p>
            <p className="text-center text-sm text-aura-text-2">
              Esta acción no se puede deshacer.
            </p>
            {error && <p className="text-center text-xs text-aura-error">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm text-aura-text-2 hover:border-white/40 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
