// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Load environment variables first — before anything else
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Connect to MongoDB immediately on startup
// ─────────────────────────────────────────────────────────────────────────────
const connectDB = require('./config/db');
connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// Core dependencies
// ─────────────────────────────────────────────────────────────────────────────
const http = require('http');
const fs   = require('fs');
const path = require('path');

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { Server }   = require('socket.io');
const morgan       = require('morgan');

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const roleRouter = require('./routes/role.routes');
const projectRouter = require('./routes/project.routes');
const sprintRouter  = require('./routes/sprint.routes');
const issueRouter   = require('./routes/issue.routes');
const activityRouter = require('./routes/activity.routes');
const scanRouter     = require('./routes/scan.routes');
const analyticsRouter = require('./routes/analytics.routes');
const exportRouter    = require('./routes/export.routes');

// ─────────────────────────────────────────────────────────────────────────────
// Step 15: JWT_SECRET guard — fail fast before binding to a port
// ─────────────────────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('[Startup] JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Create Express application
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Security headers
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", process.env.CLIENT_URL]
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: CORS
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Step 6: Body parsing
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// Step 7: MongoDB query injection sanitization
// ─────────────────────────────────────────────────────────────────────────────
app.use(mongoSanitize());

// HTTP request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 8: Auth-specific rate limiter — tighter limit, applied first
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Step 9: General rate limiter — covers the rest of /api/v1
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/v1', generalLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Step 10: Mount route handlers
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     authRouter);
app.use('/api/v1/users',    userRouter);
app.use('/api/v1/roles',    roleRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/sprints',  sprintRouter);
app.use('/api/v1/issues',   issueRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/scan',     scanRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/export',    exportRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Step 11: 404 catch-all (must come after all routes)
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 12: Global error handler (must be last middleware — 4 args)
// ─────────────────────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS_DIR — ensure the directory exists before accepting requests
// ─────────────────────────────────────────────────────────────────────────────
const exportsDir = process.env.EXPORTS_DIR || './exports/filemap';
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
  console.log(`[Startup] Created exports directory: ${exportsDir}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 13: Create HTTP server wrapping the Express app
// ─────────────────────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────────────────────────
// Step 14: Initialize Socket.io (handlers wired in Phase 2)
// ─────────────────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Initialize real-time handlers
require('./sockets/boardSocket')(io);
require('./sockets/scanSocket')(io);

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

// ─────────────────────────────────────────────────────────────────────────────
// Step 16: Start listening
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = { app, server, io }; // exported for testing
