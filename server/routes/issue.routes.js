const express = require('express');
const router = express.Router();
const { 
  listIssues, 
  createIssue, 
  getIssue, 
  updateIssue, 
  updateStatus, 
  deleteIssue 
} = require('../controllers/issueController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// GET /api/v1/issues
router.get('/', authMiddleware, listIssues);

// POST /api/v1/issues (not Viewer, not RepoAnalyst)
// requireRole excludes them: Admin, ProjectManager, Developer
router.post('/', authMiddleware, requireRole('Admin', 'ProjectManager', 'Developer'), createIssue);

// GET /api/v1/issues/:id
router.get('/:id', authMiddleware, getIssue);

// PATCH /api/v1/issues/:id (Admin, PM, Developer)
router.patch('/:id', authMiddleware, requireRole('Admin', 'ProjectManager', 'Developer'), updateIssue);

// PATCH /api/v1/issues/:id/status (Admin, PM, Developer)
router.patch('/:id/status', authMiddleware, requireRole('Admin', 'ProjectManager', 'Developer'), updateStatus);

// DELETE /api/v1/issues/:id (Admin, PM only)
router.delete('/:id', authMiddleware, requireRole('Admin', 'ProjectManager'), deleteIssue);

module.exports = router;
