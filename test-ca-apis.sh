#!/bin/bash

# CA Services API Testing Script
# This script tests all CA Services section APIs with the new 3-level hierarchy

BASE_URL="http://localhost:3000/api/v1/ca"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "CA Services API Testing Script"
echo "=========================================="
echo ""

# Step 1: Check server health
echo -e "${YELLOW}Step 1: Checking Server Health${NC}"
echo "----------------------------------------"
curl -s http://localhost:3000/health | jq . || echo "Server not running!"
echo ""

# Step 2: CA Services health check
echo -e "${YELLOW}Step 2: CA Services Health Check${NC}"
echo "----------------------------------------"
echo "CA Services Health:"
curl -s http://localhost:3000/api/v1/ca/health | jq .
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

# Step 4: Test Catalog APIs (3-level hierarchy)
echo -e "${YELLOW}Step 4: Catalog APIs (3-Level Hierarchy)${NC}"
echo "----------------------------------------"

echo "4.1 Get Categories (Level 1):"
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/category" \
  -H "Authorization: Bearer $TOKEN")
echo "$CATEGORIES_RESPONSE" | jq .
CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data[0].id // empty')
echo ""

if [ ! -z "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
  echo "4.2 Get Subcategories (Level 2) - Category ID: $CATEGORY_ID:"
  SUBCATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/category/$CATEGORY_ID/subcategory" \
    -H "Authorization: Bearer $TOKEN")
  echo "$SUBCATEGORIES_RESPONSE" | jq .
  SUBCATEGORY_ID=$(echo "$SUBCATEGORIES_RESPONSE" | jq -r '.data[0].id // empty')
  echo ""
  
  if [ ! -z "$SUBCATEGORY_ID" ] && [ "$SUBCATEGORY_ID" != "null" ]; then
    echo "4.3 Get Sub-subcategories (Level 3) - Subcategory ID: $SUBCATEGORY_ID:"
    SUBSUBCATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/subcategory/$SUBCATEGORY_ID/sub-subcategory" \
      -H "Authorization: Bearer $TOKEN")
    echo "$SUBSUBCATEGORIES_RESPONSE" | jq .
    SUBSUBCATEGORY_ID=$(echo "$SUBSUBCATEGORIES_RESPONSE" | jq -r '.data[0].id // empty')
    echo ""
  fi
fi

echo "4.4 Get Services:"
curl -s -X GET "$BASE_URL/services?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4.5 Get GST Tabs:"
curl -s -X GET "$BASE_URL/services/gst/tabs" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 5: Test Form Schema APIs
echo -e "${YELLOW}Step 5: Form Schema APIs${NC}"
echo "----------------------------------------"

if [ ! -z "$SUBSUBCATEGORY_ID" ] && [ "$SUBSUBCATEGORY_ID" != "null" ]; then
  echo "5.1 Get Form Schema - Sub-subcategory ID: $SUBSUBCATEGORY_ID:"
  FORM_SCHEMA_RESPONSE=$(curl -s -X GET "$BASE_URL/forms/schema/$SUBSUBCATEGORY_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "$FORM_SCHEMA_RESPONSE" | jq .
  echo ""
fi

# Step 6: Test Form Entry APIs
echo -e "${YELLOW}Step 6: Form Entry APIs${NC}"
echo "----------------------------------------"

echo "6.1 Get User Form Entries:"
FORM_ENTRIES_RESPONSE=$(curl -s -X GET "$BASE_URL/forms/entries?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "$FORM_ENTRIES_RESPONSE" | jq .
ENTRY_ID=$(echo "$FORM_ENTRIES_RESPONSE" | jq -r '.data.entries[0].entryId // empty')
echo ""

if [ ! -z "$ENTRY_ID" ] && [ "$ENTRY_ID" != "null" ]; then
  echo "6.2 Get Form Entry Details - Entry ID: $ENTRY_ID:"
  curl -s -X GET "$BASE_URL/forms/entries/$ENTRY_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

if [ ! -z "$SUBSUBCATEGORY_ID" ] && [ "$SUBSUBCATEGORY_ID" != "null" ]; then
  echo "6.3 Submit Form Entry:"
  SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/forms/entries" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"subSubcategoryId\": \"$SUBSUBCATEGORY_ID\",
      \"formData\": {
        \"businessName\": \"New Test Business\",
        \"ownerName\": \"Test Owner\",
        \"businessType\": \"retail\",
        \"businessAddress\": \"456 Test Street, Delhi\",
        \"pincode\": \"110001\",
        \"mobileNumber\": \"9876543210\",
        \"email\": \"newtest@example.com\",
        \"panNumber\": \"FGHIJ5678K\"
      },
      \"files\": {
        \"aadharCard\": \"https://example.com/documents/aadhar2.pdf\",
        \"addressProof\": \"https://example.com/documents/address2.pdf\"
      }
    }")
  echo "$SUBMIT_RESPONSE" | jq .
  echo ""
  
  echo "6.4 Save Draft Entry:"
  DRAFT_RESPONSE=$(curl -s -X POST "$BASE_URL/forms/entries/draft" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"subSubcategoryId\": \"$SUBSUBCATEGORY_ID\",
      \"formData\": {
        \"businessName\": \"Draft Business\",
        \"ownerName\": \"Draft Owner\",
        \"businessType\": \"service\"
      }
    }")
  echo "$DRAFT_RESPONSE" | jq .
  echo ""
fi

# Step 7: Test Application APIs
echo -e "${YELLOW}Step 7: Application APIs${NC}"
echo "----------------------------------------"

echo "7.1 Get User Applications:"
curl -s -X GET "$BASE_URL/applications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Step 8: Test Support APIs
echo -e "${YELLOW}Step 8: Support APIs${NC}"
echo "----------------------------------------"

echo "8.1 Get Support Phone:"
curl -s -X GET "$BASE_URL/support/phone" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "8.2 Request Callback:"
curl -s -X POST "$BASE_URL/support/callback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "preferredTime": "10:00 AM - 12:00 PM",
    "reason": "Need help with GST registration"
  }' | jq .
echo ""

# Step 9: Test Additional APIs
echo -e "${YELLOW}Step 9: Additional APIs${NC}"
echo "----------------------------------------"

echo "9.1 Get Testimonials:"
curl -s -X GET "$BASE_URL/testimonials?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "9.2 Get Recent Courses:"
curl -s -X GET "$BASE_URL/courses?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo ""
echo "=========================================="
echo -e "${GREEN}✓ All CA Services API Tests Completed${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Catalog APIs (3-level hierarchy): Tested"
echo "- Form Schema APIs: Tested"
echo "- Form Entry APIs: Tested"
echo "- Application APIs: Tested"
echo "- Support APIs: Tested"
echo "- Additional APIs: Tested"

