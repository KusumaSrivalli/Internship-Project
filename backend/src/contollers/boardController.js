const { query } = require('../models/db');
const { logActivity } = require('../services/activityService');
const { emitToBoard } = require('../socket');

const getBoards = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT b.*, bm.role,
        (SELECT COUNT(*) FROM lists WHERE board_id = b.id) as list_count,
        (SELECT COUNT(*) FROM tasks WHERE board_id = b.id) as task_count
      FROM boards b
      JOIN board_members bm ON b.id = bm.board_id
      WHERE bm.user_id = $1
      ORDER BY b.updated_at DESC
    `, [req.user.id]);
    res.json({ boards: rows });
  } catch (err) { next(err); }
};

const getBoard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [board] } = await query('SELECT * FROM boards WHERE id = $1', [id]);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Get lists with tasks
    const { rows: lists } = await query(`
      SELECT * FROM lists WHERE board_id = $1 ORDER BY position
    `, [id]);

    const { rows: tasks } = await query(`
      SELECT t.*,
        json_agg(DISTINCT jsonb_build_object('id', u.id, 'username', u.username, 'avatar_color', u.avatar_color))
          FILTER (WHERE u.id IS NOT NULL) as assignees
      FROM tasks t
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE t.board_id = $1
      GROUP BY t.id
      ORDER BY t.position
    `, [id]);

    const { rows: members } = await query(`
      SELECT u.id, u.username, u.email, u.avatar_color, bm.role
      FROM board_members bm
      JOIN users u ON bm.user_id = u.id
      WHERE bm.board_id = $1
    `, [id]);

    // Map tasks into lists
    const listsWithTasks = lists.map(list => ({
      ...list,
      tasks: tasks.filter(t => t.list_id === list.id)
    }));

    res.json({ board: { ...board, lists: listsWithTasks, members } });
  } catch (err) { next(err); }
};

const createBoard = async (req, res, next) => {
  try {
    const { title, description, color } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const { rows: [board] } = await query(
      'INSERT INTO boards (title, description, owner_id, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, req.user.id, color || '#6366f1']
    );

    await query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)',
      [board.id, req.user.id, 'owner']
    );

    // Create default lists
    const defaultLists = ['To Do', 'In Progress', 'Done'];
    for (let i = 0; i < defaultLists.length; i++) {
      await query(
        'INSERT INTO lists (title, board_id, position) VALUES ($1, $2, $3)',
        [defaultLists[i], board.id, i]
      );
    }

    res.status(201).json({ board });
  } catch (err) { next(err); }
};

const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, color } = req.body;

    const { rows: [board] } = await query(
      'UPDATE boards SET title = COALESCE($1, title), description = COALESCE($2, description), color = COALESCE($3, color), updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, description, color, id]
    );

    emitToBoard(id, 'board:updated', { board });
    res.json({ board });
  } catch (err) { next(err); }
};

const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM boards WHERE id = $1', [id]);
    res.json({ message: 'Board deleted' });
  } catch (err) { next(err); }
};

const inviteMember = async (req, res, next) => {
  try {
    const { id: boardId } = req.params;
    const { email } = req.body;

    const { rows: [user] } = await query('SELECT id, username, email, avatar_color FROM users WHERE email = $1', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [boardId, user.id, 'member']
    );

    await logActivity({ boardId, userId: req.user.id, entityType: 'board', entityId: boardId, action: 'member_added', meta: { username: user.username } });
    emitToBoard(boardId, 'board:member_added', { user: { ...user, role: 'member' } });

    res.json({ user: { ...user, role: 'member' } });
  } catch (err) { next(err); }
};

module.exports = { getBoards, getBoard, createBoard, updateBoard, deleteBoard, inviteMember };