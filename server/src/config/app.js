const express = require('express');
const path = require('path');
const cors = require('cors');
const errorHandler = require('../middleware/errorHandler');
const { sendError } = require('../utils/response');
const { getAllowedOrigins } = require('./runtime');

/**
 * Create and configure Express app
 * Separated from server startup for better testing and modularity
 */
const createApp = () => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  // Middleware
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin or explicit wildcard in production
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        const corsError = new Error('CORS origin not allowed');
        corsError.statusCode = 403;
        callback(corsError);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: true, limit: '16kb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/users', require('../routes/users'));
  app.use('/api/conversations', require('../routes/conversations'));
  app.use('/api/messages', require('../routes/messages'));

  // Serve static files from React build in production
  const isDev = process.env.NODE_ENV !== 'production';
  if (!isDev) {
    // __dirname is /app/server/src/config in production container
    // Root client build lives at /app/client/dist
    const clientBuildPath = path.join(__dirname, '../../../client/dist');
    app.use(express.static(clientBuildPath));

    // SPA catch-all: serve React app for all non-API routes
    app.use((req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    // In development, show info endpoint
    app.use((req, res) => {
      res.status(404).json(sendError(`Route ${req.originalUrl} not found`, 404));
    });
  }

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
