const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getActivities } = require('../controllers/activityController');

router.use(authenticate);
router.get('/board/:boardId', getActivities);

module.exports = router;