const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.id, n.type, n.reference_id, n.created_at, n.read,
              actor.id AS actor_user_id,
              actor.handle AS actor_handle,
              p.display_name AS actor_name,
              p.avatar_url AS actor_avatar,
              msg.conversation_id
       FROM notifications n
       LEFT JOIN users actor ON actor.id = n.actor_user_id AND actor.deleted_at IS NULL
       LEFT JOIN profiles p ON p.user_id = actor.id
       LEFT JOIN messages msg ON n.type = 'message' AND msg.id = n.reference_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('notifications list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('notification read error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('notifications read all error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
