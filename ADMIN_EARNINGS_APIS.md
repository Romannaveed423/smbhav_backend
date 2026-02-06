# Admin Panel Earnings APIs - Click Tracking System

## Overview

These APIs are specifically for the admin panel to manage click tracking and conversions. All endpoints require:
- **Authentication**: Bearer token in Authorization header
- **Admin Role**: User must have `role: 'admin'` in their user record

## Base URL

```
/api/v1/admin/earnings
```

---

## 1. Get Click Logs

**Endpoint:** `GET /api/v1/admin/earnings/clicks`

**Description:** Retrieve all click logs with filtering and pagination options.

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `status` | string | No | Filter by status: `pending`, `converted`, `expired`, `rejected` |
| `userId` | string | No | Filter by user ID |
| `productId` | string | No | Filter by product ID |
| `startDate` | string | No | Start date filter (ISO 8601 datetime) |
| `endDate` | string | No | End date filter (ISO 8601 datetime) |

**Request Example:**

```bash
GET /api/v1/admin/earnings/clicks?page=1&limit=20&status=pending
Authorization: Bearer <admin_token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "clickLogs": [
      {
        "id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "clickId": "550e8400-e29b-41d4-a716-446655440000",
        "user": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "9876543210"
        },
        "product": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Credit Card Application",
          "category": "campaign"
        },
        "offer": {
          "id": "507f1f77bcf86cd799439013",
          "name": "Premium Credit Card",
          "amount": 500
        },
        "taskUrl": "https://example.com/task",
        "redirectUrl": "https://example.com/task?click_id=...&postback_url=...",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "referrer": "https://example.com/referrer",
        "clickedAt": "2024-01-15T10:30:00.000Z",
        "expiresAt": "2024-01-16T10:30:00.000Z",
        "status": "pending",
        "conversionId": null,
        "postbackReceived": false,
        "postbackReceivedAt": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Server error

---

## 2. Get Conversions

**Endpoint:** `GET /api/v1/admin/earnings/conversions`

**Description:** Retrieve all conversions (earnings with click tracking) with filtering and pagination.

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `status` | string | No | Filter by earning status: `pending`, `completed`, `cancelled` |
| `approvalStatus` | string | No | Filter by approval status: `pending`, `auto_approved`, `manually_approved`, `rejected` |
| `userId` | string | No | Filter by user ID |
| `productId` | string | No | Filter by product ID |

**Request Example:**

```bash
GET /api/v1/admin/earnings/conversions?page=1&limit=20&approvalStatus=pending
Authorization: Bearer <admin_token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "conversions": [
      {
        "id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "conversionId": "CONV_123456789",
        "clickId": "550e8400-e29b-41d4-a716-446655440000",
        "user": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "9876543210"
        },
        "product": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Credit Card Application",
          "category": "campaign"
        },
        "offer": {
          "id": "507f1f77bcf86cd799439013",
          "name": "Premium Credit Card",
          "amount": 500
        },
        "amount": 500,
        "status": "completed",
        "approvalStatus": "pending",
        "approvedBy": null,
        "approvedAt": null,
        "rejectionReason": null,
        "postbackReceived": true,
        "postbackReceivedAt": "2024-01-15T11:00:00.000Z",
        "clickLog": {
          "clickedAt": "2024-01-15T10:30:00.000Z",
          "ipAddress": "192.168.1.1",
          "userAgent": "Mozilla/5.0...",
          "status": "converted"
        },
        "earnedAt": "2024-01-15T11:00:00.000Z",
        "creditedAt": null,
        "createdAt": "2024-01-15T11:00:00.000Z",
        "updatedAt": "2024-01-15T11:00:00.000Z"
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

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Server error

---

## 3. Approve/Reject Conversion

**Endpoint:** `POST /api/v1/admin/earnings/conversions/:conversionId/approve`

**Description:** Manually approve or reject a conversion. Used when postback is not available or manual review is needed.

**Authentication:** Required (Admin only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversionId` | string | Yes | Unique conversion identifier |

**Request Body:**

```json
{
  "action": "approve" | "reject",
  "reason": "string (required if action is 'reject')"
}
```

**Request Example - Approval:**

```bash
POST /api/v1/admin/earnings/conversions/CONV_123456789/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "approve"
}
```

**Request Example - Rejection:**

```bash
POST /api/v1/admin/earnings/conversions/CONV_123456789/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "reject",
  "reason": "Fraudulent activity detected - duplicate conversion"
}
```

**Response Example - Approval:**

```json
{
  "success": true,
  "message": "Conversion approved successfully",
  "data": {
    "conversionId": "CONV_123456789",
    "earningId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "status": "completed",
    "approvalStatus": "manually_approved"
  }
}
```

**Response Example - Rejection:**

```json
{
  "success": true,
  "message": "Conversion rejected successfully",
  "data": {
    "conversionId": "CONV_123456789",
    "earningId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "status": "cancelled",
    "approvalStatus": "rejected",
    "rejectionReason": "Fraudulent activity detected - duplicate conversion"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid action, missing reason for rejection, or conversion already processed
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Conversion not found
- `500 Internal Server Error`: Server error

**Note:** 
- When approved: If not already credited, user's wallet will be credited and referral commission will be processed
- When rejected: Wallet will NOT be credited, click log status will be updated to 'rejected'

---

## Authentication

All endpoints require:

1. **Bearer Token** in the Authorization header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

2. **Admin Role**: The user account must have `role: 'admin'` set in the database.

**To set a user as admin:**

```javascript
// MongoDB command
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Error Response (Non-Admin):**

```json
{
  "success": false,
  "message": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## Example API Client Code

### TypeScript/JavaScript

```typescript
// Admin Earnings API Client
const API_BASE_URL = 'http://localhost:3000/api/v1/admin/earnings';

class AdminEarningsAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get Click Logs
   */
  async getClickLogs(params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'converted' | 'expired' | 'rejected';
    userId?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/clicks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get Conversions
   */
  async getConversions(params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'completed' | 'cancelled';
    approvalStatus?: 'pending' | 'auto_approved' | 'manually_approved' | 'rejected';
    userId?: string;
    productId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/conversions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Approve/Reject Conversion
   */
  async approveConversion(
    conversionId: string,
    action: 'approve' | 'reject',
    reason?: string
  ) {
    if (action === 'reject' && !reason) {
      throw new Error('Reason is required when rejecting a conversion');
    }

    const url = `${API_BASE_URL}/conversions/${conversionId}/approve`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        action,
        reason,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

// Usage Example
const adminAPI = new AdminEarningsAPI('your_admin_token_here');

// Get pending click logs
const clickLogs = await adminAPI.getClickLogs({
  page: 1,
  limit: 20,
  status: 'pending'
});

// Get pending conversions
const conversions = await adminAPI.getConversions({
  page: 1,
  limit: 20,
  approvalStatus: 'pending'
});

// Approve a conversion
await adminAPI.approveConversion('CONV_123456789', 'approve');

// Reject a conversion
await adminAPI.approveConversion(
  'CONV_123456789',
  'reject',
  'Fraudulent activity detected'
);
```

### cURL Examples

```bash
# Get Click Logs
curl -X GET "http://localhost:3000/api/v1/admin/earnings/clicks?page=1&limit=20&status=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Get Conversions
curl -X GET "http://localhost:3000/api/v1/admin/earnings/conversions?page=1&limit=20&approvalStatus=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Approve Conversion
curl -X POST "http://localhost:3000/api/v1/admin/earnings/conversions/CONV_123456789/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'

# Reject Conversion
curl -X POST "http://localhost:3000/api/v1/admin/earnings/conversions/CONV_123456789/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "reason": "Fraudulent activity detected"
  }'
```

---

## Summary

These 3 APIs provide complete admin control over the click tracking and conversion system:

1. **Get Click Logs** - View all user clicks on tasks
2. **Get Conversions** - View all conversions with approval status
3. **Approve/Reject Conversion** - Manually approve or reject conversions

All APIs require:
- ✅ Bearer token authentication
- ✅ Admin role permission
- ✅ Proper error handling

