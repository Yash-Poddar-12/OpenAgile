const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * server/routes/analytics.routes.js
 * API router for repository metrics and trends.
 */

// GET /api/v1/analytics
// requireRole excludes Viewer
router.get('/', authMiddleware, requireRole('Admin', 'ProjectManager', 'Developer', 'RepoAnalyst'), getAnalytics);

module.exports = router;
