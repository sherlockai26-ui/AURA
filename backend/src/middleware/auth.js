const jwt = require('jsonwebtoken');
const pool = require('../db');

module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT id, email, handle
       FROM users u
       WHERE id = $1
         AND deleted_at IS NULL
         AND COALESCE(to_jsonb(u)->>'status', 'active') <> 'deleted'`,
      [payload.id]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Cuenta no disponible.' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
