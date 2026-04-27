import { NavLink, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import { navItems, matchNavItem } from './NavIcons.jsx';
import { useAuthStore } from '../lib/store.js';
import { DuoAvatar, MemberAvatar } from '../routes/WhoIsHere.jsx';

// Sidebar lateral para desktop (≥md). En móvil está oculto y se usa BottomTabBar.
export default function SideNav() {
  const navigate = useNavigate();
  const session  = useAuthStore((s) => s.session);
  const cachedAccount = useAuthStore((s) => s.accounts[s.session?.email] || null);
  const logout   = useAuthStore((s) => s.logout);

  if (!session) return null;

  const account = cachedAccount || {
    handle: session.handle,
    mode: session.mode || 'single',
    members: [{ handle: session.handle, name: session.handle }],
  };

  const isSingle = account.mode === 'single';
  const items    = isSingle
    ? navItems.map((item) => (item.to === '/destello' ? matchNavItem : item))
    : navItems;

  const identity = session.identity || 'member0';
  const activeMember = identity === 'member0' ? account.members[0]
                      : identity === 'member1' ? account.members[1]
                      : null;

  const viewerHandle = identity === 'duo'
    ? `@${account.handle}`
    : `@${activeMember?.handle ?? account.handle}`;

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className="hidden md:flex fixed top-0 left-0 z-30 h-[100dvh] w-[240px] lg:w-[260px] flex-col border-r border-white/5 bg-aura-bg/90 backdrop-blur"
    >
      {/* Logo */}
      <NavLink to="/feed" className="flex items-center gap-2 px-5 py-5 text-white">
        <BrandLogo size={34} />
        <span className="text-[22px] font-light tracking-[4px]">AURA</span>
      </NavLink>

      {/* Navegación */}
      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {items.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/feed'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-card px-3 py-3 text-sm transition ${
                    isActive
                      ? 'bg-aura-surface text-aura-cyan shadow-inset-purple/0'
                      : 'text-aura-text-2 hover:bg-aura-surface/60 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon active={isActive} size={20} />
                    <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tarjeta de identidad activa */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-card bg-aura-surface/60 p-3">
          {identity === 'duo'
            ? <DuoAvatar account={account} size={40} />
            : <MemberAvatar member={activeMember} size={40} />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{viewerHandle}</p>
            <p className="text-[11px] text-aura-text-2 truncate">
              {identity === 'duo' ? 'Perfil principal' : account.mode === 'duo' ? 'Subperfil' : 'Single'}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="shrink-0 text-aura-text-2 hover:text-aura-error p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 4h5v16h-5" />
              <path d="M10 8 6 12l4 4" />
              <path d="M6 12h12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
