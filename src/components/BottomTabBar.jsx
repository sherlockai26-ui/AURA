import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/feed',          label: 'Inicio',         icon: HomeIcon },
  { to: '/destello',      label: 'Destello',       icon: DestelloIcon },
  { to: '/notifications', label: 'Notificaciones', icon: BellIcon },
  { to: '/messages',      label: 'Mensajes',       icon: ChatIcon },
  { to: '/profile',       label: 'Perfil',         icon: ProfileIcon },
];

export default function BottomTabBar() {
  return (
    <nav
      role="tablist"
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-[480px] border-t border-white/5 bg-aura-surface/90 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => (
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
                  <Icon active={isActive} />
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

/* --- Iconos en línea (evitan dependencia extra) ---------------------- */

function color(active) {
  return active ? '#00F5D4' : '#B0B0B0';
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" strokeLinejoin="round" />
    </svg>
  );
}
function DestelloIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" strokeLinejoin="round" fill={active ? 'rgba(0,245,212,0.15)' : 'none'} />
    </svg>
  );
}
function BellIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
function ChatIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M4 5h16v11H8l-4 4V5Z" strokeLinejoin="round" />
    </svg>
  );
}
function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinejoin="round" />
    </svg>
  );
}
