const { query } = require('../models/db');

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const { rows } = await query(
      `SELECT id, username, email, avatar_color FROM users
       WHERE username ILIKE $1 OR email ILIKE $1
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
};

module.exports = { searchUsers };