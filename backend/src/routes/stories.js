const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

async function listStories(req, res, scope) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const relationWhere = scope === 'circle'
    ? `AND EXISTS (
         SELECT 1 FROM matches m
         WHERE (m.user1_id = $2 AND m.user2_id = s.user_id)
            OR (m.user2_id = $2 AND m.user1_id = s.user_id)
       )`
    : `AND s.user_id <> $2
       AND NOT EXISTS (
         SELECT 1 FROM matches m
         WHERE (m.user1_id = $2 AND m.user2_id = s.user_id)
            OR (m.user2_id = $2 AND m.user1_id = s.user_id)
       )`;

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.content, s.image_url, s.visibility, s.created_at, s.expires_at,
              u.id AS user_id, u.handle,
              p.display_name, p.avatar_url
       FROM stories s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN profiles p ON p.user_id = s.user_id
       WHERE s.expires_at > NOW()
       ${relationWhere}
       ORDER BY s.created_at DESC
       LIMIT $1`,
      [limit, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('stories list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
}

// GET /api/stories — explore: active stories from users without a match relation.
router.get('/', (req, res) => listStories(req, res, 'explore'));

// No contacts/follow graph exists yet, so circle is based on matches only.
router.get('/following', (req, res) => listStories(req, res, 'circle'));
router.get('/circle', (req, res) => listStories(req, res, 'circle'));

// POST /api/stories
router.post('/', async (req, res) => {
  const content = String(req.body.content || '').trim();
  const imageUrl = req.body.image_url || null;
  const visibility = req.body.visibility === 'circle' ? 'circle' : 'public';

  if (!content && !imageUrl) {
    return res.status(400).json({ error: 'La historia no puede estar vacía.' });
  }

  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO stories (user_id, content, image_url, visibility)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT i.id, i.content, i.image_url, i.visibility, i.created_at, i.expires_at,
              u.id AS user_id, u.handle,
              p.display_name, p.avatar_url
       FROM inserted i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN profiles p ON p.user_id = i.user_id`,
      [req.user.id, content, imageUrl, visibility]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('story create error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
