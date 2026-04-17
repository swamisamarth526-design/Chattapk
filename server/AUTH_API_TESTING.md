### ChatX Authentication API - Testing Guide

## Base URL
http://localhost:5000

## Endpoints

### 1. Register New User
**POST** `/api/auth/register`
**Auth:** Not required

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "lastSeen": "2024-03-30T14:30:00.000Z",
      "createdAt": "2024-03-30T14:30:00.000Z",
      "updatedAt": "2024-03-30T14:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

#### Error Responses

**400 - Validation Failed**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "email": "Please provide a valid email address",
    "password": "Password must be at least 6 characters",
    "confirmPassword": "Passwords do not match"
  },
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

**409 - Email Already Registered**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email already registered",
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

---

### 2. Login
**POST** `/api/auth/login`
**Auth:** Not required

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "lastSeen": "2024-03-30T14:30:00.000Z",
      "createdAt": "2024-03-30T14:30:00.000Z",
      "updatedAt": "2024-03-30T14:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

#### Error Responses

**400 - Validation Failed**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "email": "Please provide a valid email address"
  },
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

**401 - Invalid Credentials**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

---

### 3. Get Current User
**GET** `/api/auth/me`
**Auth:** Required (Bearer token)

#### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null,
    "lastSeen": "2024-03-30T14:30:00.000Z",
    "createdAt": "2024-03-30T14:30:00.000Z",
    "updatedAt": "2024-03-30T14:30:00.000Z"
  },
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

#### Error Responses

**401 - No Token**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "No token provided",
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

**401 - Invalid Token**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token",
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

**404 - User Not Found**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

---

### 4. Logout
**POST** `/api/auth/logout`
**Auth:** Required (Bearer token)

#### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": null,
  "timestamp": "2024-03-30T14:30:00.000Z"
}
```

---

## Testing Sequence

### Test 1: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**Expected:** 201 Created with user and token

---

### Test 2: Login with Correct Credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Expected:** 200 OK with user and token

---

### Test 3: Get Current User (with token from login)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 200 OK with user data

---

### Test 4: Register with Invalid Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "invalid-email",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**Expected:** 400 Bad Request with validation error

---

### Test 5: Register with Mismatched Passwords
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123",
    "confirmPassword": "DifferentPassword"
  }'
```

**Expected:** 400 Bad Request with password mismatch error

---

### Test 6: Register Duplicate Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another John",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**Expected:** 409 Conflict - Email already registered

---

### Test 7: Login with Wrong Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword"
  }'
```

**Expected:** 401 Unauthorized - Invalid email or password

---

### Test 8: Get User Without Token
```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected:** 401 Unauthorized - No token provided

---

### Test 9: Get User with Invalid Token
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected:** 401 Unauthorized - Invalid or expired token

---

### Test 10: Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 200 OK - Logged out successfully

---

## Using Postman/Thunder Client

### Step-by-Step Test Guide

1. **Create Environment Variable**
   - Create a new environment called "ChatX Dev"
   - Add variable: `token` with initial value: empty
   - Add variable: `base_url` with value: `http://localhost:5000`

2. **Register Request**
   - Method: POST
   - URL: `{{base_url}}/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "password": "Password123",
       "confirmPassword": "Password123"
     }
     ```
   - Tests (script):
     ```javascript
     if (pm.response.code === 201) {
       const jsonData = pm.response.json();
       pm.environment.set("token", jsonData.data.token);
       pm.test("User registered successfully", () => {
         pm.expect(pm.response.code).to.equal(201);
         pm.expect(jsonData.success).to.be.true;
       });
     }
     ```

3. **Login Request**
   - Method: POST
   - URL: `{{base_url}}/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "john@example.com",
       "password": "Password123"
     }
     ```
   - Tests (script):
     ```javascript
     if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       pm.environment.set("token", jsonData.data.token);
       pm.test("Login successful", () => {
         pm.expect(jsonData.success).to.be.true;
         pm.expect(jsonData.data.token).to.exist;
       });
     }
     ```

4. **Get Current User Request**
   - Method: GET
   - URL: `{{base_url}}/api/auth/me`
   - Headers:
     ```
     Authorization: Bearer {{token}}
     ```
   - Tests (script):
     ```javascript
     pm.test("Get current user", () => {
       pm.expect(pm.response.code).to.equal(200);
       const jsonData = pm.response.json();
       pm.expect(jsonData.data.email).to.exist;
     });
     ```

5. **Logout Request**
   - Method: POST
   - URL: `{{base_url}}/api/auth/logout`
   - Headers:
     ```
     Authorization: Bearer {{token}}
     ```
   - Tests (script):
     ```javascript
     pm.test("Logout successful", () => {
       pm.expect(pm.response.code).to.equal(200);
     });
     ```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 Server Error | MongoDB not connected | Start MongoDB server before running the app |
| Invalid token | Token expired or malformed | Generate new token via login |
| No token provided | Missing Authorization header | Include `Authorization: Bearer {token}` header |
| Validation failed | Missing required fields | Check all required fields are provided |
| Email already registered | Creating duplicate account | Use different email or login instead |
| Password mismatch | confirmPassword differs | Ensure both passwords are identical |

---

## Key Security Notes

✅ **Passwords:** Never sent in responses, only hashed values stored
✅ **Tokens:** JWT valid for 7 days, generated only on register/login
✅ **Protected Routes:** Require Bearer token in Authorization header
✅ **Validation:** All inputs validated before processing
✅ **Errors:** Generic messages for failed login (no user enumeration)
✅ **HTTPS:** Use HTTPS in production for token transmission

---

## Token Structure (JWT)

The token returned is a JWT with this structure:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2ODg3Nzc0MDAsImV4cCI6MTY4OTM4MjIwMH0.signature
```

**Decoded header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Decoded payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1688777400,
  "exp": 1689382200
}
```

Use this token in `Authorization: Bearer {token}` header for protected routes.
