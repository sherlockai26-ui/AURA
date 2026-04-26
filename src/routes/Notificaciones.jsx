import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

const TYPE_ICONS = {
  match:   '❤️',
  message: '💬',
  group:   '🎲',
  spark:   '⚡',
  system:  '✨',
};

export default function Notificaciones() {
  const navigate      = useNavigate();
  const notifications = useAuthStore((s) => s.notifications);
  const markAsRead    = useAuthStore((s) => s.markAsRead);
  const markAllAsRead = useAuthStore((s) => s.markAllAsRead);
  const unread        = useAuthStore((s) => s.unreadCount());

  function handleClick(n) {
    markAsRead(n.id);
    if (n.path) navigate(n.path);
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

      {notifications.length === 0 ? (
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
                  {n.text}
                </p>
                <p className="text-xs text-aura-text-2 mt-0.5">{n.timeAgo}</p>
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
