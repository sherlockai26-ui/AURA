const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const pool        = require('../db');

router.use(requireAuth);

const TEAM_SELECT = `
  SELECT t.*,
         uc.handle AS creator_handle,
         COALESCE(pc.display_name, uc.handle) AS creator_display_name,
         pc.avatar_url AS creator_avatar,
         ut.handle AS teammate_handle,
         COALESCE(pt.display_name, ut.handle) AS teammate_display_name,
         pt.avatar_url AS teammate_avatar,
         ct.id AS conn_team_id,
         ct.creator_id AS conn_creator_id,
         ct.teammate_id AS conn_teammate_id,
         ucc.handle AS conn_creator_handle,
         COALESCE(pcc.display_name, ucc.handle) AS conn_creator_display_name,
         pcc.avatar_url AS conn_creator_avatar,
         uct.handle AS conn_teammate_handle,
         COALESCE(pct.display_name, uct.handle) AS conn_teammate_display_name,
         pct.avatar_url AS conn_teammate_avatar
  FROM teams_2pa2 t
  JOIN users uc ON uc.id = t.creator_id
  LEFT JOIN profiles pc ON pc.user_id = t.creator_id
  JOIN users ut ON ut.id = t.teammate_id
  LEFT JOIN profiles pt ON pt.user_id = t.teammate_id
  LEFT JOIN teams_2pa2 ct ON ct.id = t.connected_team_id
  LEFT JOIN users ucc ON ucc.id = ct.creator_id
  LEFT JOIN profiles pcc ON pcc.user_id = ct.creator_id
  LEFT JOIN users uct ON uct.id = ct.teammate_id
  LEFT JOIN profiles pct ON pct.user_id = ct.teammate_id
`;

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${TEAM_SELECT} WHERE t.creator_id=$1 OR t.teammate_id=$1 ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('teams list error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/teams/create
router.post('/create', async (req, res) => {
  const { friendId } = req.body;
  if (!friendId || friendId === req.user.id) {
    return res.status(400).json({ error: 'Amigo inválido.' });
  }
  try {
    const friendCheck = await pool.query(
      `SELECT 1 FROM friendships
       WHERE status='accepted'
         AND ((requester_id=$1 AND addressee_id=$2) OR (addressee_id=$1 AND requester_id=$2))`,
      [req.user.id, friendId]
    );
    if (friendCheck.rows.length === 0) {
      return res.status(400).json({ error: 'No son amigos.' });
    }
    const existing = await pool.query(
      `SELECT id FROM teams_2pa2
       WHERE (creator_id=$1 OR teammate_id=$1) AND status='open'`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya tienes un equipo activo.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO teams_2pa2 (creator_id, teammate_id) VALUES ($1, $2) RETURNING id`,
      [req.user.id, friendId]
    );
    const teamId = rows[0].id;
    pool.query(
      `INSERT INTO notifications (user_id, actor_user_id, type, reference_id)
       VALUES ($1, $2, 'team_invite', $3)`,
      [friendId, req.user.id, teamId]
    ).catch(() => {});
    const { rows: full } = await pool.query(
      `${TEAM_SELECT} WHERE t.id=$1`, [teamId]
    );
    res.status(201).json(full[0]);
  } catch (err) {
    console.error('team create error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/teams/search  — equipos abiertos de otros usuarios
router.post('/search', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${TEAM_SELECT}
       WHERE t.status='open' AND t.creator_id != $1 AND t.teammate_id != $1
       ORDER BY t.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('team search error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/teams/:id/connect  — { femaleTeamId }
router.post('/:id/connect', async (req, res) => {
  const { femaleTeamId } = req.body;
  const teamId = req.params.id;
  if (!femaleTeamId) return res.status(400).json({ error: 'femaleTeamId requerido.' });

  try {
    const myRes = await pool.query(
      `SELECT * FROM teams_2pa2
       WHERE id=$1 AND status='open' AND (creator_id=$2 OR teammate_id=$2)`,
      [teamId, req.user.id]
    );
    if (myRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado o no disponible.' });
    }
    const otherRes = await pool.query(
      `SELECT * FROM teams_2pa2 WHERE id=$1 AND status='open'`,
      [femaleTeamId]
    );
    if (otherRes.rows.length === 0) {
      return res.status(404).json({ error: 'El equipo objetivo ya no está disponible.' });
    }
    const myTeam    = myRes.rows[0];
    const otherTeam = otherRes.rows[0];

    // Crear conversación grupal con 4 miembros
    const convRes = await pool.query(`INSERT INTO conversations DEFAULT VALUES RETURNING id`);
    const convId  = convRes.rows[0].id;
    const members = [myTeam.creator_id, myTeam.teammate_id, otherTeam.creator_id, otherTeam.teammate_id];
    for (const uid of members) {
      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [convId, uid]
      );
    }

    // Actualizar ambos equipos
    await pool.query(
      `UPDATE teams_2pa2 SET status='matched', conversation_id=$1, connected_team_id=$2 WHERE id=$3`,
      [convId, femaleTeamId, teamId]
    );
    await pool.query(
      `UPDATE teams_2pa2 SET status='matched', conversation_id=$1, connected_team_id=$2 WHERE id=$3`,
      [convId, teamId, femaleTeamId]
    );

    // Notificar a los otros 3 miembros
    for (const uid of members) {
      if (uid !== req.user.id) {
        pool.query(
          `INSERT INTO notifications (user_id, actor_user_id, type, reference_id)
           VALUES ($1, $2, 'team_invite', $3)`,
          [uid, req.user.id, convId]
        ).catch(() => {});
      }
    }

    const { rows: updatedTeam } = await pool.query(
      `${TEAM_SELECT} WHERE t.id=$1`, [teamId]
    );
    res.json({ success: true, conversation_id: convId, team: updatedTeam[0] });
  } catch (err) {
    console.error('team connect error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/teams/:id/confirm  — { pairs: [{ maleUserId, femaleUserId }] }
router.post('/:id/confirm', async (req, res) => {
  const { pairs } = req.body;
  const teamId = req.params.id;
  if (!Array.isArray(pairs) || pairs.length !== 2) {
    return res.status(400).json({ error: 'Se requieren exactamente 2 parejas.' });
  }
  try {
    const teamRes = await pool.query(
      `SELECT * FROM teams_2pa2
       WHERE id=$1 AND status='matched' AND (creator_id=$2 OR teammate_id=$2)`,
      [teamId, req.user.id]
    );
    if (teamRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }
    for (const pair of pairs) {
      const [u1, u2] = [pair.maleUserId, pair.femaleUserId].sort();
      await pool.query(
        `INSERT INTO matches (user1_id, user2_id, team_id)
         VALUES ($1, $2, $3) ON CONFLICT (user1_id, user2_id) DO NOTHING`,
        [u1, u2, teamId]
      );
      pool.query(
        `INSERT INTO notifications (user_id, actor_user_id, type) VALUES ($1, $2, 'match')`,
        [pair.femaleUserId, pair.maleUserId]
      ).catch(() => {});
      pool.query(
        `INSERT INTO notifications (user_id, actor_user_id, type) VALUES ($1, $2, 'match')`,
        [pair.maleUserId, pair.femaleUserId]
      ).catch(() => {});
    }
    await pool.query(`UPDATE teams_2pa2 SET status='closed' WHERE id=$1`, [teamId]);
    res.json({ success: true });
  } catch (err) {
    console.error('team confirm error:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
