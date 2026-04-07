/**
 * Role hierarchy (for reference only — enforcement is done via allowedRoles array):
 *   ['Admin', 'ProjectManager', 'Developer', 'RepoAnalyst', 'Viewer']
 */

/**
 * requireRole(...allowedRoles)
 * Returns Express middleware that checks req.user.role is in allowedRoles.
 *
 * Usage:
 *   router.post('/projects', authMiddleware, requireRole('Admin', 'ProjectManager'), createProject)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { requireRole };
