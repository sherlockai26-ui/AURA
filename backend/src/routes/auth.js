const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

const HANDLE_RE = /^[a-zA-Z0-9_.]{3,24}$/;
const EMAIL_RE  = /^\S+@\S+\.\S+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, handle: user.handle },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, handle, password, display_name, mode } = req.body;

  if (!EMAIL_RE.test(String(email || '')))   return res.status(400).json({ error: 'Correo inválido.' });
  if (!HANDLE_RE.test(String(handle || ''))) return res.status(400).json({ error: 'Handle inválido: 3–24 letras/números.' });
  if (String(password || '').length < 8)     return res.status(400).json({ error: 'Contraseña mínima de 8 caracteres.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id
       FROM users
       WHERE (lower(email) = $1 OR lower(handle) = $2)
         AND deleted_at IS NULL
         AND COALESCE(to_jsonb(users)->>'status', 'active') <> 'deleted'`,
      [email.trim().toLowerCase(), handle.trim().toLowerCase()]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El correo o handle ya está en uso.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      'INSERT INTO users (email, handle, password_hash) VALUES ($1, $2, $3) RETURNING id, email, handle',
      [email.trim().toLowerCase(), handle.trim().toLowerCase(), hash]
    );
    const user = rows[0];

    await client.query(
      'INSERT INTO profiles (user_id, display_name, mode) VALUES ($1, $2, $3)',
      [user.id, display_name || handle, mode || 'single']
    );
    await client.query(
      'INSERT INTO sparks_wallets (user_id, balance) VALUES ($1, 50)',
      [user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        mode: mode || 'single',
        display_name: display_name || handle,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El correo o handle ya está en uso.' });
    }
    console.error('register error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Faltan campos.' });

  const id = String(identifier).trim().toLowerCase();
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.handle, u.password_hash,
              p.mode, p.display_name
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (lower(u.email) = $1 OR lower(u.handle) = $1)
         AND u.deleted_at IS NULL
         AND COALESCE(to_jsonb(u)->>'status', 'active') <> 'deleted'`,
      [id]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'No encontramos esa cuenta o nickname.' });

    const user = rows[0];
    const ok   = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        mode: user.mode || 'single',
        display_name: user.display_name || user.handle,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
