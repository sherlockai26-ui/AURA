import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import {
  apiGetConversations,
  apiGetMessages,
  apiSendMessage,
  apiStartConversation,
} from '../lib/api.js';

export default function EspejoChat() {
  const location     = useLocation();
  const session      = useAuthStore((s) => s.session);
  const viewerHandle = useAuthStore((s) => s.viewerHandle());

  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [sending,       setSending]       = useState(false);
  const [newHandle,     setNewHandle]     = useState('');
  const [showNew,       setShowNew]       = useState(false);
  const [convError,     setConvError]     = useState('');
  const [msgError,      setMsgError]      = useState('');
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  // Load conversations list
  useEffect(() => {
    let cancelled = false;
    setConvError('');
    apiGetConversations()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
        const requested = new URLSearchParams(location.search).get('conv');
        if (requested) {
          const found = list.find((c) => c.id === requested);
          if (found) setActiveConv(found);
        }
      })
      .catch((err) => {
        if (!cancelled) setConvError(err.message || 'No se pudo cargar las conversaciones.');
      });
    return () => { cancelled = true; };
  }, [location.search]);

  // Load messages for active conversation + poll every 4s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeConv) return;

    setMsgError('');
    const load = () => {
      apiGetMessages(activeConv.id)
        .then((data) => { if (Array.isArray(data)) setMessages(data); })
        .catch((err) => setMsgError(err.message || 'Error al cargar mensajes.'));
    };
    load();
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeConv) return;
    setSending(true);
    try {
      await apiSendMessage(activeConv.id, trimmed);
      setText('');
      const data = await apiGetMessages(activeConv.id);
      if (Array.isArray(data)) setMessages(data);
    } catch (err) {
      setMsgError(err.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  async function startConversation(e) {
    e.preventDefault();
    const handle = newHandle.trim().replace(/^@/, '');
    if (!handle) return;
    try {
      const conv = await apiStartConversation(handle);
      const updated = await apiGetConversations();
      setConversations(Array.isArray(updated) ? updated : []);
      const found = (Array.isArray(updated) ? updated : []).find((c) => c.id === conv.id);
      if (found) setActiveConv(found);
      setNewHandle('');
      setShowNew(false);
    } catch (err) {
      alert(err.message || 'No se pudo iniciar la conversación.');
    }
  }

  if (activeConv) {
    return (
      <div className="flex h-full flex-col text-white">
        <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button onClick={() => { setActiveConv(null); setMessages([]); setMsgError(''); }} className="text-aura-cyan text-lg p-1">←</button>
          <Link to={`/profile/${activeConv.other_user_id}`} className="shrink-0">
            <ConvAvatar handle={activeConv.other_handle} avatarUrl={activeConv.other_avatar} />
          </Link>
          <div>
            <Link to={`/profile/${activeConv.other_user_id}`} className="font-semibold text-sm hover:text-aura-cyan">
              {activeConv.other_name || activeConv.other_handle}
            </Link>
            <p className="text-xs text-aura-text-2">@{activeConv.other_handle}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {msgError && (
            <p className="text-center text-xs text-aura-error py-2">{msgError}</p>
          )}
          {!msgError && messages.length === 0 && (
            <p className="text-center text-xs text-aura-text-2 py-6">Sin mensajes aún. ¡Di hola!</p>
          )}
          {messages.map((m) => {
            const isMe = m.sender_id === session?.id || m.handle === viewerHandle;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-card px-3 py-2 text-sm ${isMe ? 'bg-aura-purple text-white' : 'bg-aura-surface text-white'}`}>
                  {!isMe && (
                    <Link to={`/profile/${m.sender_id}`} className="text-xs text-aura-cyan mb-0.5 hover:underline">
                      @{m.handle}
                    </Link>
                  )}
                  <p>{m.content}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 text-right">
                    {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-white/10 px-4 py-3 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-card bg-aura-surface px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-card bg-aura-cyan px-4 py-3 text-sm font-semibold text-aura-bg disabled:opacity-50"
          >
            {sending ? '…' : '→'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col text-white">
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <p className="font-semibold text-sm">Espejo</p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="text-aura-cyan text-xl p-1"
          aria-label="Nueva conversación"
        >
          ✏️
        </button>
      </div>

      {showNew && (
        <form onSubmit={startConversation} className="px-4 py-3 border-b border-white/10 flex gap-2">
          <input
            type="text"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            placeholder="Handle del usuario"
            className="flex-1 rounded-card bg-aura-surface px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple"
          />
          <button type="submit" className="rounded-card bg-aura-cyan px-4 py-3 text-sm font-semibold text-aura-bg">
            Iniciar
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {convError ? (
          <div className="mt-8 px-4 text-center">
            <p className="text-sm text-aura-error mb-2">{convError}</p>
            <button
              onClick={() => { setConvError(''); apiGetConversations().then((d) => setConversations(Array.isArray(d) ? d : [])).catch((e) => setConvError(e.message)); }}
              className="text-xs text-aura-cyan hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <p className="mt-8 text-center text-sm text-aura-text-2">Sin conversaciones aún. Presiona ✏️ para empezar.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-aura-surface text-left"
            >
              <ConvAvatar handle={c.other_handle} avatarUrl={c.other_avatar} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.other_name || c.other_handle}</p>
                <p className="text-xs text-aura-text-2 truncate">{c.last_message || 'Sin mensajes'}</p>
              </div>
              {c.last_message_at && (
                <span className="text-[10px] text-aura-text-2 shrink-0">
                  {new Date(c.last_message_at).toLocaleDateString('es-MX')}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ConvAvatar({ handle, avatarUrl }) {
  if (avatarUrl) {
    const src = avatarUrl.startsWith('http') ? avatarUrl : avatarUrl;
    return <img src={src} alt={handle} className="h-10 w-10 rounded-full object-cover shrink-0" />;
  }
  const letter = (handle || '?')[0].toUpperCase();
  return (
    <span className="h-10 w-10 rounded-full bg-aura-purple/30 grid place-items-center text-aura-purple font-semibold shrink-0">
      {letter}
    </span>
  );
}
