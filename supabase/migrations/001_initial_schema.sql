-- Aruco initial schema

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (id = auth.uid());

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  max_members INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circles_insert" ON circles FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "circles_update_owner" ON circles FOR UPDATE
  USING (created_by = auth.uid());

CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (circle_id, user_id)
);

ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circle_members_select" ON circle_members FOR SELECT
  USING (
    circle_id IN (SELECT cm2.circle_id FROM circle_members cm2 WHERE cm2.user_id = auth.uid())
  );

CREATE POLICY "circle_members_insert" ON circle_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT cm2.circle_id FROM circle_members cm2
      WHERE cm2.user_id = auth.uid() AND cm2.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "users_select_same_circle" ON users FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT cm.user_id FROM circle_members cm
      WHERE cm.circle_id IN (
        SELECT cm2.circle_id FROM circle_members cm2 WHERE cm2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "circles_select_member" ON circles FOR SELECT
  USING (
    id IN (SELECT cm.circle_id FROM circle_members cm WHERE cm.user_id = auth.uid())
  );

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE circle_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  invite_code TEXT UNIQUE,
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_circle_invites_code ON circle_invites(invite_code)
  WHERE status = 'pending';

ALTER TABLE circle_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select" ON circle_invites FOR SELECT
  USING (true);

CREATE POLICY "invites_insert" ON circle_invites FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT cm.circle_id FROM circle_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "invites_update" ON circle_invites FOR UPDATE
  USING (true);

CREATE TYPE walk_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  note TEXT,
  status walk_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  photo_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "walks_own" ON walks FOR ALL
  USING (user_id = auth.uid());

CREATE TABLE walk_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (walk_id, circle_id)
);

ALTER TABLE walk_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "walk_shares_select" ON walk_shares FOR SELECT
  USING (
    circle_id IN (SELECT cm.circle_id FROM circle_members cm WHERE cm.user_id = auth.uid())
  );

CREATE POLICY "walk_shares_insert" ON walk_shares FOR INSERT
  WITH CHECK (
    walk_id IN (SELECT w.id FROM walks w WHERE w.user_id = auth.uid())
  );

CREATE POLICY "walks_select_shared" ON walks FOR SELECT
  USING (
    id IN (
      SELECT ws.walk_id FROM walk_shares ws
      JOIN circle_members cm ON ws.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE TABLE walk_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  storage_key TEXT NOT NULL,
  thumbnail_key TEXT,
  medium_key TEXT,
  width INT NOT NULL,
  height INT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  taken_at TIMESTAMPTZ NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE walk_photos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_walk_photos_walk_id ON walk_photos(walk_id);

CREATE POLICY "walk_photos_own" ON walk_photos FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "walk_photos_select_shared" ON walk_photos FOR SELECT
  USING (
    walk_id IN (
      SELECT ws.walk_id FROM walk_shares ws
      JOIN circle_members cm ON ws.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE TABLE photo_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (walk_id, user_id)
);

ALTER TABLE photo_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON photo_reactions FOR SELECT
  USING (
    walk_id IN (
      SELECT ws.walk_id FROM walk_shares ws
      JOIN circle_members cm ON ws.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "reactions_insert" ON photo_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_delete" ON photo_reactions FOR DELETE
  USING (user_id = auth.uid());

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, push_token)
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_own" ON devices FOR ALL
  USING (user_id = auth.uid());

CREATE TYPE notification_type AS ENUM (
  'new_walk', 'reaction', 'invite', 'invite_accepted'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (user_id = auth.uid());

CREATE VIEW walk_feed AS
SELECT
  w.id AS walk_id,
  w.user_id,
  u.display_name,
  u.avatar_url,
  w.title,
  w.note,
  w.started_at,
  w.ended_at,
  w.duration_seconds,
  w.photo_count,
  ws.circle_id,
  c.name AS circle_name,
  (
    SELECT COALESCE(json_agg(json_build_object(
      'id', p.id,
      'thumbnail_key', p.thumbnail_key,
      'width', p.width,
      'height', p.height
    ) ORDER BY p.sort_order), '[]'::json)
    FROM walk_photos p
    WHERE p.walk_id = w.id
    AND p.upload_status = 'completed'
  ) AS preview_photos,
  (
    SELECT COALESCE(json_agg(json_build_object(
      'emoji', r.emoji,
      'user_id', r.user_id,
      'display_name', ru.display_name
    )), '[]'::json)
    FROM photo_reactions r
    JOIN users ru ON r.user_id = ru.id
    WHERE r.walk_id = w.id
  ) AS reactions
FROM walks w
JOIN users u ON w.user_id = u.id
JOIN walk_shares ws ON w.id = ws.walk_id
JOIN circles c ON ws.circle_id = c.id
WHERE w.status = 'completed';

ALTER PUBLICATION supabase_realtime ADD TABLE walk_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE photo_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
