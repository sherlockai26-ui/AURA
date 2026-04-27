import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from '../lib/api.js';

const TYPE_ICONS = {
  match:   '❤️',
  message: '💬',
  group:   '🎲',
  spark:   '⚡',
  system:  '✨',
};

export default function Notificaciones() {
  const navigate      = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const unread = notifications.filter((n) => !n.read).length;

  async function loadNotifications() {
    setError('');
    try {
      const data = await apiGetNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 15000);
    return () => clearInterval(id);
  }, []);

  async function handleClick(n) {
    setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
    try { await apiMarkNotificationRead(n.id); } catch {}
    const path = notificationPath(n);
    if (path) navigate(path);
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await apiMarkAllNotificationsRead(); } catch {}
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-aura-text-2 hover:text-white text-xl"
          >
            ‹
          </button>
          <h1 className="text-xl font-semibold">Notificaciones</h1>
          {unread > 0 && (
            <span className="bg-aura-cyan text-aura-bg text-xs font-bold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs text-aura-cyan hover:opacity-80 transition"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-16 text-center text-sm text-aura-text-2">Cargando notificaciones…</p>
      ) : error ? (
        <div className="mt-12 rounded-card border border-aura-error/40 bg-aura-surface p-4 text-center">
          <p className="mb-3 text-sm text-aura-error">{error}</p>
          <button type="button" onClick={loadNotifications} className="text-xs text-aura-cyan hover:underline">
            Reintentar
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 mt-16 text-aura-text-2">
          <span className="text-6xl">🔔</span>
          <p className="text-sm">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 rounded-card border px-4 py-3 text-left w-full transition hover:border-aura-cyan/30 active:scale-[.99] ${
                n.read
                  ? 'border-white/5 bg-aura-surface/50'
                  : 'border-white/10 bg-aura-surface'
              }`}
            >
              <span className="text-xl mt-0.5 shrink-0">
                {TYPE_ICONS[n.type] || '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-aura-text-2' : 'text-white'}`}>
                  {notificationText(n)}
                </p>
                <p className="text-xs text-aura-text-2 mt-0.5">{formatDate(n.created_at)}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-aura-cyan mt-2 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function notificationText(n) {
  const actor = n.actor_name || n.actor_handle || 'Alguien';
  if (n.type === 'match') return `Nuevo match con @${n.actor_handle || actor}`;
  if (n.type === 'message') return `${actor} te envió un mensaje`;
  return 'Nueva notificación';
}

function notificationPath(n) {
  if (n.type === 'message' && n.conversation_id) return `/messages?conv=${n.conversation_id}`;
  if (n.type === 'match') return '/zona-match';
  return '';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
