const router      = require('express').Router();
const multer      = require('multer');
const path        = require('path');
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOADS_DIR || '/uploads'),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/uploads/avatar
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo no válido.' });
  const url = `/uploads/${req.file.filename}`;
  try {
    await pool.query(
      `INSERT INTO profiles (user_id, avatar_url, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url, updated_at = NOW()`,
      [req.user.id, url]
    );
    res.json({ url });
  } catch (err) {
    console.error('avatar upload error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/uploads/image  (para posts)
router.post('/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo no válido.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
