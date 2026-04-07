const express = require('express');
const router = express.Router();
const { startScan, getResults, getScanHistory } = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * server/routes/scan.routes.js
 * API router for repository dependency scanning.
 */

// POST /api/v1/scan - start a new scan
// requireRole excludes Viewer
router.post('/', authMiddleware, requireRole('Admin', 'ProjectManager', 'Developer', 'RepoAnalyst'), startScan);

// GET /api/v1/scan/history - get scan history records
// IMPORTANT: /history must be defined BEFORE /:id/results in router to prevent route collision
router.get('/history', authMiddleware, getScanHistory);

// GET /api/v1/scan/:id/results - check scan status or get results
router.get('/:id/results', authMiddleware, getResults);

module.exports = router;
