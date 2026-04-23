// Logo triangular geométrico AURA (líneas púrpura + cyan, sin rellenos).
// `size` define el ancho/alto en px. `glow` activa drop-shadow neón.
export default function BrandLogo({ size = 96, glow = true, className = '' }) {
  return (
    <svg
      viewBox="0 0 200 180"
      width={size}
      height={size}
      role="img"
      aria-label="AURA"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 18px rgba(157,78,221,0.55))' } : undefined}
    >
      <defs>
        <linearGradient id="aura-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9D4EDD" />
          <stop offset="1" stopColor="#00F5D4" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#aura-stroke)"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <polygon points="100,15 185,165 15,165" />
        <polygon points="100,60 140,135 60,135" />
        <line x1="100" y1="15" x2="100" y2="135" />
        <line x1="15" y1="165" x2="140" y2="135" />
        <line x1="185" y1="165" x2="60" y2="135" />
        <line x1="60" y1="135" x2="140" y2="135" />
      </g>
    </svg>
  );
}
