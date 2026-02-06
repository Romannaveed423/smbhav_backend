# Authentication Endpoints Testing Guide

## 🔐 Auth Endpoints

All auth endpoints are under: `http://72.61.244.223:3000/api/v1/auth/`

---

## ✅ Health Check (No Authentication Required)

**Endpoint:**
```
GET http://72.61.244.223:3000/api/v1/auth/health
```

**Test in Browser:**
```
http://72.61.244.223:3000/api/v1/auth/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "module": "auth",
  "timestamp": "2025-12-27T08:27:43.214Z"
}
```

---

## 📝 Available Auth Endpoints

### 1. Register User

**Endpoint:**
```
POST http://72.61.244.223:3000/api/v1/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123!",
  "referralCode": "ABC123"  // Optional
}
```

**cURL Command:**
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "referralCode": "...",
      "isEmailVerified": false,
      "isPhoneVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 2. Login

**Endpoint:**
```
POST http://72.61.244.223:3000/api/v1/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**cURL Command:**
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "walletBalance": 0,
      "totalEarnings": 0,
      "referralCode": "...",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 3. Refresh Token

**Endpoint:**
```
POST http://72.61.244.223:3000/api/v1/auth/refresh
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**cURL Command:**
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 4. Forgot Password

**Endpoint:**
```
POST http://72.61.244.223:3000/api/v1/auth/forgot-password
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@example.com"
}
```

**cURL Command:**
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

---

### 5. Reset Password

**Endpoint:**
```
POST http://72.61.244.223:3000/api/v1/auth/reset-password
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePassword123!"
}
```

**cURL Command:**
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewSecurePassword123!"
  }'
```

---

### 6. Logout (Requires Authentication)

**Endpoint:**
```
POST http://72.61.244.223:3000/api/v1/auth/logout
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer your_access_token_here
```

**cURL Command:**
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here"
```

---

## 🧪 Quick Test Sequence

### Step 1: Test Health Endpoint
```bash
curl http://72.61.244.223:3000/api/v1/auth/health
```

### Step 2: Register a User
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "Test123!"
  }'
```

### Step 3: Login
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Copy the `token` from the response and use it in Step 4.

### Step 4: Test Logout (requires token)
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 Test Using Postman or Browser

### Health Check (GET - Browser)
```
http://72.61.244.223:3000/api/v1/auth/health
```

### Register/Login (POST - Use Postman or cURL)
For POST requests, use:
- **Postman** (recommended for testing)
- **cURL** (command line)
- **JavaScript fetch** (if testing from code)

---

## ⚠️ Common Errors

### 400 Bad Request
- Missing required fields
- Invalid email format
- Weak password

### 401 Unauthorized
- Invalid credentials
- Invalid or expired token

### 409 Conflict
- User already exists (on register)

---

## 🔑 Token Usage

After login, you'll receive:
- **token**: Use in `Authorization: Bearer <token>` header for protected endpoints
- **refreshToken**: Use to get a new token when the current one expires
- **expiresIn**: Token expiration time in seconds (3600 = 1 hour)

**Example:**
```bash
curl -X GET http://72.61.244.223:3000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

