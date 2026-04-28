import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import {
  apiGetPublicUser,
  apiGetPublicUserPosts,
  apiGetPublicUserFriends,
  apiGetPublicUserPhotos,
  apiRequestConnection,
  apiAcceptFriendRequest,
  apiRemoveFriend,
} from '../lib/api.js';

function normalizePost(p) {
  return {
    id:        p.id,
    user_id:   p.user_id,
    handle:    p.handle || p.display_name || 'anon',
    caption:   p.content || '',
    image_url: p.image_url || null,
    sparks:    Number(p.likes_count || 0),
    comments:  Number(p.comments_count || 0),
    likedByMe: p.liked_by_me || false,
    timestamp: p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '',
    avatar_url: p.avatar_url || null,
  };
}

const TABS = ['Publicaciones', 'Fotos', 'Conexiones', 'Guardadas'];

export default function PublicProfile() {
  const { userId }  = useParams();
  const navigate    = useNavigate();

  const [profile,          setProfile]          = useState(null);
  const [posts,            setPosts]            = useState([]);
  const [photos,           setPhotos]           = useState([]);
  const [friends,          setFriends]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [tab,              setTab]              = useState('Publicaciones');
  const [friendBusy,       setFriendBusy]       = useState(false);
  const [showConnect,      setShowConnect]      = useState(false);
  const [connMsg,          setConnMsg]          = useState('');
  const [showAvatarModal,  setShowAvatarModal]  = useState(false);
  const [showDisconnect,   setShowDisconnect]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [profileData, postData, friendData, photoData] = await Promise.all([
          apiGetPublicUser(userId),
          apiGetPublicUserPosts(userId),
          apiGetPublicUserFriends(userId).catch(() => []),
          apiGetPublicUserPhotos(userId).catch(() => []),
        ]);
        if (cancelled) return;
        setProfile(profileData);
        setPosts((Array.isArray(postData) ? postData : []).map(normalizePost));
        setFriends(Array.isArray(friendData) ? friendData : []);
        setPhotos(Array.isArray(photoData) ? photoData : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudo cargar el perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  async function handleConnect() {
    setFriendBusy(true);
    try {
      await apiRequestConnection(userId, connMsg.trim());
      setProfile(p => ({ ...p, relationship: 'pending_sent' }));
      setShowConnect(false);
    } catch {}
    setFriendBusy(false);
  }

  async function handleAccept() {
    setFriendBusy(true);
    try {
      await apiAcceptFriendRequest(profile.friendship_request_id);
      setProfile(p => ({ ...p, relationship: 'friend' }));
    } catch {}
    setFriendBusy(false);
  }

  async function handleDisconnect() {
    setFriendBusy(true);
    try {
      await apiRemoveFriend(userId);
      setProfile(p => ({ ...p, relationship: 'none' }));
      setShowDisconnect(false);
    } catch {}
    setFriendBusy(false);
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-28 pt-4 text-white">
      <button onClick={() => navigate(-1)} className="text-lg text-white/50 hover:text-white mb-3">
        ← Volver
      </button>

      {loading && <p className="text-center text-white/40 py-10">Cargando perfil…</p>}
      {error && !loading && (
        <div className="text-center py-10">
          <p className="text-red-400 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-xs text-aura-cyan hover:underline">Reintentar</button>
        </div>
      )}

      {profile && !loading && (
        <>
          <div className="flex flex-col items-center mb-4">
            <ProfileAvatar
              profile={profile}
              onClick={profile.avatar_url ? () => setShowAvatarModal(true) : undefined}
            />
            <h1 className="text-2xl font-bold mt-2">{profile.display_name || profile.handle}</h1>
            <p className="text-white/50">@{profile.handle}</p>
            <span className="text-xs text-aura-cyan mt-1">{relationshipLabel(profile.relationship)}</span>
            {profile.bio && (
              <p className="text-sm text-white/60 mt-2 text-center">{profile.bio}</p>
            )}

            <div className="flex gap-2 mt-3 w-full max-w-xs">
              <FriendButton
                profile={profile}
                busy={friendBusy}
                onConnect={() => { setConnMsg(''); setShowConnect(true); }}
                onAccept={handleAccept}
                onDisconnect={() => setShowDisconnect(true)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-4">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition ${tab === t ? 'text-aura-cyan border-b-2 border-aura-cyan' : 'text-white/50'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Publicaciones' && (
            posts.length === 0
              ? <p className="text-center text-white/40 py-6">Sin publicaciones todavía.</p>
              : posts.map(p => <PostCard key={p.id} post={p} onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))} />)
          )}

          {tab === 'Fotos' && (
            photos.length === 0
              ? <p className="text-center text-white/40 py-6">Sin fotos todavía.</p>
              : <div className="grid grid-cols-3 gap-0.5">
                  {photos.map(p => (
                    <img
                      key={p.id}
                      src={p.image_url?.startsWith('http') || p.image_url?.startsWith('/') ? p.image_url : `/${p.image_url}`}
                      alt=""
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
          )}

          {tab === 'Conexiones' && (
            friends.length === 0
              ? <p className="text-center text-white/40 py-6">Aún no tiene conexiones públicas.</p>
              : friends.map(f => (
                  <button
                    key={f.id || f.user_id}
                    onClick={() => navigate(`/profile/${f.id || f.user_id}`)}
                    className="flex items-center gap-3 w-full py-2 text-left hover:bg-white/5 rounded-lg px-1 transition"
                  >
                    <FriendAvatar friend={f} />
                    <div>
                      <p className="text-sm font-semibold">@{f.handle}</p>
                      {f.display_name && f.display_name !== f.handle && (
                        <p className="text-xs text-white/50">{f.display_name}</p>
                      )}
                    </div>
                  </button>
                ))
          )}

          {tab === 'Guardadas' && (
            <p className="text-center text-white/40 py-6">Las historias guardadas son privadas.</p>
          )}
        </>
      )}

      {/* Modal: ver foto de perfil */}
      {showAvatarModal && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowAvatarModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold"
            onClick={() => setShowAvatarModal(false)}
          >
            ✕
          </button>
          <img
            src={profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('/') ? profile.avatar_url : `/${profile.avatar_url}`}
            alt={profile.handle}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal: confirmar desconexión */}
      {showDisconnect && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1F2833] p-5">
            <p className="font-semibold text-white mb-2">¿Deseas confirmar desconexión?</p>
            <p className="text-sm text-white/50 mb-5">
              Si aceptas, se eliminará la conexión y el match asociado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnect(false)}
                className="flex-1 rounded-full border py-2.5 text-sm text-white/70"
                style={{ borderColor: '#B0B0B0' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnect}
                disabled={friendBusy}
                className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#FF4D6D' }}
              >
                {friendBusy ? '…' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: enviar solicitud de conexión */}
      {showConnect && profile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1F2833] p-5">
            <p className="font-semibold text-white mb-1">Conectar con @{profile.handle}</p>
            <p className="text-xs text-white/50 mb-3">Cuéntale por qué quieres conectar.</p>
            <input
              autoFocus
              value={connMsg}
              onChange={e => setConnMsg(e.target.value.slice(0, 40))}
              placeholder="Un detalle, un cumplido…"
              maxLength={40}
              className="w-full rounded-lg bg-aura-bg border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-aura-cyan"
            />
            <p className="text-right text-[10px] text-white/30 mt-1">{connMsg.length}/40</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConnect(false)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm text-white/60"
              >
                Cancelar
              </button>
              <button
                disabled={connMsg.trim().length === 0 || friendBusy}
                onClick={handleConnect}
                className="flex-[2] rounded-full bg-aura-cyan py-2.5 text-sm font-semibold text-aura-bg disabled:opacity-40"
              >
                {friendBusy ? '…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileAvatar({ profile, onClick }) {
  const clickable = !!onClick;
  if (profile.avatar_url) {
    const src = profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('/')
      ? profile.avatar_url
      : `/${profile.avatar_url}`;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full overflow-hidden border-2 border-aura-cyan ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!clickable}
      >
        <img src={src} alt={profile.handle} className="w-24 h-24 object-cover" />
      </button>
    );
  }
  const initial = String(profile.handle || '?').charAt(0).toUpperCase();
  return (
    <div className="w-24 h-24 rounded-full bg-aura-surface border-2 border-aura-cyan flex items-center justify-center text-2xl text-aura-cyan font-bold">
      {initial}
    </div>
  );
}

function FriendAvatar({ friend }) {
  if (friend.avatar_url) {
    const src = friend.avatar_url.startsWith('http') || friend.avatar_url.startsWith('/')
      ? friend.avatar_url
      : `/${friend.avatar_url}`;
    return <img src={src} alt={friend.handle} className="w-10 h-10 rounded-full object-cover" />;
  }
  const initial = String(friend.handle || '?').charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-aura-surface flex items-center justify-center text-lg text-aura-cyan font-bold">
      {initial}
    </div>
  );
}

function FriendButton({ profile, busy, onConnect, onAccept, onDisconnect }) {
  const { relationship } = profile;
  if (relationship === 'self') return null;
  if (relationship === 'match') {
    return (
      <button className="w-full rounded-full bg-aura-cyan/20 py-2 text-sm text-aura-cyan font-semibold">
        Abrir mensajes
      </button>
    );
  }
  if (relationship === 'friend') {
    return (
      <button
        onClick={onDisconnect}
        className="w-full rounded-full border border-aura-cyan/30 py-2 text-sm text-aura-cyan/70 hover:border-red-500/50 hover:text-red-400 transition"
      >
        Conectados ✓
      </button>
    );
  }
  if (relationship === 'pending_sent') {
    return (
      <span className="w-full rounded-full border border-white/10 py-2 text-sm text-white/40 text-center block">
        Solicitud enviada
      </span>
    );
  }
  if (relationship === 'pending_received') {
    return (
      <button
        onClick={onAccept}
        disabled={busy}
        className="w-full rounded-full bg-aura-cyan py-2 text-sm text-aura-bg font-semibold disabled:opacity-50"
      >
        {busy ? '…' : 'Aceptar conexión'}
      </button>
    );
  }
  return (
    <button
      onClick={onConnect}
      className="w-full rounded-full bg-aura-cyan py-2 text-sm text-aura-bg font-semibold"
    >
      Conectar
    </button>
  );
}

function relationshipLabel(relationship) {
  if (relationship === 'self') return 'Tu perfil';
  if (relationship === 'match') return 'En tu círculo';
  if (relationship === 'friend') return 'Conexión';
  if (relationship === 'pending_sent') return 'Solicitud enviada';
  if (relationship === 'pending_received') return 'Quiere conectar contigo';
  return '';
}
