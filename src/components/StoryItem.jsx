export default function StoryItem({ handle, unseen, imageUrl, avatarUrl, isCreate = false, onClick }) {
  const media = imageUrl || avatarUrl;
  const initial = String(handle || '?').replace('@', '').charAt(0).toUpperCase() || '?';

  return (
    <button
      type="button"
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
          ) : media ? (
            <img src={media} alt={handle} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-aura-cyan">{initial}</span>
          )}
        </span>
      </span>
      <span className="truncate text-[10px] text-aura-text-2" style={{ maxWidth: 72 }}>
        {handle}
      </span>
    </button>
  );
}
