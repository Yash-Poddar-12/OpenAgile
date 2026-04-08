const jwt = require('jsonwebtoken');

const DEMO_ROLE = 'Admin';

/**
 * authMiddleware
 * Reads the Authorization header, verifies the JWT, and attaches
 * req.user = { userId, role, email } on success.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: DEMO_ROLE,
      email: decoded.email,
    };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authMiddleware;
