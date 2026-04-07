const express = require('express');
const router = express.Router();
const { 
  createSprint, 
  listSprints, 
  activateSprint, 
  closeSprint 
} = require('../controllers/sprintController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// GET /api/v1/sprints
router.get('/', authMiddleware, listSprints);

// POST /api/v1/sprints (Admin, PM only)
router.post('/', authMiddleware, requireRole('Admin', 'ProjectManager'), createSprint);

// PATCH /api/v1/sprints/:id/activate (Admin, PM only)
router.patch('/:id/activate', authMiddleware, requireRole('Admin', 'ProjectManager'), activateSprint);

// PATCH /api/v1/sprints/:id/close (Admin, PM only)
router.patch('/:id/close', authMiddleware, requireRole('Admin', 'ProjectManager'), closeSprint);

module.exports = router;
