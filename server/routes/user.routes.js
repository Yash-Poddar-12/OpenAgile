const express = require('express');
const router = express.Router();

const { listUsers, listActiveUsers, updateRole, deactivateUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/active', listActiveUsers);

// All user management routes below require Admin role
router.use(requireRole('Admin'));

// GET /api/v1/users
router.get('/', listUsers);

// PATCH /api/v1/users/:id/role
router.patch('/:id/role', updateRole);

// DELETE /api/v1/users/:id  (soft delete — sets isActive=false)
router.delete('/:id', deactivateUser);

module.exports = router;
