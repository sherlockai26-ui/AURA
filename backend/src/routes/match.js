const router    = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool      = require('../db');

router.use(requireAuth);

// GET /api/match/candidates — users not yet liked or passed
router.get('/candidates', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.handle, p.display_name, p.bio, p.avatar_url
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id != $1
        AND u.deleted_at IS NULL
        AND u.id NOT IN (SELECT to_user_id FROM user_likes  WHERE from_user_id = $1)
        AND u.id NOT IN (SELECT to_user_id FROM user_passes WHERE from_user_id = $1)
      ORDER BY RANDOM()
      LIMIT 20
    `, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('match candidates error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/match/like/:targetUserId
router.post('/like/:targetUserId', async (req, res) => {
  const userId   = req.user.id;
  const targetId = req.params.targetUserId;
  if (!targetId || targetId === userId) return res.status(400).json({ error: 'Target inválido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: targetRows } = await client.query(
      'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [targetId]
    );
    if (targetRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no disponible.' });
    }

    await client.query(`
      INSERT INTO user_likes (from_user_id, to_user_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userId, targetId]);

    const { rows: mutual } = await client.query(`
      SELECT 1 FROM user_likes WHERE from_user_id = $1 AND to_user_id = $2
    `, [targetId, userId]);

    let isMatch        = false;
    let conversationId = null;

    if (mutual.length > 0) {
      const [u1, u2] = [userId, targetId].sort();
      await client.query(`
        INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [u1, u2]);

      isMatch = true;

      const { rows: matchRows } = await client.query(
        'SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2 LIMIT 1',
        [u1, u2]
      );
      const matchId = matchRows[0]?.id;

      const { rows: existing } = await client.query(`
        SELECT cm1.conversation_id
        FROM conversation_members cm1
        JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
        WHERE cm1.user_id = $1 AND cm2.user_id = $2
        LIMIT 1
      `, [userId, targetId]);

      if (existing.length > 0) {
        conversationId = existing[0].conversation_id;
      } else {
        const { rows: newConv } = await client.query(
          'INSERT INTO conversations DEFAULT VALUES RETURNING id'
        );
        conversationId = newConv[0].id;
        await client.query(`
          INSERT INTO conversation_members (conversation_id, user_id)
          VALUES ($1, $2), ($1, $3)
        `, [conversationId, userId, targetId]);
      }

      if (matchId) {
        await client.query(`
          INSERT INTO notifications (user_id, type, reference_id, actor_user_id)
          SELECT $1, 'match', $3, $2
          WHERE NOT EXISTS (
            SELECT 1 FROM notifications WHERE user_id = $1 AND type = 'match' AND reference_id = $3
          )
        `, [userId, targetId, matchId]);
        await client.query(`
          INSERT INTO notifications (user_id, type, reference_id, actor_user_id)
          SELECT $1, 'match', $3, $2
          WHERE NOT EXISTS (
            SELECT 1 FROM notifications WHERE user_id = $1 AND type = 'match' AND reference_id = $3
          )
        `, [targetId, userId, matchId]);
      }
    }

    await client.query('COMMIT');
    res.json({ liked: true, isMatch, conversationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('match like error:', err);
    res.status(500).json({ error: 'Error interno.' });
  } finally {
    client.release();
  }
});

// POST /api/match/pass/:targetUserId
router.post('/pass/:targetUserId', async (req, res) => {
  const userId   = req.user.id;
  const targetId = req.params.targetUserId;
  if (!targetId || targetId === userId) return res.status(400).json({ error: 'Target inválido.' });

  try {
    const { rows: targetRows } = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [targetId]
    );
    if (targetRows.length === 0) return res.status(404).json({ error: 'Usuario no disponible.' });

    await pool.query(`
      INSERT INTO user_passes (from_user_id, to_user_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userId, targetId]);
    res.json({ passed: true });
  } catch (err) {
    console.error('match pass error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/match/matches
router.get('/matches', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT
        m.id         AS match_id,
        m.created_at,
        u.id         AS other_id,
        u.handle     AS other_handle,
        p.display_name AS other_name,
        p.avatar_url AS other_avatar,
        (
          SELECT cm1.conversation_id
          FROM conversation_members cm1
          JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
          WHERE cm1.user_id = $1 AND cm2.user_id = u.id
          LIMIT 1
        ) AS conversation_id
      FROM matches m
      JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
      JOIN profiles p ON p.user_id = u.id
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
        AND u.deleted_at IS NULL
      ORDER BY m.created_at DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('match list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
