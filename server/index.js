require('dotenv').config();

const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./src/config/database');
const createApp = require('./src/config/app');
const initializeSocket = require('./src/sockets');
const { getAllowedOrigins } = require('./src/config/runtime');

const PORT = process.env.PORT || 5000;

/**
 * Start server with HTTP and Socket.IO
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);
    const allowedOrigins = getAllowedOrigins();

    // Initialize Socket.IO
    const io = socketIo(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true,
      },
    });

    initializeSocket(io);

    // Attach io to app for access in controllers/routes if needed
    app.locals.io = io;

    // Start listening
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║     ChatX Server Running              ║
║     Port: ${PORT}                         ║
║     Environment: ${process.env.NODE_ENV || 'development'}        ║
║     API: http://localhost:${PORT}       ║
║     WebSocket: ws://localhost:${PORT}   ║
╚═══════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

