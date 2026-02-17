const { query, getClient } = require('../models/db');
const { logActivity } = require('../services/activityService');
const { emitToBoard } = require('../socket');

const getTasks = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { search, page = 1, limit = 50, assignee, priority } = req.query;

    let conditions = ['t.board_id = $1'];
    let params = [boardId];
    let idx = 2;

    if (search) {
      conditions.push(`(t.title ILIKE $${idx} OR t.description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (assignee) {
      conditions.push(`EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = $${idx})`);
      params.push(assignee);
      idx++;
    }
    if (priority) {
      conditions.push(`t.priority = $${idx}`);
      params.push(priority);
      idx++;
    }

    const offset = (page - 1) * limit;
    const { rows: tasks } = await query(`
      SELECT t.*,
        json_agg(DISTINCT jsonb_build_object('id', u.id, 'username', u.username, 'avatar_color', u.avatar_color))
          FILTER (WHERE u.id IS NOT NULL) as assignees
      FROM tasks t
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.id
      ORDER BY t.position
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) FROM tasks t WHERE ${conditions.join(' AND ')}`,
      params
    );

    res.json({ tasks, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, listId, boardId, priority, dueDate, assignees } = req.body;
    if (!title || !listId || !boardId) {
      return res.status(400).json({ error: 'title, listId and boardId required' });
    }

    const { rows: [{ maxPos }] } = await query(
      'SELECT COALESCE(MAX(position), -1) as "maxPos" FROM tasks WHERE list_id = $1',
      [listId]
    );

    const { rows: [task] } = await query(`
      INSERT INTO tasks (title, description, list_id, board_id, position, priority, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [title, description, listId, boardId, maxPos + 1, priority || 'medium', dueDate || null, req.user.id]);

    if (assignees && assignees.length > 0) {
      for (const uid of assignees) {
        await query('INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [task.id, uid]);
      }
    }

    const fullTask = await getTaskWithAssignees(task.id);
    await logActivity({ boardId, userId: req.user.id, entityType: 'task', entityId: task.id, action: 'task_created', meta: { title } });
    emitToBoard(boardId, 'task:created', { task: fullTask });

    res.status(201).json({ task: fullTask });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, listId } = req.body;

    const { rows: [old] } = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!old) return res.status(404).json({ error: 'Task not found' });

    const { rows: [task] } = await query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        due_date = COALESCE($4, due_date),
        list_id = COALESCE($5, list_id),
        updated_at = NOW()
      WHERE id = $6 RETURNING *
    `, [title, description, priority, dueDate, listId, id]);

    const fullTask = await getTaskWithAssignees(id);
    await logActivity({ boardId: task.board_id, userId: req.user.id, entityType: 'task', entityId: id, action: 'task_updated', meta: { changes: req.body } });
    emitToBoard(task.board_id, 'task:updated', { task: fullTask });

    res.json({ task: fullTask });
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [task] } = await query('SELECT board_id, title FROM tasks WHERE id = $1', [id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await query('DELETE FROM tasks WHERE id = $1', [id]);
    await logActivity({ boardId: task.board_id, userId: req.user.id, entityType: 'task', entityId: id, action: 'task_deleted', meta: { title: task.title } });
    emitToBoard(task.board_id, 'task:deleted', { taskId: id });

    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};

// Handle drag-and-drop reordering
const moveTask = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { targetListId, newPosition, boardId } = req.body;

    const { rows: [task] } = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const sourceListId = task.list_id;

    if (sourceListId !== targetListId) {
      // Moving to a different list - shift positions in source list
      await client.query(
        'UPDATE tasks SET position = position - 1 WHERE list_id = $1 AND position > $2',
        [sourceListId, task.position]
      );
      // Make space in target list
      await client.query(
        'UPDATE tasks SET position = position + 1 WHERE list_id = $1 AND position >= $2',
        [targetListId, newPosition]
      );
    } else {
      // Same list reorder
      if (newPosition > task.position) {
        await client.query(
          'UPDATE tasks SET position = position - 1 WHERE list_id = $1 AND position > $2 AND position <= $3',
          [sourceListId, task.position, newPosition]
        );
      } else {
        await client.query(
          'UPDATE tasks SET position = position + 1 WHERE list_id = $1 AND position >= $2 AND position < $3',
          [sourceListId, newPosition, task.position]
        );
      }
    }

    await client.query(
      'UPDATE tasks SET list_id = $1, position = $2, updated_at = NOW() WHERE id = $3',
      [targetListId, newPosition, id]
    );

    await client.query('COMMIT');

    const updatedTask = await getTaskWithAssignees(id);
    await logActivity({ boardId: task.board_id, userId: req.user.id, entityType: 'task', entityId: id, action: 'task_moved', meta: { from: sourceListId, to: targetListId } });
    emitToBoard(task.board_id, 'task:moved', { taskId: id, sourceListId, targetListId, newPosition, task: updatedTask });

    res.json({ task: updatedTask });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const assignUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const { rows: [task] } = await query('SELECT board_id FROM tasks WHERE id = $1', [id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await query(
      'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, userId]
    );

    const fullTask = await getTaskWithAssignees(id);
    emitToBoard(task.board_id, 'task:updated', { task: fullTask });
    res.json({ task: fullTask });
  } catch (err) { next(err); }
};

const unassignUser = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { rows: [task] } = await query('SELECT board_id FROM tasks WHERE id = $1', [id]);

    await query('DELETE FROM task_assignees WHERE task_id = $1 AND user_id = $2', [id, userId]);

    const fullTask = await getTaskWithAssignees(id);
    emitToBoard(task.board_id, 'task:updated', { task: fullTask });
    res.json({ task: fullTask });
  } catch (err) { next(err); }
};

// Helper
const getTaskWithAssignees = async (taskId) => {
  const { rows: [task] } = await query(`
    SELECT t.*,
      json_agg(DISTINCT jsonb_build_object('id', u.id, 'username', u.username, 'avatar_color', u.avatar_color))
        FILTER (WHERE u.id IS NOT NULL) as assignees
    FROM tasks t
    LEFT JOIN task_assignees ta ON t.id = ta.task_id
    LEFT JOIN users u ON ta.user_id = u.id
    WHERE t.id = $1
    GROUP BY t.id
  `, [taskId]);
  return task;
};

module.exports = { getTasks, createTask, updateTask, deleteTask, moveTask, assignUser, unassignUser };