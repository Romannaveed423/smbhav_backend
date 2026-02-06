#!/bin/bash

# Earnings/Offers API Testing Script
# Quick test script for earnings and offers endpoints

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Earnings/Offers API Testing${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Step 1: Login
echo -e "${YELLOW}Step 1: Login${NC}"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Get All Offers
echo -e "${YELLOW}Step 2: GET /api/v1/earn/offers${NC}"
echo "----------------------------------------"
OFFERS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/offers?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$OFFERS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Success${NC}"
  echo "$OFFERS_RESPONSE" | jq '.data | {total: .pagination.total, page: .pagination.page, offers_count: (.offers | length), first_offer: .offers[0] | {id: ._id, name, amount, status}}'
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$OFFERS_RESPONSE" | jq .
fi
echo ""

# Step 3: Get Offers with Filters
echo -e "${YELLOW}Step 3: GET /api/v1/earn/offers (with filters)${NC}"
echo "----------------------------------------"
FILTERED_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/offers?page=1&limit=5&category=campaign&status=active" \
  -H "Authorization: Bearer $TOKEN")

if echo "$FILTERED_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Success${NC}"
  echo "$FILTERED_RESPONSE" | jq '.data.pagination'
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$FILTERED_RESPONSE" | jq .
fi
echo ""

# Step 4: Get Dashboard
echo -e "${YELLOW}Step 4: GET /api/v1/earn/dashboard${NC}"
echo "----------------------------------------"
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/dashboard?section=sambhav" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DASHBOARD_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Success${NC}"
  echo "$DASHBOARD_RESPONSE" | jq '.data | {walletBalance, totalEarnings, totalLeads, totalSales}'
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$DASHBOARD_RESPONSE" | jq .
fi
echo ""

# Step 5: Get Earnings History
echo -e "${YELLOW}Step 5: GET /api/v1/earn/earnings${NC}"
echo "----------------------------------------"
EARNINGS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/earnings?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$EARNINGS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Success${NC}"
  echo "$EARNINGS_RESPONSE" | jq '.data | {total: .pagination.total, earnings_count: (.earnings | length)}'
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$EARNINGS_RESPONSE" | jq .
fi
echo ""

# Step 6: Get Products
echo -e "${YELLOW}Step 6: GET /api/v1/earn/products${NC}"
echo "----------------------------------------"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/earn/products?section=sambhav&page=1&limit=3" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PRODUCTS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Success${NC}"
  PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.products[0].id // empty')
  echo "$PRODUCTS_RESPONSE" | jq '.data | {total: .pagination.total, products_count: (.products | length)}'
  
  # Step 7: Get Product Offers (if product found)
  if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
    echo ""
    echo -e "${YELLOW}Step 7: GET /api/v1/earn/products/:productId/offers${NC}"
    echo "----------------------------------------"
    PRODUCT_OFFERS=$(curl -s -X GET "$BASE_URL/earn/products/$PRODUCT_ID/offers" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$PRODUCT_OFFERS" | jq -e '.success' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Success${NC}"
      echo "$PRODUCT_OFFERS" | jq '.data | {product_name: .product.name, offers_count: (.activeOffers | length)}'
      
      # Get first offer ID for application test
      OFFER_ID=$(echo "$PRODUCT_OFFERS" | jq -r '.data.activeOffers[0].id // empty')
      if [ ! -z "$OFFER_ID" ] && [ "$OFFER_ID" != "null" ]; then
        echo ""
        echo -e "${YELLOW}Step 8: POST /api/v1/earn/offer-applications${NC}"
        echo "----------------------------------------"
        APPLICATION_RESPONSE=$(curl -s -X POST "$BASE_URL/earn/offer-applications" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"offerId\": \"$OFFER_ID\",
            \"offerPromotion\": \"I will promote this offer through my social media channels with detailed reviews and tutorials covering all features and benefits\"
          }")
        
        if echo "$APPLICATION_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
          echo -e "${GREEN}✓ Success${NC}"
          echo "$APPLICATION_RESPONSE" | jq '.data.application | {id: ._id, status, offerName}'
        else
          echo -e "${RED}✗ Failed${NC}"
          echo "$APPLICATION_RESPONSE" | jq .
        fi
      fi
    else
      echo -e "${RED}✗ Failed${NC}"
      echo "$PRODUCT_OFFERS" | jq .
    fi
  fi
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$PRODUCTS_RESPONSE" | jq .
fi

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo "For detailed API documentation, see: EARNINGS_OFFERS_API.md"
echo ""

