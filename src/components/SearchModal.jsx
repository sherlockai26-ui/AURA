import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSearchUsers, apiRequestConnection } from '../lib/api.js';

export default function SearchModal({ onClose }) {
  const navigate = useNavigate();
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [connecting,  setConnecting]  = useState(null); // userId being connected
  const [connTarget,  setConnTarget]  = useState(null); // { id, handle } for msg modal
  const [connMsg,     setConnMsg]     = useState('');
  const [statuses,    setStatuses]    = useState({}); // userId → 'pending_sent'

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiSearchUsers(val.trim());
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function sendConnection(userId, message) {
    setConnecting(userId);
    try {
      await apiRequestConnection(userId, message);
      setStatuses(s => ({ ...s, [userId]: 'pending_sent' }));
      setConnTarget(null);
    } catch {}
    setConnecting(null);
  }

  function goToProfile(userId) {
    navigate(`/profile/${userId}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#1F2833] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder="Buscar usuarios…"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <p className="text-center text-white/40 text-sm py-6">Buscando…</p>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm text-white/40">No se encontraron usuarios</p>
            </div>
          )}
          {!loading && results.map(u => {
            const av  = u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.handle)}&background=1a1b1f&color=00F5D4&size=40`;
            const status = statuses[u.id];
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                <button onClick={() => goToProfile(u.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <img src={av} alt={u.handle} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">@{u.handle}</p>
                    {u.display_name && u.display_name !== u.handle && (
                      <p className="text-xs text-white/50 truncate">{u.display_name}</p>
                    )}
                  </div>
                </button>
                {status === 'pending_sent' ? (
                  <span className="flex-shrink-0 text-xs text-white/40 border border-white/15 rounded-full px-3 py-1">
                    Enviada
                  </span>
                ) : (
                  <button
                    onClick={() => { setConnTarget(u); setConnMsg(''); }}
                    disabled={connecting === u.id}
                    className="flex-shrink-0 text-xs bg-aura-cyan text-aura-bg font-semibold py-1 px-3 rounded-full hover:bg-aura-cyan/80 transition disabled:opacity-50"
                  >
                    {connecting === u.id ? '…' : 'Conectar'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini modal: mensaje de conexión */}
      {connTarget && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4" onClick={() => setConnTarget(null)}>
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1F2833] p-5" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-white mb-1">Conectar con @{connTarget.handle}</p>
            <p className="text-xs text-white/50 mb-3">Cuéntale por qué quieres conectar.</p>
            <input
              autoFocus
              value={connMsg}
              onChange={e => setConnMsg(e.target.value.slice(0, 40))}
              placeholder="Un detalle, un cumplido…"
              maxLength={40}
              className="w-full rounded-lg bg-aura-bg border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-aura-cyan"
            />
            <p className="text-right text-[10px] text-white/30 mt-1">{connMsg.length}/40</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setConnTarget(null)} className="flex-1 rounded-full border border-white/20 py-2.5 text-sm text-white/60">
                Cancelar
              </button>
              <button
                disabled={connMsg.trim().length === 0 || connecting === connTarget.id}
                onClick={() => sendConnection(connTarget.id, connMsg.trim())}
                className="flex-[2] rounded-full bg-aura-cyan py-2.5 text-sm font-semibold text-aura-bg disabled:opacity-40"
              >
                {connecting === connTarget.id ? '…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
