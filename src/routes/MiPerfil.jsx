import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiMe, apiGetPublicUserPosts, apiUploadAvatar, apiFetchFriends, apiGetSavedStories } from '../lib/api.js';
import PostCard from '../components/PostCard.jsx';

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

const TABS = ['Publicaciones', 'Fotos', 'Amigos', 'Guardadas'];

export default function MiPerfil() {
  const navigate    = useNavigate();
  const session     = useAuthStore((s) => s.session);
  const [tab,       setTab]       = useState('Publicaciones');
  const [me,        setMe]        = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [friends,   setFriends]   = useState([]);
  const [saved,     setSaved]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      try {
        const [meData, postData, friendData, savedData] = await Promise.allSettled([
          apiMe(),
          apiGetPublicUserPosts(session.id),
          apiFetchFriends(),
          apiGetSavedStories(),
        ]);
        if (cancelled) return;
        if (meData.status === 'fulfilled') setMe(meData.value);
        if (postData.status === 'fulfilled') setPosts((Array.isArray(postData.value) ? postData.value : []).map(normalizePost));
        if (friendData.status === 'fulfilled') setFriends(Array.isArray(friendData.value) ? friendData.value : []);
        if (savedData.status === 'fulfilled') setSaved(Array.isArray(savedData.value) ? savedData.value : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await apiUploadAvatar(file);
      setMe((m) => m ? { ...m, avatar_url: data.url } : m);
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm">Cargando perfil…</div>;

  const photos = posts.filter((p) => p.image_url);
  const avatar = me?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(me?.handle || 'U')}&background=1a1b1f&color=00F5D4&size=128`;

  return (
    <div className="pb-8 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-aura-bg/95 px-4 py-3 backdrop-blur-md border-b border-white/5">
        <span className="text-base font-bold tracking-[2px]">Perfil</span>
        <button onClick={() => navigate('/seguridad')} aria-label="Ajustes">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
          </svg>
        </button>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center gap-3 pt-6 pb-4 px-4">
        <label className="relative cursor-pointer group">
          <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-2 border-aura-cyan/40" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition text-xs text-white">Foto</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
        </label>
        <div className="text-center">
          <p className="font-bold text-lg">@{me?.handle}</p>
          {me?.display_name && me.display_name !== me.handle && (
            <p className="text-white/60 text-sm">{me.display_name}</p>
          )}
          {me?.bio && <p className="text-white/70 text-sm mt-1 max-w-xs mx-auto">{me.bio}</p>}
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="font-bold">{posts.length}</p><p className="text-white/40 text-xs">Posts</p></div>
          <div><p className="font-bold">{friends.length}</p><p className="text-white/40 text-xs">Amigos</p></div>
          <div><p className="font-bold">{me?.sparks ?? 0}</p><p className="text-white/40 text-xs">Chispas ⚡</p></div>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => navigate('/nido/editar')} className="flex-1 rounded-full border border-white/20 py-2 text-sm text-white/80 hover:border-aura-cyan/60 transition">Editar perfil</button>
          <button onClick={() => navigate('/confidentes')} className="flex-1 rounded-full border border-aura-purple/40 py-2 text-sm text-aura-purple hover:bg-aura-purple/10 transition">Confidentes</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition ${tab === t ? 'text-aura-cyan border-b-2 border-aura-cyan' : 'text-white/50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-2">
        {tab === 'Publicaciones' && (
          posts.length === 0
            ? <p className="text-center text-white/40 text-sm py-12">Sin publicaciones todavía.</p>
            : posts.map((p) => <PostCard key={p.id} post={p} onDelete={(id) => setPosts(prev => prev.filter(x => x.id !== id))} />)
        )}

        {tab === 'Fotos' && (
          photos.length === 0
            ? <p className="text-center text-white/40 text-sm py-12">Sin fotos todavía.</p>
            : <div className="grid grid-cols-3 gap-0.5 px-0">
                {photos.map((p) => (
                  <img key={p.id} src={p.image_url} alt="" className="aspect-square w-full object-cover" />
                ))}
              </div>
        )}

        {tab === 'Amigos' && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{friends.length} amigos</span>
              <div className="flex gap-2">
                <button onClick={() => navigate('/solicitudes')} className="text-xs text-aura-cyan hover:underline">Solicitudes</button>
                <button onClick={() => navigate('/amigos')} className="text-xs text-white/50 hover:underline">Ver todos</button>
              </div>
            </div>
            {friends.length === 0
              ? <p className="text-center text-white/40 text-sm py-8">Aún no tienes amigos en AURA.</p>
              : friends.slice(0, 6).map((f) => <FriendRow key={f.user_id} friend={f} navigate={navigate} />)
            }
          </div>
        )}

        {tab === 'Guardadas' && (
          <div className="px-4 py-2">
            <div className="flex justify-end mb-2">
              <button onClick={() => navigate('/guardadas')} className="text-xs text-white/50 hover:underline">Ver todas</button>
            </div>
            {saved.length === 0
              ? <p className="text-center text-white/40 text-sm py-8">Sin historias guardadas.</p>
              : <div className="grid grid-cols-3 gap-1">
                  {saved.slice(0, 9).map((s) => (
                    <div key={s.id} className="aspect-square rounded-lg overflow-hidden bg-aura-surface flex items-center justify-center">
                      {s.image_url
                        ? <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                        : <p className="text-[10px] text-white/60 text-center p-1 line-clamp-3">{s.content}</p>
                      }
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

function FriendRow({ friend, navigate }) {
  const av = friend.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.handle)}&background=1a1b1f&color=00F5D4&size=40`;
  return (
    <button onClick={() => navigate(`/profile/${friend.user_id}`)} className="flex items-center gap-3 w-full py-2 text-left hover:bg-white/5 rounded-lg px-1 transition">
      <img src={av} alt={friend.handle} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold">@{friend.handle}</p>
        {friend.display_name && friend.display_name !== friend.handle && (
          <p className="text-xs text-white/50">{friend.display_name}</p>
        )}
      </div>
    </button>
  );
}
