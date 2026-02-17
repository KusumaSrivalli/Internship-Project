const { query } = require('../models/db');
const { emitToBoard } = require('../socket');

const createList = async (req, res, next) => {
  try {
    const { title, boardId } = req.body;
    if (!title || !boardId) return res.status(400).json({ error: 'title and boardId required' });

    const { rows: [{ maxPos }] } = await query(
      'SELECT COALESCE(MAX(position), -1) as "maxPos" FROM lists WHERE board_id = $1',
      [boardId]
    );

    const { rows: [list] } = await query(
      'INSERT INTO lists (title, board_id, position) VALUES ($1, $2, $3) RETURNING *',
      [title, boardId, maxPos + 1]
    );

    emitToBoard(boardId, 'list:created', { list: { ...list, tasks: [] } });
    res.status(201).json({ list: { ...list, tasks: [] } });
  } catch (err) { next(err); }
};

const updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const { rows: [list] } = await query(
      'UPDATE lists SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [title, id]
    );

    emitToBoard(list.board_id, 'list:updated', { list });
    res.json({ list });
  } catch (err) { next(err); }
};

const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [list] } = await query('SELECT board_id FROM lists WHERE id = $1', [id]);
    if (!list) return res.status(404).json({ error: 'List not found' });

    await query('DELETE FROM lists WHERE id = $1', [id]);
    emitToBoard(list.board_id, 'list:deleted', { listId: id });
    res.json({ message: 'List deleted' });
  } catch (err) { next(err); }
};

module.exports = { createList, updateList, deleteList };