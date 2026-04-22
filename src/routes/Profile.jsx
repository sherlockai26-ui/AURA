import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

export default function Profile() {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.accounts[s.session?.email] || null);
  const activeIndex = useAuthStore((s) => s.session?.activeMemberIndex ?? 0);
  const sparks = useAuthStore((s) => s.sparks);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const setActiveMember = useAuthStore((s) => s.setActiveMember);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!account) return null;

  const mode = account.mode;
  const isDuo = mode === 'duo';
  const activeMember = account.members[activeIndex];

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function onDelete() {
    deleteAccount();
    navigate('/login', { replace: true });
  }

  return (
    <div className="pb-4">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-aura-bg/95 px-4 py-3 backdrop-blur-md">
        <span className="text-[20px] font-bold tracking-[2px] text-white">Mi Nido</span>
        <span className="text-xs text-aura-text-2">
          Modo <span className="text-aura-cyan font-semibold">{isDuo ? 'Duo' : 'Single'}</span>
        </span>
      </header>

      <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4" aria-label="Identidad">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-aura-purple to-aura-cyan font-bold text-aura-bg">
            {initials(activeMember.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{activeMember.name}</p>
            <p className="truncate text-xs text-aura-text-2">@{activeMember.handle}</p>
          </div>
          <div className="flex items-center gap-1 rounded-pill border border-aura-cyan/40 px-3 py-1 text-aura-cyan">
            <span aria-hidden>⚡</span>
            <span className="text-sm font-semibold">{sparks}</span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <Stat label="Correo" value={account.email} />
          <Stat label="NickName" value={`@${account.handle}`} />
          <Stat label="Modo" value={isDuo ? 'Duo · Pareja' : 'Single · Individual'} />
          <Stat label="Creado" value={new Date(account.createdAt).toLocaleDateString()} />
        </dl>
      </section>

      {isDuo && (
        <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4" aria-label="Integrantes">
          <h3 className="mb-2 text-sm font-semibold tracking-wider">Integrantes</h3>
          <ul className="divide-y divide-white/5">
            {account.members.map((m, i) => (
              <li
                key={m.handle}
                className="flex items-center gap-3 py-2"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-aura-bg text-sm font-bold text-aura-cyan">
                  {initials(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.name}</p>
                  <p className="truncate text-[11px] text-aura-text-2">@{m.handle} · {maskPhone(m.phone)}</p>
                </div>
                <button
                  onClick={() => setActiveMember(i)}
                  disabled={i === activeIndex}
                  className={`rounded-pill border px-3 py-1 text-xs transition ${
                    i === activeIndex
                      ? 'border-aura-cyan/40 text-aura-cyan'
                      : 'border-white/15 text-aura-text-2 hover:text-white'
                  }`}
                >
                  {i === activeIndex ? 'Activo' : 'Cambiar'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4" aria-label="Ajustes">
        <h3 className="mb-2 text-sm font-semibold tracking-wider">Ajustes</h3>
        <div className="flex flex-col divide-y divide-white/5">
          <Row label="Seguridad" hint="Contraseña, 2FA, sesiones" disabled />
          <Row label="Monedero · Chispas" hint={`${sparks} ⚡ disponibles`} disabled />
          <Row label="Notificaciones" hint="Próximamente" disabled />
          <Row label="Legal" hint="Términos y Privacidad" disabled />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-pill border border-white/15 py-3 text-sm font-semibold uppercase tracking-wider text-aura-text-2 transition hover:text-white"
          >
            Cerrar sesión
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="w-full rounded-pill border border-aura-error/80 bg-transparent py-3 text-sm font-semibold uppercase tracking-wider text-aura-error transition hover:bg-aura-error/10"
          >
            Eliminar cuenta
          </button>
        </div>
      </section>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-title"
        >
          <div className="w-full max-w-sm rounded-card border border-aura-error/50 bg-aura-surface p-5 shadow-glow-purple">
            <h3 id="del-title" className="text-lg font-semibold text-aura-error">
              Eliminar cuenta
            </h3>
            <p className="mt-2 text-sm text-aura-text-2">
              Esta acción es <strong>irreversible</strong>. Se borrará el Nido{' '}
              <span className="text-white">@{account.handle}</span>
              {isDuo ? ` y los ${account.members.length} subperfiles.` : ' y tu perfil.'}
              {' '}En producción pediremos verificación SMS adicional.
            </p>
            <label className="mt-3 block text-xs text-aura-text-2">
              Escribe <span className="font-mono text-aura-error">ELIMINAR</span> para confirmar:
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 w-full rounded-card bg-aura-bg px-3 py-2 text-white outline-none border border-white/10 focus:border-aura-error"
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setConfirmOpen(false); setConfirmText(''); }}
                className="flex-1 rounded-pill border border-white/15 py-2 text-sm text-aura-text-2"
              >
                Cancelar
              </button>
              <button
                onClick={onDelete}
                disabled={confirmText !== 'ELIMINAR'}
                className="flex-1 rounded-pill bg-aura-error py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-card bg-aura-bg/50 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-aura-text-2">{label}</dt>
      <dd className="mt-1 truncate text-sm text-white">{value}</dd>
    </div>
  );
}

function Row({ label, hint, disabled }) {
  return (
    <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-[11px] text-aura-text-2">{hint}</p>
      </div>
      <span className="text-aura-text-2">›</span>
    </div>
  );
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}
function maskPhone(p) {
  if (!p) return '—';
  const d = String(p).replace(/\s+/g, '');
  return d.slice(0, 3) + ' ••• ' + d.slice(-2);
}
