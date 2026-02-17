const { query } = require('../models/db');

const getActivities = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await query(`
      SELECT a.*, u.username, u.avatar_color
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.board_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `, [boardId, limit, offset]);

    const { rows: [{ count }] } = await query(
      'SELECT COUNT(*) FROM activities WHERE board_id = $1',
      [boardId]
    );

    res.json({ activities: rows, total: parseInt(count) });
  } catch (err) { next(err); }
};

module.exports = { getActivities };