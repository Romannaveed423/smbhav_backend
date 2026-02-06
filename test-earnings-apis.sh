#!/bin/bash

# Earnings API Testing Script
# This script tests all Earnings section APIs

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Earnings API Testing Script"
echo "=========================================="
echo ""

# Step 1: Check server health
echo -e "${YELLOW}Step 1: Checking Server Health${NC}"
echo "----------------------------------------"
curl -s http://localhost:3000/health | jq . || echo "Server not running!"
echo ""

# Step 2: Earnings health check
echo -e "${YELLOW}Step 2: Earnings Health Check${NC}"
echo "----------------------------------------"
echo "Earnings Health:"
curl -s http://localhost:3000/api/v1/earn/health | jq .
echo ""

# Step 3: Login to get token
echo -e "${YELLOW}Step 3: Authentication${NC}"
echo "----------------------------------------"
echo "Attempting to login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Login failed. Please ensure test user exists.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 4: Test Dashboard API
echo -e "${YELLOW}Step 4: Dashboard API${NC}"
echo "----------------------------------------"

echo "4.1 Get Earnings Dashboard:"
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/dashboard" \
  -H "Authorization: Bearer $TOKEN")
echo "$DASHBOARD_RESPONSE" | jq .
echo ""

# Step 5: Test Products APIs
echo -e "${YELLOW}Step 5: Products APIs${NC}"
echo "----------------------------------------"

echo "5.1 Get Earnings Products:"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "$PRODUCTS_RESPONSE" | jq .
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.products[0].id // empty')
echo ""

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "5.2 Get Product Offers (Product ID: $PRODUCT_ID):"
  OFFERS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/products/$PRODUCT_ID/offers" \
    -H "Authorization: Bearer $TOKEN")
  echo "$OFFERS_RESPONSE" | jq .
  OFFER_ID=$(echo "$OFFERS_RESPONSE" | jq -r '.data.offers[0].id // empty')
  echo ""
  
  echo "5.3 Get Product Detail (Product ID: $PRODUCT_ID):"
  curl -s -X GET "$BASE_URL/earn/products/$PRODUCT_ID/detail" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
  
  echo "5.4 Apply for Product (Product ID: $PRODUCT_ID):"
  APPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/earn/products/$PRODUCT_ID/apply" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientDetails\": {
        \"clientName\": \"Test Client\",
        \"businessName\": \"Test Business\",
        \"gstin\": \"29ABCDE1234F1Z5\",
        \"addressProof\": \"https://example.com/proof.pdf\"
      },
      \"documents\": {
        \"aadhar\": \"https://example.com/aadhar.pdf\",
        \"pan\": \"https://example.com/pan.pdf\",
        \"addressProof\": \"https://example.com/address.pdf\"
      },
      \"offerId\": \"$OFFER_ID\"
    }")
  echo "$APPLY_RESPONSE" | jq .
  APPLICATION_ID=$(echo "$APPLY_RESPONSE" | jq -r '.data.applicationId // empty')
  TRACKING_TOKEN=$(echo "$APPLY_RESPONSE" | jq -r '.data.trackingToken // empty')
  echo ""
  
  if [ ! -z "$APPLICATION_ID" ] && [ "$APPLICATION_ID" != "null" ]; then
    echo "5.5 Get Application Status (Application ID: $APPLICATION_ID):"
    curl -s -X GET "$BASE_URL/earn/applications/$APPLICATION_ID/status" \
      -H "Authorization: Bearer $TOKEN" | jq .
    echo ""
  fi
  
  if [ ! -z "$TRACKING_TOKEN" ] && [ "$TRACKING_TOKEN" != "null" ]; then
    echo "5.6 Test Postback (Tracking Token: ${TRACKING_TOKEN:0:20}...):"
    POSTBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/earn/postback?token=$TRACKING_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "amount": 500,
        "status": "completed",
        "transactionId": "TXN_TEST_123",
        "conversionId": "CONV_TEST_456"
      }')
    echo "$POSTBACK_RESPONSE" | jq .
    echo ""
  fi
fi

# Step 6: Test Earnings APIs
echo -e "${YELLOW}Step 6: Earnings APIs${NC}"
echo "----------------------------------------"

echo "6.1 Get User Earnings:"
EARNINGS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/earnings?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "$EARNINGS_RESPONSE" | jq .
echo ""

echo "6.2 Get User Earnings (Filtered by status=completed):"
curl -s -X GET "$BASE_URL/earn/earnings?status=completed&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "6.3 Get User Earnings (Filtered by status=pending):"
curl -s -X GET "$BASE_URL/earn/earnings?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 7: Test Withdrawal APIs
echo -e "${YELLOW}Step 7: Withdrawal APIs${NC}"
echo "----------------------------------------"

echo "7.1 Get Withdrawals:"
WITHDRAWALS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/withdrawals?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "$WITHDRAWALS_RESPONSE" | jq .
echo ""

echo "7.2 Get Withdrawals (Filtered by status=completed):"
curl -s -X GET "$BASE_URL/earn/withdrawals?status=completed&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "7.3 Get Withdrawals (Filtered by status=pending):"
curl -s -X GET "$BASE_URL/earn/withdrawals?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "7.4 Withdraw Earnings:"
WITHDRAW_RESPONSE=$(curl -s -X POST "$BASE_URL/earn/withdraw" \
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
  }')
echo "$WITHDRAW_RESPONSE" | jq .
echo ""

# Step 8: Test Edge Cases
echo -e "${YELLOW}Step 8: Edge Cases & Error Handling${NC}"
echo "----------------------------------------"

echo "8.1 Get Non-existent Product:"
curl -s -X GET "$BASE_URL/earn/products/507f1f77bcf86cd799439999/detail" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "8.2 Get Non-existent Application:"
curl -s -X GET "$BASE_URL/earn/applications/507f1f77bcf86cd799439999/status" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "8.3 Withdraw with Invalid Amount:"
curl -s -X POST "$BASE_URL/earn/withdraw" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0,
    "method": "bank_transfer",
    "accountDetails": {
      "accountNumber": "1234567890",
      "ifsc": "BANK0001234",
      "accountHolderName": "Test User"
    }
  }' | jq .
echo ""

echo "8.4 Postback with Invalid Token:"
curl -s -X POST "$BASE_URL/earn/postback?token=invalid_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "status": "completed"
  }' | jq .
echo ""

echo ""
echo "=========================================="
echo -e "${GREEN}✓ All Earnings API Tests Completed${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Dashboard: Tested"
echo "- Products: Tested"
echo "- Offers: Tested"
echo "- Applications: Tested"
echo "- Earnings: Tested"
echo "- Withdrawals: Tested"
echo "- Postback: Tested"
echo "- Error Handling: Tested"

