# User API Documentation

Complete documentation for user-related endpoints in ChatX API.

## Overview

All user endpoints are **protected routes** that require JWT authentication via `Authorization: Bearer <token>` header.

### Key Features
- ✅ Search users by name or email
- ✅ Discover all users (paginated)
- ✅ Get user profiles by ID
- ✅ Current user excluded from discovery/search results
- ✅ Efficient queries with field projection
- ✅ No sensitive fields exposed (password hidden)
- ✅ Pagination support with limit/offset

---

## API Endpoints

### 1. Get All Users (Discover/Browse)

**Endpoint:** `GET /api/users`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/users?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "lastSeen": "2026-03-30T10:30:00.000Z",
        "createdAt": "2026-03-15T08:45:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Bob Smith",
        "email": "bob@example.com",
        "avatar": null,
        "lastSeen": "2026-03-30T08:15:00.000Z",
        "createdAt": "2026-03-14T09:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  },
  "message": "Users retrieved successfully",
  "statusCode": 200
}
```

**Notes:**
- Current logged-in user is automatically excluded from results
- Results sorted by newest first (`createdAt` descending)
- `hasMore` indicates if there are more results available
- Safe fields only: `_id`, `name`, `email`, `avatar`, `lastSeen`, `createdAt`

---

### 2. Search Users

**Endpoint:** `GET /api/users/search?q=query`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `q` (required): Search query (2-100 characters)
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Search Features:**
- Case-insensitive matching
- Searches both `name` and `email` fields
- Regex-based for flexible matching
- Current user automatically excluded

**Request Examples:**

Search by name:
```bash
curl -X GET "http://localhost:5000/api/users/search?q=alice" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Search by email:
```bash
curl -X GET "http://localhost:5000/api/users/search?q=bob@example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Partial name search:
```bash
curl -X GET "http://localhost:5000/api/users/search?q=john&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "lastSeen": "2026-03-30T10:30:00.000Z",
        "createdAt": "2026-03-15T08:45:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  },
  "message": "Search results retrieved successfully",
  "statusCode": 200
}
```

**Error Response - Missing Query (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "q": "Search query is required"
  }
}
```

**Error Response - Query Too Short (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "q": "Search query must be at least 2 characters"
  }
}
```

**Notes:**
- Results sorted alphabetically by name
- Empty results return `users: []` with `total: 0`
- Pagination works same as getAllUsers endpoint

---

### 3. Get User Profile by ID

**Endpoint:** `GET /api/users/:id`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required): MongoDB ObjectId of the user

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "avatar": "https://example.com/avatar1.jpg",
    "lastSeen": "2026-03-30T10:30:00.000Z",
    "createdAt": "2026-03-15T08:45:00.000Z"
  },
  "message": "User profile retrieved successfully",
  "statusCode": 200
}
```

**Error Response - Invalid ID Format (400):**
```json
{
  "success": false,
  "message": "Invalid user ID format",
  "statusCode": 400
}
```

**Error Response - User Not Found (404):**
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

**Notes:**
- ID must be valid MongoDB ObjectId (24 hex characters)
- Returns same safe fields as other endpoints
- Useful for loading user profile in chat sidebar or detailed view

---

## Authentication

### Getting a JWT Token

First, register or login to get a token:

```bash
# Register
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'

# Or login
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Response includes `token`:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Use the token in all user API requests:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Returned

### User Object (Safe Fields)

All user endpoints return the following safe fields:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | MongoDB unique user identifier |
| `name` | String | User's full name |
| `email` | String | User's email address |
| `avatar` | String\|null | URL to user's avatar image |
| `lastSeen` | ISO 8601 | Last time user was active (for online status) |
| `createdAt` | ISO 8601 | Account creation timestamp |

### Sensitive Fields (Never Returned)

- `password` - Always excluded
- `__v` - Mongoose version field not included
- Any other database internals

---

## Pagination

All list endpoints support pagination via query parameters:

```bash
# Get 15 results starting from offset 30
curl -X GET "http://localhost:5000/api/users?limit=15&offset=30"
```

**Pagination Object:**
```json
{
  "pagination": {
    "total": 150,        // Total matching records
    "limit": 15,         // Results per page
    "offset": 30,        // Results skipped
    "hasMore": true      // More results available?
  }
}
```

**Pagination Logic:**
- `limit`: Capped at 100 (max 100 results per request)
- `offset`: 0-based (0 = first result)
- `hasMore`: `true` if `offset + limit < total`
- Use `hasMore` to determine if there are more pages to load

**Example Pagination Flow:**
1. Get first page: `?limit=20&offset=0`
2. If `hasMore: true`, load next: `?limit=20&offset=20`
3. Continue until `hasMore: false`

---

## Error Handling

### Common Errors

**401 Unauthorized - Missing/Invalid Token:**
```bash
# No Authorization header
curl http://localhost:5000/api/users
```
Response:
```json
{
  "success": false,
  "message": "No token, authorization denied",
  "statusCode": 401
}
```

**401 Unauthorized - Expired Token:**
```json
{
  "success": false,
  "message": "Token is not valid",
  "statusCode": 401
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "fieldName": "Field-specific error message"
  }
}
```

**404 Not Found - User doesn't exist:**
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

---

## Use Cases

### 1. Chat Sidebar - Discover Users

Load a paginated list of all users for the chat sidebar:

```bash
curl -X GET "http://localhost:5000/api/users?limit=10&offset=0" \
  -H "Authorization: Bearer ${TOKEN}"
```

Then paginate with:
```bash
curl -X GET "http://localhost:5000/api/users?limit=10&offset=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 2. Search Bar - Find Users by Name/Email

User types in search box, debounce and call:

```bash
curl -X GET "http://localhost:5000/api/users/search?q=alice" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 3. User Profile in Chat - Load Profile Data

When user clicks on a contact in sidebar:

```bash
curl -X GET "http://localhost:5000/api/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}"
```

Returns user data to display name, avatar, online status, etc.

---

## Implementation Notes

### Efficiency

- **Field Projection**: Only requested fields returned (no full user document)
- **Lean Queries**: `.lean()` used for read-only queries (faster)
- **Indexes**: Email indexed for fast searchability
- **Regex Search**: Case-insensitive matching without full-text search overhead

### Security

- ✅ All routes protected with JWT authentication
- ✅ Password field never exposed (select: false)
- ✅ Current user automatically excluded from results
- ✅ Input validation on all query parameters
- ✅ MongoDB ObjectId format validation

### Current User Exclusion

The current user is automatically excluded from all results:

```javascript
// In controller
{ _id: { $ne: req.user.userId } }
```

User cannot:
- See themselves in user lists
- Search and find themselves
- Request their own profile via `/api/users/:id` (though it would work)

---

## Testing Checklist

### Prerequisites
- MongoDB running: `mongosh`
- Server running: `npm run dev` in `/server`
- Valid JWT token from auth/register or auth/login

### Test Cases

**1.1 - Get all users (default pagination)**
```bash
curl -X GET "http://localhost:5000/api/users" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns list of users
✓ Current user not in list
✓ Pagination included

**1.2 - Get all users (custom limit)**
```bash
curl -X GET "http://localhost:5000/api/users?limit=5" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns max 5 users
✓ hasMore indicates if more available

**1.3 - Get all users (with offset)**
```bash
curl -X GET "http://localhost:5000/api/users?limit=10&offset=20" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Skips first 20 users
✓ Returns next 10

**2.1 - Search by name**
```bash
curl -X GET "http://localhost:5000/api/users/search?q=alice" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns users with name containing "alice"
✓ Case-insensitive match

**2.2 - Search by email**
```bash
curl -X GET "http://localhost:5000/api/users/search?q=bob@example.com" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns user with matching email
✓ Exact or partial match works

**2.3 - Search with pagination**
```bash
curl -X GET "http://localhost:5000/api/users/search?q=john&limit=5&offset=0" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Paginated search results
✓ Limit enforced

**2.4 - Search validation - empty query**
```bash
curl -X GET "http://localhost:5000/api/users/search?q=" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns 400 error
✓ Error message: "Search query is required"

**2.5 - Search validation - query too short**
```bash
curl -X GET "http://localhost:5000/api/users/search?q=a" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns 400 error
✓ Error message: "minimum 2 characters"

**3.1 - Get user by ID (valid ID)**
```bash
curl -X GET "http://localhost:5000/api/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns user data if exists
✓ All safe fields included

**3.2 - Get user by ID (invalid ID format)**
```bash
curl -X GET "http://localhost:5000/api/users/invalid-id" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns 400 error
✓ Error message: "Invalid user ID format"

**3.3 - Get user by ID (non-existent user)**
```bash
curl -X GET "http://localhost:5000/api/users/000000000000000000000000" \
  -H "Authorization: Bearer ${TOKEN}"
```
✓ Returns 404 error
✓ Error message: "User not found"

**4.1 - Missing authorization header**
```bash
curl -X GET "http://localhost:5000/api/users"
```
✓ Returns 401 error
✓ Error message: "No token, authorization denied"

**4.2 - Invalid token**
```bash
curl -X GET "http://localhost:5000/api/users" \
  -H "Authorization: Bearer invalid-token"
```
✓ Returns 401 error
✓ Error message: "Token is not valid"

---

## Response Format

All endpoints follow consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message",
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "errors": { /* validation errors if applicable */ }
}
```

---

## Related Documentation

- [Authentication API](./AUTH_API_TESTING.md) - Register, login, authentication flow
- [Conversation API](./docs/CONVERSATION_API.md) - Manage conversations (coming next)
- [Message API](./docs/MESSAGE_API.md) - Send/receive messages (coming next)
- [Database Schema](./MODELS_COMPLETE.md) - User, Conversation, Message schemas
