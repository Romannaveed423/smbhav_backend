# Earnings API Testing Guide

## Overview

This guide provides instructions for testing all Earnings section APIs, similar to the Store section testing.

## Prerequisites

1. Server must be running on `http://localhost:3000`
2. MongoDB must be connected
3. Seed data should be created (run `node seed-earnings-data.js`)

## Seed Data

Run the seed script to create test data:

```bash
node seed-earnings-data.js
```

This creates:
- **4 Products**: Credit Card, Personal Loan, Home Loan, Insurance Policy
- **8 Offers**: 2 offers per product (Standard and Premium)
- **3 Applications**: With different statuses (approved, in_review, pending)
- **2 Earnings**: One completed, one pending
- **3 Withdrawals**: Different statuses and methods

## Test User

- **Email**: `test@example.com`
- **Password**: `test123`
- **Wallet Balance**: Updated based on earnings

## Testing Scripts

### Automated Test Script

Run the comprehensive test script:

```bash
./test-earnings-apis.sh
```

**Note**: If you encounter rate limiting errors, wait 15 minutes between test runs or use an existing authentication token.

### Manual Testing

#### Step 1: Get Authentication Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }' | jq -r '.data.token')

echo "Token: ${TOKEN:0:20}..."
```

#### Step 2: Test Health Check

```bash
curl -s http://localhost:3000/api/v1/earn/health | jq .
```

#### Step 3: Test Dashboard

```bash
curl -s -X GET "http://localhost:3000/api/v1/earn/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 4: Test Products

```bash
# Get all products
curl -s -X GET "http://localhost:3000/api/v1/earn/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get product offers (replace PRODUCT_ID)
PRODUCT_ID="YOUR_PRODUCT_ID"
curl -s -X GET "http://localhost:3000/api/v1/earn/products/$PRODUCT_ID/offers" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get product detail
curl -s -X GET "http://localhost:3000/api/v1/earn/products/$PRODUCT_ID/detail" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 5: Test Application

```bash
# Apply for product
APPLY_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/earn/products/$PRODUCT_ID/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientDetails": {
      "clientName": "Test Client",
      "businessName": "Test Business",
      "gstin": "29ABCDE1234F1Z5",
      "addressProof": "https://example.com/proof.pdf"
    },
    "documents": {
      "aadhar": "https://example.com/aadhar.pdf",
      "pan": "https://example.com/pan.pdf",
      "addressProof": "https://example.com/address.pdf"
    }
  }')

APPLICATION_ID=$(echo $APPLY_RESPONSE | jq -r '.data.applicationId')
TRACKING_TOKEN=$(echo $APPLY_RESPONSE | jq -r '.data.trackingToken')

echo "Application ID: $APPLICATION_ID"
echo "Tracking Token: ${TRACKING_TOKEN:0:20}..."

# Get application status
curl -s -X GET "http://localhost:3000/api/v1/earn/applications/$APPLICATION_ID/status" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 6: Test Postback

```bash
# Test postback (no authentication required, uses tracking token)
curl -s -X POST "http://localhost:3000/api/v1/earn/postback?token=$TRACKING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "status": "completed",
    "transactionId": "TXN_TEST_123",
    "conversionId": "CONV_TEST_456"
  }' | jq .
```

#### Step 7: Test Earnings

```bash
# Get all earnings
curl -s -X GET "http://localhost:3000/api/v1/earn/earnings?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get completed earnings
curl -s -X GET "http://localhost:3000/api/v1/earn/earnings?status=completed&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get pending earnings
curl -s -X GET "http://localhost:3000/api/v1/earn/earnings?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 8: Test Withdrawals

```bash
# Get withdrawals
curl -s -X GET "http://localhost:3000/api/v1/earn/withdrawals?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Withdraw earnings
curl -s -X POST "http://localhost:3000/api/v1/earn/withdraw" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200,
    "method": "bank_transfer",
    "accountDetails": {
      "accountNumber": "1234567890",
      "ifsc": "BANK0001234",
      "accountHolderName": "Test User"
    }
  }' | jq .
```

## API Endpoints Summary

### 1. Health Check
- **GET** `/api/v1/earn/health`
- **Auth**: Not required
- **Response**: `{ "status": "ok", "module": "earnings", "timestamp": "..." }`

### 2. Dashboard
- **GET** `/api/v1/earn/dashboard?section={section}&category={category}`
- **Auth**: Required
- **Response**: Wallet balance, total earnings, leads, sales, products

### 3. Products
- **GET** `/api/v1/earn/products?page={page}&limit={limit}&section={section}&category={category}`
- **Auth**: Required
- **Response**: List of earning products

### 4. Product Offers
- **GET** `/api/v1/earn/products/:productId/offers`
- **Auth**: Required
- **Response**: List of offers for a product

### 5. Product Detail
- **GET** `/api/v1/earn/products/:productId/detail`
- **Auth**: Required
- **Response**: Detailed product information with metrics

### 6. Apply for Product
- **POST** `/api/v1/earn/products/:productId/apply`
- **Auth**: Required
- **Body**: `{ clientDetails, documents, offerId? }`
- **Response**: Application ID, tracking token, postback URL

### 7. Application Status
- **GET** `/api/v1/earn/applications/:applicationId/status`
- **Auth**: Required
- **Response**: Application status and timeline

### 8. Earnings
- **GET** `/api/v1/earn/earnings?page={page}&limit={limit}&status={status}`
- **Auth**: Required
- **Response**: List of user earnings

### 9. Withdraw Earnings
- **POST** `/api/v1/earn/withdraw`
- **Auth**: Required
- **Body**: `{ amount, method, accountDetails }`
- **Response**: Withdrawal request details

### 10. Withdrawals
- **GET** `/api/v1/earn/withdrawals?page={page}&limit={limit}&status={status}`
- **Auth**: Required
- **Response**: List of withdrawal requests

### 11. Postback (S2S)
- **POST** `/api/v1/earn/postback?token={trackingToken}`
- **Auth**: Not required (secured by tracking token)
- **Body**: `{ amount?, status?, transactionId?, conversionId?, ... }`
- **Response**: Postback processing result

## Expected Test Results

After running the seed script and tests, you should see:

✅ **Products**: 4 products available
✅ **Offers**: 8 offers (2 per product)
✅ **Applications**: 3 applications with different statuses
✅ **Earnings**: 2 earnings (1 completed, 1 pending)
✅ **Withdrawals**: 3 withdrawals (different statuses)

## Troubleshooting

### Rate Limiting
If you see "Too many authentication attempts", wait 15 minutes or restart the server.

### Missing Data
Run the seed script again:
```bash
node seed-earnings-data.js
```

### Authentication Errors
Ensure the test user exists:
```bash
# Check if user exists in database or create via registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "test123",
    "confirmPassword": "test123",
    "agreeToTerms": true
  }'
```

## Files Created

1. **seed-earnings-data.js** - Seed data script
2. **test-earnings-apis.sh** - Automated test script
3. **EARNINGS_API_TEST_GUIDE.md** - This guide

## Next Steps

1. Run seed script: `node seed-earnings-data.js`
2. Wait for rate limit to reset (if needed)
3. Run test script: `./test-earnings-apis.sh`
4. Or test manually using the commands above

