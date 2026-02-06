# Users API Documentation

## 📋 Overview

This document covers all user-related API endpoints in the system. The APIs are divided into:
1. **User-facing endpoints** - For users to manage their own profile and data
2. **Admin endpoints** - Full admin user management (list, CRUD, role, verify, KYC, freeze, statistics)

---

## 🔗 User-Facing Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

---

## 1. Profile Management

### 1.1 Get User Profile

**Endpoint:** `GET /api/v1/user/profile`

**Description:** Get the authenticated user's profile information

**Authentication:** Required (User token)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/profile" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profileImage": "https://example.com/profile.jpg",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "pincode": "10001",
      "country": "USA"
    },
    "walletBalance": 1500.50,
    "totalEarnings": 5000.00,
    "totalWithdrawals": 3500.00,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "kycStatus": "verified",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (no token or invalid token)
- `404` - User not found

---

### 1.2 Update User Profile

**Endpoint:** `PUT /api/v1/user/profile`

**Description:** Update the authenticated user's profile information

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+1234567891",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "pincode": "90001",
    "country": "USA"
  },
  "profileImage": "https://example.com/new-profile.jpg"
}
```

**Request Example:**
```bash
curl -X PUT "http://localhost:3000/api/v1/user/profile" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "phone": "+1234567891",
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "pincode": "90001",
      "country": "USA"
    }
  }'
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "+1234567891",
    "profileImage": "https://example.com/new-profile.jpg",
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "pincode": "90001",
      "country": "USA"
    },
    "updatedAt": "2025-12-15T11:00:00.000Z"
  }
}
```

**Validation Rules:**
- `name` - Optional, 2-100 characters
- `phone` - Optional, 10-15 characters, must be unique if changed
- `address` - Optional, object with street, city, state, pincode, country
- `profileImage` - Optional, string URL

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `404` - User not found
- `409` - Phone number already exists (if phone is changed to existing number)

---

## 2. Location Management

### 2.1 Get User Location

**Endpoint:** `GET /api/v1/user/location`

**Description:** Get the user's current saved location

**Authentication:** Required (User token)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/location" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY 10001"
    }
  }
}
```

---

### 2.2 Get User Locations (History)

**Endpoint:** `GET /api/v1/user/locations`

**Description:** Get list of user's saved locations

**Authentication:** Required (User token)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/locations" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "123 Main St, New York, NY 10001",
        "isDefault": true,
        "createdAt": "2025-12-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 2.3 Update User Location

**Endpoint:** `PUT /api/v1/user/location`

**Description:** Update or save user's location

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, New York, NY 10001",
  "isDefault": true
}
```

**Request Example:**
```bash
curl -X PUT "http://localhost:3000/api/v1/user/location" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, New York, NY 10001"
  }'
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "location": {
      "_id": "507f1f77bcf86cd799439011",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY 10001",
      "isDefault": true,
      "updatedAt": "2025-12-15T11:00:00.000Z"
    }
  }
}
```

---

## 3. Favorites Management

### 3.1 Get User Favorites

**Endpoint:** `GET /api/v1/user/favorites`

**Description:** Get list of user's favorite items

**Authentication:** Required (User token)

**Query Parameters:**
- `type` (optional) - Filter by type: "product", "store", etc.
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/favorites?type=product&page=1&limit=20" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "itemId": "507f1f77bcf86cd799439020",
        "itemType": "product",
        "item": {
          "id": "507f1f77bcf86cd799439020",
          "name": "Product Name",
          "price": 99.99
        },
        "createdAt": "2025-12-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 3.2 Add to Favorites

**Endpoint:** `POST /api/v1/user/favorites`

**Description:** Add an item to user's favorites

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "itemId": "507f1f77bcf86cd799439020",
  "itemType": "product"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/user/favorites" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "507f1f77bcf86cd799439020",
    "itemType": "product"
  }'
```

**Response Format (201 Created):**
```json
{
  "success": true,
  "message": "Item added to favorites",
  "data": {
    "favorite": {
      "_id": "507f1f77bcf86cd799439011",
      "itemId": "507f1f77bcf86cd799439020",
      "itemType": "product",
      "createdAt": "2025-12-15T10:30:00.000Z"
    }
  }
}
```

---

### 3.3 Remove from Favorites

**Endpoint:** `DELETE /api/v1/user/favorites/:favoriteId`

**Description:** Remove an item from user's favorites

**Authentication:** Required (User token)

**Request Example:**
```bash
curl -X DELETE "http://localhost:3000/api/v1/user/favorites/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Item removed from favorites"
}
```

---

### 3.4 Check Favorite Status

**Endpoint:** `GET /api/v1/user/favorites/check`

**Description:** Check if an item is in user's favorites

**Authentication:** Required (User token)

**Query Parameters:**
- `itemId` (required) - Item ID to check
- `itemType` (required) - Item type: "product", "store", etc.

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/favorites/check?itemId=507f1f77bcf86cd799439020&itemType=product" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "isFavorite": true,
    "favoriteId": "507f1f77bcf86cd799439011"
  }
}
```

---

## 4. Health Check

### 4.1 User Module Health

**Endpoint:** `GET /api/v1/user/health`

**Description:** Check if the user module is healthy

**Authentication:** Not required

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/health"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "module": "user",
  "status": "healthy",
  "timestamp": "2025-12-15T10:30:00.000Z",
  "uptime": 123.45
}
```

---

## 🔐 Authentication

All user endpoints (except health check) require authentication using JWT Bearer tokens.

**Header Format:**
```
Authorization: Bearer {userToken}
```

---

## 📊 User Model Schema

```typescript
{
  _id: ObjectId,
  name: String,                    // Required, 2-100 chars
  email: String,                   // Required, unique, lowercase
  phone: String,                   // Required, unique, 10-15 chars
  password: String,                // Required (unless social login)
  profileImage?: String,           // Optional
  address?: {                      // Optional
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  walletBalance: Number,           // Default: 0
  totalEarnings: Number,           // Default: 0
  totalWithdrawals: Number,        // Default: 0
  isEmailVerified: Boolean,        // Default: false
  isPhoneVerified: Boolean,        // Default: false
  kycStatus: String,               // "pending" | "verified" | "rejected"
  role?: String,                   // "user" | "admin", default: "user"
  referralCode: String,            // Unique code
  referredBy?: ObjectId,           // Referrer user ID
  referralEarnings: Number,        // Default: 0
  totalReferrals: Number,          // Default: 0
  activeReferrals: Number,         // Default: 0
  socialLogin?: {                  // Optional
    provider: String,              // "google" | "facebook"
    socialId: String
  },
  refreshToken?: String,
  resetPasswordToken?: String,
  resetPasswordExpires?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number already exists"
    }
  ],
  "code": "DUPLICATE_ENTRY"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE_ENTRY` - Duplicate value (e.g., phone, email)

---

## 📝 Admin User Management

**Base URL:** `http://localhost:3000/api/v1/admin/users`  
**Authentication:** Required (Admin JWT in `Authorization: Bearer <token>`)

All admin user endpoints require **authenticate** + **requireAdmin** middleware. User IDs must be valid 24-character MongoDB ObjectIds.

---

### 1. List Users

**Endpoint:** `GET /api/v1/admin/users`

**Query Parameters:**

| Parameter  | Type   | Default   | Description                                      |
|-----------|--------|-----------|--------------------------------------------------|
| page      | number | 1         | Page number                                      |
| limit     | number | 20        | Items per page (max 100)                         |
| search    | string | -         | Search by name, email, or phone                  |
| role      | string | -         | `user` \| `admin` (if omitted, only non-admins) |
| status    | string | -         | `active` \| `inactive` \| `frozen`               |
| kycStatus | string | -         | `pending` \| `verified` \| `rejected`            |
| sortBy    | string | createdAt | createdAt, name, email, walletBalance, totalEarnings, updatedAt |
| sortOrder | string | desc      | `asc` \| `desc`                                  |

**Response (200):** `{ success, data: { users, total, page, limit, totalPages } }`

---

### 2. Get Single User

**Endpoint:** `GET /api/v1/admin/users/:userId`

**Response (200):** `{ success, data: { user } }` with full profile (wallet, referrals, status, lastLogin, etc.)

**Errors:** `404` NOT_FOUND

---

### 3. Create User

**Endpoint:** `POST /api/v1/admin/users`

**Body:** `name`, `email`, `phone`, `password` (min 6), optional: `role`, `kycStatus`, `isEmailVerified`, `isPhoneVerified`

**Response (201):** `{ success, message, data: { user } }`

**Errors:** `409` DUPLICATE_ENTRY (email/phone exists), `400` VALIDATION_ERROR

---

### 4. Update User

**Endpoint:** `PUT /api/v1/admin/users/:userId`

**Body (all optional):** `name`, `phone`, `address` (object), `profileImage`, `kycStatus`, `isEmailVerified`, `isPhoneVerified`

**Response (200):** `{ success, message, data: { user } }`

**Errors:** `404` NOT_FOUND, `409` DUPLICATE_ENTRY (phone)

---

### 5. Delete User

**Endpoint:** `DELETE /api/v1/admin/users/:userId`

**Body (optional):** `{ "hard": false, "reason": "..." }` — `hard: true` permanently deletes; default is soft delete (status = inactive).

**Security:** Cannot delete own account. Cannot delete the last admin.

**Response (200):** `{ success, message, data: { userId, status? } }`

**Errors:** `403` FORBIDDEN, `404` NOT_FOUND

---

### 6. Change User Role

**Endpoint:** `PUT /api/v1/admin/users/:userId/role`

**Body:** `{ "role": "user" | "admin" }`

**Security:** Cannot remove admin role from yourself if you are the last admin.

**Response (200):** `{ success, message, data: { userId, role } }`

**Errors:** `403` FORBIDDEN, `404` NOT_FOUND

---

### 7. Verify Email (Admin Override)

**Endpoint:** `PUT /api/v1/admin/users/:userId/verify-email`

**Body (optional):** `{ "verified": true }` — default true if omitted.

**Response (200):** `{ success, message, data: { userId, isEmailVerified } }`

**Errors:** `404` NOT_FOUND

---

### 8. Verify Phone (Admin Override)

**Endpoint:** `PUT /api/v1/admin/users/:userId/verify-phone`

**Body (optional):** `{ "verified": true }` — default true if omitted.

**Response (200):** `{ success, message, data: { userId, isPhoneVerified } }`

**Errors:** `404` NOT_FOUND

---

### 9. Update KYC Status

**Endpoint:** `PUT /api/v1/admin/users/:userId/kyc-status`

**Body:** `{ "kycStatus": "pending" | "verified" | "rejected", "reason": "..." }`

**Response (200):** `{ success, message, data: { userId, kycStatus } }`

**Errors:** `404` NOT_FOUND

---

### 10. Get User Statistics

**Endpoint:** `GET /api/v1/admin/users/:userId/statistics`

**Response (200):** `{ success, data: { user, wallet, referral, transactions } }` — counts and sums for earnings, withdrawals, referrals.

**Errors:** `404` NOT_FOUND

---

### 11. Get User Transactions

**Endpoint:** `GET /api/v1/admin/users/:userId/transactions`

**Query:** `page`, `limit`, `type` (credit | debit), `status` (pending | completed | cancelled | processing | rejected)

**Response (200):** `{ success, data: { transactions, pagination } }`

**Errors:** `404` NOT_FOUND

---

### 12. Adjust User Balance

**Endpoint:** `POST /api/v1/admin/users/:userId/adjust-balance`

**Body:** `{ "amount": number, "reason": "string" }` — amount can be negative (deduction). Balance cannot go below zero.

**Response (200):** `{ success, message, data: { userId, previousBalance, newBalance, adjustment, reason } }`

**Errors:** `400` VALIDATION_ERROR (negative balance), `404` NOT_FOUND

---

### 13. Freeze / Unfreeze User

**Endpoint:** `POST /api/v1/admin/users/:userId/freeze`

**Body:** `{ "freeze": true | false, "reason": "..." }` — reason optional when freezing.

**Security:** Cannot freeze your own account.

**Response (200):** `{ success, message, data: { userId, status, reason } }`

**Errors:** `403` FORBIDDEN, `404` NOT_FOUND

---

## Admin Error Handling

All admin endpoints use the same error format and codes:

- **VALIDATION_ERROR** (400) — Invalid input or ObjectId
- **NOT_FOUND** (404) — User not found
- **UNAUTHORIZED** (401) — Missing or invalid token
- **FORBIDDEN** (403) — Not admin, or protected action (e.g. delete self, remove last admin)
- **DUPLICATE_ENTRY** (409) — Email or phone already exists

---

## 🔗 Related Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Earnings (User-specific)
- `GET /api/v1/earn/dashboard` - Get user earnings dashboard
- `GET /api/v1/earn/earnings` - Get user earnings
- `GET /api/v1/earn/withdrawals` - Get user withdrawals

---

**Last Updated:** 2026-01-29

