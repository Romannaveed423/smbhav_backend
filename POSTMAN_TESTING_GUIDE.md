# Postman Testing Guide for Sambhav Backend API

## Prerequisites

1. Make sure the server is running:
   ```bash
   npm run dev
   ```
   Server should start on `http://localhost:3000`

2. Import the Postman collection:
   - Open Postman
   - Click "Import" button
   - Select `postman_collection.json` file
   - Or manually create requests as shown below

## Testing Authentication APIs

### 1. Register User

**Endpoint:** `POST http://localhost:3000/api/v1/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Abdiaziz A.kadir",
  "email": "abdiaziz@sambhav.com",
  "phone": "+919876543210",
  "password": "password123",
  "confirmPassword": "password123",
  "agreeToTerms": true
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Abdiaziz A.kadir",
      "email": "abdiaziz@sambhav.com",
      "phone": "+919876543210",
      "profileImage": null,
      "isEmailVerified": false,
      "isPhoneVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 3600
  }
}
```

**Important:** 
- Copy the `token` and `refreshToken` from the response
- Save them in Postman environment variables for use in other requests
- Password must be at least 6 characters and contain at least one letter and one number

---

### 2. Login

**Endpoint:** `POST http://localhost:3000/api/v1/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "abdiaziz@sambhav.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Abdiaziz A.kadir",
      "email": "abdiaziz@sambhav.com",
      "phone": "+919876543210",
      "profileImage": null,
      "walletBalance": 0,
      "totalEarnings": 0,
      "isEmailVerified": false,
      "isPhoneVerified": false
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 3600
  }
}
```

**Important:**
- Save the `token` in Postman environment variable `{{token}}`
- Save the `refreshToken` in Postman environment variable `{{refreshToken}}`

---

### 3. Get User Profile (Protected Route)

**Endpoint:** `GET http://localhost:3000/api/v1/user/profile`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Abdiaziz A.kadir",
    "email": "abdiaziz@sambhav.com",
    "phone": "+919876543210",
    "profileImage": null,
    "address": null,
    "walletBalance": 0,
    "totalEarnings": 0,
    "totalWithdrawals": 0,
    "isEmailVerified": false,
    "isPhoneVerified": false,
    "kycStatus": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Refresh Token

**Endpoint:** `POST http://localhost:3000/api/v1/auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_access_token",
    "expiresIn": 3600
  }
}
```

---

### 5. Logout

**Endpoint:** `POST http://localhost:3000/api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Setting Up Postman Environment Variables

1. In Postman, click on "Environments" in the left sidebar
2. Click "+" to create a new environment
3. Name it "Sambhav Local"
4. Add these variables:
   - `baseUrl` = `http://localhost:3000`
   - `token` = (leave empty, will be set after login)
   - `refreshToken` = (leave empty, will be set after login)

5. After login/register, you can set the token automatically using Postman's "Tests" tab:

**For Login/Register requests, add this in the "Tests" tab:**
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
    }
    if (jsonData.data && jsonData.data.refreshToken) {
        pm.environment.set("refreshToken", jsonData.data.refreshToken);
    }
}
```

---

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### User Already Exists (409)
```json
{
  "success": false,
  "message": "User already exists",
  "code": "DUPLICATE_ENTRY"
}
```

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

## Quick Test Flow

1. **Register** a new user → Save token
2. **Login** with the same credentials → Verify token works
3. **Get Profile** using the token → Verify protected route works
4. **Logout** → Verify token is invalidated

---

## Testing Tips

1. Use different email/phone for each test user
2. Test validation errors by sending invalid data
3. Test duplicate registration with same email/phone
4. Test protected routes without token (should get 401)
5. Test with expired/invalid token

---

## Health Check

**Endpoint:** `GET http://localhost:3000/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Use this to verify the server is running before testing other endpoints.

