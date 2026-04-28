require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./db');
const fs      = require('fs');

const UNSAFE_SECRETS = ['CAMBIA_ESTO_POR_UN_SECRETO_LARGO_Y_ALEATORIO', 'change_this_secret_in_production', ''];
if (!process.env.JWT_SECRET || UNSAFE_SECRETS.includes(process.env.JWT_SECRET)) {
  const message = 'JWT_SECRET no está configurado o usa el valor por defecto. Cambia JWT_SECRET en tu archivo .env antes de usar en producción.';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.error(`ADVERTENCIA: ${message}`);
}

const app  = express();
const PORT = process.env.PORT || 3000;

// Express genera ETags por defecto y responde 304 si el body no cambió.
// Para una API dinámica esto es incorrecto: siempre devolver datos frescos.
app.set('etag', false);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// Todas las rutas /api/* nunca deben cachearse
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Serve uploaded files
const uploadsDir = process.env.UPLOADS_DIR || '/uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/me',      require('./routes/me'));
app.use('/api/profile', require('./routes/me'));   // alias PUT /api/profile
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/posts',   require('./routes/posts'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/sparks',  require('./routes/sparks'));
app.use('/api/match',  require('./routes/match'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tasks',  require('./routes/tasks'));
app.use('/api/videos', require('./routes/videos'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Wait for DB and run schema
async function initDB() {
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch {
      retries--;
      if (retries === 0) throw new Error('Cannot connect to database');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const schema = require('fs').readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database ready');
}

initDB()
  .then(() => app.listen(PORT, () => console.log(`AURA API listening on :${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
