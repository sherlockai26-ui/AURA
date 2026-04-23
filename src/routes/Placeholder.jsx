export default function Placeholder({ title, subtitle, icon = '◌' }) {
  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="grid place-items-center rounded-full border border-aura-purple/60 text-aura-purple"
        style={{ width: 80, height: 80, fontSize: 32 }}
      >
        {icon}
      </div>
      <h2 className="text-xl font-semibold tracking-wide">{title}</h2>
      <p className="text-sm text-aura-text-2 max-w-xs">{subtitle}</p>
    </div>
  );
}
