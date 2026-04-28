import { useEffect, useRef } from 'react';
import { useAuthStore } from '../lib/store.js';
import { apiGetNotifications } from '../lib/api.js';

const TOAST_TEXT = {
  video_like:    (actor) => `A ${actor} le gustó tu video`,
  video_comment: (actor) => `${actor} comentó en tu video`,
  message:       (actor) => `${actor} te envió un mensaje`,
  match:         (actor) => `Nuevo match con ${actor}`,
};

function toastLink(n) {
  if (n.type === 'video_like' || n.type === 'video_comment') return '/flash';
  if (n.type === 'message' && n.conversation_id) return `/messages?conv=${n.conversation_id}`;
  if (n.type === 'match') return '/zona-match';
  return '';
}

export function useRealtimeNotifications() {
  const session  = useAuthStore((s) => s.session);
  const addToast = useAuthStore((s) => s.addToast);
  const baseline = useRef(null);
  const isFirst  = useRef(true);

  useEffect(() => {
    if (!session) return;

    async function poll() {
      let data;
      try { data = await apiGetNotifications(); } catch { return; }
      if (!Array.isArray(data)) return;

      if (isFirst.current) {
        isFirst.current = false;
        baseline.current = data.length > 0 ? data[0].created_at : new Date().toISOString();
        return;
      }

      const fresh = baseline.current
        ? data.filter((n) => !n.read && new Date(n.created_at) > new Date(baseline.current))
        : [];

      if (fresh.length > 0) baseline.current = fresh[0].created_at;

      for (const n of fresh.slice(0, 3)) {
        const makeTxt = TOAST_TEXT[n.type];
        if (!makeTxt) continue;
        const actor = n.actor_handle ? `@${n.actor_handle}` : 'Alguien';
        addToast({ type: n.type, message: makeTxt(actor), link: toastLink(n) });
      }
    }

    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
