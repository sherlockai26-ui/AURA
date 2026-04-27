-- AURA database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  handle        VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio          TEXT DEFAULT '',
  avatar_url   VARCHAR(500),
  mode         VARCHAR(10) DEFAULT 'single',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT,
  image_url  VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT DEFAULT '',
  image_url  VARCHAR(500),
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  CHECK (visibility IN ('public', 'circle'))
);

CREATE INDEX IF NOT EXISTS idx_stories_active ON stories (expires_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('match', 'message')),
  reference_id  UUID,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  read          BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS sparks_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 50 NOT NULL CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS sparks_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id),
  to_user_id   UUID REFERENCES users(id),
  amount       INTEGER NOT NULL,
  reason       VARCHAR(255),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Match system ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_likes (
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS user_passes (
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user1_id, user2_id)
);

-- ── Reward tasks ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reward_tasks (
  key         VARCHAR(50) PRIMARY KEY,
  title       VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  reward      INTEGER NOT NULL,
  auto_check  BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_task_claims (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  task_key   VARCHAR(50) REFERENCES reward_tasks(key),
  status     VARCHAR(20) DEFAULT 'done',
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, task_key)
);

INSERT INTO reward_tasks (key, title, description, reward, auto_check) VALUES
  ('complete_profile', 'Completa tu perfil',    'Agrega nombre y bio a tu nido',             100, true),
  ('upload_avatar',    'Sube tu foto',           'Agrega una foto de perfil',                  50, true),
  ('first_post',       'Primer post',            'Crea tu primera publicación',                50, true),
  ('first_like',       'Primer like',            'Dale me gusta a una publicación',            30, true),
  ('first_match',      'Primer match',           'Logra tu primer match en Zona de Match',    100, true),
  ('first_message',    'Primer mensaje',         'Envía tu primer mensaje en el chat',         50, true),
  ('invite_friend',    'Invita a un amigo',      'Comparte tu código de referido con alguien',200, false),
  ('share_aura',       'Comparte AURA',          'Comparte AURA en redes sociales',           100, false)
ON CONFLICT DO NOTHING;
