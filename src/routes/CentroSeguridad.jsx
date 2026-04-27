import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card border border-white/10 bg-aura-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-aura-text-2 text-xl font-light">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/10">{children}</div>
      )}
    </div>
  );
}

export default function CentroSeguridad() {
  const navigate = useNavigate();
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg]       = useState('');
  const [blockMsg, setBlockMsg] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  function handlePwSubmit(e) {
    e.preventDefault();
    if (pwForm.next.length < 6) {
      setPwMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg('Las contraseñas no coinciden.');
      return;
    }
    setPwMsg('Contraseña actualizada correctamente ✓');
    setPwForm({ current: '', next: '', confirm: '' });
  }

  const inputCls = 'w-full rounded-xl bg-aura-bg border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-aura-text-2 focus:border-aura-cyan outline-none transition';

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-aura-text-2 hover:text-white text-xl"
        >
          ‹
        </button>
        <h1 className="text-xl font-semibold">Seguridad</h1>
      </div>

      <div className="flex flex-col gap-3">
        {/* Cambiar contraseña */}
        <Section icon="🔑" title="Cambiar contraseña">
          <p className="pt-3 text-sm text-aura-text-2">
            Próximamente: podrás cambiar tu contraseña desde aquí.
          </p>
        </Section>

        {/* Sesiones activas */}
        <Section icon="💻" title="Sesiones activas">
          <p className="pt-3 text-sm text-aura-text-2">
            Próximamente: aquí verás los dispositivos donde tu cuenta está abierta.
          </p>
        </Section>

        {/* 2FA */}
        <Section icon="🛡️" title="Autenticación en dos pasos (2FA)">
          <p className="pt-3 text-sm text-aura-text-2">
            Próximamente: añade una capa extra de seguridad a tu cuenta.
          </p>
        </Section>

        {/* Bloquear usuarios */}
        <Section icon="🚫" title="Bloquear usuarios">
          <div className="pt-3 flex flex-col gap-3">
            <p className="text-sm text-aura-text-2">
              Aquí puedes ver y gestionar los usuarios que has bloqueado.
            </p>
            <button
              type="button"
              onClick={() => setBlockMsg('No tienes usuarios bloqueados.')}
              className="rounded-full border border-white/20 py-2 text-sm text-aura-text-2 hover:border-white/40 transition"
            >
              Ver lista de bloqueados
            </button>
            {blockMsg && (
              <p className="text-xs text-aura-text-2 text-center">{blockMsg}</p>
            )}
          </div>
        </Section>

        {/* Reportar problema */}
        <Section icon="⚠️" title="Reportar un problema">
          <div className="pt-3 flex flex-col gap-3">
            <p className="text-sm text-aura-text-2">
              Si encuentras algún error o comportamiento inapropiado, repórtalo aquí.
            </p>
            <button
              type="button"
              onClick={() => setReportMsg('Gracias por tu reporte. Lo revisaremos pronto.')}
              className="rounded-full border border-aura-purple/60 py-2 text-sm text-aura-purple hover:bg-aura-purple/10 transition"
            >
              Enviar reporte
            </button>
            {reportMsg && (
              <p className="text-xs text-aura-cyan text-center">{reportMsg}</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
