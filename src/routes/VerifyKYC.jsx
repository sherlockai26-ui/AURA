import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function VerifyKYC() {
  const navigate = useNavigate();
  const setRegistrationData = useAuthStore((s) => s.setRegistrationData);

  // phase: 'idle' | 'scanning-doc' | 'doc-done' | 'scanning-selfie' | 'complete'
  const [phase, setPhase] = useState('idle');

  const docDone    = ['doc-done', 'scanning-selfie', 'complete'].includes(phase);
  const selfieDone = phase === 'complete';
  const isScanning = phase === 'scanning-doc' || phase === 'scanning-selfie';

  async function startScan() {
    setPhase('scanning-doc');
    await sleep(2000);
    setPhase('doc-done');
    await sleep(1200);
    setPhase('scanning-selfie');
    await sleep(2000);
    setPhase('complete');
    setRegistrationData({ kycVerificado: true });
    await sleep(1600);
    navigate('/registro', { state: { fromKYC: true } });
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <Particles />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 py-8">

        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="rounded-full p-2 text-aura-cyan transition hover:bg-white/5 active:scale-90"
            style={{ fontSize: 20 }}
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-aura-cyan" style={{ fontSize: 22 }}>🛡️</span>
            <h1 className="text-xl font-semibold tracking-wide">Verificación de Edad</h1>
          </div>
        </header>

        {/* Texto explicativo */}
        <p className="mb-6 text-sm text-aura-text-2">
          Escanea tu INE o Pasaporte para confirmar que eres mayor de edad.
          Tus datos son procesados de forma segura y no se almacenan en nuestros servidores.
        </p>

        {/* Zona de escaneo del documento */}
        <div
          className={`mb-4 flex min-h-[180px] flex-col items-center justify-center rounded-card border-2 border-dashed transition-all duration-500 ${
            phase === 'scanning-doc'
              ? 'border-aura-cyan bg-aura-surface shadow-glow-cyan animate-pulse-glow'
              : docDone
              ? 'border-aura-cyan/70 bg-aura-surface'
              : 'border-aura-purple/50 bg-aura-surface/40'
          }`}
        >
          {docDone ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-5xl text-aura-cyan">✓</span>
              <p className="font-semibold text-aura-cyan">Documento escaneado</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <div
                className={`grid place-items-center rounded-full border transition-all duration-300 ${
                  phase === 'scanning-doc'
                    ? 'border-aura-cyan text-aura-cyan'
                    : 'border-aura-purple/50 text-aura-purple'
                }`}
                style={{ width: 64, height: 64, fontSize: 26 }}
              >
                {phase === 'scanning-doc' ? '⟳' : '+'}
              </div>
              <p className="px-6 text-center text-sm text-aura-text-2">
                {phase === 'scanning-doc'
                  ? 'Escaneando documento...'
                  : 'Coloca aquí tu INE o Pasaporte'}
              </p>
            </div>
          )}
        </div>

        {/* Zona de selfie */}
        <div
          className={`mb-6 flex items-center gap-4 rounded-card border p-4 transition-all duration-500 ${
            phase === 'scanning-selfie'
              ? 'border-aura-cyan bg-aura-surface shadow-glow-cyan'
              : selfieDone
              ? 'border-aura-cyan/60 bg-aura-surface'
              : 'border-white/10 bg-aura-surface'
          }`}
        >
          <div
            className={`grid shrink-0 place-items-center rounded-full border transition-all duration-300 ${
              selfieDone
                ? 'border-aura-cyan text-aura-cyan'
                : phase === 'scanning-selfie'
                ? 'border-aura-cyan text-aura-cyan'
                : 'border-aura-cyan/40 text-aura-cyan/60'
            }`}
            style={{ width: 48, height: 48, fontSize: 22 }}
          >
            {selfieDone ? '✓' : '😊'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">Selfie de prueba de vida</p>
            <p className="mt-0.5 text-xs text-aura-text-2">
              {phase === 'scanning-selfie'
                ? 'Capturando selfie...'
                : selfieDone
                ? 'Selfie de vida capturada ✓'
                : 'A continuación, selfie para prueba de vida'}
            </p>
          </div>
        </div>

        {/* Verificación completa */}
        {phase === 'complete' && (
          <div className="mb-6 flex flex-col items-center gap-2 rounded-card border border-aura-cyan/40 bg-aura-cyan/10 p-5">
            <span className="text-3xl text-aura-cyan">✓</span>
            <p className="font-semibold text-aura-cyan">Verificación completada</p>
            <p className="text-center text-xs text-aura-text-2">
              Redirigiendo al registro…
            </p>
          </div>
        )}

        {/* Barra de progreso durante escaneo */}
        {isScanning && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <p className="text-xs text-aura-cyan">
              {phase === 'scanning-doc' ? 'Analizando documento…' : 'Procesando selfie…'}
            </p>
            <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-aura-surface">
              <div className="h-full w-10 rounded-full bg-aura-cyan animate-loader" />
            </div>
          </div>
        )}

        {/* Botón principal */}
        {phase === 'idle' && (
          <button
            type="button"
            onClick={startScan}
            className="w-full rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition hover:opacity-90 active:scale-[.99]"
          >
            Iniciar Escaneo
          </button>
        )}

        {/* Nota de seguridad */}
        <p
          className="mt-auto flex items-center justify-center gap-1 pt-6 text-center text-aura-text-2"
          style={{ fontSize: 11 }}
        >
          <span>🔒</span> Verificación segura · Datos no almacenados
        </p>

      </main>
    </div>
  );
}
