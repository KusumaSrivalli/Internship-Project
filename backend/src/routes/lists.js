const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createList, updateList, deleteList } = require('../controllers/listController');

router.use(authenticate);

router.post('/', createList);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

module.exports = router;