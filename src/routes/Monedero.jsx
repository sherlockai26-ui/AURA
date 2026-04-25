import { useAuthStore } from '../lib/store.js';

const PACKS = [
  { label: '50 Chispas',  amount: 50,  price: '$29 MXN' },
  { label: '150 Chispas', amount: 150, price: '$79 MXN' },
  { label: '500 Chispas', amount: 500, price: '$199 MXN' },
];

export default function Monedero() {
  const sparks    = useAuthStore((s) => s.sparks);
  const addSparks = useAuthStore((s) => s.addSparks);

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

      <p className="text-sm font-semibold mb-3 text-white/80">Recargar</p>
      <div className="flex flex-col gap-3">
        {PACKS.map((pack) => (
          <button
            key={pack.amount}
            type="button"
            onClick={() => addSparks(pack.amount)}
            className="flex items-center justify-between rounded-card border border-white/10 bg-aura-surface px-4 py-4 transition hover:border-aura-cyan active:scale-[.99]"
          >
            <div className="flex items-center gap-3">
              <span className="text-aura-cyan text-lg">⚡</span>
              <span className="font-semibold">{pack.label}</span>
            </div>
            <span className="text-sm text-aura-text-2">{pack.price}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-aura-text-2">
        Demo · los pagos reales estarán disponibles próximamente.
      </p>
    </div>
  );
}
