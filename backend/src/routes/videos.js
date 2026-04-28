const router      = require('express').Router();
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

const videosDir = path.join(process.env.UPLOADS_DIR || '/uploads', 'videos');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videosDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/videos/upload
router.post('/upload', requireAuth, upload.fields([
  { name: 'video',     maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
  const videoFile = req.files?.video?.[0];
  if (!videoFile) return res.status(400).json({ error: 'Video requerido.' });

  const thumbFile  = req.files?.thumbnail?.[0];
  const title      = req.body.title?.trim() || null;
  const duration   = req.body.duration ? parseInt(req.body.duration, 10) : null;

  if (duration !== null && duration > 120) {
    return res.status(400).json({ error: 'El video no puede superar 120 segundos.' });
  }

  const videoUrl = `/uploads/videos/${videoFile.filename}`;
  const thumbUrl = thumbFile ? `/uploads/videos/${thumbFile.filename}` : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO videos (user_id, title, video_url, thumbnail_url, duration)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, video_url, thumbnail_url, title, duration, created_at`,
      [req.user.id, title, videoUrl, thumbUrl, duration]
    );
    res.status(201).json({ video: rows[0] });
  } catch (err) {
    console.error('video upload error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/videos?page=1&limit=10
router.get('/', requireAuth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT
         v.id, v.title, v.video_url, v.thumbnail_url, v.duration, v.created_at,
         u.id   AS user_id,
         u.handle,
         COALESCE(p.display_name, u.handle) AS display_name,
         p.avatar_url,
         COUNT(DISTINCT vl.user_id)::int  AS likes_count,
         COUNT(DISTINCT vc.id)::int       AS comments_count,
         BOOL_OR(vl.user_id = $1)         AS liked
       FROM videos v
       JOIN users u  ON u.id = v.user_id
       LEFT JOIN profiles p        ON p.user_id = v.user_id
       LEFT JOIN video_likes vl    ON vl.video_id = v.id
       LEFT JOIN video_comments vc ON vc.video_id = v.id
       GROUP BY v.id, u.id, u.handle, p.display_name, p.avatar_url
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ videos: rows, page, limit });
  } catch (err) {
    console.error('video feed error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/videos/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  const videoId = req.params.id;
  const userId  = req.user.id;

  try {
    const existing = await pool.query(
      'SELECT 1 FROM video_likes WHERE user_id=$1 AND video_id=$2',
      [userId, videoId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM video_likes WHERE user_id=$1 AND video_id=$2', [userId, videoId]);
    } else {
      await pool.query('INSERT INTO video_likes (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, videoId]);
    }

    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS likes_count FROM video_likes WHERE video_id=$1',
      [videoId]
    );
    res.json({ liked: existing.rows.length === 0, likes_count: rows[0].likes_count });
  } catch (err) {
    console.error('video like error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/videos/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  const videoId = req.params.id;
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ error: 'Comentario vacío.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO video_comments (video_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, content, created_at`,
      [videoId, req.user.id, content]
    );
    res.status(201).json({ comment: rows[0] });
  } catch (err) {
    console.error('video comment error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/videos/:id/comments
router.get('/:id/comments', requireAuth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT
         vc.id, vc.content, vc.created_at,
         u.id AS user_id, u.handle,
         COALESCE(p.display_name, u.handle) AS display_name,
         p.avatar_url
       FROM video_comments vc
       JOIN users u    ON u.id = vc.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE vc.video_id = $1
       ORDER BY vc.created_at ASC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    res.json({ comments: rows, page, limit });
  } catch (err) {
    console.error('video comments error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
