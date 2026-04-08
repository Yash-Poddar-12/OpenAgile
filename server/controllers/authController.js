const jwt = require('jsonwebtoken');
const User = require('../models/User');

const DEMO_ROLE = 'Admin';

/**
 * Generate a signed JWT for the given user document.
 * Payload: { userId, role, email }
 */
const signToken = (user) => {
  return jwt.sign(
    { userId: user.userId, role: DEMO_ROLE, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );
};

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Manual validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check uniqueness before attempting insert (friendlier error)
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Create user — set passwordHash to plain password; pre-save hook will hash it
    const role = DEMO_ROLE;
    
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // pre-save hook hashes this automatically
      role
    });

    await user.save();

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: DEMO_ROLE,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user (case-insensitive via static method)
    const user = await User.findByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Use the instance method — no direct bcrypt call in the controller
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.status(200).json({
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: DEMO_ROLE,
      },
    });
  } catch (err) {
    next(err);
  }
};

const requestReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user || !user.isActive) {
      return res.status(200).json({
        message: 'If an active account exists for that email, a reset request has been recorded.',
      });
    }

    return res.status(200).json({
      message: 'Password reset request recorded. Contact an administrator to complete the reset.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Requires authMiddleware — req.user is already populated.
 */
const me = async (req, res, next) => {
  try {
    const user = await User.findOne(
      { userId: req.user.userId },
      { passwordHash: 0 }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plainUser = user.toObject ? user.toObject() : user;

    return res.status(200).json({
      user: {
        ...plainUser,
        role: DEMO_ROLE,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, requestReset };
