const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask, moveTask, assignUser, unassignUser } = require('../controllers/taskController');

router.use(authenticate);

router.get('/board/:boardId', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/:id/move', moveTask);
router.post('/:id/assignees', assignUser);
router.delete('/:id/assignees/:userId', unassignUser);

module.exports = router;