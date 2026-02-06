# Offer Applications API Documentation

## 📋 Overview

**Offer Applications** are requests from publishers/users who want to promote offers. Publishers submit applications to promote specific offers, and admins review and approve/reject them.

**Flow:**
1. Publisher submits application to promote an offer
2. Admin reviews application
3. Admin approves/rejects application
4. Approved applications become "Active" and can be promoted

---

## 🗄️ Data Model

### OfferApplication Schema

```typescript
{
  _id: ObjectId,
  offerId: ObjectId,              // Reference to the Offer being promoted
  offerName: String,              // Name of the offer (for quick reference)
  publisherId: ObjectId,          // User/Publisher who submitted the application
  publisherName: String,          // Publisher's name
  publisherEmail: String,         // Publisher's email
  offerPromotion: String,         // Description of the promotion they want to run (min 10 chars)
  status: String,                 // "Pending" | "Approved" | "Rejected" | "Active"
  rejectionReason: String,        // Optional: Reason if rejected
  approvedBy: ObjectId,           // Admin who approved/rejected
  approvedAt: Date,               // When it was approved/rejected
  notes: String,                  // Admin notes
  createdAt: Date,
  updatedAt: Date
}
```

**Status Values:**
- `Pending` - Initial status when created
- `Approved` - Admin approved the application
- `Rejected` - Admin rejected the application
- `Active` - Application is active and being promoted

---

## 🔗 API Endpoints

### User/Publisher Endpoints

#### 1. Create Offer Application

**Endpoint:** `POST /api/v1/earn/offer-applications`

**Description:** Publisher submits a new application to promote an offer

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "offerId": "507f1f77bcf86cd799439020",
  "offerPromotion": "First month free - Special promotion for new users"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/earn/offer-applications" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "507f1f77bcf86cd799439020",
    "offerPromotion": "First month free"
  }'
```

**Response Format (201 Created):**
```json
{
  "success": true,
  "message": "Offer application submitted successfully",
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439011",
      "offerId": "507f1f77bcf86cd799439020",
      "offerName": "Netflix Premium Plan",
      "publisherId": "507f1f77bcf86cd799439021",
      "publisherName": "Michael Chen",
      "offerPromotion": "First month free",
      "status": "Pending",
      "createdAt": "2025-12-15T10:30:00.000Z",
      "updatedAt": "2025-12-15T10:30:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `offerId` is required and must exist
- `offerPromotion` is required (min 10 characters)
- User must be authenticated
- User cannot submit duplicate application for same offer (check existing pending/active applications)

**Error Responses:**
- `400` - Validation error (missing fields, invalid offerId, duplicate application)
- `401` - Unauthorized (no token or invalid token)
- `404` - Offer not found

---

### Admin Endpoints

#### 2. List All Offer Applications

**Endpoint:** `GET /api/v1/admin/earn/offer-applications`

**Description:** Get a paginated list of all offer applications with filtering options

**Authentication:** Required (Admin token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page
- `status` (optional) - Filter by status: "Pending", "Approved", "Rejected", "Active", "All"
- `search` (optional) - Search by offer name or publisher name
- `offerId` (optional) - Filter by specific offer ID
- `publisherId` (optional) - Filter by publisher ID

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/earn/offer-applications?page=1&limit=10&status=Pending&search=Netflix" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "offerId": "507f1f77bcf86cd799439020",
        "offerName": "Netflix Premium Plan",
        "publisherId": "507f1f77bcf86cd799439021",
        "publisherName": "Michael Chen",
        "publisherEmail": "michael@example.com",
        "offerPromotion": "First month free",
        "status": "Pending",
        "rejectionReason": null,
        "approvedBy": null,
        "approvedAt": null,
        "notes": null,
        "createdAt": "2025-12-15T10:30:00.000Z",
        "updatedAt": "2025-12-15T10:30:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

**Error Responses:**
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (not an admin)

---

#### 3. Get Single Offer Application

**Endpoint:** `GET /api/v1/admin/earn/offer-applications/:applicationId`

**Description:** Get detailed information about a specific offer application with populated offer and publisher data

**Authentication:** Required (Admin token)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/earn/offer-applications/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439011",
      "offerId": "507f1f77bcf86cd799439020",
      "offerName": "Netflix Premium Plan",
      "offer": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Netflix Premium Plan",
        "description": "Stream unlimited movies and TV shows",
        "category": "Entertainment",
        "status": "active",
        "imageUrl": "https://example.com/image.jpg",
        "icon": "https://example.com/icon.png"
      },
      "publisherId": "507f1f77bcf86cd799439021",
      "publisherName": "Michael Chen",
      "publisherEmail": "michael@example.com",
      "publisher": {
        "_id": "507f1f77bcf86cd799439021",
        "name": "Michael Chen",
        "email": "michael@example.com",
        "phone": "+1234567890"
      },
      "offerPromotion": "First month free",
      "status": "Pending",
      "rejectionReason": null,
      "approvedBy": null,
      "approvedAt": null,
      "notes": null,
      "createdAt": "2025-12-15T10:30:00.000Z",
      "updatedAt": "2025-12-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Offer application not found

---

#### 4. Update Offer Application Status (Approve/Reject)

**Endpoint:** `PUT /api/v1/admin/earn/offer-applications/:applicationId/status`

**Description:** Admin approves or rejects an offer application

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "status": "Approved",
  "rejectionReason": "Does not meet our criteria",
  "notes": "Approved for Q1 2026 campaign"
}
```

**Request Example (Approve):**
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/earn/offer-applications/507f1f77bcf86cd799439011/status" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "notes": "Approved for Q1 2026 campaign"
  }'
```

**Request Example (Reject):**
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/earn/offer-applications/507f1f77bcf86cd799439011/status" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Rejected",
    "rejectionReason": "Does not meet our quality standards",
    "notes": "Application lacks sufficient detail"
  }'
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Offer application approved successfully",
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "Approved",
      "approvedBy": "507f1f77bcf86cd799439022",
      "approvedAt": "2025-12-15T11:00:00.000Z",
      "notes": "Approved for Q1 2026 campaign",
      "rejectionReason": null,
      "updatedAt": "2025-12-15T11:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `status` must be one of: "Pending", "Approved", "Rejected", "Active"
- If `status` is "Rejected", `rejectionReason` is required
- Cannot change status from "Rejected" to "Approved" (must create new application)
- Only admins can update status

**Error Responses:**
- `400` - Invalid status or missing rejection reason when rejecting
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Offer application not found

---

#### 5. Activate Offer Application

**Endpoint:** `PUT /api/v1/admin/earn/offer-applications/:applicationId/activate`

**Description:** Activate an approved offer application (set status to "Active")

**Authentication:** Required (Admin token)

**Request Example:**
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/earn/offer-applications/507f1f77bcf86cd799439011/activate" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Offer application activated successfully",
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "Active",
      "updatedAt": "2025-12-15T11:30:00.000Z"
    }
  }
}
```

**Validation Rules:**
- Application must be in "Approved" status
- Only admins can activate

**Error Responses:**
- `400` - Application not in Approved status
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Offer application not found

---

#### 6. Delete Offer Application

**Endpoint:** `DELETE /api/v1/admin/earn/offer-applications/:applicationId`

**Description:** Delete an offer application

**Authentication:** Required (Admin token)

**Request Example:**
```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/earn/offer-applications/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Offer application deleted successfully"
}
```

**Validation Rules:**
- Only admins can delete
- Cannot delete "Active" applications (must deactivate first)

**Error Responses:**
- `400` - Cannot delete active application
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Offer application not found

---

#### 7. Bulk Update Status

**Endpoint:** `POST /api/v1/admin/earn/offer-applications/bulk-status`

**Description:** Update status of multiple applications at once

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "applicationIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "status": "Approved",
  "notes": "Bulk approved for Q1 campaign"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/earn/offer-applications/bulk-status" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "status": "Approved",
    "notes": "Bulk approved for Q1 campaign"
  }'
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "2 offer applications updated successfully",
  "data": {
    "updated": 2,
    "failed": 0,
    "applications": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "status": "Approved",
        "updatedAt": "2025-12-15T12:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "status": "Approved",
        "updatedAt": "2025-12-15T12:00:00.000Z"
      }
    ]
  }
}
```

**Validation Rules:**
- At least one application ID is required
- `status` must be valid
- For bulk rejections, `notes` can serve as rejection reason

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - No applications found

---

## 🔐 Authentication

All endpoints require authentication using JWT Bearer tokens.

### User Endpoints
- Header: `Authorization: Bearer {userToken}`
- User must be authenticated

### Admin Endpoints
- Header: `Authorization: Bearer {adminToken}`
- User must be authenticated AND have `role: 'admin'` in database

---

## ✅ Validation Rules

### Create Offer Application
1. `offerId` is required and must exist in database
2. `offerPromotion` is required (minimum 10 characters)
3. User cannot submit duplicate application for same offer if status is "Pending" or "Active"

### Update Status
1. `status` must be one of: "Pending", "Approved", "Rejected", "Active"
2. If `status` is "Rejected", `rejectionReason` is required
3. Cannot change status from "Rejected" to "Approved"
4. Only "Approved" applications can be activated

### Delete Application
1. Cannot delete "Active" applications (must deactivate first)

---

## 📊 Status Flow

```
Pending → Approved → Active
   ↓
Rejected (end state)
```

**Status Transitions:**
- `Pending` → `Approved` ✅
- `Pending` → `Rejected` ✅
- `Approved` → `Active` ✅ (via activate endpoint)
- `Rejected` → `Approved` ❌ (not allowed, create new application)
- `Active` → `Rejected` ✅ (via update status endpoint)

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "offerPromotion",
      "message": "Offer promotion description must be at least 10 characters"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE_ENTRY` - Duplicate application detected

---

## 📝 Notes

1. **Duplicate Prevention**: The system automatically prevents users from submitting duplicate applications for the same offer if they have a pending or active application.

2. **Status Management**: Once an application is rejected, it cannot be approved again. A new application must be created.

3. **Activation**: Only approved applications can be activated. Use the dedicated activate endpoint for this purpose.

4. **Bulk Operations**: Bulk status updates are available for admins to process multiple applications efficiently.

5. **Search**: The list endpoint supports searching by offer name or publisher name (case-insensitive).

6. **Pagination**: All list endpoints support pagination with configurable page size.

---

## 🔗 Related Endpoints

- `GET /api/v1/earn/offers` - List available offers (for users to see what they can apply for)
- `GET /api/v1/admin/earn/offers` - List all offers (admin view)

---

**Last Updated:** 2025-12-15

