import { NavLink } from 'react-router-dom';
import { navItems } from './NavIcons.jsx';

// Tab bar fija inferior — solo móvil (<md). En desktop usamos SideNav.
export default function BottomTabBar() {
  return (
    <nav
      role="tablist"
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 mx-auto max-w-[480px] border-t border-white/5 bg-aura-surface/90 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {navItems.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 text-[10px] transition ${
                  isActive ? 'text-aura-cyan' : 'text-aura-text-2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} size={22} />
                  <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
