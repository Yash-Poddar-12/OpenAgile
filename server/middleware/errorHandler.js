/**
 * Global error-handling middleware (must be registered LAST in Express).
 * Signature: (err, req, res, next) — 4 args identifies it as an error handler.
 *
 * Handled cases:
 *   - mongoose ValidationError  → 400 with per-field messages
 *   - Duplicate key (11000)     → 409 { error: 'Email already exists' }
 *   - JWT errors                → 401 { error: 'Invalid or expired token' }
 *   - All other errors          → 500 { error: err.message }
 */
const errorHandler = (err, req, res, next) => {
  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  // JWT Errors
  if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError' ||
    err.name === 'NotBeforeError'
  ) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // All other errors — log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorHandler]', err);
  }

  return res.status(500).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
