#!/bin/bash

# Click Tracking & Postback API Testing Script
# This script tests the new click tracking system

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
ADMIN_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Click Tracking & Postback API Testing"
echo "=========================================="
echo ""

# Step 1: Check server health
echo -e "${YELLOW}Step 1: Checking Server Health${NC}"
echo "----------------------------------------"
curl -s http://localhost:3000/health | jq . || echo -e "${RED}Server not running!${NC}"
echo ""

# Step 2: Login to get user token
echo -e "${YELLOW}Step 2: User Authentication${NC}"
echo "----------------------------------------"
echo "Attempting to login as test user..."
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

echo -e "${GREEN}✓ User authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 3: Get a product ID
echo -e "${YELLOW}Step 3: Get Products${NC}"
echo "----------------------------------------"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/products?page=1&limit=1" \
  -H "Authorization: Bearer $TOKEN")
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.products[0].id // empty')

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" == "null" ]; then
  echo -e "${RED}No products found. Please seed product data first.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Found product: $PRODUCT_ID${NC}"
echo ""

# Step 4: Test Generate Click Endpoint
echo -e "${YELLOW}Step 4: Generate Click${NC}"
echo "----------------------------------------"
echo "Testing POST /api/v1/earn/products/$PRODUCT_ID/click"

GENERATE_CLICK_RESPONSE=$(curl -s -X POST "$BASE_URL/earn/products/$PRODUCT_ID/click" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskUrl": "https://example.com/task"
  }')

echo "$GENERATE_CLICK_RESPONSE" | jq .

CLICK_ID=$(echo "$GENERATE_CLICK_RESPONSE" | jq -r '.data.clickId // empty')
REDIRECT_URL=$(echo "$GENERATE_CLICK_RESPONSE" | jq -r '.data.redirectUrl // empty')
TRACKING_URL=$(echo "$GENERATE_CLICK_RESPONSE" | jq -r '.data.trackingUrl // empty')

if [ -z "$CLICK_ID" ] || [ "$CLICK_ID" == "null" ]; then
  echo -e "${RED}Failed to generate click${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Click generated successfully${NC}"
echo "Click ID: $CLICK_ID"
echo "Redirect URL: $REDIRECT_URL"
echo "Tracking URL: $TRACKING_URL"
echo ""

# Step 5: Test Track Click Endpoint (Optional)
echo -e "${YELLOW}Step 5: Track Click (Optional Analytics)${NC}"
echo "----------------------------------------"
echo "Testing GET /api/v1/earn/track/$CLICK_ID"

TRACK_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/track/$CLICK_ID")
echo "$TRACK_RESPONSE" | jq .
echo ""

# Step 6: Test Postback Endpoint
echo -e "${YELLOW}Step 6: Postback with Click ID${NC}"
echo "----------------------------------------"
echo "Testing POST /api/v1/earn/postback?click_id=$CLICK_ID"

POSTBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/earn/postback?click_id=$CLICK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "status": "completed",
    "transactionId": "TXN_TEST_123",
    "conversionId": "CONV_TEST_456",
    "offerId": ""
  }')

echo "$POSTBACK_RESPONSE" | jq .

CONVERSION_ID=$(echo "$POSTBACK_RESPONSE" | jq -r '.data.conversionId // empty')
EARNING_ID=$(echo "$POSTBACK_RESPONSE" | jq -r '.data.earningId // empty')

if [ -z "$CONVERSION_ID" ] || [ "$CONVERSION_ID" == "null" ]; then
  echo -e "${RED}Postback may have failed${NC}"
else
  echo -e "${GREEN}✓ Postback processed successfully${NC}"
  echo "Conversion ID: $CONVERSION_ID"
  echo "Earning ID: $EARNING_ID"
fi
echo ""

# Step 7: Test Admin Endpoints (if admin user exists)
echo -e "${YELLOW}Step 7: Admin Endpoints${NC}"
echo "----------------------------------------"

# Try to login as admin (you'll need to create an admin user first)
echo "Note: Admin endpoints require a user with role='admin'"
echo "You can set a user as admin in MongoDB:"
echo "  db.users.updateOne({email: 'admin@example.com'}, {\$set: {role: 'admin'}})"
echo ""

# Step 8: Test Error Cases
echo -e "${YELLOW}Step 8: Error Handling${NC}"
echo "----------------------------------------"

echo "8.1 Postback with Invalid Click ID:"
curl -s -X POST "$BASE_URL/earn/postback?click_id=invalid_click_id_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "status": "completed"
  }' | jq .
echo ""

echo "8.2 Generate Click with Invalid Product ID:"
curl -s -X POST "$BASE_URL/earn/products/invalid_product_id/click" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskUrl": "https://example.com/task"
  }' | jq .
echo ""

echo "8.3 Generate Click without Authentication:"
curl -s -X POST "$BASE_URL/earn/products/$PRODUCT_ID/click" \
  -H "Content-Type: application/json" \
  -d '{
    "taskUrl": "https://example.com/task"
  }' | jq .
echo ""

echo "8.4 Generate Click with Invalid Task URL:"
curl -s -X POST "$BASE_URL/earn/products/$PRODUCT_ID/click" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskUrl": "not-a-valid-url"
  }' | jq .
echo ""

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Click Tracking API Tests Completed${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Generate Click: Tested"
echo "- Track Click: Tested"
echo "- Postback with click_id: Tested"
echo "- Error Handling: Tested"
echo ""
echo "Next Steps:"
echo "1. Create an admin user in MongoDB:"
echo "   db.users.updateOne({email: 'YOUR_EMAIL'}, {\$set: {role: 'admin'}})"
echo "2. Test admin endpoints with admin token"
echo "3. Verify click logs in database"
echo "4. Verify earnings were created with clickId and conversionId"

