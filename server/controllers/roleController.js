const Role = require('../models/Role');

/**
 * GET /api/v1/roles
 * Returns all Role documents.
 */
const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({}).lean();
    return res.status(200).json({ roles });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/roles/:id
 * Param :id resolves to roleName (unique string identifier).
 * Body: { permissions: { fileMapScan, viewProjects, ... } }
 * Updates the permissions object for the matching role.
 */
const updateRole = async (req, res, next) => {
  try {
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'permissions object is required' });
    }

    // Allow only known permission keys to be updated
    const allowedKeys = [
      'fileMapScan',
      'viewProjects',
      'editIssues',
      'kanban',
      'export',
      'adminPanel',
    ];

    const sanitized = {};
    for (const key of allowedKeys) {
      if (key in permissions) {
        sanitized[`permissions.${key}`] = Boolean(permissions[key]);
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ error: 'No valid permission fields provided' });
    }

    const role = await Role.findOneAndUpdate(
      { roleName: req.params.id },
      { $set: sanitized },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    return res.status(200).json({ role });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/roles
 * Body: { roleName, color, permissions: { ... } }
 */
const createRole = async (req, res, next) => {
  try {
    const { roleName, color, permissions } = req.body;

    if (!roleName || !color || !permissions) {
      return res.status(400).json({ error: 'roleName, color, and permissions are required' });
    }

    const existingRole = await Role.findOne({ roleName });
    if (existingRole) {
      return res.status(400).json({ error: 'Role name already exists' });
    }

    const role = await Role.create({
      roleName,
      color,
      permissions
    });

    return res.status(201).json({ role });
  } catch (err) {
    next(err);
  }
};

module.exports = { listRoles, updateRole, createRole };
