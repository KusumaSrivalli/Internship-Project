const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { searchUsers } = require('../controllers/userController');

router.use(authenticate);
router.get('/search', searchUsers);

module.exports = router;