const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

// GET /api/confidants
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.handle, COALESCE(p.display_name, u.handle) AS display_name, p.avatar_url
       FROM confidants c
       JOIN users u    ON u.id = c.confidant_user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('confidants list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/confidants
router.post('/', async (req, res) => {
  const { confidantUserId } = req.body;
  if (!confidantUserId || confidantUserId === req.user.id) {
    return res.status(400).json({ error: 'Usuario inválido.' });
  }
  try {
    await pool.query(
      'INSERT INTO confidants (user_id, confidant_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, confidantUserId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('add confidant error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// DELETE /api/confidants/:userId
router.delete('/:userId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM confidants WHERE user_id=$1 AND confidant_user_id=$2',
      [req.user.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('remove confidant error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
