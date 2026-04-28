import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { MemberAvatar, DuoAvatar } from './WhoIsHere.jsx';
import { apiDeleteMe } from '../lib/api.js';

export default function Profile() {
  const navigate       = useNavigate();
  const session        = useAuthStore((s) => s.session);
  const storedAccount  = useAuthStore((s) => s.accounts[s.session?.email] || null);
  const sparks         = useAuthStore((s) => s.sparks);
  const logout         = useAuthStore((s) => s.logout);
  const updatePhoto    = useAuthStore((s) => s.updatePhoto);
  const leaveDuo       = useAuthStore((s) => s.leaveDuo);
  const invitePartner  = useAuthStore((s) => s.invitePartner);
  const acceptInvite   = useAuthStore((s) => s.acceptInvite);
  const voteDeletion   = useAuthStore((s) => s.voteDeletion);
  const cancelVote     = useAuthStore((s) => s.cancelDeletionVote);
  const generateOtp    = useAuthStore((s) => s.generateOtp);
  const verifyOtp      = useAuthStore((s) => s.verifyOtp);

  const [modal, setModal]       = useState(null); // 'leave'|'delete-single'|'delete-vote'|'invite'
  const [leaveStep, setLeaveStep] = useState('confirm'); // 'confirm'|'otp'
  const [leaveIdx,  setLeaveIdx]  = useState(null);
  const [leaveOtpVals, setLeaveOtpVals] = useState(Array(6).fill(''));
  const [leaveCode, setLeaveCode] = useState('');

  const [inviteName,  setInviteName]  = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteCode,  setInviteCode]  = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [voteOtpVals,   setVoteOtpVals]   = useState(Array(6).fill(''));
  const [voteCode,      setVoteCode]       = useState('');
  const [voteStep,      setVoteStep]       = useState('confirm');

  const [error, setError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!session) return null;

  const account = storedAccount || {
    email: session.email,
    handle: session.handle,
    mode: session.mode || 'single',
    members: [{ name: session.display_name || session.handle, handle: session.handle, isAdmin: true }],
    createdAt: Date.now(),
  };

  const email   = session.email;
  const isDuo   = account.mode === 'duo';
  const identity = session.identity;

  // Índice del miembro activo (si identity es member0/member1)
  const activeMemberIdx = identity === 'member0' ? 0 : identity === 'member1' ? 1 : null;
  const activeMember    = activeMemberIdx !== null ? account.members[activeMemberIdx] : null;
  const myHandle        = activeMember?.handle || account.handle;

  const hasVoted = account.deletionVotes?.includes(myHandle);

  function onLogout() { logout(); navigate('/login', { replace: true }); }

  // ── Foto ────────────────────────────────────────────────────────────
  function pickPhoto(target) {
    const input = document.createElement('input');
    input.type  = 'accept';
    input.type  = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => updatePhoto(email, target, ev.target.result);
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ── Salir del Duo ───────────────────────────────────────────────────
  function startLeave(idx) {
    setLeaveIdx(idx);
    setLeaveStep('confirm');
    setLeaveOtpVals(Array(6).fill(''));
    setError('');
    setModal('leave');
  }

  function sendLeaveOtp() {
    const key  = `leave:${email}:${leaveIdx}`;
    const code = generateOtp(key);
    setLeaveCode(code);
    setLeaveStep('otp');
  }

  function confirmLeave() {
    const code = leaveOtpVals.join('');
    const key  = `leave:${email}:${leaveIdx}`;
    if (!verifyOtp(key, code)) { setError('Código incorrecto.'); return; }
    leaveDuo(email, leaveIdx);
    logout();
    navigate('/login', { replace: true });
  }

  // ── Invitar nuevo integrante ─────────────────────────────────────────
  function sendInvite() {
    if (!inviteName.trim()) { setError('Escribe el nombre del nuevo integrante.'); return; }
    if (invitePhone.replace(/\D/g, '').length < 8) { setError('Teléfono inválido.'); return; }
    const code = invitePartner(email, { name: inviteName.trim(), phone: invitePhone.trim() });
    setInviteCode(code);
    setError('');
  }

  // ── Votar eliminar cuenta ────────────────────────────────────────────
  function startVote() {
    if (activeMemberIdx === null) { setError('Selecciona una identidad de miembro para votar.'); return; }
    const key  = `delete-vote:${email}:${myHandle}`;
    const code = generateOtp(key);
    setVoteCode(code);
    setVoteStep('otp');
    setVoteOtpVals(Array(6).fill(''));
    setError('');
    setModal('delete-vote');
  }

  function confirmVote() {
    const code = voteOtpVals.join('');
    const key  = `delete-vote:${email}:${myHandle}`;
    if (!verifyOtp(key, code)) { setError('Código incorrecto.'); return; }
    const result = voteDeletion(email, myHandle);
    if (result === 'deleted') {
      navigate('/login', { replace: true });
    } else {
      setModal(null);
    }
  }

  // ── Eliminar cuenta Single ───────────────────────────────────────────
  async function deleteSingle() {
    if (deleteConfirm !== 'ELIMINAR') { setError('Escribe ELIMINAR para confirmar.'); return; }
    setDeletingAccount(true);
    setError('');
    try {
      await apiDeleteMe();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la cuenta.');
      setDeletingAccount(false);
    }
  }

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <span className="text-lg font-bold tracking-[2px]">Mi Nido</span>
        <span className="text-xs text-aura-cyan font-semibold">{isDuo ? 'DUO' : 'SINGLE'}</span>
      </header>

      {/* ── Fotos de perfil ── */}
      <section className="mx-4 mt-4 rounded-card bg-aura-surface p-4">
        {isDuo ? (
          <div className="flex flex-col gap-4">
            {/* Foto del Duo */}
            <div className="flex items-center gap-3">
              <PhotoButton target="duo" photo={account.duoPhoto} onPick={pickPhoto}>
                <DuoAvatar account={account} size={64} />
              </PhotoButton>
              <div>
                <p className="font-semibold">@{account.handle}</p>
                <p className="text-xs text-aura-text-2">Perfil del Duo</p>
              </div>
            </div>
            {/* Fotos individuales */}
            <div className="border-t border-white/5 pt-3 flex gap-4">
              {account.members.map((m, i) => (
                <div key={m.handle} className="flex flex-col items-center gap-1">
                  <PhotoButton target={`member${i}`} photo={m.photo} onPick={pickPhoto}>
                    <MemberAvatar member={m} size={52} />
                  </PhotoButton>
                  <p className="text-xs text-aura-text-2">@{m.handle}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <PhotoButton target="member0" photo={account.members[0]?.photo} onPick={pickPhoto}>
              <MemberAvatar member={account.members[0]} size={64} />
            </PhotoButton>
            <div>
              <p className="font-semibold">{account.members[0]?.name}</p>
              <p className="text-xs text-aura-text-2">@{account.members[0]?.handle}</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Info de la cuenta ── */}
      <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4">
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <Stat label="Correo"  value={account.email} />
          <Stat label="Handle"  value={`@${account.handle}`} />
          <Stat label="Chispas" value={`${sparks} ⚡`} />
          <Stat label="Creado"  value={new Date(account.createdAt).toLocaleDateString()} />
        </dl>
      </section>

      {/* ── Integrantes (Duo) ── */}
      {isDuo && (
        <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4">
          <h3 className="mb-2 text-sm font-semibold tracking-wider">Integrantes del Duo</h3>
          <ul className="divide-y divide-white/5">
            {account.members.map((m, i) => (
              <li key={m.handle} className="flex items-center gap-3 py-3">
                <MemberAvatar member={m} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-aura-text-2">@{m.handle} · {maskPhone(m.phone)}</p>
                  {m.isAdmin && <span className="text-[10px] text-aura-cyan">Admin</span>}
                </div>
                {/* Solo el propio miembro puede salirse */}
                {activeMemberIdx === i && (
                  <button
                    onClick={() => startLeave(i)}
                    className="shrink-0 rounded-pill border border-aura-error/60 px-2 py-1 text-[11px] text-aura-error hover:bg-aura-error/10 transition"
                  >
                    Salir
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Invitar nuevo integrante si pendingPartner y soy admin */}
          {account.pendingPartner && activeMember?.isAdmin && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <p className="text-xs text-aura-text-2 mb-2">
                El Duo tiene un espacio libre. Invita a un nuevo integrante.
              </p>
              <button
                onClick={() => { setInviteName(''); setInvitePhone(''); setInviteCode(''); setError(''); setModal('invite'); }}
                className="w-full rounded-pill border border-aura-cyan/60 py-2 text-sm text-aura-cyan hover:shadow-glow-cyan transition"
              >
                + Invitar nuevo integrante
              </button>
            </div>
          )}

          {/* Estado de invitación pendiente */}
          {account.pendingInvite && (
            <div className="mt-3 rounded-card border border-aura-cyan/30 bg-aura-bg/50 p-3 text-xs text-aura-text-2">
              Invitación enviada a <span className="text-white">{account.pendingInvite.name}</span>{' '}
              ({maskPhone(account.pendingInvite.phone)}). El invitado debe iniciar sesión con este correo y su código.
            </div>
          )}
        </section>
      )}

      {/* ── Votación de eliminación (Duo) ── */}
      {isDuo && (
        <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4">
          <h3 className="mb-1 text-sm font-semibold tracking-wider text-aura-error">Eliminar cuenta Duo</h3>
          <p className="text-xs text-aura-text-2 mb-3">
            Requiere la confirmación (SMS) de <strong>ambos integrantes</strong>.{' '}
            Votos actuales: <span className="text-white">{account.deletionVotes?.length || 0}/{account.members.length}</span>
          </p>
          {activeMemberIdx !== null && (
            hasVoted ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-aura-error">Tu voto está registrado</span>
                <button
                  onClick={() => cancelVote(email, myHandle)}
                  className="text-xs text-aura-text-2 underline hover:text-white"
                >
                  Cancelar voto
                </button>
              </div>
            ) : (
              <button
                onClick={startVote}
                className="w-full rounded-pill border border-aura-error/70 py-2 text-sm text-aura-error hover:bg-aura-error/10 transition"
              >
                Votar para eliminar
              </button>
            )
          )}
          {identity === 'duo' && (
            <p className="text-xs text-aura-text-2 mt-2">Entra como un integrante específico para emitir tu voto.</p>
          )}
        </section>
      )}

      {/* ── Ajustes / Sesión ── */}
      <section className="mx-4 mt-3 rounded-card bg-aura-surface p-4">
        <h3 className="mb-2 text-sm font-semibold tracking-wider">Ajustes</h3>
        <div className="flex flex-col divide-y divide-white/5 mb-4">
          <Row to="/seguridad"      label="Seguridad"           hint="Contraseña, 2FA, sesiones"  />
          <Row to="/monedero"       label="Monedero · Chispas"  hint={`${sparks} ⚡ disponibles`} />
          <Row to="/notificaciones" label="Notificaciones"      hint="Centro de avisos"           />
          <Row to="/legal"          label="Legal"               hint="Términos y Privacidad"      />
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onLogout}
            className="w-full rounded-pill border border-white/15 py-3 text-sm font-semibold uppercase tracking-wider text-aura-text-2 transition hover:text-white"
          >
            Cerrar sesión
          </button>
          {!isDuo && (
            <button
              onClick={() => { setDeleteConfirm(''); setError(''); setModal('delete-single'); }}
              className="w-full rounded-pill border border-aura-error/80 py-3 text-sm font-semibold uppercase tracking-wider text-aura-error transition hover:bg-aura-error/10"
            >
              Eliminar cuenta
            </button>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          Modales
      ════════════════════════════════════════════════════════════ */}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">

          {/* ── Salir del Duo ── */}
          {modal === 'leave' && (
            <ModalCard onClose={() => setModal(null)}>
              <h3 className="text-lg font-semibold text-aura-error">Salir del Duo</h3>
              {leaveStep === 'confirm' && (
                <>
                  <p className="mt-2 text-sm text-aura-text-2">
                    Al salir, <strong className="text-white">todos tus datos</strong> serán eliminados del Duo.
                    El otro integrante quedará como administrador y podrá invitar a alguien nuevo.
                    Esta acción no se puede deshacer.
                  </p>
                  <button onClick={sendLeaveOtp} className="mt-4 w-full rounded-pill bg-aura-error py-3 text-sm font-semibold text-white">
                    Confirmar y enviar SMS
                  </button>
                </>
              )}
              {leaveStep === 'otp' && (
                <>
                  <p className="mt-2 text-sm text-aura-text-2">
                    Ingresa el código enviado a <span className="text-white">{maskPhone(account.members[leaveIdx]?.phone)}</span>
                  </p>
                  <div className="mt-3">
                    <OtpInput values={leaveOtpVals} onChange={setLeaveOtpVals} />
                  </div>
                  {leaveCode && (
                    <p className="mt-2 text-center text-xs text-aura-text-2">
                      Demo · código: <span className="font-mono text-aura-cyan">{leaveCode}</span>
                    </p>
                  )}
                  {error && <p className="mt-2 text-center text-xs text-aura-error">{error}</p>}
                  <button onClick={confirmLeave} className="mt-4 w-full rounded-pill bg-aura-error py-3 text-sm font-semibold text-white">
                    Salir definitivamente
                  </button>
                </>
              )}
            </ModalCard>
          )}

          {/* ── Invitar nuevo integrante ── */}
          {modal === 'invite' && (
            <ModalCard onClose={() => setModal(null)}>
              <h3 className="text-lg font-semibold text-aura-cyan">Invitar nuevo integrante</h3>
              <p className="mt-1 text-sm text-aura-text-2">El nuevo integrante iniciará sesión con el correo del Duo.</p>
              {!inviteCode ? (
                <>
                  <div className="mt-3 flex flex-col gap-2">
                    <input placeholder="Nombre" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                      className="w-full rounded-card bg-aura-bg px-3 py-3 text-sm text-white placeholder-aura-text-2 border border-white/10 outline-none focus:border-aura-purple" />
                    <input placeholder="Teléfono" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)}
                      type="tel" inputMode="tel"
                      className="w-full rounded-card bg-aura-bg px-3 py-3 text-sm text-white placeholder-aura-text-2 border border-white/10 outline-none focus:border-aura-purple" />
                  </div>
                  {error && <p className="mt-2 text-xs text-aura-error">{error}</p>}
                  <button onClick={sendInvite} className="mt-4 w-full rounded-pill bg-aura-cyan py-3 text-sm font-semibold text-aura-bg">
                    Enviar invitación
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-aura-text-2">
                    Comparte este código con <strong className="text-white">{inviteName}</strong>.
                    Debe iniciar sesión con el correo del Duo y elegir "Nuevo integrante invitado".
                  </p>
                  <div className="mt-3 rounded-card bg-aura-bg p-3 text-center">
                    <span className="font-mono text-2xl text-aura-cyan tracking-widest">{inviteCode}</span>
                  </div>
                  <button onClick={() => setModal(null)} className="mt-4 w-full rounded-pill border border-white/15 py-3 text-sm text-aura-text-2">
                    Cerrar
                  </button>
                </>
              )}
            </ModalCard>
          )}

          {/* ── Eliminar cuenta Single ── */}
          {modal === 'delete-single' && (
            <ModalCard onClose={() => setModal(null)}>
              <h3 className="text-lg font-semibold text-aura-error">Eliminar cuenta</h3>
              <p className="mt-2 text-sm text-aura-text-2">
                Acción <strong>irreversible</strong>. Se eliminará la cuenta <span className="text-white">@{account.handle}</span> y todos sus datos.
              </p>
              <label className="mt-3 block text-xs text-aura-text-2">
                Escribe <span className="font-mono text-aura-error">ELIMINAR</span> para confirmar:
              </label>
              <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} autoFocus
                className="mt-1 w-full rounded-card bg-aura-bg px-3 py-2 text-white outline-none border border-white/10 focus:border-aura-error" />
              {error && <p className="mt-2 text-xs text-aura-error">{error}</p>}
              <button onClick={deleteSingle} disabled={deleteConfirm !== 'ELIMINAR' || deletingAccount}
                className="mt-4 w-full rounded-pill bg-aura-error py-3 text-sm font-semibold text-white disabled:opacity-50">
                {deletingAccount ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </ModalCard>
          )}

          {/* ── Voto de eliminación Duo ── */}
          {modal === 'delete-vote' && (
            <ModalCard onClose={() => setModal(null)}>
              <h3 className="text-lg font-semibold text-aura-error">Votar eliminar Duo</h3>
              <p className="mt-2 text-sm text-aura-text-2">
                Confirma tu voto con el código enviado a{' '}
                <span className="text-white">{maskPhone(activeMember?.phone)}</span>.
                Se necesitan ambos votos para eliminar.
              </p>
              <div className="mt-3">
                <OtpInput values={voteOtpVals} onChange={setVoteOtpVals} />
              </div>
              {voteCode && (
                <p className="mt-2 text-center text-xs text-aura-text-2">
                  Demo · código: <span className="font-mono text-aura-cyan">{voteCode}</span>
                </p>
              )}
              {error && <p className="mt-2 text-center text-xs text-aura-error">{error}</p>}
              <button onClick={confirmVote} className="mt-4 w-full rounded-pill bg-aura-error py-3 text-sm font-semibold text-white">
                Emitir voto
              </button>
            </ModalCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Componentes de apoyo ─────────────────────────────────────────── */

function ModalCard({ children, onClose }) {
  return (
    <div className="w-full max-w-sm rounded-t-2xl sm:rounded-card border border-white/10 bg-aura-surface p-5 shadow-glow-purple">
      <div className="flex justify-end mb-1">
        <button onClick={onClose} className="text-aura-text-2 hover:text-white text-lg leading-none">✕</button>
      </div>
      {children}
    </div>
  );
}

function PhotoButton({ target, photo, onPick, children }) {
  return (
    <button
      onClick={() => onPick(target)}
      title="Cambiar foto"
      className="relative group shrink-0"
    >
      {children}
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition text-xs text-white">
        Foto
      </span>
    </button>
  );
}

function OtpInput({ values, onChange }) {
  const refs = useRef([]);
  return (
    <div className="flex justify-center gap-2">
      {values.map((v, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)}
          inputMode="numeric" maxLength={1} value={v}
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

function Stat({ label, value }) {
  return (
    <div className="rounded-card bg-aura-bg/50 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-aura-text-2">{label}</dt>
      <dd className="mt-1 truncate text-sm text-white">{value}</dd>
    </div>
  );
}

function Row({ label, hint, to }) {
  const content = (
    <>
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-[11px] text-aura-text-2">{hint}</p>
      </div>
      <span className="text-aura-text-2">›</span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center justify-between py-3 transition hover:text-aura-cyan"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 opacity-60">{content}</div>
  );
}

function maskPhone(p) {
  const d = String(p || '').replace(/\s+/g, '');
  return d.slice(0, 3) + ' ••• ' + d.slice(-2);
}
