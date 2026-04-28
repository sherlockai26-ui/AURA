import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiFetchFriends, createTeam2pa2, searchFemaleTeams, connectTeams, confirmPairs, getMyTeams } from '../lib/api.js';

const STEPS = ['Invitar amigo', 'Buscar equipo', 'Conectados', 'Parejas'];

export default function Team2pa2() {
  const navigate = useNavigate();
  const session  = useAuthStore(s => s.session);

  const [step,           setStep]           = useState(0);
  const [myTeam,         setMyTeam]         = useState(null);
  const [friends,        setFriends]        = useState([]);
  const [available,      setAvailable]      = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [myPick,         setMyPick]         = useState(null);
  const [done,           setDone]           = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [acting,         setActing]         = useState(false);
  const [error,          setError]          = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [teamsRes, friendsRes] = await Promise.allSettled([getMyTeams(), apiFetchFriends()]);
        if (friendsRes.status === 'fulfilled') setFriends(Array.isArray(friendsRes.value) ? friendsRes.value : []);
        if (teamsRes.status === 'fulfilled') {
          const active = teamsRes.value.find(t => t.status === 'open' || t.status === 'matched');
          if (active) {
            setMyTeam(active);
            if (active.status === 'open') {
              setStep(1);
              loadAvailable();
            } else if (active.status === 'matched') {
              setStep(2);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAvailable() {
    const data = await searchFemaleTeams().catch(() => []);
    setAvailable(Array.isArray(data) ? data : []);
  }

  async function handleCreateTeam() {
    if (!selectedFriend) return;
    setActing(true);
    setError('');
    try {
      const team = await createTeam2pa2(selectedFriend.user_id);
      setMyTeam(team);
      setStep(1);
      await loadAvailable();
    } catch (err) {
      setError(err.message || 'Error al crear el equipo.');
    } finally {
      setActing(false);
    }
  }

  async function handleConnect(otherId) {
    setActing(true);
    setError('');
    try {
      const result = await connectTeams(myTeam.id, otherId);
      setMyTeam(result.team);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al conectar equipos.');
    } finally {
      setActing(false);
    }
  }

  async function handleConfirm() {
    if (!myPick) return;
    const myId        = session.id;
    const teammateId  = myTeam.creator_id === myId ? myTeam.teammate_id : myTeam.creator_id;
    const connMembers = [
      { id: myTeam.conn_creator_id,  handle: myTeam.conn_creator_handle },
      { id: myTeam.conn_teammate_id, handle: myTeam.conn_teammate_handle },
    ];
    const otherPick = connMembers.find(m => m.id !== myPick);

    setActing(true);
    setError('');
    try {
      await confirmPairs(myTeam.id, [
        { maleUserId: myId,       femaleUserId: myPick },
        { maleUserId: teammateId, femaleUserId: otherPick.id },
      ]);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Error al confirmar parejas.');
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm">Cargando…</div>;
  }

  return (
    <div className="pb-8 text-white">
      {/* Header + progress */}
      <div className="sticky top-0 z-20 bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold tracking-[2px]">2PA2</span>
          <span className="text-xs text-white/40">{step + 1} / 4</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full">
          <div
            className="h-1 bg-aura-cyan rounded-full transition-all duration-300"
            style={{ width: `${(step + 1) * 25}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {STEPS.map((s, i) => (
            <span key={i} className={`text-[9px] ${i <= step ? 'text-aura-cyan' : 'text-white/30'}`}>{s}</span>
          ))}
        </div>
      </div>

      {error && <p className="mx-4 mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Step 0: Select friend */}
      {step === 0 && (
        <div className="px-4 pt-5">
          <p className="text-sm text-white/60 mb-4">Selecciona un amigo para formar tu equipo.</p>
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm mb-3">Sin amigos disponibles.</p>
              <button onClick={() => navigate('/amigos')} className="text-aura-cyan text-xs underline">
                Agregar amigos →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(f => {
                const av  = f.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.handle)}&background=1a1b1f&color=00F5D4&size=40`;
                const sel = selectedFriend?.user_id === f.user_id;
                return (
                  <button
                    key={f.user_id}
                    onClick={() => setSelectedFriend(f)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${sel ? 'border-aura-cyan bg-aura-cyan/10' : 'border-white/10 bg-aura-surface hover:border-white/30'}`}
                  >
                    <img src={av} alt={f.handle} className="w-10 h-10 rounded-full object-cover" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">@{f.handle}</p>
                      {f.display_name && f.display_name !== f.handle && (
                        <p className="text-xs text-white/50 truncate">{f.display_name}</p>
                      )}
                    </div>
                    {sel && <span className="text-aura-cyan text-lg flex-shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          {selectedFriend && (
            <button
              onClick={handleCreateTeam}
              disabled={acting}
              className="mt-4 w-full rounded-full bg-aura-cyan py-3 text-sm font-semibold text-aura-bg disabled:opacity-50"
            >
              {acting ? 'Creando equipo…' : `Equipo con @${selectedFriend.handle}`}
            </button>
          )}
        </div>
      )}

      {/* Step 1: Browse available teams */}
      {step === 1 && (
        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/60">Equipos disponibles</p>
            <button onClick={loadAvailable} className="text-xs text-aura-cyan">↻ Actualizar</button>
          </div>
          {myTeam && (
            <div className="mb-4 p-3 rounded-xl bg-aura-cyan/5 border border-aura-cyan/20 text-xs text-white/60">
              Tu equipo: <span className="text-white">@{myTeam.creator_handle}</span> + <span className="text-white">@{myTeam.teammate_handle}</span>
            </div>
          )}
          {available.length === 0 ? (
            <p className="text-center text-white/40 text-sm py-12">
              No hay equipos disponibles aún.
              <br />
              <span className="text-[11px]">Comparte AURA para encontrar más personas.</span>
            </p>
          ) : (
            <div className="space-y-3">
              {available.map(t => (
                <div key={t.id} className="border border-white/10 bg-aura-surface rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TeamMember handle={t.creator_handle} displayName={t.creator_display_name} avatar={t.creator_avatar} />
                    <span className="text-aura-purple text-xl mx-1">+</span>
                    <TeamMember handle={t.teammate_handle} displayName={t.teammate_display_name} avatar={t.teammate_avatar} />
                  </div>
                  <button
                    onClick={() => handleConnect(t.id)}
                    disabled={acting}
                    className="w-full rounded-full border border-aura-purple/60 py-2 text-sm text-aura-purple hover:bg-aura-purple/10 transition disabled:opacity-50"
                  >
                    {acting ? 'Conectando…' : 'Conectar equipos'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Chat + pair selection */}
      {step === 2 && !done && (
        <div className="px-4 pt-5">
          <div className="rounded-xl border border-aura-cyan/30 bg-aura-cyan/5 p-4 mb-4">
            <p className="text-sm font-semibold text-aura-cyan mb-1">¡Equipos conectados!</p>
            <p className="text-xs text-white/60">Conózcanse en el chat grupal, luego confirmen sus parejas.</p>
          </div>
          {myTeam?.conversation_id && (
            <button
              onClick={() => navigate('/messages')}
              className="w-full rounded-full bg-aura-cyan py-3 text-sm font-semibold text-aura-bg mb-4"
            >
              Ir al chat grupal →
            </button>
          )}

          {/* Pair selection */}
          {myTeam?.conn_creator_id && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-3">¿Cuál es tu pareja?</p>
              {[
                { id: myTeam.conn_creator_id,  handle: myTeam.conn_creator_handle,  displayName: myTeam.conn_creator_display_name,  avatar: myTeam.conn_creator_avatar },
                { id: myTeam.conn_teammate_id, handle: myTeam.conn_teammate_handle, displayName: myTeam.conn_teammate_display_name, avatar: myTeam.conn_teammate_avatar },
              ].map(m => {
                const av  = m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.handle || '?')}&background=1a1b1f&color=9D4EDD&size=40`;
                const sel = myPick === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMyPick(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition mb-2 ${sel ? 'border-aura-purple bg-aura-purple/10' : 'border-white/10 bg-aura-surface hover:border-white/30'}`}
                  >
                    <img src={av} alt={m.handle} className="w-10 h-10 rounded-full object-cover" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">@{m.handle}</p>
                      {m.displayName && m.displayName !== m.handle && (
                        <p className="text-xs text-white/50 truncate">{m.displayName}</p>
                      )}
                    </div>
                    {sel && <span className="text-aura-purple text-lg flex-shrink-0">♥</span>}
                  </button>
                );
              })}
              <button
                onClick={handleConfirm}
                disabled={!myPick || acting}
                className="mt-2 w-full rounded-full bg-aura-purple py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {acting ? 'Confirmando…' : 'Confirmar parejas'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Done */}
      {done && (
        <div className="px-4 pt-12 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-xl font-bold text-aura-cyan">¡Parejas formadas!</p>
          <p className="text-sm text-white/60 mt-2">Los matches han sido creados. ¡Mucha suerte!</p>
          <button
            onClick={() => navigate('/zona-match')}
            className="mt-6 w-full rounded-full bg-aura-cyan py-3 text-sm font-semibold text-aura-bg"
          >
            Ver mis matches →
          </button>
        </div>
      )}
    </div>
  );
}

function TeamMember({ handle, displayName, avatar }) {
  const av = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(handle || '?')}&background=1a1b1f&color=9D4EDD&size=40`;
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <img src={av} alt={handle} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">@{handle}</p>
        {displayName && displayName !== handle && (
          <p className="text-[10px] text-white/40 truncate">{displayName}</p>
        )}
      </div>
    </div>
  );
}
