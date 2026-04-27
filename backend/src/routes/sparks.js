const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

// GET /api/sparks
router.get('/', requireAuth, async (req, res) => {
  try {
    const wallet = await pool.query('SELECT balance FROM sparks_wallets WHERE user_id = $1', [req.user.id]);
    if (wallet.rows.length === 0) return res.json({ balance: 0, transactions: [] });

    const tx = await pool.query(
      `SELECT st.id, st.amount, st.reason, st.created_at,
              fu.handle AS from_handle, tu.handle AS to_handle
       FROM sparks_transactions st
       LEFT JOIN users fu ON fu.id = st.from_user_id
       LEFT JOIN users tu ON tu.id = st.to_user_id
       WHERE st.from_user_id = $1 OR st.to_user_id = $1
       ORDER BY st.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ balance: wallet.rows[0].balance, transactions: tx.rows });
  } catch (err) {
    console.error('get sparks error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/sparks/transfer
router.post('/transfer', requireAuth, async (req, res) => {
  const { to_handle, amount, reason } = req.body;
  const qty = parseInt(amount);
  if (!to_handle || !qty || qty < 1) return res.status(400).json({ error: 'Datos inválidos.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const target = await client.query('SELECT id FROM users WHERE handle = $1', [to_handle]);
    if (target.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Usuario no encontrado.' }); }
    const toId = target.rows[0].id;
    if (toId === req.user.id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No puedes transferirte chispas a ti mismo.' }); }

    const sender = await client.query('SELECT balance FROM sparks_wallets WHERE user_id = $1 FOR UPDATE', [req.user.id]);
    if (sender.rows.length === 0 || sender.rows[0].balance < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente.' });
    }

    await client.query('UPDATE sparks_wallets SET balance = balance - $1 WHERE user_id = $2', [qty, req.user.id]);
    await client.query(
      'INSERT INTO sparks_wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = sparks_wallets.balance + EXCLUDED.balance',
      [toId, qty]
    );
    await client.query(
      'INSERT INTO sparks_transactions (from_user_id, to_user_id, amount, reason) VALUES ($1, $2, $3, $4)',
      [req.user.id, toId, qty, reason || null]
    );

    const updated = await client.query('SELECT balance FROM sparks_wallets WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');
    res.json({ balance: updated.rows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('transfer error:', err);
    res.status(500).json({ error: 'Error interno.' });
  } finally {
    client.release();
  }
});

module.exports = router;
