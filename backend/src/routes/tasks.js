const router    = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool      = require('../db');

router.use(requireAuth);

async function isCompleted(client, userId, taskKey) {
  switch (taskKey) {
    case 'complete_profile': {
      const { rows } = await client.query(
        `SELECT 1 FROM profiles WHERE user_id = $1
         AND display_name IS NOT NULL AND display_name != ''
         AND bio IS NOT NULL AND bio != ''`,
        [userId]
      );
      return rows.length > 0;
    }
    case 'upload_avatar': {
      const { rows } = await client.query(
        `SELECT 1 FROM profiles WHERE user_id = $1 AND avatar_url IS NOT NULL`,
        [userId]
      );
      return rows.length > 0;
    }
    case 'first_post': {
      const { rows } = await client.query(
        `SELECT 1 FROM posts WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      return rows.length > 0;
    }
    case 'first_like': {
      const { rows } = await client.query(
        `SELECT 1 FROM likes WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      return rows.length > 0;
    }
    case 'first_match': {
      const { rows } = await client.query(
        `SELECT 1 FROM matches WHERE user1_id = $1 OR user2_id = $1 LIMIT 1`,
        [userId]
      );
      return rows.length > 0;
    }
    case 'first_message': {
      const { rows } = await client.query(
        `SELECT 1 FROM messages WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      return rows.length > 0;
    }
    default:
      return false;
  }
}

// GET /api/tasks
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT
        rt.key,
        rt.title,
        rt.description,
        rt.reward,
        rt.auto_check,
        utc.status,
        utc.claimed_at
      FROM reward_tasks rt
      LEFT JOIN user_task_claims utc ON utc.task_key = rt.key AND utc.user_id = $1
      ORDER BY rt.reward DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('tasks list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/tasks/:taskKey/claim
router.post('/:taskKey/claim', async (req, res) => {
  const userId  = req.user.id;
  const taskKey = req.params.taskKey;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: taskRows } = await client.query(
      'SELECT * FROM reward_tasks WHERE key = $1',
      [taskKey]
    );
    if (taskRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }
    const task = taskRows[0];

    const { rows: prior } = await client.query(
      'SELECT status FROM user_task_claims WHERE user_id = $1 AND task_key = $2',
      [userId, taskKey]
    );
    if (prior.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ya reclamaste esta tarea.', status: prior[0].status });
    }

    let status = 'done';

    if (task.auto_check) {
      const done = await isCompleted(client, userId, taskKey);
      if (!done) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Aún no has completado esta tarea.' });
      }
      await client.query(
        'UPDATE sparks_wallets SET balance = balance + $1 WHERE user_id = $2',
        [task.reward, userId]
      );
      await client.query(
        'INSERT INTO sparks_transactions (to_user_id, amount, reason) VALUES ($1, $2, $3)',
        [userId, task.reward, task.title]
      );
    } else {
      status = 'pending';
    }

    await client.query(
      'INSERT INTO user_task_claims (user_id, task_key, status) VALUES ($1, $2, $3)',
      [userId, taskKey, status]
    );

    const { rows: wallet } = await client.query(
      'SELECT balance FROM sparks_wallets WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    res.json({ ok: true, status, reward: task.reward, balance: wallet[0]?.balance ?? 0 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('tasks claim error:', err);
    res.status(500).json({ error: 'Error interno.' });
  } finally {
    client.release();
  }
});

module.exports = router;
