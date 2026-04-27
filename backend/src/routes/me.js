const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

// GET /api/me
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.handle, u.created_at,
              p.display_name, p.bio, p.avatar_url, p.mode,
              w.balance AS sparks
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN sparks_wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// PUT /api/profile
router.put('/profile', requireAuth, async (req, res) => {
  const { display_name, bio } = req.body;
  try {
    await pool.query(
      `INSERT INTO profiles (user_id, display_name, bio, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             bio          = EXCLUDED.bio,
             updated_at   = NOW()`,
      [req.user.id, display_name || '', bio || '']
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
