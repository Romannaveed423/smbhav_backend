#!/bin/bash

# Health Check Testing Script
# Tests all API module health endpoints

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  API Health Check Testing"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "Testing ${name}... "
    
    response=$(curl -s -w "\n%{http_code}" "${url}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

# Test Server Health
echo "1. Server Health Check"
test_endpoint "Server" "${BASE_URL}/health"

# Test Auth Module
echo "2. Authentication Module"
test_endpoint "Auth" "${API_BASE}/auth/health"

# Test User Module
echo "3. User Module"
test_endpoint "User" "${API_BASE}/user/health"

# Test Home Module
echo "4. Home Module"
test_endpoint "Home" "${API_BASE}/home/health"

# Test Earnings Module
echo "5. Earnings Module"
test_endpoint "Earnings" "${API_BASE}/earn/health"

# Test Referral Module
echo "6. Referral Module"
test_endpoint "Referral" "${API_BASE}/referral/health"

# Test CA Services Module
echo "7. CA Services Module"
test_endpoint "CA Services" "${API_BASE}/ca/health"

# Test POD Module
echo "8. POD Module"
test_endpoint "POD" "${API_BASE}/pod/health"

echo "=========================================="
echo "  Health Check Testing Complete"
echo "=========================================="

