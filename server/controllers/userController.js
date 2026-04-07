const User = require('../models/User');
const Role = require('../models/Role');

/**
 * GET /api/v1/users
 * Returns all users, excluding passwordHash.
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).lean();
    return res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/users/:id/role
 * Body: { role }
 * Updates the role of the user identified by userId param.
 */
const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const validRole = await Role.findOne({ roleName: role });
    if (!validRole) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { role },
      { new: true, projection: { passwordHash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Soft-deletes: sets isActive = false.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { isActive: false },
      { new: true, projection: { passwordHash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, updateRole, deactivateUser };
