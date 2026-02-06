#!/bin/bash

# Route Testing Script
# Tests if routes are properly registered

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Testing Route Registration"
echo "=============================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server not responding (HTTP $http_code)${NC}"
    exit 1
fi
echo ""

# Test 2: Test existing admin route (should get 401 without auth, not 404)
echo "2. Testing Admin Route (should get 401 without auth, not 404)..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/admin/earnings/clicks")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✅ Route exists (401 Unauthorized - expected)${NC}"
elif [ "$http_code" -eq 404 ]; then
    echo -e "${RED}❌ Route NOT FOUND (404)${NC}"
    echo "   This means the route is not registered!"
else
    echo -e "${YELLOW}⚠️  Unexpected status: $http_code${NC}"
    echo "$body"
fi
echo ""

# Test 3: Test non-existent route (should get 404)
echo "3. Testing Non-existent Route (should get 404)..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/admin/earn/products")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 404 ]; then
    echo -e "${GREEN}✅ Correctly returns 404 for non-existent route${NC}"
    echo "   Route /api/v1/admin/earn/products does NOT exist"
else
    echo -e "${YELLOW}⚠️  Unexpected status: $http_code${NC}"
fi
echo ""

# Test 4: Test user route (should get 401 without auth, not 404)
echo "4. Testing User Route (should get 401 without auth, not 404)..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/earn/products")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✅ Route exists (401 Unauthorized - expected)${NC}"
elif [ "$http_code" -eq 404 ]; then
    echo -e "${RED}❌ Route NOT FOUND (404)${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected status: $http_code${NC}"
fi
echo ""

echo "=============================="
echo "Summary:"
echo "- If admin route returns 401 (not 404): Route is registered ✅"
echo "- If admin route returns 404: Route is NOT registered ❌"
echo "- Route /api/v1/admin/earn/products does NOT exist"

