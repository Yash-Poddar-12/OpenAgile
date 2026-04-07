const express = require('express');
const router = express.Router();
const { generateExport, getRecentExports } = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * server/routes/export.routes.js
 * API router for the export system.
 */

// POST /api/v1/export - Generate and download export artifacts
// requireRole excludes Viewer
router.post('/', authMiddleware, requireRole('Admin', 'ProjectManager', 'RepoAnalyst'), generateExport);

// GET /api/v1/export/recent - Get history of user's exports
router.get('/recent', authMiddleware, getRecentExports);

module.exports = router;
