const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

// GET /api/users/search?q=  — ANTES de /:id para evitar colisión de rutas
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 1) return res.json([]);
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.handle, p.display_name, p.avatar_url, p.bio
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id != $1
         AND u.deleted_at IS NULL
         AND (u.handle ILIKE '%' || $2 || '%' OR p.display_name ILIKE '%' || $2 || '%')
       ORDER BY u.handle
       LIMIT 20`,
      [req.user.id, q]
    );
    res.json(rows);
  } catch (err) {
    console.error('user search error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.handle, u.created_at,
              p.display_name, p.bio, p.avatar_url, p.mode,
              CASE
                WHEN u.id = $1 THEN 'self'
                WHEN EXISTS (SELECT 1 FROM matches m
                  WHERE (m.user1_id=$1 AND m.user2_id=u.id) OR (m.user2_id=$1 AND m.user1_id=u.id)
                ) THEN 'match'
                WHEN EXISTS (SELECT 1 FROM friendships f
                  WHERE f.status='accepted'
                    AND ((f.requester_id=$1 AND f.addressee_id=u.id) OR (f.addressee_id=$1 AND f.requester_id=u.id))
                ) THEN 'friend'
                WHEN EXISTS (SELECT 1 FROM friendships f
                  WHERE f.status='pending' AND f.requester_id=$1 AND f.addressee_id=u.id
                ) THEN 'pending_sent'
                WHEN EXISTS (SELECT 1 FROM friendships f
                  WHERE f.status='pending' AND f.requester_id=u.id AND f.addressee_id=$1
                ) THEN 'pending_received'
                ELSE 'none'
              END AS relationship,
              (SELECT f.id FROM friendships f
               WHERE f.status='pending'
                 AND ((f.requester_id=$1 AND f.addressee_id=u.id) OR (f.requester_id=u.id AND f.addressee_id=$1))
               LIMIT 1) AS friendship_request_id
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $2
         AND u.deleted_at IS NULL`,
      [req.user.id, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('public user error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

router.get('/:id/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.content, p.image_url, p.created_at,
              u.handle, u.id AS user_id,
              pr.display_name, pr.avatar_url,
              COUNT(DISTINCT l.user_id) AS likes_count,
              COUNT(DISTINCT c.id)      AS comments_count,
              BOOL_OR(l.user_id = $1)   AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = p.user_id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.user_id = $2
         AND u.deleted_at IS NULL
       GROUP BY p.id, u.id, pr.user_id
       ORDER BY p.created_at DESC
       LIMIT $3`,
      [req.user.id, req.params.id, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('public user posts error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/users/:id/friends — lista pública de conexiones
router.get('/:id/friends', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.handle, p.display_name, p.avatar_url
       FROM friendships f
       JOIN users u ON u.id = (CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END)
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE f.status = 'accepted'
         AND ((f.requester_id = $1 AND f.addressee_id = u.id) OR (f.addressee_id = $1 AND f.requester_id = u.id))
         AND u.deleted_at IS NULL
       ORDER BY u.handle
       LIMIT $2`,
      [req.params.id, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('public user friends error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/users/:id/photos — fotos públicas
router.get('/:id/photos', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.image_url, p.created_at
       FROM posts p
       WHERE p.user_id = $1 AND p.image_url IS NOT NULL
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [req.params.id, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('public user photos error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
