import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';

const FUSION_COST = 300;

export default function FusionDuo() {
  const navigate     = useNavigate();
  const session      = useAuthStore((s) => s.session);
  const accounts     = useAuthStore((s) => s.accounts);
  const sparks       = useAuthStore((s) => s.sparks);
  const spendSpark   = useAuthStore((s) => s.spendSpark);
  const clearMatch   = useAuthStore((s) => s.clearActiveMatch);
  const activeMatch  = useAuthStore((s) => s.activeMatch);

  const account   = session ? accounts[session.email] : null;
  const myHandle  = account?.handle ?? '?';
  const otherHandle = activeMatch?.otherNickname ?? '@Desconocido';
  const hasFunds  = sparks >= FUSION_COST;

  const [phase, setPhase] = useState('confirm'); // 'confirm' | 'animating' | 'done'
  const [error, setError]  = useState('');

  async function onAccept() {
    if (!hasFunds) { setError('No tienes suficientes Chispas.'); return; }
    setError('');
    if (!spendSpark(FUSION_COST)) { setError('No tienes suficientes Chispas.'); return; }
    setPhase('animating');
    await sleep(2200);
    setPhase('done');
    clearMatch();
    await sleep(1800);
    navigate('/profile', { replace: true });
  }

  if (phase === 'done') {
    return (
      <div className="relative min-h-[100dvh] bg-aura-bg text-white">
        <Particles />
        <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col items-center justify-center gap-6 px-8 text-center">
          <div style={{ fontSize: 72 }}>🎉</div>
          <h1 className="text-2xl font-semibold text-aura-cyan">¡Nido creado!</h1>
          <p className="text-aura-text-2">Redirigiendo a tu nuevo perfil Dúo…</p>
        </main>
      </div>
    );
  }

  if (phase === 'animating') {
    return (
      <div className="relative min-h-[100dvh] bg-aura-bg text-white">
        <Particles />
        <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col items-center justify-center gap-6 px-8 text-center">
          <FusionAnimation />
          <p className="text-aura-cyan font-semibold tracking-wide">Fusionando Nidos…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <Particles />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 py-8">

        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="rounded-full p-2 text-aura-text-2 hover:text-white transition"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold tracking-wide">Pase de Unión</h1>
        </header>

        {/* Avatares fusionándose */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <AvatarBubble handle={`@${myHandle}`} color="#9D4EDD" />
          <div className="flex flex-col items-center gap-1">
            <svg width="40" height="20" viewBox="0 0 40 20">
              <path d="M0 10 Q20 2 40 10 Q20 18 0 10Z" fill="rgba(157,78,221,0.2)" stroke="#9D4EDD" strokeWidth="1" />
            </svg>
            <span className="text-xl text-aura-cyan">∞</span>
          </div>
          <AvatarBubble handle={otherHandle} color="#00F5D4" />
        </div>

        {/* Texto principal */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-white">¡Están a un paso de crear su Nido!</h2>
          <p className="mt-2 text-sm text-aura-text-2">
            Ambos aceptan fusionar sus cuentas en un nuevo perfil Dúo compartido.
          </p>
        </div>

        {/* Resumen de costo */}
        <div className="mb-6 rounded-card border border-white/10 bg-aura-surface p-5">
          <p className="mb-4 text-sm font-semibold text-white/80 uppercase tracking-wider">Resumen</p>
          <div className="flex flex-col gap-3">
            <SummaryRow label={`Cuenta de @${myHandle}`} value="Miembro 1" />
            <SummaryRow label={`Cuenta de ${otherHandle}`} value="Miembro 2" />
            <div className="my-1 h-px bg-white/10" />
            <SummaryRow label="Pase de Unión (cada uno)" value={`${FUSION_COST} ⚡`} highlight />
            <SummaryRow label="Tu saldo actual" value={`${sparks} ⚡`} dim />
          </div>
        </div>

        {/* Saldo suficiente / insuficiente */}
        {hasFunds ? (
          <div className="mb-4 flex items-center gap-2 rounded-card border border-aura-cyan/30 bg-aura-cyan/10 px-4 py-3">
            <span className="text-aura-cyan">✓</span>
            <p className="text-sm text-aura-cyan">Tienes saldo suficiente para la fusión.</p>
          </div>
        ) : (
          <div className="mb-4 flex flex-col gap-2 rounded-card border border-aura-error/30 bg-aura-error/10 px-4 py-3">
            <p className="text-sm text-aura-error">Saldo insuficiente. Necesitas {FUSION_COST - sparks} ⚡ más.</p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="self-start text-xs text-aura-cyan underline"
            >
              Comprar Chispas →
            </button>
          </div>
        )}

        {error && (
          <p className="mb-3 text-center text-sm text-aura-error">{error}</p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={onAccept}
          disabled={!hasFunds}
          className="w-full rounded-pill bg-aura-purple py-4 font-semibold uppercase tracking-wider text-white shadow-glow-purple transition hover:opacity-90 active:scale-[.99] disabled:opacity-40"
        >
          Aceptar y Comprar Pase de Unión ({FUSION_COST} ⚡)
        </button>

        <p className="mt-4 text-center text-xs text-aura-text-2">
          Al confirmar, ambas cuentas se fusionan de forma permanente. Esta acción no puede deshacerse.
        </p>

      </main>
    </div>
  );
}

/* ── Sub-componentes ──────────────────────────────────────────────── */

function AvatarBubble({ handle, color }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: 72, height: 72,
          background: `${color}22`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 16px ${color}44`,
          fontSize: 28,
        }}
      >
        👤
      </div>
      <p className="text-xs text-aura-text-2">{handle}</p>
    </div>
  );
}

function SummaryRow({ label, value, highlight, dim }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${dim ? 'text-aura-text-2' : 'text-white/80'}`}>{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-aura-cyan' : dim ? 'text-aura-text-2' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function FusionAnimation() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Aro izquierdo */}
      <div
        className="absolute animate-pulse-glow"
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '3px solid #9D4EDD',
          boxShadow: '0 0 20px rgba(157,78,221,0.6)',
          left: 8,
          animation: 'fusionLeft 2.2s ease-in-out forwards',
        }}
      />
      {/* Aro derecho */}
      <div
        className="absolute"
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '3px solid #00F5D4',
          boxShadow: '0 0 20px rgba(0,245,212,0.6)',
          right: 8,
          animation: 'fusionRight 2.2s ease-in-out forwards',
        }}
      />
      {/* Centro brillante */}
      <div
        style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'radial-gradient(#fff, #9D4EDD)',
          boxShadow: '0 0 24px #9D4EDD',
        }}
      />
      <style>{`
        @keyframes fusionLeft  { 0%{left:8px}  80%{left:48px} 100%{left:48px} }
        @keyframes fusionRight { 0%{right:8px} 80%{right:48px} 100%{right:48px} }
      `}</style>
    </div>
  );
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
