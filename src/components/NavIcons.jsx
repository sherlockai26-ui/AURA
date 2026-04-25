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

export function CitaDobleIcon({ active, size = 22 }) {
  const c = color(active);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* 4 puntos conectados en diamante */}
      <circle cx="12" cy="4"  r="2" fill={c} />
      <circle cx="4"  cy="12" r="2" fill={c} />
      <circle cx="20" cy="12" r="2" fill={c} />
      <circle cx="12" cy="20" r="2" fill={c} />
      <line x1="12" y1="6"  x2="6"  y2="11" stroke={c} strokeWidth="1.5" />
      <line x1="12" y1="6"  x2="18" y2="11" stroke={c} strokeWidth="1.5" />
      <line x1="6"  y1="13" x2="12" y2="18" stroke={c} strokeWidth="1.5" />
      <line x1="18" y1="13" x2="12" y2="18" stroke={c} strokeWidth="1.5" />
      {active && <line x1="6" y1="12" x2="18" y2="12" stroke={c} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />}
    </svg>
  );
}

export function MatchIcon({ active, size = 22 }) {
  const c = color(active);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      {/* Anillo partido: dos arcos que se acercan desde los lados */}
      <path d="M5 12a7 7 0 0 0 6 6.93" />
      <path d="M5 12a7 7 0 0 1 6-6.93" />
      <path d="M19 12a7 7 0 0 1-6 6.93" />
      <path d="M19 12a7 7 0 0 0-6-6.93" />
      {active && <circle cx="12" cy="12" r="1.5" fill={c} stroke="none" />}
    </svg>
  );
}

// Items de navegación base — Cita Doble ocupa el centro (ambos modos).
export const navItems = [
  { to: '/feed',        label: 'Inicio',      Icon: HomeIcon },
  { to: '/destello',    label: 'Destello',    Icon: DestelloIcon },
  { to: '/cita-doble',  label: 'Cita Doble',  Icon: CitaDobleIcon },
  { to: '/messages',    label: 'Mensajes',    Icon: ChatIcon },
  { to: '/profile',     label: 'Mi Nido',     Icon: ProfileIcon },
];

// Item de Zona de Match para usuarios Single (reemplaza Destello).
export const matchNavItem = { to: '/zona-match', label: 'Match', Icon: MatchIcon };
