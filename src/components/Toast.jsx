import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

const BORDER = {
  video_like:    '#00F5D4',
  like:          '#00F5D4',
  video_comment: '#9D4EDD',
  comment:       '#9D4EDD',
  match:         '#22c55e',
  message:       '#3b82f6',
};

const ICON = {
  video_like:    '🤍',
  video_comment: '💬',
  match:         '❤️',
  message:       '💬',
};

function ToastItem({ toast, onRemove }) {
  const navigate  = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 10);
    const t2 = setTimeout(() => { setShow(false); setTimeout(onRemove, 300); }, 4700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick() {
    if (toast.link) navigate(toast.link);
    onRemove();
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg cursor-pointer w-full max-w-xs"
      style={{
        background:    '#1F2833',
        borderLeft:    `4px solid ${BORDER[toast.type] || '#00F5D4'}`,
        transform:     show ? 'translateX(0)' : 'translateX(110%)',
        opacity:       show ? 1 : 0,
        transition:    'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <span className="text-lg flex-shrink-0">{ICON[toast.type] || '🔔'}</span>
      <p className="text-white text-sm flex-1 line-clamp-2">{toast.message}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="text-white/40 hover:text-white text-xl leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts      = useAuthStore((s) => s.toasts);
  const removeToast = useAuthStore((s) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 320 }}>
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
