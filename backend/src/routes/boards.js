const router = require('express').Router();
const { authenticate, boardAccess } = require('../middleware/auth');
const { getBoards, getBoard, createBoard, updateBoard, deleteBoard, inviteMember } = require('../controllers/boardController');

router.use(authenticate);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', boardAccess, getBoard);
router.put('/:id', boardAccess, updateBoard);
router.delete('/:id', boardAccess, deleteBoard);
router.post('/:id/members', boardAccess, inviteMember);

module.exports = router;