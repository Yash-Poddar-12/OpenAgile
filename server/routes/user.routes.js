const express = require('express');
const router = express.Router();

const { listUsers, updateRole, deactivateUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All user management routes require authentication + Admin role
router.use(authMiddleware, requireRole('Admin'));

// GET /api/v1/users
router.get('/', listUsers);

// PATCH /api/v1/users/:id/role
router.patch('/:id/role', updateRole);

// DELETE /api/v1/users/:id  (soft delete — sets isActive=false)
router.delete('/:id', deactivateUser);

module.exports = router;
