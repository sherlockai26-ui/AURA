// Silueta abstracta para stories: gradiente determinista según `seed`.
export default function StoryItem({ handle, unseen, seed = 0, isCreate = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-1"
      style={{ width: 72 }}
    >
      <span
        className={`grid place-items-center rounded-full p-[2px] ${
          unseen && !isCreate
            ? 'bg-gradient-to-br from-aura-purple to-aura-cyan'
            : isCreate
            ? 'bg-aura-purple/70'
            : 'bg-white/10'
        }`}
        style={{ width: 64, height: 64 }}
      >
        <span
          className="grid h-full w-full place-items-center rounded-full bg-aura-bg overflow-hidden"
        >
          {isCreate ? (
            <span className="text-aura-purple text-2xl leading-none">+</span>
          ) : (
            <Silhouette seed={seed} />
          )}
        </span>
      </span>
      <span className="truncate text-[10px] text-aura-text-2" style={{ maxWidth: 72 }}>
        {handle}
      </span>
    </button>
  );
}

function Silhouette({ seed }) {
  const a = ['#9D4EDD', '#00F5D4', '#1F2833'];
  const c1 = a[seed % 3];
  const c2 = a[(seed + 1) % 3];
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <defs>
        <linearGradient id={`g${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="60" height="60" fill="#0B0C10" />
      <circle cx="30" cy="24" r="10" fill={`url(#g${seed})`} opacity="0.85" />
      <path d="M10 56 C 14 40, 46 40, 50 56 Z" fill={`url(#g${seed})`} opacity="0.7" />
    </svg>
  );
}
