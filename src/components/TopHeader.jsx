import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { DuoAvatar, MemberAvatar } from '../routes/WhoIsHere.jsx';
import MenuDrawer from './MenuDrawer.jsx';

export default function TopHeader() {
  const sparks  = useAuthStore((s) => s.sparks);
  const session = useAuthStore((s) => s.session);
  const account = useAuthStore((s) => s.accounts[s.session?.email] || null);

  const [menuOpen, setMenuOpen] = useState(false);

  if (!account || !session) return null;

  const identity = session.identity;
  const member0  = account.members[0];
  const member1  = account.members[1];
  const isDuo    = account.mode === 'duo';

  const displayHandle =
    identity === 'duo'     ? `@${account.handle}`       :
    identity === 'member0' ? `@${member0?.handle ?? ''}` :
                             `@${member1?.handle ?? ''}`;

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/5 bg-aura-bg/95 px-4 py-2 backdrop-blur-md">
        {/* Logo solo en móvil (en desktop lo muestra SideNav) */}
        <span className="md:hidden text-[20px] font-bold tracking-[2px] text-white">AURA</span>

        {/* Identidad activa — visible en todos los tamaños cuando es Duo */}
        {isDuo && (
          <div className="flex items-center gap-1.5 min-w-0">
            {identity === 'duo'     && <DuoAvatar account={account} size={28} />}
            {identity === 'member0' && <MemberAvatar member={member0} size={28} />}
            {identity === 'member1' && <MemberAvatar member={member1} size={28} />}
            <span className="text-xs text-aura-text-2 truncate max-w-[100px] md:max-w-[160px]">
              {displayHandle}
            </span>
          </div>
        )}

        {/* Título de sección — solo desktop (evita que se sienta vacío) */}
        <h1 className="hidden md:block ml-2 text-sm font-semibold tracking-wider text-aura-text-2 uppercase">
          Vitrina
        </h1>

        <div className="flex items-center gap-3 ml-auto">
          <Link
            to="/profile"
            className="flex items-center gap-1 rounded-pill border border-aura-cyan/40 px-3 py-1 text-aura-cyan"
            aria-label={`${sparks} Chispas`}
          >
            <span>⚡</span>
            <span className="text-sm font-semibold">{sparks}</span>
          </Link>

          <Link to="/notifications" aria-label="Notificaciones" className="text-aura-cyan">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" strokeLinejoin="round" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </Link>

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="text-aura-cyan p-1 -mr-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7"  x2="20" y2="7"  />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </header>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
