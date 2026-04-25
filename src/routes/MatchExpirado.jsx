import { useNavigate } from 'react-router-dom';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';

export default function MatchExpirado() {
  const navigate    = useNavigate();
  const clearMatch  = useAuthStore((s) => s.clearActiveMatch);

  function volver() {
    clearMatch();
    navigate('/zona-match', { replace: true });
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <Particles />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col items-center justify-center gap-8 px-8 text-center">

        {/* Ícono: anillo partido alejándose */}
        <div className="relative">
          <svg width={96} height={96} viewBox="0 0 96 96" fill="none">
            {/* Aro izquierdo alejándose */}
            <g transform="translate(-10,0)">
              <path
                d="M28 48a20 20 0 0 0 18 19.8"
                stroke="#9D4EDD" strokeWidth="3" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(157,78,221,0.5))' }}
              />
              <path
                d="M28 48a20 20 0 0 1 18-19.8"
                stroke="#9D4EDD" strokeWidth="3" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(157,78,221,0.5))' }}
              />
            </g>
            {/* Aro derecho alejándose */}
            <g transform="translate(10,0)">
              <path
                d="M68 48a20 20 0 0 1-18 19.8"
                stroke="#00F5D4" strokeWidth="3" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,245,212,0.5))' }}
              />
              <path
                d="M68 48a20 20 0 0 0-18-19.8"
                stroke="#00F5D4" strokeWidth="3" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,245,212,0.5))' }}
              />
            </g>
            {/* Línea de separación */}
            <line x1="48" y1="30" x2="48" y2="66" stroke="#fff" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-wide">El tiempo terminó</h1>
          <p className="text-aura-text-2 max-w-xs mx-auto">
            No fue este el indicado. A veces el tiempo simplemente no alcanza.
          </p>
        </div>

        <button
          type="button"
          onClick={volver}
          className="rounded-pill bg-aura-purple px-10 py-4 font-semibold uppercase tracking-wider text-white shadow-glow-purple transition hover:opacity-90 active:scale-[.99]"
        >
          Volver a Zona de Match
        </button>

        <p className="text-xs text-aura-text-2">
          Tendrás 5 Me Gusta nuevos disponibles mañana.
        </p>

      </main>
    </div>
  );
}
