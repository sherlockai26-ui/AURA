import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import { useAuthStore } from '../lib/store.js';

export default function WhoIsHere() {
  const navigate    = useNavigate();
  const email       = useAuthStore((s) => s.pendingWho?.email);
  const account     = useAuthStore((s) => s.accounts[s.pendingWho?.email]);
  const finalize    = useAuthStore((s) => s.finalizeIdentity);
  const clearWho    = useAuthStore((s) => s.clearPendingWho);
  const generateOtp = useAuthStore((s) => s.generateOtp);
  const verifyOtp   = useAuthStore((s) => s.verifyOtp);

  const [stage, setStage]           = useState('pick');       // 'pick' | 'otp' | 'invite-otp'
  const [selectedIdx, setSelectedIdx] = useState(null);       // 0 | 1
  const [demoCode, setDemoCode]     = useState('');
  const [otpVals, setOtpVals]       = useState(Array(6).fill(''));
  const [error, setError]           = useState('');
  const [accepting, setAccepting]   = useState(false);

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  if (!account) return null;

  const members = account.members;

  // ── Seleccionar identidad ──────────────────────────────────────────
  function pickDuo() {
    finalize(email, 'duo');
    navigate('/feed', { replace: true });
  }

  function pickMember(idx) {
    const key  = `login:${email}:${idx}`;
    const code = generateOtp(key);
    setDemoCode(code);
    setSelectedIdx(idx);
    setOtpVals(Array(6).fill(''));
    setError('');
    setStage('otp');
  }

  function pickInvite() {
    const key  = `invite:${email}`;
    // El OTP ya está guardado en account.pendingInvite.otp al invitar
    setDemoCode(account.pendingInvite?.otp || '');
    setOtpVals(Array(6).fill(''));
    setError('');
    setStage('invite-otp');
  }

  // ── Verificar OTP de miembro ───────────────────────────────────────
  function verifyMember() {
    const code = otpVals.join('');
    const key  = `login:${email}:${selectedIdx}`;
    if (!verifyOtp(key, code)) { setError('Código incorrecto. Inténtalo de nuevo.'); return; }
    const identity = selectedIdx === 0 ? 'member0' : 'member1';
    finalize(email, identity);
    navigate('/feed', { replace: true });
  }

  // ── Verificar OTP de invitación ────────────────────────────────────
  function verifyInvite() {
    const code = otpVals.join('');
    if (code !== account.pendingInvite?.otp) { setError('Código de invitación incorrecto.'); return; }
    const acceptInvite = useAuthStore.getState().acceptInvite;
    acceptInvite(email, { name: account.pendingInvite.name, phone: account.pendingInvite.phone });
    navigate('/feed', { replace: true });
  }

  // ── Retroceder ─────────────────────────────────────────────────────
  function goBack() { setStage('pick'); setError(''); }
  function goLogin() { clearWho(); navigate('/login', { replace: true }); }

  return (
    <div className="min-h-[100dvh] bg-aura-bg text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[420px]">

        <header className="flex flex-col items-center mb-8">
          <BrandLogo size={64} />
          {stage === 'pick' && (
            <>
              <h2 className="mt-4 text-xl font-semibold tracking-wide">¿Quién está ahí?</h2>
              <p className="mt-1 text-sm text-aura-text-2">Elige tu identidad para entrar</p>
              <p className="mt-0.5 text-xs text-aura-text-2">@{account.handle}</p>
            </>
          )}
          {stage === 'otp' && (
            <>
              <h2 className="mt-4 text-xl font-semibold">Confirma tu identidad</h2>
              <p className="mt-1 text-sm text-aura-text-2">
                Enviamos un código al teléfono de{' '}
                <span className="text-white font-medium">@{members[selectedIdx]?.handle}</span>
              </p>
              <p className="text-xs text-aura-text-2 mt-0.5">
                {maskPhone(members[selectedIdx]?.phone)}
              </p>
            </>
          )}
          {stage === 'invite-otp' && (
            <>
              <h2 className="mt-4 text-xl font-semibold">Código de invitación</h2>
              <p className="mt-1 text-sm text-aura-text-2">
                El administrador del Duo te compartió un código de ingreso
              </p>
            </>
          )}
        </header>

        {/* ── Selector de identidad ── */}
        {stage === 'pick' && (
          <div className="flex flex-col gap-3">
            {members.map((m, idx) => (
              <button
                key={m.handle}
                onClick={() => pickMember(idx)}
                className="flex items-center gap-4 rounded-card bg-aura-surface border border-white/10 p-4 text-left transition hover:border-aura-purple hover:shadow-glow-purple"
              >
                <MemberAvatar member={m} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{m.name}</p>
                  <p className="text-sm text-aura-cyan truncate">@{m.handle}</p>
                </div>
                <span className="text-aura-text-2 text-xs">SMS →</span>
              </button>
            ))}

            {/* Opción Duo completo */}
            <button
              onClick={pickDuo}
              className="flex items-center gap-4 rounded-card border border-aura-purple/60 bg-aura-surface p-4 text-left transition hover:shadow-glow-purple"
            >
              <DuoAvatar account={account} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Modo Duo</p>
                <p className="text-sm text-aura-purple truncate">@{account.handle}</p>
              </div>
              <span className="text-aura-text-2 text-xs">Sin SMS</span>
            </button>

            {/* Invitación pendiente */}
            {account.pendingInvite && (
              <button
                onClick={pickInvite}
                className="flex items-center gap-4 rounded-card border border-aura-cyan/60 bg-aura-surface p-4 text-left transition hover:shadow-glow-cyan"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-aura-cyan/40 text-2xl text-aura-cyan">+</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{account.pendingInvite.name}</p>
                  <p className="text-sm text-aura-cyan">Nuevo integrante invitado</p>
                </div>
                <span className="text-aura-text-2 text-xs">Código →</span>
              </button>
            )}

            <button onClick={goLogin} className="mt-2 text-center text-xs text-aura-text-2 hover:text-white">
              ← Volver al login
            </button>
          </div>
        )}

        {/* ── OTP de miembro o invitación ── */}
        {(stage === 'otp' || stage === 'invite-otp') && (
          <div className="flex flex-col gap-5">
            <OtpInput values={otpVals} onChange={setOtpVals} />

            {demoCode && (
              <div className="rounded-card border border-white/10 bg-aura-surface/70 p-3 text-center text-xs">
                <span className="text-aura-text-2">Modo demo · código: </span>
                <span className="font-mono text-aura-cyan">{demoCode}</span>
              </div>
            )}

            {error && (
              <p role="alert" className="text-center text-sm text-aura-error">{error}</p>
            )}

            <button
              onClick={stage === 'otp' ? verifyMember : verifyInvite}
              className="w-full rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition hover:opacity-90"
            >
              Verificar y entrar
            </button>
            <button onClick={goBack} className="text-center text-xs text-aura-text-2 hover:text-white">
              ← Elegir otra identidad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-componentes ──────────────────────────────────────────────── */

function OtpInput({ values, onChange }) {
  const refs = useRef([]);
  return (
    <div className="flex justify-center gap-2">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(0, 1);
            const next = [...values];
            next[i] = ch;
            onChange(next);
            if (ch && i < values.length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className="h-14 w-12 rounded-card bg-aura-surface text-center text-xl text-white outline-none border border-white/10 focus:border-aura-purple focus:shadow-glow-purple"
        />
      ))}
    </div>
  );
}

export function MemberAvatar({ member, size = 40 }) {
  if (member?.photo) {
    return (
      <img
        src={member.photo}
        alt={member.name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full bg-gradient-to-br from-aura-purple to-aura-cyan font-bold text-aura-bg"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials(member?.name)}
    </span>
  );
}

export function DuoAvatar({ account, size = 40 }) {
  if (account?.duoPhoto) {
    return (
      <img
        src={account.duoPhoto}
        alt={account.handle}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full border-2 border-aura-purple text-aura-purple"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      ∞
    </span>
  );
}

function initials(s) {
  return String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}
function maskPhone(p) {
  const d = String(p || '').replace(/\s+/g, '');
  return d.slice(0, 3) + ' ••• ' + d.slice(-2);
}
