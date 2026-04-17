# Backend Setup Complete

## Files Created & Purpose

### Config Files
1. **src/config/database.js** - MongoDB connection using Mongoose
   - Connects to MongoDB using `MONGODB_URI` from environment
   - Handles connection errors and exits process on failure
   - Returns mongoose connection object

2. **src/config/app.js** - Express application factory
   - Creates and configures Express app in a reusable way
   - Applies CORS middleware (configured for frontend origin)
   - Sets up JSON and URL-encoded body parsing
   - Mounts all API routes
   - Includes 404 handler for undefined routes
   - Applies global error handler as final middleware

### Middleware
1. **src/middleware/auth.js** - JWT authentication middleware
   - `protect` - Verifies JWT token from Authorization header
   - Extracts token using `Bearer {token}` format
   - Attaches decoded user data to `req.user`
   - Returns 401 for missing or invalid tokens

2. **src/middleware/errorHandler.js** - Global error handling middleware
   - Catches all errors from routes and passes to this middleware
   - Must be defined last in middleware stack
   - Returns consistent error response structure
   - Logs errors to console for debugging

### Utilities
1. **src/utils/jwt.js** - JWT token utilities
   - `generateToken(userId)` - Creates JWT token valid for 7 days
   - `verifyToken(token)` - Verifies and decodes token
   - `decodeToken(token)` - Safely decodes token without verification

2. **src/utils/asyncHandler.js** - Async error wrapper
   - Wraps async route handlers to catch promise rejections
   - Passes errors to global error handler middleware
   - Eliminates need for try-catch in every controller

3. **src/utils/response.js** - Response structure utilities
   - `sendResponse(data, message, statusCode)` - Success response
   - `sendError(message, statusCode, error)` - Error response
   - Consistent API response structure with timestamp
   - Shows error details only in development mode

### Routes
1. **src/routes/auth.js** - Authentication endpoints
   - POST /api/auth/register - Register new user
   - POST /api/auth/login - Login user
   - GET /api/auth/me - Get current user (protected)

2. **src/routes/users.js** - User endpoints
   - GET /api/users/search?q=query - Search users (protected)
   - GET /api/users/:id - Get user profile (protected)
   - PUT /api/users/:id - Update profile (protected)

3. **src/routes/conversations.js** - Conversation endpoints
   - GET /api/conversations - Get all conversations (protected)
   - POST /api/conversations - Create new conversation (protected)
   - GET /api/conversations/:id - Get conversation (protected)
   - DELETE /api/conversations/:id - Delete conversation (protected)

4. **src/routes/messages.js** - Message endpoints
   - GET /api/messages/:conversationId - Get messages (protected)
   - POST /api/messages - Send message (protected)
   - PUT /api/messages/:id - Edit message (protected)
   - DELETE /api/messages/:id - Delete message (protected)

### Controllers
1. **src/controllers/authController.js**
   - `register()` - Register new user
   - `login()` - Login user
   - `getCurrentUser()` - Get authenticated user

2. **src/controllers/userController.js**
   - `searchUsers()` - Search users by query
   - `getUserProfile()` - Get user profile details
   - `updateUserProfile()` - Update user information

3. **src/controllers/conversationController.js**
   - `getConversations()` - Get user's conversations
   - `createConversation()` - Create new conversation
   - `getConversation()` - Get single conversation with messages
   - `deleteConversation()` - Delete conversation

4. **src/controllers/messageController.js**
   - `getMessages()` - Get paginated messages
   - `sendMessage()` - Send new message
   - `editMessage()` - Edit message content
   - `deleteMessage()` - Delete message

### Services & Validators
1. **src/services/authService.js** - Auth business logic
   - `hashPassword()` - Hash password with bcryptjs
   - `comparePassword()` - Verify password
   - `isValidEmail()` - Validate email format
   - `isValidPassword()` - Validate password strength (min 6 chars)

2. **src/validators/auth.js** - Input validation
   - `validateRegister()` - Validate registration input
   - `validateLogin()` - Validate login input

### Socket.IO
1. **src/sockets/index.js** - WebSocket event handlers
   - `authenticate` - Authenticate socket connection
   - `join-room` - Join conversation room
   - `leave-room` - Leave conversation room
   - `send-message` - Send message (TBD)
   - `typing` - Typing indicator (TBD)
   - `stop-typing` - Stop typing indicator (TBD)
   - `disconnect` - Handle user disconnect

### Server Entry Point
1. **index.js** - Main server startup file
   - Loads environment variables from .env
   - Connects to MongoDB
   - Creates Express app
   - Creates HTTP server
   - Initializes Socket.IO
   - Listens on PORT with graceful shutdown handling

2. **.env** - Development environment variables (created from template)
   - MONGODB_URI: mongodb://localhost:27017/chatx
   - JWT_SECRET: JWT signing secret (change in production)
   - PORT: 5000
   - NODE_ENV: development
   - FRONTEND_URL: http://localhost:5173

## Architecture & Flow

### Request Flow
```
Client Request
    ↓
Express Router (routes/*)
    ↓
Optional: Auth Middleware (protect)
    ↓
Controller (controllers/*)
    ↓
Service Layer (services/*)
    ↓
Database (Models)
    ↓
Response Utility (sendResponse/sendError)
    ↓
Error Handler Middleware (if error thrown)
    ↓
Client Response
```

### Response Structure
```json
{
  "success": true/false,
  "statusCode": 200/400/500,
  "message": "Success or error message",
  "data": { /* data if successful */ },
  "error": "error details in development only",
  "timestamp": "2024-03-30T..."
}
```

## How to Run Backend

### Prerequisites
- Node.js (v14+)
- MongoDB running locally (mongodb://localhost:27017) or cloud instance

### Steps
```bash
# 1. Enter server directory
cd server

# 2. Install dependencies (already done)
npm install

# 3. Configure .env file (already created with defaults)
# Edit .env to change MongoDB URI, JWT secret, or port if needed

# 4. Start development server (watches for file changes)
npm run dev

# OR start production server
npm start
```

### Expected Output
```
╔═══════════════════════════════════════╗
║     ChatX Server Running              ║
║     Port: 5000                        ║
║     Environment: development          ║
║     API: http://localhost:5000        ║
║     WebSocket: ws://localhost:5000    ║
╚═══════════════════════════════════════╝
```

### Test Server
```bash
# Test health endpoint
curl http://localhost:5000/health

# Response:
{
  "status": "Server is running",
  "timestamp": "2024-03-30T..."
}
```

## Error Handling Pattern

### Controller Example
```javascript
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  const { isValid, errors } = validateRegister({ username, email, password });
  if (!isValid) {
    return res.status(400).json(sendError('Validation failed', 400, errors));
  }

  // Business logic...
  const user = await User.create({ username, email, password });

  res.status(201).json(sendResponse(user, 'User created successfully', 201));
});
```

### Error thrown anywhere → automatically caught by asyncHandler → passed to errorHandler middleware → consistent error response

## Next Steps

1. **Build Database Models** - Create Mongoose schemas for User, Conversation, Message
2. **Implement Auth Controllers** - Register, login, password hashing
3. **Implement CRUD Controllers** - User, conversation, message operations
4. **Wire Routes to Controllers** - Connect endpoints to logic
5. **Implement Socket.IO Events** - Real-time message handling
6. **Test Endpoints** - Use Postman/curl to verify APIs
7. **Frontend Integration** - Connect React app to backend APIs

## Key Features Implemented

✅ Environment-based configuration
✅ MongoDB connection with Mongoose
✅ Express app factory pattern (separation of concerns)
✅ JWT authentication middleware
✅ Global error handling with consistent response format
✅ Async error wrapper to eliminate try-catch boilerplate
✅ CORS configured for frontend origin
✅ Socket.IO server initialized and ready
✅ Route structure with placeholder endpoints
✅ Controller structure with documentation
✅ Service layer for business logic
✅ Validation utilities for input checking
✅ Graceful server shutdown on Ctrl+C

## Running Status

The backend infrastructure is ready! You can now start the server with `npm run dev`. The health endpoint responds, and all routes are ready for implementation.
