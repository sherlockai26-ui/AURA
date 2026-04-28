const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

// POST /api/friends/request
router.post('/request', async (req, res) => {
  const { toUserId, message } = req.body;
  if (!toUserId || toUserId === req.user.id) {
    return res.status(400).json({ error: 'Usuario inválido.' });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 40) {
    return res.status(400).json({ error: 'El mensaje debe tener entre 1 y 40 caracteres.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status, message)
       VALUES ($1, $2, 'pending', $3)
       ON CONFLICT (requester_id, addressee_id) DO NOTHING
       RETURNING id`,
      [req.user.id, toUserId, message.trim()]
    );
    if (rows.length === 0) return res.status(409).json({ error: 'Solicitud ya existe.' });

    // Obtener handle del solicitante para la notificación
    const { rows: senderRows } = await pool.query(
      `SELECT handle FROM users WHERE id=$1`, [req.user.id]
    );
    const senderHandle = senderRows[0]?.handle || 'alguien';

    pool.query(
      `INSERT INTO notifications (user_id, actor_user_id, type, reference_id)
       VALUES ($1, $2, 'connection_request', $3)`,
      [toUserId, req.user.id, rows[0].id]
    ).catch(() => {});

    res.status(201).json({ success: true, message: `@${senderHandle} desea conectar contigo` });
  } catch (err) {
    console.error('friend request error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/friends/accept
router.post('/accept', async (req, res) => {
  const { requestId } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE friendships SET status='accepted', updated_at=NOW()
       WHERE id=$1 AND addressee_id=$2 AND status='pending'
       RETURNING id, requester_id`,
      [requestId, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });

    // Notificar al solicitante
    const { rows: acceptorRows } = await pool.query(
      `SELECT handle FROM users WHERE id=$1`, [req.user.id]
    );
    const acceptorHandle = acceptorRows[0]?.handle || 'alguien';

    pool.query(
      `INSERT INTO notifications (user_id, actor_user_id, type, reference_id)
       VALUES ($1, $2, 'connection_request', $3)`,
      [rows[0].requester_id, req.user.id, rows[0].id]
    ).catch(() => {});

    res.json({ success: true, message: `@${acceptorHandle} aceptó tu conexión` });
  } catch (err) {
    console.error('friend accept error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/friends/decline
router.post('/decline', async (req, res) => {
  const { requestId } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE friendships SET status='declined', updated_at=NOW()
       WHERE id=$1 AND addressee_id=$2 AND status='pending'
       RETURNING id`,
      [requestId, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    res.json({ success: true });
  } catch (err) {
    console.error('friend decline error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// DELETE /api/friends/:userId
router.delete('/:userId', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE status='accepted'
         AND ((requester_id=$1 AND addressee_id=$2) OR (addressee_id=$1 AND requester_id=$2))`,
      [req.user.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('friend delete error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/friends/requests  (ANTES de GET /)
router.get('/requests', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.status, f.created_at, f.message,
              f.requester_id, f.addressee_id,
              u.handle,
              COALESCE(p.display_name, u.handle) AS display_name,
              p.avatar_url,
              CASE WHEN f.requester_id = $1 THEN 'sent' ELSE 'received' END AS direction
       FROM friendships f
       JOIN users u ON u.id = (CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END)
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='pending'
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('friend requests error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/friends
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END AS user_id,
         u.handle,
         COALESCE(p.display_name, u.handle) AS display_name,
         p.avatar_url
       FROM friendships f
       JOIN users u ON u.id = (CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END)
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='accepted'
       ORDER BY f.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('friends list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
