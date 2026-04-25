import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';

const SCREENS = [
  {
    emoji: '✨',
    title: 'Bienvenido a AURA',
    desc: 'Un espacio íntimo donde solteros y parejas crean conexiones auténticas y momentos que perduran.',
  },
  {
    emoji: '💜',
    title: 'Encuentra tu Sintonía',
    desc: 'Descubre perfiles compatibles, lanza Destellos y vive Citas Dobles grupales únicas.',
  },
  {
    emoji: '🔮',
    title: 'Tu Nido, tu mundo',
    desc: 'Construye tu espacio, acumula Chispas y conecta de formas que solo AURA hace posibles.',
  },
];

export default function Onboarding() {
  const navigate           = useNavigate();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [current, setCurrent] = useState(0);

  const isLast = current === SCREENS.length - 1;
  const screen = SCREENS[current];

  function onNext() {
    if (!isLast) { setCurrent((c) => c + 1); return; }
    finish();
  }

  function finish() {
    completeOnboarding();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white overflow-hidden">
      <Particles />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">

        {/* Skip */}
        <div className="flex justify-end px-6 pt-5" style={{ minHeight: 44 }}>
          {!isLast && (
            <button
              type="button"
              onClick={finish}
              className="text-sm text-aura-text-2 transition hover:text-white"
            >
              Saltar
            </button>
          )}
        </div>

        {/* Contenido de la pantalla */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div
            className="mb-8 grid place-items-center rounded-full"
            style={{
              width: 120, height: 120,
              fontSize: 52,
              background: 'rgba(157,78,221,0.12)',
              border: '2px solid rgba(157,78,221,0.3)',
              boxShadow: '0 0 40px rgba(157,78,221,0.2)',
              transition: 'all 0.3s ease',
            }}
          >
            {screen.emoji}
          </div>

          <h1
            className="mb-4 text-3xl font-bold tracking-wide"
            style={{ textShadow: '0 0 20px rgba(157,78,221,0.4)' }}
          >
            {screen.title}
          </h1>
          <p className="max-w-xs text-base leading-relaxed text-aura-text-2">
            {screen.desc}
          </p>
        </div>

        {/* Navegación inferior */}
        <div className="flex flex-col items-center gap-5 px-8 pb-12">

          {/* Dots de progreso */}
          <div className="flex gap-2">
            {SCREENS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Pantalla ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  background: i === current ? '#9D4EDD' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNext}
            className="w-full max-w-xs rounded-pill bg-aura-purple py-4 font-semibold uppercase tracking-wider text-white shadow-glow-purple transition hover:opacity-90 active:scale-[.99]"
          >
            {isLast ? 'Entrar a Aura' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
