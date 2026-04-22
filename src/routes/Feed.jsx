import { useCallback, useEffect, useRef, useState } from 'react';
import TopHeader from '../components/TopHeader.jsx';
import StatusBox from '../components/StatusBox.jsx';
import QuickAccessRow from '../components/QuickAccessRow.jsx';
import StoriesRow from '../components/StoriesRow.jsx';
import PostCard from '../components/PostCard.jsx';
import { getInitialPosts, getMorePosts } from '../lib/data.js';

const PAGE = 4;

export default function Feed() {
  const [posts, setPosts] = useState(() => getInitialPosts(6));
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    // Simula red. En real: fetch paginado con cursor.
    setTimeout(() => {
      setPosts((prev) => [...prev, ...getMorePosts(prev.length, PAGE)]);
      setLoading(false);
    }, 450);
  }, [loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '600px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  function openComposer() {
    alert('Composer del feed (próximo entregable)');
  }

  return (
    <div>
      <TopHeader />
      <StatusBox onOpenComposer={openComposer} />
      <QuickAccessRow />
      <StoriesRow />

      <div className="mt-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}

        <div ref={sentinelRef} className="py-6 text-center text-xs text-aura-text-2">
          {loading ? 'Cargando más…' : '· · ·'}
        </div>
      </div>
    </div>
  );
}
