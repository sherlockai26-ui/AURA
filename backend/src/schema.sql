-- AURA database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  handle        VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_active ON users (id) WHERE deleted_at IS NULL;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'users'::regclass
      AND c.contype = 'u'
    GROUP BY c.conname
    HAVING array_agg(a.attname::text ORDER BY a.attname::text) = ARRAY['email']
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;

  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'users'::regclass
      AND c.contype = 'u'
    GROUP BY c.conname
    HAVING array_agg(a.attname::text ORDER BY a.attname::text) = ARRAY['handle']
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_unique
  ON users (lower(email))
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_handle_active_unique
  ON users (lower(handle))
  WHERE deleted_at IS NULL;

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

-- Extend notifications type (idempotent — always includes all known types)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
      AND conrelid = 'notifications'::regclass
      AND pg_catalog.pg_get_constraintdef(oid) NOT LIKE '%friend_request%'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('match', 'message', 'video_like', 'video_comment', 'friend_request'));
  END IF;
END $$;

-- ── Friends & Confidants ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friendships (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);

CREATE TABLE IF NOT EXISTS confidants (
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confidant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, confidant_user_id)
);

-- ── Saved stories ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_stories (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- ── Story privacy ────────────────────────────────────────────────────────

ALTER TABLE stories ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'global'
  CHECK (privacy IN ('global', 'circle', 'confidants'));

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

-- ── Flash videos ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS videos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200),
    video_url     TEXT NOT NULL,
    thumbnail_url TEXT,
    duration      INTEGER,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_user_id    ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

CREATE TABLE IF NOT EXISTS video_likes (
    user_id    UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    video_id   UUID NOT NULL REFERENCES videos(id)  ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS video_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id   UUID NOT NULL REFERENCES videos(id)  ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);

ALTER TABLE videos ADD COLUMN IF NOT EXISTS privacy VARCHAR(10) DEFAULT 'public'
  CHECK (privacy IN ('public', 'exclude', 'private'));

CREATE TABLE IF NOT EXISTS video_exclusions (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    PRIMARY KEY (video_id, user_id)
);

CREATE TABLE IF NOT EXISTS video_comment_likes (
    user_id    UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES video_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
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

-- ── Teams 2pa2 ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams_2pa2 (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teammate_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connected_team_id UUID REFERENCES teams_2pa2(id) ON DELETE SET NULL,
    conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
    status            VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teams_2pa2_creator  ON teams_2pa2(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_teams_2pa2_teammate ON teams_2pa2(teammate_id, status);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams_2pa2(id) ON DELETE SET NULL;

ALTER TABLE friendships ADD COLUMN IF NOT EXISTS message VARCHAR(40);

-- Extend notifications type for team_invite
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
      AND conrelid = 'notifications'::regclass
      AND pg_catalog.pg_get_constraintdef(oid) NOT LIKE '%team_invite%'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('match', 'message', 'video_like', 'video_comment', 'friend_request', 'team_invite', 'connection_request'));
  END IF;
END $$;
