import { useState } from 'react';
import StoryItem from './StoryItem.jsx';
import { storiesCircle, storiesExplore } from '../lib/data.js';

export default function StoriesRow() {
  const [tab, setTab] = useState('circle');
  const list = tab === 'circle' ? storiesCircle : storiesExplore;

  return (
    <section aria-label="Historias" className="mt-4">
      <div className="flex items-center gap-6 px-4">
        <TabBtn active={tab === 'circle'} onClick={() => setTab('circle')}>
          Tu Círculo
        </TabBtn>
        <TabBtn active={tab === 'explore'} onClick={() => setTab('explore')}>
          Explorar
        </TabBtn>
      </div>

      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
        <StoryItem
          handle="Crear"
          isCreate
          onClick={() => alert('Crear historia (próximamente)')}
        />
        {list.map((s) => (
          <StoryItem key={s.id} handle={s.handle} unseen={s.unseen} seed={s.seed} />
        ))}
      </div>
    </section>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative py-1 text-sm transition ${
        active ? 'text-white font-semibold' : 'text-aura-text-2'
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-aura-cyan shadow-glow-cyan" />
      )}
    </button>
  );
}
