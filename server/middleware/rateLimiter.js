const rateLimit = require('express-rate-limit');

/**
 * generalLimiter — applied globally on /api/v1
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

/**
 * authLimiter — applied on /api/v1/auth/login and /api/v1/auth/register
 * 5 requests per minute per IP
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts' },
});

module.exports = { generalLimiter, authLimiter };
