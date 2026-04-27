import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import { apiGetPublicUser, apiGetPublicUserPosts } from '../lib/api.js';

function normalizePost(p) {
  return {
    id:         p.id,
    user_id:    p.user_id,
    handle:     p.handle || p.display_name || 'anon',
    caption:    p.content || '',
    image_url:  p.image_url || null,
    sparks:     Number(p.likes_count || 0),
    comments:   Number(p.comments_count || 0),
    likedByMe:  p.liked_by_me || false,
    timestamp:  p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '',
    avatar_url: p.avatar_url || null,
  };
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [profileData, postData] = await Promise.all([
          apiGetPublicUser(userId),
          apiGetPublicUserPosts(userId),
        ]);
        if (cancelled) return;
        setProfile(profileData);
        setPosts((Array.isArray(postData) ? postData : []).map(normalizePost));
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudo cargar el perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="pb-6 text-white">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-aura-bg/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-lg text-aura-text-2 hover:text-white"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Perfil</h1>
      </header>

      {loading && <p className="py-12 text-center text-sm text-aura-text-2">Cargando perfil…</p>}

      {error && !loading && (
        <div className="mx-4 mt-8 rounded-card border border-aura-error/40 bg-aura-surface px-4 py-5 text-center">
          <p className="text-sm text-aura-error">{error}</p>
        </div>
      )}

      {profile && !loading && (
        <>
          <section className="mx-4 mt-4 rounded-card border border-white/10 bg-aura-surface p-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar profile={profile} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{profile.display_name || profile.handle}</p>
                <p className="text-sm text-aura-cyan">@{profile.handle}</p>
                <p className="mt-1 text-xs text-aura-text-2">
                  {relationshipLabel(profile.relationship)}
                </p>
              </div>
            </div>
            {profile.bio && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90">{profile.bio}</p>
            )}
            {profile.relationship === 'match' && (
              <Link
                to="/messages"
                className="mt-4 inline-flex rounded-pill border border-aura-cyan/60 px-4 py-2 text-xs font-semibold text-aura-cyan"
              >
                Abrir mensajes
              </Link>
            )}
          </section>

          <section className="mt-5">
            <h2 className="mb-3 px-4 text-sm font-semibold text-aura-text-2">Publicaciones</h2>
            {posts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-aura-text-2">
                Este perfil aún no tiene publicaciones.
              </p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ProfileAvatar({ profile }) {
  if (profile.avatar_url) {
    const src = profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('/')
      ? profile.avatar_url
      : `/${profile.avatar_url}`;
    return <img src={src} alt={profile.handle} className="h-20 w-20 rounded-full object-cover" />;
  }
  const initial = String(profile.handle || '?').charAt(0).toUpperCase();
  return (
    <span className="grid h-20 w-20 place-items-center rounded-full bg-aura-purple/25 text-2xl font-semibold text-aura-cyan">
      {initial}
    </span>
  );
}

function relationshipLabel(relationship) {
  if (relationship === 'self') return 'Tu perfil';
  if (relationship === 'match') return 'En tu círculo';
  return 'Explorar';
}
