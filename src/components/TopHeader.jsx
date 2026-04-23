import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { DuoAvatar, MemberAvatar } from '../routes/WhoIsHere.jsx';

export default function TopHeader() {
  const sparks   = useAuthStore((s) => s.sparks);
  const session  = useAuthStore((s) => s.session);
  const account  = useAuthStore((s) => s.accounts[s.session?.email] || null);

  if (!account || !session) return null;

  const identity = session.identity;
  const member0  = account.members[0];
  const member1  = account.members[1];
  const isDuo    = account.mode === 'duo';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-aura-bg/95 px-4 py-2 backdrop-blur-md border-b border-white/5">
      <span className="text-[20px] font-bold tracking-[2px] text-white">AURA</span>

      {/* Identidad activa */}
      {isDuo && (
        <div className="flex items-center gap-1.5 min-w-0">
          {identity === 'duo' && <DuoAvatar account={account} size={28} />}
          {identity === 'member0' && <MemberAvatar member={member0} size={28} />}
          {identity === 'member1' && <MemberAvatar member={member1} size={28} />}
          <span className="text-xs text-aura-text-2 truncate max-w-[80px]">
            {identity === 'duo'     ? `@${account.handle}` :
             identity === 'member0' ? `@${member0?.handle}` :
                                      `@${member1?.handle}`}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <Link
          to="/profile"
          className="flex items-center gap-1 rounded-pill border border-aura-cyan/40 px-3 py-1 text-aura-cyan"
          aria-label={`${sparks} Chispas`}
        >
          <span>⚡</span>
          <span className="text-sm font-semibold">{sparks}</span>
        </Link>
        <Link to="/notifications" aria-label="Notificaciones" className="text-aura-cyan">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" strokeLinejoin="round" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
