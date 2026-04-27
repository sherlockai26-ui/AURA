import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';

// Panel derecho desktop (≥lg). Accesos rápidos + resumen del Nido.
export default function RightPanel() {
  const sparks  = useAuthStore((s) => s.sparks);
  const session = useAuthStore((s) => s.session);
  const cachedAccount = useAuthStore((s) => s.accounts[s.session?.email] || null);

  if (!session) return null;

  const account = cachedAccount || {
    handle: session.handle,
    mode: session.mode || 'single',
    members: [{ handle: session.handle, name: session.handle }],
  };

  const isDuo = account.mode === 'duo';

  return (
    <aside className="hidden lg:flex fixed top-0 right-0 z-10 h-[100dvh] w-[300px] xl:w-[340px] flex-col gap-4 overflow-y-auto border-l border-white/5 bg-aura-bg/60 p-5 pt-20">
      {/* Saldo de Chispas */}
      <section className="rounded-card bg-aura-surface p-4">
        <p className="text-[11px] uppercase tracking-wider text-aura-text-2">Monedero</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-2xl font-bold text-aura-cyan">⚡ {sparks}</span>
          <Link
            to="/monedero"
            className="rounded-pill border border-aura-cyan/50 px-3 py-1 text-xs text-aura-cyan hover:shadow-glow-cyan transition"
          >
            Recargar
          </Link>
        </div>
        <p className="mt-2 text-[11px] text-aura-text-2">Tu Chispa diaria ya está incluida.</p>
      </section>

      {/* Accesos rápidos */}
      <section className="rounded-card bg-aura-surface p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-aura-text-2">Explorar</p>
        <div className="grid grid-cols-3 gap-2">
          <QuickLink to="/destello"   icon="⚡" label="Destello" />
          <QuickLink to="/sintonia"   icon="🧭" label="Sintonía" />
          <QuickLink to="/album-privado" icon="🔒" label="Álbum" />
        </div>
      </section>

      {/* Resumen del Nido */}
      <section className="rounded-card bg-aura-surface p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-aura-text-2">Mi Nido</p>
        <p className="text-sm font-semibold">@{account.handle}</p>
        <p className="text-[11px] text-aura-text-2">
          {isDuo ? `${account.members.length} integrantes · Duo` : 'Single'}
        </p>
        <Link to="/nido" className="mt-3 inline-block text-xs text-aura-cyan hover:underline">
          Ver perfil completo →
        </Link>
      </section>

      {/* Privacidad */}
      <section className="rounded-card border border-white/5 bg-aura-surface/50 p-4 text-[11px] text-aura-text-2">
        <p className="flex items-center gap-2">
          <span>🪟</span>
          <span className="font-semibold text-white">Privacidad en desarrollo</span>
        </p>
        <p className="mt-1 leading-relaxed">
          Watermark disuasorio activo en imágenes.
          Cifrado E2E y verificación de identidad próximamente.
        </p>
      </section>

      <footer className="mt-auto pt-4 text-[10px] text-aura-text-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#terms"    className="hover:underline">Términos</a>
          <a href="#privacy"  className="hover:underline">Privacidad</a>
          <a href="#help"     className="hover:underline">Ayuda</a>
          <a href="#contact"  className="hover:underline">Contacto</a>
        </div>
        <p className="mt-2">© 2026 AURA</p>
      </footer>
    </aside>
  );
}

function QuickLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 rounded-card border border-white/5 bg-aura-bg/40 p-2 transition hover:border-aura-purple hover:shadow-glow-purple"
    >
      <span className="text-lg text-aura-purple">{icon}</span>
      <span className="text-[11px] text-white">{label}</span>
    </Link>
  );
}
