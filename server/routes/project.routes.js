const express = require('express');
const router = express.Router();
const { 
  createProject, 
  listProjects, 
  getProject, 
  archiveProject,
  updateProject,
  unarchiveProject
} = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// GET /api/v1/projects
router.get('/', authMiddleware, listProjects);

// POST /api/v1/projects (Admin, PM only)
router.post('/', authMiddleware, requireRole('Admin', 'ProjectManager'), createProject);

// GET /api/v1/projects/:id
router.get('/:id', authMiddleware, getProject);

// PATCH /api/v1/projects/:id (Admin, PM, or Owner)
router.patch('/:id', authMiddleware, updateProject);

// PATCH /api/v1/projects/:id/archive (Admin, PM only)
router.patch('/:id/archive', authMiddleware, requireRole('Admin', 'ProjectManager'), archiveProject);

// PATCH /api/v1/projects/:id/reactivate (Admin, PM only)
router.patch('/:id/reactivate', authMiddleware, requireRole('Admin', 'ProjectManager'), unarchiveProject);

module.exports = router;
