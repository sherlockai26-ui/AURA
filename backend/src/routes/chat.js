const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

// GET /api/chat/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.created_at,
              u.id AS other_user_id, u.handle AS other_handle,
              pr.display_name AS other_name, pr.avatar_url AS other_avatar,
              (SELECT content FROM messages m2
               WHERE m2.conversation_id = c.id
               ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages m3
               WHERE m3.conversation_id = c.id
               ORDER BY m3.created_at DESC LIMIT 1) AS last_message_at
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
       JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id <> $1
       JOIN users u ON u.id = cm2.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       ORDER BY last_message_at DESC NULLS LAST`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('get conversations error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/chat/conversations  — inicia o recupera conversación con un usuario
router.post('/conversations', requireAuth, async (req, res) => {
  const { other_handle } = req.body;
  if (!other_handle) return res.status(400).json({ error: 'Falta other_handle.' });

  const client = await pool.connect();
  try {
    const other = await client.query('SELECT id FROM users WHERE handle = $1', [other_handle]);
    if (other.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const otherId = other.rows[0].id;
    if (otherId === req.user.id) return res.status(400).json({ error: 'No puedes chatear contigo mismo.' });

    // Check if conversation exists
    const existing = await client.query(
      `SELECT c.id FROM conversations c
       JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = $1
       JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = $2`,
      [req.user.id, otherId]
    );
    if (existing.rows.length > 0) return res.json({ id: existing.rows[0].id });

    await client.query('BEGIN');
    const { rows } = await client.query('INSERT INTO conversations DEFAULT VALUES RETURNING id');
    const convId = rows[0].id;
    await client.query('INSERT INTO conversation_members VALUES ($1, $2), ($1, $3)', [convId, req.user.id, otherId]);
    await client.query('COMMIT');
    res.status(201).json({ id: convId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create conversation error:', err);
    res.status(500).json({ error: 'Error interno.' });
  } finally {
    client.release();
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const member = await pool.query(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'No tienes acceso a esta conversación.' });

    const { rows } = await pool.query(
      `SELECT m.id, m.content, m.created_at,
              u.handle, u.id AS sender_id,
              pr.display_name, pr.avatar_url
       FROM messages m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN profiles pr ON pr.user_id = m.user_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('get messages error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Mensaje vacío.' });

  try {
    const member = await pool.query(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'No tienes acceso a esta conversación.' });

    const { rows } = await pool.query(
      'INSERT INTO messages (conversation_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, content.trim()]
    );
    await pool.query(
      `INSERT INTO notifications (user_id, type, reference_id, actor_user_id)
       SELECT user_id, 'message', $3, $2
       FROM conversation_members
       WHERE conversation_id = $1 AND user_id <> $2`,
      [req.params.id, req.user.id, rows[0].id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('send message error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
