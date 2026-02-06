#!/bin/bash

# Store API Testing Script
# This script tests all Store section APIs

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Store API Testing Script"
echo "=========================================="
echo ""

# Step 1: Check server health
echo -e "${YELLOW}Step 1: Checking Server Health${NC}"
echo "----------------------------------------"
curl -s http://localhost:3000/health | jq . || echo "Server not running!"
echo ""

# Step 2: Health checks for all modules
echo -e "${YELLOW}Step 2: Health Checks${NC}"
echo "----------------------------------------"
echo "Store Health:"
curl -s http://localhost:3000/api/v1/store/health | jq .
echo ""
echo "Cart Health:"
curl -s http://localhost:3000/api/v1/cart/health | jq .
echo ""
echo "Notifications Health:"
curl -s http://localhost:3000/api/v1/notifications/health | jq .
echo ""
echo "Locations Health:"
curl -s http://localhost:3000/api/v1/locations/health | jq .
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
  echo -e "${RED}Login failed. Creating test user...${NC}"
  
  # Try to register
  REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "phone": "9876543210",
      "password": "test123",
      "confirmPassword": "test123",
      "agreeToTerms": true
    }')
  
  TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token // empty')
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}Failed to create user. Please create a user manually or use existing credentials.${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
  fi
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 4: Test Location APIs
echo -e "${YELLOW}Step 4: Location APIs${NC}"
echo "----------------------------------------"

echo "4.1 Get User Locations:"
curl -s -X GET "$BASE_URL/user/locations" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4.2 Get User Location (Default):"
curl -s -X GET "$BASE_URL/user/location" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4.3 Search Locations:"
curl -s -X GET "$BASE_URL/locations/search?query=main" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 5: Test Category APIs
echo -e "${YELLOW}Step 5: Category APIs${NC}"
echo "----------------------------------------"

echo "5.1 Get Categories:"
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/store/categories" \
  -H "Authorization: Bearer $TOKEN")
echo "$CATEGORIES_RESPONSE" | jq .
CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data.categories[0].id // empty')
echo ""

if [ ! -z "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
  echo "5.2 Get Category Products (Category ID: $CATEGORY_ID):"
  curl -s -X GET "$BASE_URL/store/categories/$CATEGORY_ID/products?page=1&limit=5" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

# Step 6: Test Banner APIs
echo -e "${YELLOW}Step 6: Banner APIs${NC}"
echo "----------------------------------------"

echo "6.1 Get Banners:"
curl -s -X GET "$BASE_URL/store/banners" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 7: Test Store APIs
echo -e "${YELLOW}Step 7: Store APIs${NC}"
echo "----------------------------------------"

echo "7.1 Get Recommended Stores:"
STORES_RESPONSE=$(curl -s -X GET "$BASE_URL/store/stores/recommended?limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$STORES_RESPONSE" | jq .
STORE_ID=$(echo "$STORES_RESPONSE" | jq -r '.data.stores[0].id // empty')
echo ""

echo "7.2 Get All Recommended Stores (Paginated):"
curl -s -X GET "$BASE_URL/store/stores/recommended/all?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

if [ ! -z "$STORE_ID" ] && [ "$STORE_ID" != "null" ]; then
  echo "7.3 Get Store Details (Store ID: $STORE_ID):"
  curl -s -X GET "$BASE_URL/store/stores/$STORE_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
  
  echo "7.4 Get Store Status (Store ID: $STORE_ID):"
  curl -s -X GET "$BASE_URL/store/stores/$STORE_ID/status" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

echo "7.5 Search Stores:"
curl -s -X GET "$BASE_URL/store/stores/search?query=store" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 8: Test Product APIs
echo -e "${YELLOW}Step 8: Product APIs${NC}"
echo "----------------------------------------"

echo "8.1 Get Special Offers:"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/store/products/special-offers?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$PRODUCTS_RESPONSE" | jq .
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.products[0].id // empty')
echo ""

echo "8.2 Get Highlights:"
curl -s -X GET "$BASE_URL/store/products/highlights?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "8.3 Get Product Details (Product ID: $PRODUCT_ID):"
  curl -s -X GET "$BASE_URL/store/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

if [ ! -z "$STORE_ID" ] && [ "$STORE_ID" != "null" ]; then
  echo "8.4 Get Store Products (Store ID: $STORE_ID):"
  curl -s -X GET "$BASE_URL/store/stores/$STORE_ID/products?page=1&limit=5" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

# Step 9: Test Search APIs
echo -e "${YELLOW}Step 9: Search APIs${NC}"
echo "----------------------------------------"

echo "9.1 Search Items:"
curl -s -X GET "$BASE_URL/store/search?query=product&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "9.2 Voice Search:"
curl -s -X POST "$BASE_URL/store/voice-search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"audioFile": "base64encodedaudio"}' | jq .
echo ""

# Step 10: Test Favorites APIs
echo -e "${YELLOW}Step 10: Favorites APIs${NC}"
echo "----------------------------------------"

echo "10.1 Get User Favorites:"
curl -s -X GET "$BASE_URL/user/favorites" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

if [ ! -z "$STORE_ID" ] && [ "$STORE_ID" != "null" ]; then
  echo "10.2 Add Store to Favorites:"
  FAVORITE_RESPONSE=$(curl -s -X POST "$BASE_URL/user/favorites" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"type\": \"store\", \"itemId\": \"$STORE_ID\"}")
  echo "$FAVORITE_RESPONSE" | jq .
  FAVORITE_ID=$(echo "$FAVORITE_RESPONSE" | jq -r '.data.id // empty')
  echo ""
  
  echo "10.3 Check Favorite Status:"
  curl -s -X GET "$BASE_URL/user/favorites/check?type=stores&itemId=$STORE_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
  
  if [ ! -z "$FAVORITE_ID" ] && [ "$FAVORITE_ID" != "null" ]; then
    echo "10.4 Remove from Favorites:"
    curl -s -X DELETE "$BASE_URL/user/favorites/$FAVORITE_ID" \
      -H "Authorization: Bearer $TOKEN" | jq .
    echo ""
  fi
fi

# Step 11: Test Cart APIs
echo -e "${YELLOW}Step 11: Cart APIs${NC}"
echo "----------------------------------------"

echo "11.1 Get Cart:"
curl -s -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ] && [ ! -z "$STORE_ID" ] && [ "$STORE_ID" != "null" ]; then
  echo "11.2 Add to Cart:"
  CART_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"productId\": \"$PRODUCT_ID\", \"quantity\": 2, \"storeId\": \"$STORE_ID\"}")
  echo "$CART_RESPONSE" | jq .
  CART_ITEM_ID=$(echo "$CART_RESPONSE" | jq -r '.data.id // empty')
  echo ""
  
  echo "11.3 Get Cart (Updated):"
  curl -s -X GET "$BASE_URL/cart" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
  
  if [ ! -z "$CART_ITEM_ID" ] && [ "$CART_ITEM_ID" != "null" ]; then
    echo "11.4 Update Cart Item:"
    curl -s -X PUT "$BASE_URL/cart/items/$CART_ITEM_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity": 3}' | jq .
    echo ""
    
    echo "11.5 Remove from Cart:"
    curl -s -X DELETE "$BASE_URL/cart/items/$CART_ITEM_ID" \
      -H "Authorization: Bearer $TOKEN" | jq .
    echo ""
  fi
fi

# Step 12: Test Notification APIs
echo -e "${YELLOW}Step 12: Notification APIs${NC}"
echo "----------------------------------------"

echo "12.1 Get Notifications:"
NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "$NOTIFICATIONS_RESPONSE" | jq .
NOTIFICATION_ID=$(echo "$NOTIFICATIONS_RESPONSE" | jq -r '.data.notifications[0].id // empty')
echo ""

if [ ! -z "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
  echo "12.2 Mark Notification as Read:"
  curl -s -X PUT "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

# Step 13: Test Utility APIs
echo -e "${YELLOW}Step 13: Utility APIs${NC}"
echo "----------------------------------------"

if [ ! -z "$STORE_ID" ] && [ "$STORE_ID" != "null" ]; then
  echo "13.1 Get Delivery Time Estimate:"
  curl -s -X GET "$BASE_URL/store/delivery-time?storeId=$STORE_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ All API Tests Completed${NC}"
echo "=========================================="

