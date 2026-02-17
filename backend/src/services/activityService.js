const { query } = require('../models/db');

const logActivity = async ({ boardId, userId, entityType, entityId, action, meta = {} }) => {
  try {
    await query(
      'INSERT INTO activities (board_id, user_id, entity_type, entity_id, action, meta) VALUES ($1, $2, $3, $4, $5, $6)',
      [boardId, userId, entityType, entityId, action, JSON.stringify(meta)]
    );
  } catch (err) {
    // Activity logging shouldn't break main flow
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = { logActivity };