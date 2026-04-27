import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiGetSparks, apiTransferSparks } from '../lib/api.js';

export default function Monedero() {
  const navigate   = useNavigate();
  const setSparks  = useAuthStore((s) => s.setSparks);

  const [balance,      setBalance]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadError,    setLoadError]    = useState('');
  const [feedback,     setFeedback]     = useState('');
  const [toHandle,     setToHandle]     = useState('');
  const [amount,       setAmount]       = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  function loadSparks() {
    setLoadError('');
    apiGetSparks()
      .then((data) => {
        setBalance(data.balance ?? 0);
        setSparks(data.balance ?? 0);
        setTransactions(data.transactions || []);
      })
      .catch((err) => setLoadError(err.message || 'No se pudo cargar el monedero.'));
  }

  useEffect(() => { loadSparks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTransfer(e) {
    e.preventDefault();
    const qty = parseInt(amount);
    if (!toHandle.trim() || !qty || qty < 1) return;
    setTransferring(true);
    setFeedback('');
    try {
      const data = await apiTransferSparks({ to_handle: toHandle.trim(), amount: qty, reason: 'Regalo' });
      setBalance(data.balance);
      setSparks(data.balance);
      const updated = await apiGetSparks();
      setTransactions(updated.transactions || []);
      setFeedback(`✓ Enviaste ${qty} Chispas a @${toHandle.trim()}`);
      setToHandle('');
      setAmount('');
      setShowTransfer(false);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      setFeedback(err.message || 'Error al transferir.');
    } finally {
      setTransferring(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-12 text-center text-white">
        <p className="text-aura-error mb-3">{loadError}</p>
        <button onClick={loadSparks} className="text-sm text-aura-cyan hover:underline">Reintentar</button>
      </div>
    );
  }

  if (balance === null) {
    return <div className="py-12 text-center text-sm text-aura-text-2">Cargando monedero…</div>;
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <h1 className="text-xl font-semibold mb-1">Monedero</h1>
      <p className="text-aura-text-2 text-sm mb-6">Gestiona tus Chispas</p>

      {/* Balance */}
      <div className="rounded-card bg-aura-surface p-5 flex items-center justify-between mb-4 border border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-4xl">⚡</span>
          <div>
            <p className="text-3xl font-bold text-aura-cyan">{balance}</p>
            <p className="text-xs text-aura-text-2 mt-0.5">Chispas disponibles</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTransfer((v) => !v)}
          className="rounded-pill border border-aura-purple/60 px-3 py-2 text-xs text-aura-purple hover:border-aura-purple"
        >
          Transferir
        </button>
      </div>

      {/* Transfer form */}
      {showTransfer && (
        <form onSubmit={handleTransfer} className="rounded-card border border-aura-purple/30 bg-aura-surface p-4 mb-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Enviar Chispas</p>
          <input
            type="text"
            placeholder="Handle del destinatario"
            value={toHandle}
            onChange={(e) => setToHandle(e.target.value)}
            className="rounded-card bg-aura-bg px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple"
          />
          <input
            type="number"
            placeholder="Cantidad"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-card bg-aura-bg px-4 py-3 text-sm text-white placeholder-aura-text-2 outline-none border border-transparent focus:border-aura-purple"
          />
          <button
            type="submit"
            disabled={transferring}
            className="rounded-pill bg-aura-cyan py-3 text-sm font-semibold text-aura-bg disabled:opacity-50"
          >
            {transferring ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      )}

      {feedback && (
        <div className={`mb-4 rounded-card px-4 py-3 text-center text-sm font-semibold border ${feedback.startsWith('✓') ? 'bg-aura-cyan/10 border-aura-cyan/40 text-aura-cyan' : 'bg-aura-error/10 border-aura-error/40 text-aura-error'}`}>
          {feedback}
        </div>
      )}

      {/* Ganar Chispas gratis */}
      <button
        type="button"
        onClick={() => navigate('/tareas')}
        className="w-full rounded-card border border-aura-purple/50 bg-aura-surface/60 px-4 py-4 mb-4 text-center hover:border-aura-purple transition"
      >
        <p className="text-sm font-semibold text-aura-purple">⚡ Gana Chispas gratis</p>
        <p className="text-xs text-aura-text-2 mt-0.5">Completa tareas y ayuda a crear comunidad</p>
      </button>

      {/* Recargar — PENDIENTE: sin pasarela de pago real */}
      <div className="rounded-card border border-white/10 bg-aura-surface/50 px-4 py-4 mb-4 text-center">
        <p className="text-sm text-aura-text-2">
          Recarga de Chispas con dinero real — <span className="text-aura-purple">próximamente</span>
        </p>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold mb-3 text-white/80">Historial</p>
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const isReceived = tx.to_handle && tx.from_handle !== 'yo';
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-card bg-aura-surface/60 px-4 py-3 border border-white/5">
                  <div>
                    <p className="text-sm">{tx.reason || (isReceived ? 'Recibido' : 'Enviado')}</p>
                    <p className="text-xs text-aura-text-2">
                      {isReceived ? `De @${tx.from_handle}` : `A @${tx.to_handle}`} · {new Date(tx.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${isReceived ? 'text-aura-cyan' : 'text-aura-error'}`}>
                    {isReceived ? '+' : '-'}{tx.amount} ⚡
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
