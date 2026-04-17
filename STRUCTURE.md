# ChatX - Project Structure & Setup Guide

## Final Directory Structure

```
ChatX/
│
├── client/                          # React + Vite Frontend
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ChatWindow.jsx       # Main chat display area
│   │   │   ├── MessageList.jsx      # Message list view
│   │   │   ├── MessageInput.jsx     # Message input form
│   │   │   ├── Sidebar.jsx          # Conversations sidebar
│   │   │   └── UserSearch.jsx       # User search component
│   │   │
│   │   ├── context/                 # React Context providers
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── ChatContext.jsx      # Chat/message state
│   │   │   └── SocketContext.jsx    # Socket.IO connection state
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js           # Auth hook for auth context
│   │   │   ├── useChat.js           # Chat hook for chat operations
│   │   │   └── useSocket.js         # Socket hook for socket operations
│   │   │
│   │   ├── layouts/                 # Layout components
│   │   │   ├── AuthLayout.jsx       # Layout for auth pages
│   │   │   └── MainLayout.jsx       # Layout for chat pages
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── ChatPage.jsx         # Main chat page
│   │   │   ├── LoginPage.jsx        # Login page
│   │   │   └── RegisterPage.jsx     # Registration page
│   │   │
│   │   ├── routes/                  # Routing logic
│   │   │   ├── AppRoutes.jsx        # Main app routes
│   │   │   └── ProtectedRoute.jsx   # Protected route wrapper
│   │   │
│   │   ├── services/                # API & Socket.IO services
│   │   │   ├── api.js               # Axios API client instance
│   │   │   └── socket.js            # Socket.IO client setup
│   │   │
│   │   ├── store/                   # State management
│   │   │   └── (optional: Redux, Zustand, etc.)
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── constants.js         # App constants
│   │   │   └── helpers.js           # Helper functions
│   │   │
│   │   ├── App.jsx                  # Main App component
│   │   ├── App.css                  # App styles
│   │   ├── index.css                # Global styles (Tailwind)
│   │   └── main.jsx                 # Vite entry point
│   │
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Dependencies & scripts
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── index.html                   # HTML entry point
│
├── server/                          # Node.js + Express Backend
│   ├── node_modules/
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   └── database.js          # MongoDB connection
│   │   │
│   │   ├── controllers/             # Route controllers
│   │   │   ├── authController.js    # Auth logic (register, login)
│   │   │   ├── userController.js    # User operations
│   │   │   ├── conversationController.js  # Conversation operations
│   │   │   └── messageController.js # Message operations
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js              # JWT verification middleware
│   │   │   └── errorHandler.js      # Error handling middleware
│   │   │
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.js              # User schema & model
│   │   │   ├── Conversation.js      # Conversation schema & model
│   │   │   └── Message.js           # Message schema & model
│   │   │
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.js              # /api/auth routes
│   │   │   ├── conversations.js     # /api/conversations routes
│   │   │   ├── messages.js          # /api/messages routes
│   │   │   └── users.js             # /api/users routes
│   │   │
│   │   ├── services/                # Business logic
│   │   │   └── authService.js       # Auth service functions
│   │   │
│   │   ├── sockets/                 # Socket.IO handlers
│   │   │   └── index.js             # Socket event handlers
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   └── jwt.js               # JWT token utilities
│   │   │
│   │   └── validators/              # Input validation
│   │       └── auth.js              # Auth validation schemas
│   │
│   ├── index.js                     # Server entry point
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore                   # Git ignore rules
│   └── package.json                 # Dependencies & scripts
│
├── .gitignore                       # Root-level Git ignore
└── README.md                        # Project documentation
```

## Quick Setup

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local with your API endpoint
npm run dev
```

## File Organization Rationale

### Frontend (`client/src/`)
- **components/**: Reusable UI building blocks (ChatWindow, MessageList, etc.)
- **pages/**: Full page components (LoginPage, ChatPage, RegisterPage)
- **layouts/**: Shared layout wrappers for different page types
- **context/**: Global state management using React Context API
- **hooks/**: Custom hooks for reusable logic (useAuth, useChat, useSocket)
- **services/**: External API calls and Socket.IO client
- **routes/**: Routing configuration and protected route logic
- **utils/**: Helper functions and constants
- **store/**: Optional: Redux or Zustand for complex state management

### Backend (`server/src/`)
- **config/**: Database and application configuration
- **models/**: Mongoose schemas (User, Conversation, Message)
- **controllers/**: Request handlers for each resource
- **routes/**: API endpoint definitions
- **middleware/**: Authentication and error handling
- **services/**: Business logic separated from controllers
- **sockets/**: WebSocket event handlers for real-time features
- **validators/**: Input validation schemas and functions
- **utils/**: Helper utilities (JWT, password hashing, etc.)

## API Routing Convention

All APIs follow `/api/resource` pattern:
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User operations
- `/api/conversations/*` - Conversation management
- `/api/messages/*` - Message operations

## Environment Variables

### Server (.env)
```
MONGODB_URI=mongodb://localhost:27017/chatx
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Client (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Development Scripts

### Server
- `npm run dev` - Start with nodemon (watches for changes)
- `npm start` - Start production server

### Client  
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Next Steps

1. **Implement Database Layer** (models + config)
2. **Build Authentication** (register, login, JWT)
3. **Create REST APIs** (CRUD endpoints)
4. **Setup Socket.IO** (real-time chat)
5. **Build Frontend UI** (components + pages)
6. **Connect Frontend to Backend** (API calls + sockets)
7. **Add Features** (typing indicator, online status, read receipts)
8. **Testing & Deployment**

## Notes

- Keep frontend focused on UI and API consumption
- Keep backend responsible for auth, validation, and business logic
- Use environment variables for all secrets and configuration
- Follow RESTful principles for API design
- Use Socket.IO for real-time features
- Always validate user input on both frontend and backend
