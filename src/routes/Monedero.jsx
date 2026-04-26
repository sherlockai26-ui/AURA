import { useState } from 'react';
import { useAuthStore } from '../lib/store.js';

const PACKS = [
  { label: '50 Chispas',  amount: 50,  price: '$2.00 USD' },
  { label: '150 Chispas', amount: 150, price: '$5.00 USD' },
  { label: '300 Chispas', amount: 300, price: '$8.00 USD' },
  { label: '500 Chispas', amount: 500, price: '$15.00 USD' },
];

export default function Monedero() {
  const sparks     = useAuthStore((s) => s.sparks);
  const addChispas = useAuthStore((s) => s.addChispas);
  const [feedback, setFeedback] = useState('');

  function handleRecargar(pack) {
    addChispas(pack.amount);
    setFeedback(`¡Recarga exitosa! +${pack.amount} Chispas ⚡`);
    setTimeout(() => setFeedback(''), 3000);
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <h1 className="text-xl font-semibold mb-1">Monedero</h1>
      <p className="text-aura-text-2 text-sm mb-6">Gestiona tus Chispas</p>

      <div className="rounded-card bg-aura-surface p-5 flex items-center gap-4 mb-6 border border-white/10">
        <span className="text-4xl">⚡</span>
        <div>
          <p className="text-3xl font-bold text-aura-cyan">{sparks}</p>
          <p className="text-xs text-aura-text-2 mt-0.5">Chispas disponibles</p>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 rounded-card bg-aura-cyan/10 border border-aura-cyan/40 px-4 py-3 text-center text-sm font-semibold text-aura-cyan">
          {feedback}
        </div>
      )}

      <p className="text-sm font-semibold mb-3 text-white/80">Recargar</p>
      <div className="flex flex-col gap-3">
        {PACKS.map((pack) => (
          <button
            key={pack.amount}
            type="button"
            onClick={() => handleRecargar(pack)}
            className="flex items-center justify-between rounded-card border border-white/10 bg-aura-surface px-4 py-4 transition hover:border-aura-cyan active:scale-[.99]"
          >
            <div className="flex items-center gap-3">
              <span className="text-aura-cyan text-lg">⚡</span>
              <span className="font-semibold">{pack.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-aura-text-2">{pack.price}</span>
              <span className="text-xs bg-aura-cyan/20 text-aura-cyan px-2 py-0.5 rounded-full">
                Recargar
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-aura-text-2">
        Demo · los pagos reales estarán disponibles próximamente.
      </p>
    </div>
  );
}
