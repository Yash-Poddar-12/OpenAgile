const express = require('express');
const router = express.Router();

const { listRoles, updateRole, createRole } = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All role management routes require authentication + Admin role
router.use(authMiddleware, requireRole('Admin'));

// GET /api/v1/roles
router.get('/', listRoles);

// PATCH /api/v1/roles/:id  (:id = roleName)
router.patch('/:id', updateRole);

// POST /api/v1/roles
router.post('/', createRole);

module.exports = router;
