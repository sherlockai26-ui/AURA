const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

async function listStories(req, res, scope) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  const relationWhere = scope === 'circle'
    ? `AND (
         EXISTS (SELECT 1 FROM matches m
           WHERE (m.user1_id=$2 AND m.user2_id=s.user_id)
              OR (m.user2_id=$2 AND m.user1_id=s.user_id))
         OR EXISTS (SELECT 1 FROM friendships f
           WHERE f.status='accepted'
             AND ((f.requester_id=$2 AND f.addressee_id=s.user_id)
               OR (f.addressee_id=$2 AND f.requester_id=s.user_id)))
       )`
    : `AND s.user_id <> $2
       AND NOT EXISTS (SELECT 1 FROM matches m
         WHERE (m.user1_id=$2 AND m.user2_id=s.user_id)
            OR (m.user2_id=$2 AND m.user1_id=s.user_id))`;

  const privacyWhere = scope === 'circle'
    ? `AND (s.privacy IS NULL OR s.privacy IN ('global','circle')
           OR (s.privacy='confidants' AND EXISTS (
                 SELECT 1 FROM confidants c WHERE c.user_id=s.user_id AND c.confidant_user_id=$2)))`
    : `AND (s.privacy IS NULL OR s.privacy='global')`;

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.content, s.image_url, s.visibility, s.privacy, s.created_at, s.expires_at,
              u.id AS user_id, u.handle, p.display_name, p.avatar_url
       FROM stories s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN profiles p ON p.user_id = s.user_id
       WHERE s.expires_at > NOW() AND u.deleted_at IS NULL
       ${relationWhere}
       ${privacyWhere}
       ORDER BY s.created_at DESC LIMIT $1`,
      [limit, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('stories list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
}

// GET /api/stories/saved  (ANTES de los dinámicos)
router.get('/saved', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
  const offset = (page - 1) * limit;
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.content, s.image_url, s.created_at, ss.saved_at,
              u.id AS user_id, u.handle, p.display_name, p.avatar_url
       FROM saved_stories ss
       JOIN stories s ON s.id = ss.story_id
       JOIN users u   ON u.id = s.user_id
       LEFT JOIN profiles p ON p.user_id = s.user_id
       WHERE ss.user_id = $1
       ORDER BY ss.saved_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('saved stories error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

router.get('/',          (req, res) => listStories(req, res, 'explore'));
router.get('/following', (req, res) => listStories(req, res, 'circle'));
router.get('/circle',    (req, res) => listStories(req, res, 'circle'));

// POST /api/stories
router.post('/', async (req, res) => {
  const content    = String(req.body.content || '').trim();
  const imageUrl   = req.body.image_url || null;
  const visibility = req.body.visibility === 'circle' ? 'circle' : 'public';
  const privacy    = ['global', 'circle', 'confidants'].includes(req.body.privacy)
    ? req.body.privacy : 'global';

  if (!content && !imageUrl) {
    return res.status(400).json({ error: 'La historia no puede estar vacía.' });
  }
  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO stories (user_id, content, image_url, visibility, privacy)
         VALUES ($1, $2, $3, $4, $5) RETURNING *
       )
       SELECT i.id, i.content, i.image_url, i.visibility, i.privacy, i.created_at, i.expires_at,
              u.id AS user_id, u.handle, p.display_name, p.avatar_url
       FROM inserted i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN profiles p ON p.user_id = i.user_id`,
      [req.user.id, content, imageUrl, visibility, privacy]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('story create error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/stories/:id/save
router.post('/:id/save', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO saved_stories (user_id, story_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('save story error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// DELETE /api/stories/:id/save
router.delete('/:id/save', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM saved_stories WHERE user_id=$1 AND story_id=$2',
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('unsave story error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
