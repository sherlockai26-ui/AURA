const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

// GET /api/posts?cursor=<timestamp>&limit=10&scope=circle|explore
router.get('/', requireAuth, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
  const cursor = req.query.cursor; // ISO timestamp for pagination
  const scope  = req.query.scope === 'explore' ? 'explore' : 'circle';

  try {
    const params = [req.user.id, limit];
    let where = scope === 'explore'
      ? `AND p.user_id <> $1
         AND NOT EXISTS (
           SELECT 1 FROM matches m
           WHERE (m.user1_id = $1 AND m.user2_id = p.user_id)
              OR (m.user2_id = $1 AND m.user1_id = p.user_id)
         )`
      : `AND (
           p.user_id = $1
           OR EXISTS (
             SELECT 1 FROM matches m
             WHERE (m.user1_id = $1 AND m.user2_id = p.user_id)
                OR (m.user2_id = $1 AND m.user1_id = p.user_id)
           )
         )`;
    if (cursor) {
      where += ' AND p.created_at < $3';
      params.push(cursor);
    }

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
       WHERE 1=1 ${where}
       GROUP BY p.id, u.id, pr.user_id
       ORDER BY p.created_at DESC
       LIMIT $2`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('get posts error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/posts
router.post('/', requireAuth, async (req, res) => {
  const { content, image_url } = req.body;
  if (!content?.trim() && !image_url) return res.status(400).json({ error: 'El post no puede estar vacío.' });

  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO posts (user_id, content, image_url)
         VALUES ($1, $2, $3)
         RETURNING *
       )
       SELECT p.id, p.content, p.image_url, p.created_at,
              u.handle, u.id AS user_id,
              pr.display_name, pr.avatar_url,
              0::integer AS likes_count,
              0::integer AS comments_count,
              false AS liked_by_me
       FROM inserted p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = p.user_id`,
      [req.user.id, content?.trim() || '', image_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create post error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/posts/:id/like  (toggle)
router.post('/:id/like', requireAuth, async (req, res) => {
  const postId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.id]
    );
    if (existing.rows.length > 0) {
      await client.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, req.user.id]);
      await client.query('COMMIT');
      return res.json({ liked: false });
    }
    await client.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, req.user.id]);
    await client.query('COMMIT');
    res.json({ liked: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('like error:', err);
    res.status(500).json({ error: 'Error interno.' });
  } finally {
    client.release();
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.handle, pr.display_name, pr.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN profiles pr ON pr.user_id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('get comments error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comentario vacío.' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('comment error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// DELETE /api/posts/:id  (solo el autor puede eliminar)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Publicación no encontrada o sin permiso.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete post error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
