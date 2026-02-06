#!/bin/bash

# POD API Testing Script
# This script tests all POD (Print on Demand) section APIs

BASE_URL="http://localhost:3000/api/v1/pod"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "POD API Testing Script"
echo "=========================================="
echo ""

# Step 1: Check server health
echo -e "${YELLOW}Step 1: Checking Server Health${NC}"
echo "----------------------------------------"
curl -s http://localhost:3000/health | jq . || echo "Server not running!"
echo ""

# Step 2: POD health check
echo -e "${YELLOW}Step 2: POD Health Check${NC}"
echo "----------------------------------------"
echo "POD Health:"
curl -s http://localhost:3000/api/v1/pod/health | jq .
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

# Step 4: Test Catalog APIs
echo -e "${YELLOW}Step 4: Catalog APIs${NC}"
echo "----------------------------------------"

echo "4.1 Get Categories:"
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")
echo "$CATEGORIES_RESPONSE" | jq .
CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data.categories[0].id // empty')
echo ""

if [ ! -z "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
  echo "4.2 Get Subcategories (Category ID: $CATEGORY_ID):"
  SUBCATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/$CATEGORY_ID/subcategories" \
    -H "Authorization: Bearer $TOKEN")
  echo "$SUBCATEGORIES_RESPONSE" | jq .
  SUBCATEGORY_ID=$(echo "$SUBCATEGORIES_RESPONSE" | jq -r '.data.subcategories[0].id // empty')
  echo ""
fi

echo "4.3 Get Products:"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$PRODUCTS_RESPONSE" | jq .
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.products[0].id // empty')
echo ""

echo "4.4 Get Best Sellers:"
curl -s -X GET "$BASE_URL/products/best-sellers?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4.5 Search Products:"
curl -s -X GET "$BASE_URL/products/search?query=shirt&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4.6 Get Banners:"
curl -s -X GET "$BASE_URL/banners" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "4.7 Get Product Details (Product ID: $PRODUCT_ID):"
  curl -s -X GET "$BASE_URL/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

# Step 5: Test Cart APIs
echo -e "${YELLOW}Step 5: Cart APIs${NC}"
echo "----------------------------------------"

echo "5.1 Get Cart Items:"
CART_RESPONSE=$(curl -s -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN")
echo "$CART_RESPONSE" | jq .
CART_ITEM_ID=$(echo "$CART_RESPONSE" | jq -r '.data.items[0].cartItemId // empty')
echo ""

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "5.2 Add to Cart:"
  ADD_CART_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/add" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"productId\": \"$PRODUCT_ID\",
      \"quantity\": 1,
      \"selectedColor\": {
        \"id\": \"1\",
        \"colorCode\": \"#FFFFFF\",
        \"colorName\": \"White\"
      },
      \"selectedSize\": \"M\",
      \"deliveryType\": \"standard\"
    }")
  echo "$ADD_CART_RESPONSE" | jq .
  NEW_CART_ITEM_ID=$(echo "$ADD_CART_RESPONSE" | jq -r '.data.cartItemId // empty')
  echo ""
  
  if [ ! -z "$NEW_CART_ITEM_ID" ] && [ "$NEW_CART_ITEM_ID" != "null" ]; then
    echo "5.3 Update Cart Item:"
    curl -s -X PATCH "$BASE_URL/cart/$NEW_CART_ITEM_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity": 2}' | jq .
    echo ""
    
    echo "5.4 Remove Cart Item:"
    curl -s -X DELETE "$BASE_URL/cart/$NEW_CART_ITEM_ID" \
      -H "Authorization: Bearer $TOKEN" | jq .
    echo ""
  fi
fi

# Step 6: Test Order APIs
echo -e "${YELLOW}Step 6: Order APIs${NC}"
echo "----------------------------------------"

echo "6.1 Get User Orders:"
ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "$ORDERS_RESPONSE" | jq .
ORDER_ID=$(echo "$ORDERS_RESPONSE" | jq -r '.data.orders[0].orderId // empty')
echo ""

if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  echo "6.2 Get Order Details (Order ID: $ORDER_ID):"
  curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
  
  echo "6.3 Track Order (Public):"
  curl -s -X GET "http://localhost:3000/api/v1/pod/orders/track/$ORDER_ID" | jq .
  echo ""
fi

# Step 7: Test Design APIs
echo -e "${YELLOW}Step 7: Design APIs${NC}"
echo "----------------------------------------"

echo "7.1 Validate Design:"
curl -s -X POST "$BASE_URL/designs/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "designUrl": "https://example.com/designs/test.jpg",
    "productType": "T-Shirt"
  }' | jq .
echo ""

echo "7.2 Generate Mockup:"
curl -s -X POST "$BASE_URL/mockup/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"designUrl\": \"https://example.com/designs/test.jpg\",
    \"color\": \"White\"
  }" | jq .
echo ""

# Step 8: Test Review APIs
echo -e "${YELLOW}Step 8: Review APIs${NC}"
echo "----------------------------------------"

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "8.1 Get Product Reviews:"
  curl -s -X GET "$BASE_URL/products/$PRODUCT_ID/reviews?page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
  
  if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
    echo "8.2 Add Review:"
    curl -s -X POST "$BASE_URL/products/$PRODUCT_ID/reviews" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"orderId\": \"$ORDER_ID\",
        \"rating\": 5,
        \"comment\": \"Great product!\",
        \"pros\": [\"Good quality\", \"Fast delivery\"],
        \"cons\": []
      }" | jq .
    echo ""
  fi
fi

# Step 9: Test Delivery APIs
echo -e "${YELLOW}Step 9: Delivery APIs${NC}"
echo "----------------------------------------"

echo "9.1 Get Express Delivery Info:"
curl -s -X GET "$BASE_URL/express-delivery/info" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "9.2 Check Express Delivery:"
  curl -s -X GET "$BASE_URL/products/$PRODUCT_ID/express-delivery?pincode=400001" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

echo "9.3 Get Delivery Charges:"
curl -s -X GET "$BASE_URL/delivery/charges?pincode=400001&deliveryType=standard" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "9.4 Get Address Suggestions:"
curl -s -X GET "$BASE_URL/addresses/suggestions?query=mumbai" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 10: Test Additional APIs
echo -e "${YELLOW}Step 10: Additional APIs${NC}"
echo "----------------------------------------"

echo "10.1 Get Packaging Categories:"
curl -s -X GET "$BASE_URL/packaging/categories" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "10.2 Get Packaging Products:"
curl -s -X GET "$BASE_URL/packaging/products?categoryId=all&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "10.3 Apply Coupon:"
curl -s -X POST "$BASE_URL/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "WELCOME10",
    "cartTotal": 1000
  }' | jq .
echo ""

# Step 11: Test Order Actions
echo -e "${YELLOW}Step 11: Order Actions${NC}"
echo "----------------------------------------"

if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  echo "11.1 Cancel Order (if pending):"
  curl -s -X POST "$BASE_URL/orders/$ORDER_ID/cancel" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "reason": "Changed my mind"
    }' | jq .
  echo ""
  
  echo "11.2 Return Order (if delivered):"
  curl -s -X POST "$BASE_URL/orders/$ORDER_ID/return" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "reason": "Defective product",
      "images": ["https://example.com/return1.jpg"]
    }' | jq .
  echo ""
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ All POD API Tests Completed${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Catalog APIs: Tested"
echo "- Cart APIs: Tested"
echo "- Order APIs: Tested"
echo "- Design APIs: Tested"
echo "- Review APIs: Tested"
echo "- Delivery APIs: Tested"
echo "- Additional APIs: Tested"

