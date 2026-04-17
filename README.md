# ChatX

> A full-stack MERN real-time chat application with JWT authentication, Socket.IO messaging, and live presence tracking

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Resume-Friendly Description](#resume-friendly-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Socket Events](#socket-events)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [Why This Project Stands Out](#why-this-project-stands-out)
- [License](#license)

## 🎯 Overview

ChatX is a full-stack MERN real-time chat application built for one-to-one messaging. It combines JWT-based authentication, a responsive React frontend, an Express and MongoDB backend, and Socket.IO for live messaging, typing indicators, presence, read receipts, and last-seen updates.

This project demonstrates how to build a modern chat product with:

- ✅ Secure authentication and protected routes
- ✅ Conversation discovery and one-to-one chat creation
- ✅ Realtime message delivery with Socket.IO
- ✅ Typing indicators, online status, and last-seen presence
- ✅ Read receipts and responsive chat UI patterns
- ✅ Practical security and validation improvements

It is designed to be clean enough for portfolio use while still being realistic about real-world app structure, API boundaries, and realtime event handling.

## 💼 Resume-Friendly Description

Built a full-stack MERN real-time chat application featuring JWT authentication, protected routes, one-to-one conversations, live messaging with Socket.IO, typing indicators, read receipts, and online/offline presence. Designed a responsive React frontend and a validated Express + MongoDB backend with secure API access, participant-based authorization, and realtime event synchronization.

## ✨ Features

### Authentication & Security
- User registration and login with JWT tokens
- Session bootstrap and logout
- JWT-protected REST API
- Authenticated Socket.IO connections
- Participant-based authorization

### Messaging
- One-to-one conversation creation
- Duplicate-conversation prevention
- Live incoming messages
- Paginated message history
- Message read receipts

### Real-time Features
- Typing indicators
- Online/offline presence
- Last-seen timestamps
- Live message delivery
- Real-time event synchronization

### User Experience
- Conversation sidebar with latest message preview
- Activity timestamps
- Responsive chat layout (desktop & mobile)
- Inline validation and error feedback
- Loading, empty, retry, and disconnected states

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - WebSocket client
- **React Context** - Auth and socket state management

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JSON Web Tokens (JWT)** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 🏗️ Architecture

ChatX uses a client-server architecture with separate REST and realtime layers:

### Request Flow
1. **React frontend** handles routing, auth state, protected pages, and the chat interface
2. **Axios** is used for REST requests (auth, conversations, users, and messages)
3. **Socket.IO** initializes after authentication and sends JWT during handshake
4. **Express backend** exposes protected REST endpoints and validates all payloads
5. **MongoDB** stores users, conversations, unread metadata, and messages
6. **Socket.IO** broadcasts message delivery, typing, read receipts, and presence changes to authorized conversation rooms

### Communication Layers

**HTTP (REST API)**
- Registration, login, session restore
- Conversation fetches
- User search
- Confirmed message submission

**WebSockets (Socket.IO)**
- Presence updates
- Typing indicators
- Read receipts
- Room joins
- Real-time message delivery

Both layers enforce participant checks for conversations and messages.

## 📁 Project Structure

```
ChatX/
│
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI and chat components
│   │   ├── context/          # Auth and socket providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Auth and app layouts
│   │   ├── pages/            # Login, register, and chat pages
│   │   ├── routes/           # Route configuration and guards
│   │   ├── services/         # API, auth, chat, token, socket services
│   │   └── utils/            # Frontend helpers and normalizers
│   ├── .env.example
│   └── package.json
│
├── server/                    # Backend application
│   ├── src/
│   │   ├── config/           # App, database, runtime configuration
│   │   ├── controllers/      # REST endpoint handlers
│   │   ├── middleware/       # Auth and error middleware
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Presence and backend helpers
│   │   ├── sockets/          # Socket.IO auth and event handlers
│   │   ├── utils/            # Response, JWT, and input utilities
│   │   └── validators/       # Request payload validation
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ChatX.git
cd ChatX
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

## ⚙️ Configuration

### Server Environment Variables

Create `server/.env` from `server/.env.example`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/chatx

# JWT Configuration
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

**Optional:**
```env
FRONTEND_URLS=http://localhost:5173,http://localhost:4173
```

### Client Environment Variables

Create `client/.env.local` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🏃 Running Locally

### Start the Backend

From the `server` folder:

```bash
npm run dev
```

The API server runs by default on **http://localhost:5000**

### Start the Frontend

From the `client` folder:

```bash
npm run dev
```

The frontend runs by default on **http://localhost:5173**

### Production Build

To create a production build of the frontend:

```bash
cd client
npm run build
```

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register a new user | ❌ |
| `POST` | `/auth/login` | Authenticate user and return JWT | ❌ |
| `GET` | `/auth/me` | Fetch current authenticated user | ✅ |
| `POST` | `/auth/logout` | Logout and update last-seen | ✅ |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users` | List users (except current user) | ✅ |
| `GET` | `/users/search?q=` | Search users by name or email | ✅ |
| `GET` | `/users/:id` | Fetch user profile summary | ✅ |

### Conversation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/conversations` | Get current user conversations | ✅ |
| `POST` | `/conversations` | Create or fetch existing 1-on-1 conversation | ✅ |
| `GET` | `/conversations/:id` | Fetch conversation details | ✅ |

### Message Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/messages/:conversationId?page=1&limit=30` | Fetch paginated messages | ✅ |
| `POST` | `/messages` | Send a message | ✅ |
| `PATCH` | `/messages/:id/read` | Mark message as read | ✅ |

## 🔌 Socket Events

Socket connections are authenticated with the same JWT used for REST requests.

### Client → Server Events

| Event | Description |
|-------|-------------|
| `join_conversation` | Join a conversation room after selection |
| `send_message` | Send a message payload through Socket.IO |
| `typing_start` | Notify the room that user started typing |
| `typing_stop` | Notify the room that user stopped typing |
| `read_message` | Mark a message as read in realtime |

### Server → Client Events

| Event | Description |
|-------|-------------|
| `connected` | Initial socket connection acknowledgement |
| `joined_conversation` | Confirms room join and current room users |
| `receive_message` | New incoming message event |
| `receive_read_receipt` | Read receipt update |
| `typing_started` | Active typing indicator event |
| `typing_stopped` | Typing stopped event |
| `user_online` | Presence update when user comes online |
| `user_offline` | Presence update when user disconnects |
| `error` | Validation or socket operation error |

## 📸 Screenshots

> Add screenshots here before sharing the project publicly.

**Suggested screenshots:**
- Login page
- Register page
- Conversation sidebar
- Active chat window
- Mobile responsive view

**Suggested file layout:**
```
docs/
└── screenshots/
    ├── login.png
    ├── register.png
    ├── sidebar.png
    ├── chat-window.png
    └── mobile.png
```

## 🚀 Future Improvements

- [ ] Group chat support
- [ ] Message attachments and file uploads
- [ ] Message reactions
- [ ] Delivery retry and offline queue handling
- [ ] Pagination or infinite scroll in the conversation list
- [ ] Better test coverage for controllers, validators, and socket flows
- [ ] Rate limiting for auth, search, and message endpoints
- [ ] Docker and deployment configuration
- [ ] End-to-end tests for auth and realtime chat flows

## 🌟 Why This Project Stands Out

- **Full-Stack Architecture:** Demonstrates both REST and realtime architecture in one application
- **Production Patterns:** Shows practical full-stack ownership across UI, backend, and WebSocket flows
- **Comprehensive Features:** Includes auth, authorization, validation, presence, and realtime state syncing
- **Clean Code Structure:** Uses reusable frontend structure instead of a single-page prototype
- **Production-Ready UX:** Reflects product thinking with loading, empty, error, retry, and disconnected states
- **Portfolio-Ready:** Clean enough for portfolio use while realistic about real-world app structure

---

**Built with ❤️ using the MERN stack**
#   C h a t t a p k  
 