# POD (Print on Demand) Admin API Documentation

## 📋 Overview

This document covers all 26 API endpoints required for the POD (Print on Demand) section of the admin dashboard. The POD section includes:

1. **POD Orders** - Managing customer orders (5 endpoints)
2. **POD Designs** - Managing user-submitted designs (3 endpoints)
3. **POD Products** - Managing POD products (4 endpoints)
4. **Catalogs** - Managing product catalogs (7 endpoints)
5. **Catalog Categories** - Managing catalog categories (7 endpoints)

---

## 🔗 Base URL

```
http://localhost:3000/api/v1
```

All endpoints require **Admin authentication** (Bearer token).

**Header Format:**
```
Authorization: Bearer {adminToken}
```

User must be authenticated AND have `role: 'admin'` in database.

---

## 📦 1. POD Orders APIs

### 1.1 List All POD Orders

**Endpoint:** `GET /api/v1/admin/pod/orders`

**Description:** Get a paginated list of all POD orders with filtering and search

**Authentication:** Required (Admin token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page
- `search` (optional) - Search by order ID, user name, or tracking number
- `status` (optional) - Filter by status: "pending", "confirmed", "processing", "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled", "returned"
- `startDate` (optional) - Filter orders from this date (ISO format)
- `endDate` (optional) - Filter orders until this date (ISO format)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/pod/orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439020",
        "userName": "John Doe",
        "products": [
          {
            "productId": "507f1f77bcf86cd799439030",
            "productName": "Custom T-Shirt",
            "variant": {
              "size": "L",
              "color": "Blue",
              "price": 29.99
            },
            "customization": {
              "design": "https://example.com/design.jpg",
              "text": "Hello World"
            },
            "quantity": 2,
            "unitPrice": 29.99
          }
        ],
        "totalAmount": 59.98,
        "status": "pending",
        "orderDate": "2025-12-15T10:30:00.000Z",
        "shippingAddress": {
          "name": "John Doe",
          "addressLine1": "123 Main St",
          "city": "New York",
          "state": "NY",
          "pincode": "10001",
          "phone": "+1234567890"
        },
        "trackingNumber": null,
        "shippedDate": null,
        "deliveredDate": null
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### 1.2 Get Single POD Order

**Endpoint:** `GET /api/v1/admin/pod/orders/:orderId`

**Description:** Get detailed information about a specific POD order

**Authentication:** Required (Admin token)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/pod/orders/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439020",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "products": [
        {
          "productId": "507f1f77bcf86cd799439030",
          "productName": "Custom T-Shirt",
          "variant": {
            "size": "L",
            "color": "Blue",
            "material": null,
            "price": 29.99
          },
          "customization": {
            "design": "https://example.com/design.jpg",
            "text": "Hello World"
          },
          "quantity": 2,
          "unitPrice": 29.99,
          "subtotal": 59.98
        }
      ],
      "totalAmount": 59.98,
      "shippingCost": 5.00,
      "tax": 0,
      "finalAmount": 64.98,
      "status": "pending",
      "orderDate": "2025-12-15T10:30:00.000Z",
      "shippingAddress": {
        "name": "John Doe",
        "addressLine1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "pincode": "10001",
        "phone": "+1234567890"
      },
      "trackingNumber": null,
      "shippedDate": null,
      "deliveredDate": null,
      "cancelledDate": null,
      "cancellationReason": null
    }
  }
}
```

---

### 1.3 Update Order Status

**Endpoint:** `PUT /api/v1/admin/pod/orders/:orderId/status`

**Description:** Update the status of a POD order

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "status": "processing"
}
```

**Valid Status Values:**
- `pending` - Order placed, awaiting processing
- `confirmed` - Order confirmed
- `processing` - Order is being processed/manufactured
- `shipped` - Order has been shipped
- `in_transit` - Order in transit
- `out_for_delivery` - Out for delivery
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled
- `returned` - Order returned

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "id": "507f1f77bcf86cd799439011",
      "status": "processing",
      "updatedAt": "2025-12-15T11:00:00.000Z"
    }
  }
}
```

---

### 1.4 Ship Order

**Endpoint:** `POST /api/v1/admin/pod/orders/:orderId/ship`

**Description:** Mark an order as shipped and add tracking number

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "trackingNumber": "TRACK123456789"
}
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Order shipped successfully",
  "data": {
    "order": {
      "id": "507f1f77bcf86cd799439011",
      "status": "shipped",
      "trackingNumber": "TRACK123456789",
      "shippedDate": "2025-12-15T11:30:00.000Z"
    }
  }
}
```

---

### 1.5 Cancel Order

**Endpoint:** `POST /api/v1/admin/pod/orders/:orderId/cancel`

**Description:** Cancel a POD order

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "id": "507f1f77bcf86cd799439011",
      "status": "cancelled",
      "cancellationReason": "Customer requested cancellation",
      "cancelledDate": "2025-12-15T12:00:00.000Z"
    }
  }
}
```

---

## 🎨 2. POD Designs APIs

### 2.1 List POD Designs

**Endpoint:** `GET /api/v1/admin/pod/designs`

**Description:** Get a list of user-submitted POD designs

**Authentication:** Required (Admin token)

**Query Parameters:**
- `status` (optional) - Filter by status: "pending", "approved", "rejected"
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439020",
        "userName": "John Doe",
        "productType": "tshirt",
        "designUrl": "https://example.com/designs/design123.jpg",
        "status": "pending",
        "submittedDate": "2025-12-15T10:30:00.000Z",
        "approvedDate": null,
        "rejectedDate": null,
        "rejectionReason": null
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 2.2 Get Single POD Design

**Endpoint:** `GET /api/v1/admin/pod/designs/:designId`

**Description:** Get detailed information about a specific POD design

**Authentication:** Required (Admin token)

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "design": {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439020",
      "userName": "John Doe",
      "productType": "tshirt",
      "designUrl": "https://example.com/designs/design123.jpg",
      "status": "pending",
      "submittedDate": "2025-12-15T10:30:00.000Z",
      "approvedDate": null,
      "rejectedDate": null,
      "rejectionReason": null
    }
  }
}
```

---

### 2.3 Approve Design

**Endpoint:** `POST /api/v1/admin/pod/designs/:designId/approve`

**Description:** Approve a user-submitted design

**Authentication:** Required (Admin token)

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Design approved successfully",
  "data": {
    "design": {
      "id": "507f1f77bcf86cd799439011",
      "status": "approved",
      "approvedDate": "2025-12-15T11:00:00.000Z",
      "approvedBy": "507f1f77bcf86cd799439022"
    }
  }
}
```

---

### 2.4 Reject Design

**Endpoint:** `POST /api/v1/admin/pod/designs/:designId/reject`

**Description:** Reject a user-submitted design with a reason

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "reason": "Design does not meet quality standards"
}
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "message": "Design rejected successfully",
  "data": {
    "design": {
      "id": "507f1f77bcf86cd799439011",
      "status": "rejected",
      "rejectionReason": "Design does not meet quality standards",
      "rejectedDate": "2025-12-15T11:00:00.000Z",
      "rejectedBy": "507f1f77bcf86cd799439022"
    }
  }
}
```

---

## 🛍️ 3. POD Products APIs

### 3.1 List POD Products

**Endpoint:** `GET /api/v1/admin/pod/products`

**Description:** Get a list of all POD products

**Authentication:** Required (Admin token)

**Query Parameters:**
- `type` (optional) - Filter by product type
- `status` (optional) - Filter by status: "active", "inactive"
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Premium T-Shirt",
        "type": "tshirt",
        "variants": [...],
        "colors": [...],
        "basePrice": 24.99,
        "status": "active",
        "images": ["https://example.com/products/tshirt1.jpg"],
        "createdAt": "2025-12-15T10:30:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 3.2 Get Single POD Product

**Endpoint:** `GET /api/v1/admin/pod/products/:productId`

**Description:** Get detailed information about a specific POD product

**Authentication:** Required (Admin token)

---

### 3.3 Create POD Product

**Endpoint:** `POST /api/v1/admin/pod/products`

**Description:** Create a new POD product

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "name": "Premium T-Shirt",
  "type": "tshirt",
  "variants": [
    {
      "size": "S",
      "color": "White",
      "material": "Cotton",
      "price": 24.99,
      "stock": 100
    }
  ],
  "basePrice": 24.99,
  "status": "active",
  "images": ["https://example.com/products/tshirt1.jpg"]
}
```

**Note:** Can also accept `multipart/form-data` with `images` as file uploads.

---

### 3.4 Update POD Product

**Endpoint:** `PUT /api/v1/admin/pod/products/:productId`

**Description:** Update a POD product

**Authentication:** Required (Admin token)

---

### 3.5 Delete POD Product

**Endpoint:** `DELETE /api/v1/admin/pod/products/:productId`

**Description:** Delete a POD product

**Authentication:** Required (Admin token)

---

## 📚 4. Catalogs APIs

### 4.1 List All Catalogs

**Endpoint:** `GET /api/v1/admin/pod/catalogs`

**Description:** Get a paginated list of all catalogs with filtering and search

**Authentication:** Required (Admin token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page
- `search` (optional) - Search by catalog name or category
- `categoryId` (optional) - Filter by category ID
- `status` (optional) - Filter by status: "Enabled", "Disabled"

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "catalogs": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Stickers & Labels",
        "slug": "stickers-labels",
        "categoryId": "507f1f77bcf86cd799439020",
        "categoryName": "Crafts & DIY Supplies",
        "image": "https://example.com/catalogs/stickers.jpg",
        "status": "Enabled",
        "createdAt": "2025-09-06T20:14:00.000Z",
        "seoTitle": null,
        "seoDescription": null,
        "seoKeywords": null
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 4.2 Get Single Catalog

**Endpoint:** `GET /api/v1/admin/pod/catalogs/:catalogId`

**Description:** Get detailed information about a specific catalog

**Authentication:** Required (Admin token)

---

### 4.3 Create Catalog

**Endpoint:** `POST /api/v1/admin/pod/catalogs`

**Description:** Create a new catalog

**Authentication:** Required (Admin token)

**Request Body (FormData):**
- `categoryId` (required) - Category ID
- `name` (required) - Catalog name (1-100 characters)
- `slug` (required) - Unique slug
- `image` (required) - Image file (PNG/JPG/JPEG, max 5MB)
- `seoTitle` (optional)
- `seoDescription` (optional)
- `seoKeywords` (optional)

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/pod/catalogs" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "categoryId=507f1f77bcf86cd799439020" \
  -F "name=Stickers & Labels" \
  -F "slug=stickers-labels" \
  -F "image=@/path/to/image.jpg"
```

---

### 4.4 Update Catalog

**Endpoint:** `PUT /api/v1/admin/pod/catalogs/:catalogId`

**Description:** Update a catalog

**Authentication:** Required (Admin token)

**Request Body (FormData or JSON):**
- All fields optional
- Can include `image` file upload

---

### 4.5 Toggle Catalog Status

**Endpoint:** `PUT /api/v1/admin/pod/catalogs/:catalogId/status`

**Description:** Enable or disable a catalog

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "status": "Disabled"
}
```

**Valid Status Values:**
- `Enabled` - Catalog is active and visible
- `Disabled` - Catalog is inactive and hidden

---

### 4.6 Update Catalog SEO Settings

**Endpoint:** `PUT /api/v1/admin/pod/catalogs/:catalogId/seo`

**Description:** Update SEO settings for a catalog

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "seoTitle": "Custom Stickers & Labels - Print on Demand",
  "seoDescription": "Create and order custom stickers and labels for your business",
  "seoKeywords": "stickers, labels, custom printing, print on demand"
}
```

---

### 4.7 Delete Catalog

**Endpoint:** `DELETE /api/v1/admin/pod/catalogs/:catalogId`

**Description:** Delete a catalog

**Authentication:** Required (Admin token)

---

## 🏷️ 5. Catalog Categories APIs

### 5.1 List All Catalog Categories

**Endpoint:** `GET /api/v1/admin/pod/catalog-categories`

**Description:** Get a paginated list of all catalog categories

**Authentication:** Required (Admin token)

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional) - Search by category name
- `feature` (optional) - Filter by feature: "General", "Featured"
- `status` (optional) - Filter by status: "Enabled", "Disabled"

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Gifts & Occasion-Based",
        "slug": "gifts-occasion-based",
        "description": "Gifts for special occasions",
        "image": "https://example.com/categories/gifts.jpg",
        "totalCatalogs": 3,
        "feature": "General",
        "status": "Enabled",
        "seoTitle": null,
        "seoDescription": null,
        "seoKeywords": null,
        "createdAt": "2025-12-15T10:30:00.000Z"
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 5.2 Get Single Catalog Category

**Endpoint:** `GET /api/v1/admin/pod/catalog-categories/:categoryId`

**Description:** Get detailed information about a specific catalog category

**Authentication:** Required (Admin token)

---

### 5.3 Create Catalog Category

**Endpoint:** `POST /api/v1/admin/pod/catalog-categories`

**Description:** Create a new catalog category

**Authentication:** Required (Admin token)

**Request Body (FormData):**
- `name` (required) - Category name (1-100 characters)
- `slug` (required) - Unique slug
- `feature` (required) - "General" or "Featured"
- `image` (required) - Image file (PNG/JPG/JPEG, max 5MB)
- `description` (optional) - Max 500 characters
- `seoTitle` (optional)
- `seoDescription` (optional)
- `seoKeywords` (optional)

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/pod/catalog-categories" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=Gifts & Occasion-Based" \
  -F "slug=gifts-occasion-based" \
  -F "description=Gifts for special occasions" \
  -F "feature=General" \
  -F "image=@/path/to/image.jpg"
```

---

### 5.4 Update Catalog Category

**Endpoint:** `PUT /api/v1/admin/pod/catalog-categories/:categoryId`

**Description:** Update a catalog category

**Authentication:** Required (Admin token)

**Request Body (FormData or JSON):**
- All fields optional
- Can include `image` file upload

---

### 5.5 Toggle Category Status

**Endpoint:** `PUT /api/v1/admin/pod/catalog-categories/:categoryId/status`

**Description:** Enable or disable a catalog category

**Authentication:** Required (Admin token)

**Request Body:**
```json
{
  "status": "Disabled"
}
```

---

### 5.6 Update Category SEO Settings

**Endpoint:** `PUT /api/v1/admin/pod/catalog-categories/:categoryId/seo`

**Description:** Update SEO settings for a catalog category

**Authentication:** Required (Admin token)

---

### 5.7 Delete Catalog Category

**Endpoint:** `DELETE /api/v1/admin/pod/catalog-categories/:categoryId`

**Description:** Delete a catalog category

**Authentication:** Required (Admin token)

**Validation Rules:**
- Cannot delete category if it has associated catalogs (must delete or move catalogs first)

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot delete category with associated catalogs",
  "code": "CATEGORY_IN_USE"
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
      "field": "name",
      "message": "Name is required"
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
- `DUPLICATE_ENTRY` - Duplicate value (e.g., slug, email)
- `CATEGORY_IN_USE` - Cannot delete category with associated catalogs
- `FILE_TOO_LARGE` - Uploaded file exceeds size limit
- `INVALID_FILE_TYPE` - File type not allowed

---

## 📝 Implementation Notes

### File Upload Handling

**Important:** For FormData requests (catalogs and catalog categories), the file is accessed via `req.file`, not `req.body.image`.

- Accept PNG, JPG, JPEG files
- Maximum file size: 5MB
- Files stored in:
  - Catalogs: `uploads/pod/catalogs/`
  - Catalog Categories: `uploads/pod/catalog-categories/`
  - POD Products: `uploads/pod/products/`
- Return public URL in response

### Slug Generation
- Generate from name: lowercase, replace spaces with hyphens, remove special characters
- Must be unique
- URL-friendly format

### Status Management
- Catalogs and Categories: `Enabled` / `Disabled`
- Orders: `pending` → `processing` → `shipped` → `delivered`
- Designs: `pending` → `approved` / `rejected`
- Products: `active` / `inactive`

---

## ✅ Summary of All Endpoints

**Total: 26 API endpoints**

- **POD Orders:** 5 endpoints (List, Get, Update Status, Ship, Cancel)
- **POD Designs:** 4 endpoints (List, Get, Approve, Reject)
- **POD Products:** 4 endpoints (List, Get, Create, Update, Delete)
- **Catalogs:** 7 endpoints (List, Get, Create, Update, Toggle Status, Update SEO, Delete)
- **Catalog Categories:** 7 endpoints (List, Get, Create, Update, Toggle Status, Update SEO, Delete)

---

**Last Updated:** 2025-12-15

