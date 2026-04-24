import { useNavigate } from 'react-router-dom';

const items = [
  { to: '/destello',     label: 'Destello',     icon: '⚡' },
  { to: '/sintonia',     label: 'Sintonía',     icon: '🧭' },
  { to: '/album-privado', label: 'Álbum Priv.', icon: '🔒' },
];

export default function QuickAccessRow() {
  const navigate = useNavigate();
  return (
    <section
      aria-label="Accesos rápidos"
      className="mx-4 mt-3 grid grid-cols-3 gap-3 rounded-card bg-aura-surface p-3 lg:hidden"
    >
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => navigate(it.to)}
          className="flex flex-col items-center gap-1 rounded-card py-2 transition active:scale-95"
        >
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full border border-aura-purple/40 text-aura-purple"
            style={{ fontSize: 18 }}
          >
            {it.icon}
          </span>
          <span className="text-[12px] text-white">{it.label}</span>
        </button>
      ))}
    </section>
  );
}
