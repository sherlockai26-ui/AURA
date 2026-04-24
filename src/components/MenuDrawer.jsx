import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { DuoAvatar, MemberAvatar } from '../routes/WhoIsHere.jsx';

/**
 * Menú lateral (hamburguesa) con switcher de identidad.
 *
 * - Cambiar a @memberN → requiere OTP SMS (evita suplantación).
 * - Cambiar al perfil principal del Duo → directo, sin OTP (ya hay sesión).
 * - En modo Single no muestra el switcher de identidad.
 */
export default function MenuDrawer({ open, onClose }) {
  const navigate         = useNavigate();
  const session          = useAuthStore((s) => s.session);
  const account          = useAuthStore((s) => s.accounts[s.session?.email] || null);
  const finalizeIdentity = useAuthStore((s) => s.finalizeIdentity);
  const generateOtp      = useAuthStore((s) => s.generateOtp);
  const verifyOtp        = useAuthStore((s) => s.verifyOtp);
  const logout           = useAuthStore((s) => s.logout);

  const [stage,     setStage]     = useState('menu');          // 'menu' | 'otp'
  const [targetIdx, setTargetIdx] = useState(null);            // 0 | 1
  const [otpVals,   setOtpVals]   = useState(Array(6).fill(''));
  const [demoCode,  setDemoCode]  = useState('');
  const [error,     setError]     = useState('');

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setStage('menu');
      setTargetIdx(null);
      setOtpVals(Array(6).fill(''));
      setDemoCode('');
      setError('');
    }
  }, [open]);

  // ESC cierra
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!session || !account) return null;

  const identity = session.identity;
  const isDuo    = account.mode === 'duo';

  // ── Acciones ───────────────────────────────────────────────────────
  function switchToDuo() {
    if (identity === 'duo') { onClose(); return; }
    finalizeIdentity(session.email, 'duo');
    onClose();
  }

  function startMemberSwitch(idx) {
    const target = idx === 0 ? 'member0' : 'member1';
    if (target === identity) { onClose(); return; }
    const key  = `switch:${session.email}:${idx}`;
    const code = generateOtp(key);
    setDemoCode(code);
    setTargetIdx(idx);
    setOtpVals(Array(6).fill(''));
    setError('');
    setStage('otp');
  }

  function confirmSwitch() {
    const code = otpVals.join('');
    const key  = `switch:${session.email}:${targetIdx}`;
    if (!verifyOtp(key, code)) { setError('Código incorrecto. Revísalo.'); return; }
    const target = targetIdx === 0 ? 'member0' : 'member1';
    finalizeIdentity(session.email, target);
    onClose();
  }

  function onLogout() {
    logout();
    onClose();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className={`fixed top-0 right-0 z-50 h-[100dvh] w-[85vw] max-w-[360px] border-l border-white/10 bg-aura-surface shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-[2px]">Menú</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-aura-text-2 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </header>

        <div className="h-[calc(100dvh-52px)] overflow-y-auto p-4">
          {stage === 'menu' && (
            <div className="flex flex-col gap-5">

              {/* Identidad activa */}
              <section className="rounded-card bg-aura-bg/50 border border-white/10 p-3 flex items-center gap-3">
                {identity === 'duo'
                  ? <DuoAvatar account={account} size={40} />
                  : <MemberAvatar member={account.members[identity === 'member0' ? 0 : 1]} size={40} />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-aura-text-2">Sesión activa</p>
                  <p className="text-sm font-semibold truncate">
                    {identity === 'duo'
                      ? `@${account.handle} (Duo)`
                      : `@${account.members[identity === 'member0' ? 0 : 1]?.handle}`}
                  </p>
                </div>
              </section>

              {/* Cambiar perfil (solo Duo) */}
              {isDuo && (
                <section>
                  <h4 className="mb-2 text-xs uppercase tracking-[2px] text-aura-text-2">
                    Cambiar perfil
                  </h4>
                  <div className="flex flex-col gap-2">
                    {account.members.map((m, idx) => {
                      const target = idx === 0 ? 'member0' : 'member1';
                      const active = target === identity;
                      return (
                        <button
                          key={m.handle}
                          onClick={() => startMemberSwitch(idx)}
                          className={`flex items-center gap-3 rounded-card border p-3 text-left transition ${
                            active
                              ? 'border-aura-cyan/60 bg-aura-bg/60'
                              : 'border-white/10 hover:border-aura-purple hover:shadow-glow-purple'
                          }`}
                        >
                          <MemberAvatar member={m} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{m.name}</p>
                            <p className="text-xs text-aura-cyan truncate">@{m.handle}</p>
                          </div>
                          <span className="text-[11px] text-aura-text-2">
                            {active ? 'Activo' : 'SMS →'}
                          </span>
                        </button>
                      );
                    })}

                    {/* Perfil principal / Duo */}
                    <button
                      onClick={switchToDuo}
                      className={`flex items-center gap-3 rounded-card border p-3 text-left transition ${
                        identity === 'duo'
                          ? 'border-aura-cyan/60 bg-aura-bg/60'
                          : 'border-aura-purple/50 hover:shadow-glow-purple'
                      }`}
                    >
                      <DuoAvatar account={account} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">Perfil principal</p>
                        <p className="text-xs text-aura-purple truncate">@{account.handle} · Duo</p>
                      </div>
                      <span className="text-[11px] text-aura-text-2">
                        {identity === 'duo' ? 'Activo' : 'Sin SMS'}
                      </span>
                    </button>
                  </div>
                </section>
              )}

              {/* Navegación */}
              <section>
                <h4 className="mb-2 text-xs uppercase tracking-[2px] text-aura-text-2">Navegar</h4>
                <nav className="flex flex-col">
                  <MenuRow to="/profile"        onClose={onClose} icon="△">Mi Nido</MenuRow>
                  <MenuRow to="/feed"           onClose={onClose} icon="❖">Vitrina</MenuRow>
                  <MenuRow to="/messages"       onClose={onClose} icon="💬">Mensajes</MenuRow>
                  <MenuRow to="/notifications"  onClose={onClose} icon="🔔">Notificaciones</MenuRow>
                  <MenuRow to="/destello"       onClose={onClose} icon="⚡">Destello</MenuRow>
                </nav>
              </section>

              {/* Sesión */}
              <section className="pt-3 border-t border-white/10">
                <button
                  onClick={onLogout}
                  className="w-full rounded-pill border border-white/15 py-3 text-sm font-semibold uppercase tracking-wider text-aura-text-2 transition hover:text-white"
                >
                  Cerrar sesión
                </button>
              </section>
            </div>
          )}

          {stage === 'otp' && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="text-center">
                <MemberAvatar member={account.members[targetIdx]} size={64} />
                <h4 className="mt-3 text-base font-semibold">Confirma tu identidad</h4>
                <p className="mt-1 text-xs text-aura-text-2">
                  Enviamos un código SMS a{' '}
                  <span className="text-white">@{account.members[targetIdx]?.handle}</span>
                </p>
                <p className="text-[11px] text-aura-text-2">
                  {maskPhone(account.members[targetIdx]?.phone)}
                </p>
              </div>

              <OtpInput values={otpVals} onChange={setOtpVals} />

              {demoCode && (
                <div className="rounded-card border border-white/10 bg-aura-bg/50 p-2 text-center text-xs">
                  <span className="text-aura-text-2">Demo · código: </span>
                  <span className="font-mono text-aura-cyan">{demoCode}</span>
                </div>
              )}

              {error && <p className="text-center text-xs text-aura-error">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStage('menu')}
                  className="flex-1 rounded-pill border border-white/15 py-3 text-sm font-semibold text-aura-text-2"
                >
                  Atrás
                </button>
                <button
                  onClick={confirmSwitch}
                  className="flex-[2] rounded-pill bg-aura-cyan py-3 text-sm font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan"
                >
                  Verificar y entrar
                </button>
              </div>

              <p className="text-center text-[11px] text-aura-text-2">
                El código se envía al teléfono del perfil para evitar que alguien
                suplante al otro integrante.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ── Sub-componentes ──────────────────────────────────────────────── */

function MenuRow({ to, onClose, icon, children }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 rounded-card px-2 py-3 text-sm text-white hover:bg-aura-bg/50 transition"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-aura-bg/60 text-aura-cyan">{icon}</span>
      <span className="flex-1">{children}</span>
      <span className="text-aura-text-2">›</span>
    </Link>
  );
}

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
            const next = [...values]; next[i] = ch; onChange(next);
            if (ch && i < values.length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus(); }}
          className="h-12 w-10 rounded-card bg-aura-bg text-center text-lg text-white outline-none border border-white/10 focus:border-aura-purple focus:shadow-glow-purple"
        />
      ))}
    </div>
  );
}

function maskPhone(p) {
  const d = String(p || '').replace(/\s+/g, '');
  return d.slice(0, 3) + ' ••• ' + d.slice(-2);
}
