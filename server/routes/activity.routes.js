const express = require('express');
const router = express.Router();
const { getActivityLog } = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/v1/activity?entityId= OR ?projectId=
router.get('/', authMiddleware, getActivityLog);

module.exports = router;
