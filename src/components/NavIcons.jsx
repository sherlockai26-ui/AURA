// Iconos de navegación compartidos entre BottomTabBar (móvil) y SideNav (desktop).
// `active` define color cyan (activo) vs gris (inactivo).

function color(active) { return active ? '#00F5D4' : '#B0B0B0'; }

export function HomeIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" strokeLinejoin="round" />
    </svg>
  );
}

export function DestelloIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" strokeLinejoin="round"
        fill={active ? 'rgba(0,245,212,0.15)' : 'none'} />
    </svg>
  );
}

export function BellIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChatIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <path d="M4 5h16v11H8l-4 4V5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color(active)} strokeWidth="1.8">
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinejoin="round" />
    </svg>
  );
}

// Definición compartida de items de navegación (orden y rutas).
export const navItems = [
  { to: '/feed',          label: 'Inicio',         Icon: HomeIcon },
  { to: '/destello',      label: 'Destello',       Icon: DestelloIcon },
  { to: '/notifications', label: 'Notificaciones', Icon: BellIcon },
  { to: '/messages',      label: 'Mensajes',       Icon: ChatIcon },
  { to: '/profile',       label: 'Mi Nido',        Icon: ProfileIcon },
];
