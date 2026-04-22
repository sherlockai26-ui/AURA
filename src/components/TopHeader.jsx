import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

export default function TopHeader() {
  const sparks = useAuthStore((s) => s.sparks);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-aura-bg/95 px-4 py-3 backdrop-blur-md">
      <span className="text-[20px] font-bold tracking-[2px] text-white">AURA</span>
      <div className="flex items-center gap-4">
        <Link
          to="/wallet"
          className="flex items-center gap-1 rounded-pill border border-aura-cyan/40 px-3 py-1 text-aura-cyan"
          aria-label={`Saldo: ${sparks} Chispas`}
        >
          <span aria-hidden>⚡</span>
          <span className="text-sm font-semibold">{sparks}</span>
        </Link>
        <Link to="/notifications" aria-label="Notificaciones" className="text-aura-cyan">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" strokeLinejoin="round" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
