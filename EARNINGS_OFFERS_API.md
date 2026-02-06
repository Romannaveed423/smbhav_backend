# Earnings/Offers API Documentation

## 📋 Overview

This document covers all API endpoints related to earnings and offers for mobile app users.

---

## 🔗 Base URL

```
http://localhost:3000/api/v1
```

All endpoints (except health check) require **User authentication** (Bearer token).

---

## 📦 1. Offers APIs

### 1.1 Get All Offers

**Endpoint:** `GET /api/v1/earn/offers`

**Description:** Get a paginated list of all active offers available to users

**Authentication:** Required (User token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page (max 100)
- `search` (optional) - Search by offer name
- `category` (optional) - Filter by category: "campaign", "dsa_mfd_agent", "social_task", "other_tasks", "influencer_marketing", "company_task", "freelancer_task"
- `section` (optional) - Filter by section: "sambhav", "public"

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/offers?page=1&limit=20&category=campaign" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "productId": "507f1f77bcf86cd799439020",
        "name": "Credit Card Sign-Up Bonus",
        "description": "Earn ₹500 by signing up for a credit card",
        "amount": 500,
        "payoutCost": 500,
        "status": "active",
        "category": "campaign",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.000Z",
        "imageUrl": "https://example.com/offers/credit-card.jpg",
        "iconUrl": "https://example.com/offers/credit-card-icon.png",
        "clickLifeSpan": 30,
        "cap": 1000,
        "dailyCap": 50,
        "monthlyCap": 200,
        "payoutModel": "CPA",
        "payoutType": "fixed",
        "trackingLink": "https://advertiser.com/track?offer=123",
        "previewLink": "https://advertiser.com/offer/123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Response Fields:**
- `_id` - Offer ID
- `productId` - Associated product ID (can be null for standalone offers)
- `name` - Offer name
- `description` - Offer description
- `amount` - Payout amount (alias for payoutCost)
- `payoutCost` - Payout amount
- `status` - Always "active" for user-facing endpoints
- `category` - Offer category
- `startDate` - Offer start date (optional)
- `endDate` - Offer end date (optional)
- `imageUrl` - Offer image URL (optional)
- `iconUrl` - Offer icon URL (optional)
- `clickLifeSpan` - Click tracking lifespan in days (optional)
- `cap` - Total offer cap (optional)
- `dailyCap` - Daily cap (optional)
- `monthlyCap` - Monthly cap (optional)
- `payoutModel` - Payout model (e.g., "CPA", "CPC") (optional)
- `payoutType` - Payout type (e.g., "fixed", "percentage") (optional)
- `trackingLink` - Tracking link for the offer (optional)
- `previewLink` - Preview link for the offer (optional)

**Filtering Rules:**
- Only returns offers with `status: "active"`
- Only returns offers that are currently valid based on dates:
  - Offers with both `startDate` and `endDate`: current date must be between them
  - Offers with only `startDate`: current date must be >= startDate
  - Offers with only `endDate`: current date must be <= endDate
  - Offers with no dates: always included

**Error Responses:**
- `401` - Unauthorized (invalid or missing token)
- `400` - Validation error (invalid query parameters)

---

### 1.2 Get Product Offers

**Endpoint:** `GET /api/v1/earn/products/:productId/offers`

**Description:** Get all offers for a specific product

**Authentication:** Required (User token)

**Path Parameters:**
- `productId` (required) - Product ID

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/products/507f1f77bcf86cd799439020/offers" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Credit Card Sign-Up Bonus",
        "amount": 500,
        "payoutCost": 500,
        "oldPrice": 0,
        "icon": "https://example.com/offers/icon.png",
        "status": "active",
        "category": "campaign",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Product not found

---

## 📦 2. Offer Applications APIs

### 2.1 Submit Offer Application

**Endpoint:** `POST /api/v1/earn/offer-applications`

**Description:** Submit a new application to promote an offer

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "offerId": "507f1f77bcf86cd799439011",
  "offerPromotion": "I will promote this offer through my social media channels with a detailed review and call-to-action"
}
```

**Validation Rules:**
- `offerId` - Required, must be a valid offer ID
- `offerPromotion` - Required, minimum 10 characters, description of how you will promote the offer

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/earn/offer-applications" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "507f1f77bcf86cd799439011",
    "offerPromotion": "I will promote this credit card offer through my Instagram and YouTube channels with detailed reviews"
  }'
```

**Response Format (201 Created):**
```json
{
  "success": true,
  "message": "Offer application submitted successfully",
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439022",
      "offerId": "507f1f77bcf86cd799439011",
      "offerName": "Credit Card Sign-Up Bonus",
      "publisherId": "507f1f77bcf86cd799439033",
      "publisherName": "John Doe",
      "offerPromotion": "I will promote this credit card offer through my Instagram and YouTube channels with detailed reviews",
      "status": "Pending",
      "createdAt": "2025-12-15T10:30:00.000Z",
      "updatedAt": "2025-12-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `404` - Offer not found
- `409` - Duplicate application (you already have a pending or active application for this offer)

---

## 📦 3. Other Earnings Endpoints

### 3.1 Get Earnings Dashboard

**Endpoint:** `GET /api/v1/earn/dashboard`

**Description:** Get user's earnings dashboard with summary statistics

**Authentication:** Required (User token)

**Query Parameters:**
- `section` (optional, default: "sambhav") - Filter by section: "sambhav", "public"
- `category` (optional) - Filter by category

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/dashboard?section=sambhav" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "walletBalance": 5000.00,
    "totalEarnings": 12500.00,
    "totalLeads": 45,
    "totalSales": 12,
    "products": [
      {
        "id": "...",
        "name": "Credit Card",
        "earnings": 2500.00,
        "leads": 15,
        "sales": 5
      }
    ]
  }
}
```

---

### 3.2 Get Earnings Products

**Endpoint:** `GET /api/v1/earn/products`

**Description:** Get a list of all earning products

**Authentication:** Required (User token)

**Query Parameters:**
- `section` (required) - "sambhav" or "public"
- `category` (optional) - Filter by category
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/products?section=sambhav&page=1&limit=20" \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### 3.3 Get Product Detail

**Endpoint:** `GET /api/v1/earn/products/:productId/detail`

**Description:** Get detailed information about a specific product with user's metrics

**Authentication:** Required (User token)

**Path Parameters:**
- `productId` (required) - Product ID

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/products/507f1f77bcf86cd799439020/detail" \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### 3.4 Get Earnings History

**Endpoint:** `GET /api/v1/earn/earnings`

**Description:** Get user's earnings history with pagination

**Authentication:** Required (User token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter until date (ISO format)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/earnings?page=1&limit=20&startDate=2025-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.000Z" \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### 3.5 Get Withdrawals

**Endpoint:** `GET /api/v1/earn/withdrawals`

**Description:** Get user's withdrawal history

**Authentication:** Required (User token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `status` (optional) - Filter by status: "pending", "processing", "completed", "failed", "cancelled"

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/earn/withdrawals?page=1&limit=20&status=pending" \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### 3.6 Withdraw Earnings

**Endpoint:** `POST /api/v1/earn/withdraw`

**Description:** Request withdrawal of earnings

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "amount": 1000.00,
  "bankAccount": {
    "accountNumber": "1234567890",
    "ifscCode": "BANK0001234",
    "accountHolderName": "John Doe",
    "bankName": "Example Bank"
  },
  "upiId": null
}
```

**OR**

```json
{
  "amount": 1000.00,
  "upiId": "john@upi",
  "bankAccount": null
}
```

**Validation Rules:**
- `amount` - Required, must be positive
- Either `bankAccount` or `upiId` is required
- `bankAccount.accountNumber` - Required if bankAccount provided
- `bankAccount.ifscCode` - Required if bankAccount provided
- `bankAccount.accountHolderName` - Required if bankAccount provided
- `bankAccount.bankName` - Required if bankAccount provided

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/earn/withdraw" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.00,
    "bankAccount": {
      "accountNumber": "1234567890",
      "ifscCode": "BANK0001234",
      "accountHolderName": "John Doe",
      "bankName": "Example Bank"
    }
  }'
```

---

## 🔐 Authentication

All endpoints (except health check) require authentication using JWT Bearer tokens.

**Header Format:**
```
Authorization: Bearer {userToken}
```

**Get Token:**
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

Response includes `token` in `data.token`.

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "offerId",
      "message": "Offer ID is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `DUPLICATE_APPLICATION` - You already have a pending or active application for this offer

---

## 📝 Testing Examples

### Complete Testing Flow

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }' | jq -r '.data.token')

echo "Token: ${TOKEN:0:20}..."

# 2. Get all offers
curl -s -X GET "http://localhost:3000/api/v1/earn/offers?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Get offers with filters
curl -s -X GET "http://localhost:3000/api/v1/earn/offers?page=1&limit=10&category=campaign&search=credit" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. Get product offers (replace PRODUCT_ID)
PRODUCT_ID="YOUR_PRODUCT_ID"
curl -s -X GET "http://localhost:3000/api/v1/earn/products/$PRODUCT_ID/offers" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Submit offer application (replace OFFER_ID)
OFFER_ID="YOUR_OFFER_ID"
curl -s -X POST "http://localhost:3000/api/v1/earn/offer-applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"offerId\": \"$OFFER_ID\",
    \"offerPromotion\": \"I will promote this offer through my social media channels with detailed reviews and tutorials\"
  }" | jq .

# 6. Get earnings dashboard
curl -s -X GET "http://localhost:3000/api/v1/earn/dashboard?section=sambhav" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 7. Get earnings history
curl -s -X GET "http://localhost:3000/api/v1/earn/earnings?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 8. Get withdrawals
curl -s -X GET "http://localhost:3000/api/v1/earn/withdrawals?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## ✅ Summary of Endpoints

1. **GET** `/api/v1/earn/offers` - Get all active offers (with filters)
2. **GET** `/api/v1/earn/products/:productId/offers` - Get offers for a product
3. **POST** `/api/v1/earn/offer-applications` - Submit offer application
4. **GET** `/api/v1/earn/dashboard` - Get earnings dashboard
5. **GET** `/api/v1/earn/products` - Get earning products
6. **GET** `/api/v1/earn/products/:productId/detail` - Get product detail
7. **GET** `/api/v1/earn/earnings` - Get earnings history
8. **GET** `/api/v1/earn/withdrawals` - Get withdrawals
9. **POST** `/api/v1/earn/withdraw` - Request withdrawal

---

**Last Updated:** 2025-12-15

