import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useAuthStore } from '../lib/store.js';

const MOCK_MESSAGES = [
  { id: '1', text: '¡Hola! Bienvenido al Espejo 💜', senderId: 'other', senderHandle: 'AURA', ts: Date.now() - 120000 },
  { id: '2', text: 'Aquí verás tus conversaciones privadas en tiempo real.', senderId: 'other', senderHandle: 'AURA', ts: Date.now() - 60000 },
];

export default function EspejoChat() {
  const session     = useAuthStore((s) => s.session);
  const user        = useAuthStore((s) => s.user);
  const viewerHandle = useAuthStore((s) => s.viewerHandle());

  const fbEnabled = !!user && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const chatId    = session?.email
    ? `chat-${btoa(session.email).replace(/[+/=]/g, '')}`
    : null;

  const [messages,  setMessages]  = useState(fbEnabled ? [] : MOCK_MESSAGES);
  const [text,      setText]      = useState('');
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!fbEnabled || !chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('ts', 'asc')
    );
    return onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setMessages(MOCK_MESSAGES)
    );
  }, [fbEnabled, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!fbEnabled || !chatId) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: trimmed, senderId: 'me', senderHandle: viewerHandle, ts: Date.now() },
      ]);
      setText('');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: trimmed,
        senderId: user.uid,
        senderHandle: viewerHandle,
        ts: serverTimestamp(),
      });
      setText('');
    } catch {
      // silently ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col text-white">
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <span className="text-xl">💬</span>
        <div>
          <p className="font-semibold text-sm">Espejo</p>
          <p className="text-xs text-aura-text-2">
            {fbEnabled ? 'Chat en tiempo real' : 'Modo demo'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map((m) => {
          const isMe = fbEnabled ? m.senderId === user?.uid : m.senderId === 'me';
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  isMe ? 'bg-aura-purple text-white' : 'bg-aura-surface text-white'
                }`}
              >
                {!isMe && (
                  <p className="text-xs text-aura-cyan mb-0.5 font-medium">{m.senderHandle}</p>
                )}
                <p>{m.text}</p>
                <p className="text-right mt-0.5 opacity-50" style={{ fontSize: 10 }}>
                  {formatTs(m.ts)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="border-t border-white/10 px-4 py-3 flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-full bg-aura-surface px-4 py-2.5 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-full bg-aura-purple px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40 hover:opacity-90 active:scale-95"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

function formatTs(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
