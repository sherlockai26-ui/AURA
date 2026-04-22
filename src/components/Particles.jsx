// Partículas flotantes púrpura/cyan para fondo de pantallas previas a auth.
// Se pintan absolute pointer-events:none sobre el body.
const dots = [
  { left: 6,  delay: 0,   duration: 14, size: 6, color: 'purple' },
  { left: 18, delay: 2,   duration: 12, size: 4, color: 'cyan'   },
  { left: 28, delay: 4,   duration: 16, size: 5, color: 'purple' },
  { left: 42, delay: 1,   duration: 13, size: 3, color: 'cyan'   },
  { left: 55, delay: 5,   duration: 15, size: 6, color: 'purple' },
  { left: 68, delay: 3,   duration: 11, size: 3, color: 'cyan'   },
  { left: 80, delay: 6,   duration: 14, size: 5, color: 'purple' },
  { left: 92, delay: 2.5, duration: 12, size: 4, color: 'cyan'   },
];

export default function Particles({ className = '' }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 overflow-hidden z-0 ${className}`}
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-float blur-[0.5px]"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            background:
              d.color === 'purple'
                ? 'radial-gradient(circle, #9D4EDD, transparent 70%)'
                : 'radial-gradient(circle, #00F5D4, transparent 70%)',
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
