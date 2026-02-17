const jwt = require('jsonwebtoken');
const { query } = require('../models/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query('SELECT id, email, username, avatar_color FROM users WHERE id = $1', [decoded.userId]);
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    next(err);
  }
};

// Check if user is a board member
const boardAccess = async (req, res, next) => {
  const boardId = req.params.boardId || req.body.boardId || req.params.id;
  const { rows } = await query(
    'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
    [boardId, req.user.id]
  );
  if (!rows[0]) return res.status(403).json({ error: 'Access denied' });
  req.boardRole = rows[0].role;
  next();
};

module.exports = { authenticate, boardAccess };