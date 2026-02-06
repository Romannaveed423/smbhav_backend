# POD (Print on Demand) API Testing Guide

## Overview

This guide provides instructions for testing all POD section APIs, similar to the Store and Earnings sections.

## Prerequisites

1. Server must be running on `http://localhost:3000`
2. MongoDB must be connected
3. Seed data should be created (run `node seed-pod-data.js`)

## Seed Data

Run the seed script to create test data:

```bash
node seed-pod-data.js
```

This creates:
- **4 Categories**: T-Shirts, Hoodies, Mugs, Posters
- **4 Subcategories**: Round Neck, V-Neck, Pullover, Zipper
- **4 Products**: Premium Cotton T-Shirt, Comfortable Hoodie, Ceramic Coffee Mug, Premium Poster Print
- **3 Banners**: Carousel and promotional banners
- **3 Coupons**: WELCOME10, FLAT50, SUMMER25
- **2 Cart Items**: Different products with various configurations
- **3 Orders**: Different statuses (delivered, shipped, pending)
- **2 Reviews**: Product reviews with ratings

## Test User

- **Email**: `test@example.com`
- **Password**: `test123`

## Testing Scripts

### Automated Test Script

Run the comprehensive test script:

```bash
./test-pod-apis.sh
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
curl -s http://localhost:3000/api/v1/pod/health | jq .
```

#### Step 3: Test Catalog APIs

```bash
# Get Categories
curl -s -X GET "http://localhost:3000/api/v1/pod/categories" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Subcategories (replace CATEGORY_ID)
CATEGORY_ID="YOUR_CATEGORY_ID"
curl -s -X GET "http://localhost:3000/api/v1/pod/categories/$CATEGORY_ID/subcategories" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Products
curl -s -X GET "http://localhost:3000/api/v1/pod/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Product Details (replace PRODUCT_ID)
PRODUCT_ID="YOUR_PRODUCT_ID"
curl -s -X GET "http://localhost:3000/api/v1/pod/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Search Products
curl -s -X GET "http://localhost:3000/api/v1/pod/products/search?query=shirt&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Best Sellers
curl -s -X GET "http://localhost:3000/api/v1/pod/products/best-sellers?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Banners
curl -s -X GET "http://localhost:3000/api/v1/pod/banners" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 4: Test Cart APIs

```bash
# Get Cart Items
curl -s -X GET "http://localhost:3000/api/v1/pod/cart" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Add to Cart
curl -s -X POST "http://localhost:3000/api/v1/pod/cart/add" \
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
  }" | jq .

# Update Cart Item (replace CART_ITEM_ID)
CART_ITEM_ID="YOUR_CART_ITEM_ID"
curl -s -X PATCH "http://localhost:3000/api/v1/pod/cart/$CART_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}' | jq .

# Remove Cart Item
curl -s -X DELETE "http://localhost:3000/api/v1/pod/cart/$CART_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Clear Cart
curl -s -X DELETE "http://localhost:3000/api/v1/pod/cart" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 5: Test Order APIs

```bash
# Get User Orders
curl -s -X GET "http://localhost:3000/api/v1/pod/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Order Details (replace ORDER_ID)
ORDER_ID="YOUR_ORDER_ID"
curl -s -X GET "http://localhost:3000/api/v1/pod/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Track Order (Public endpoint)
curl -s -X GET "http://localhost:3000/api/v1/pod/orders/track/$ORDER_ID" | jq .

# Place Order
curl -s -X POST "http://localhost:3000/api/v1/pod/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 1,
        "selectedColor": {
          "id": "1",
          "colorCode": "#FFFFFF",
          "colorName": "White"
        },
        "selectedSize": "M"
      }
    ],
    "shippingAddress": {
      "name": "Test User",
      "phone": "9876543210",
      "email": "test@example.com",
      "addressLine1": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "paymentMethod": {
      "type": "online"
    },
    "deliveryType": "standard",
    "couponCode": "WELCOME10"
  }' | jq .

# Cancel Order
curl -s -X POST "http://localhost:3000/api/v1/pod/orders/$ORDER_ID/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed my mind"
  }' | jq .

# Return Order
curl -s -X POST "http://localhost:3000/api/v1/pod/orders/$ORDER_ID/return" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Defective product",
    "images": ["https://example.com/return1.jpg"]
  }' | jq .
```

#### Step 6: Test Design APIs

```bash
# Validate Design
curl -s -X POST "http://localhost:3000/api/v1/pod/designs/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "designUrl": "https://example.com/designs/test.jpg",
    "productType": "T-Shirt"
  }' | jq .

# Generate Mockup
curl -s -X POST "http://localhost:3000/api/v1/pod/mockup/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"designUrl\": \"https://example.com/designs/test.jpg\",
    \"color\": \"White\"
  }" | jq .

# Upload Design (requires multipart/form-data)
curl -s -X POST "http://localhost:3000/api/v1/pod/designs/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/design.jpg" \
  -F "productType=T-Shirt" | jq .
```

#### Step 7: Test Review APIs

```bash
# Get Product Reviews
curl -s -X GET "http://localhost:3000/api/v1/pod/products/$PRODUCT_ID/reviews?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Add Review
curl -s -X POST "http://localhost:3000/api/v1/pod/products/$PRODUCT_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"rating\": 5,
    \"comment\": \"Great product!\",
    \"pros\": [\"Good quality\", \"Fast delivery\"],
    \"cons\": []
  }" | jq .
```

#### Step 8: Test Delivery APIs

```bash
# Get Express Delivery Info
curl -s -X GET "http://localhost:3000/api/v1/pod/express-delivery/info" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Check Express Delivery
curl -s -X GET "http://localhost:3000/api/v1/pod/products/$PRODUCT_ID/express-delivery?pincode=400001" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Delivery Charges
curl -s -X GET "http://localhost:3000/api/v1/pod/delivery/charges?pincode=400001&deliveryType=standard" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Address Suggestions
curl -s -X GET "http://localhost:3000/api/v1/pod/addresses/suggestions?query=mumbai" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 9: Test Additional APIs

```bash
# Get Packaging Categories
curl -s -X GET "http://localhost:3000/api/v1/pod/packaging/categories" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get Packaging Products
curl -s -X GET "http://localhost:3000/api/v1/pod/packaging/products?categoryId=all&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Apply Coupon
curl -s -X POST "http://localhost:3000/api/v1/pod/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "WELCOME10",
    "cartTotal": 1000
  }' | jq .
```

## API Endpoints Summary

### Catalog APIs
1. **GET** `/api/v1/pod/categories` - Get all categories
2. **GET** `/api/v1/pod/categories/:categoryId/subcategories` - Get subcategories
3. **GET** `/api/v1/pod/products` - Get products with filters
4. **GET** `/api/v1/pod/products/:productId` - Get product details
5. **GET** `/api/v1/pod/products/search` - Search products
6. **GET** `/api/v1/pod/products/best-sellers` - Get best sellers
7. **GET** `/api/v1/pod/banners` - Get banners

### Cart APIs
8. **GET** `/api/v1/pod/cart` - Get cart items
9. **POST** `/api/v1/pod/cart/add` - Add to cart
10. **PATCH** `/api/v1/pod/cart/:cartItemId` - Update cart item
11. **DELETE** `/api/v1/pod/cart/:cartItemId` - Remove cart item
12. **DELETE** `/api/v1/pod/cart` - Clear cart

### Order APIs
13. **GET** `/api/v1/pod/orders` - Get user orders
14. **GET** `/api/v1/pod/orders/:orderId` - Get order details
15. **GET** `/api/v1/pod/orders/track/:orderId` - Track order (public)
16. **POST** `/api/v1/pod/orders` - Place order
17. **POST** `/api/v1/pod/orders/:orderId/cancel` - Cancel order
18. **POST** `/api/v1/pod/orders/:orderId/return` - Return order

### Design APIs
19. **POST** `/api/v1/pod/designs/upload` - Upload design
20. **POST** `/api/v1/pod/designs/validate` - Validate design
21. **POST** `/api/v1/pod/mockup/generate` - Generate mockup

### Review APIs
22. **GET** `/api/v1/pod/products/:productId/reviews` - Get product reviews
23. **POST** `/api/v1/pod/products/:productId/reviews` - Add review

### Delivery APIs
24. **GET** `/api/v1/pod/express-delivery/info` - Get express delivery info
25. **GET** `/api/v1/pod/products/:productId/express-delivery` - Check express delivery
26. **GET** `/api/v1/pod/delivery/charges` - Get delivery charges
27. **GET** `/api/v1/pod/addresses/suggestions` - Get address suggestions

### Additional APIs
28. **POST** `/api/v1/pod/coupons/apply` - Apply coupon
29. **GET** `/api/v1/pod/packaging/categories` - Get packaging categories
30. **GET** `/api/v1/pod/packaging/products` - Get packaging products

## Expected Test Results

After running the seed script and tests, you should see:

✅ **Categories**: 4 categories available
✅ **Subcategories**: 4 subcategories
✅ **Products**: 4 products with different types
✅ **Banners**: 3 banners (carousel and promotional)
✅ **Coupons**: 3 coupons with different discount types
✅ **Cart Items**: 2 items in cart
✅ **Orders**: 3 orders with different statuses
✅ **Reviews**: 2 product reviews

## Troubleshooting

### Rate Limiting
If you see "Too many authentication attempts", wait 15 minutes or restart the server.

### Missing Data
Run the seed script again:
```bash
node seed-pod-data.js
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

1. **seed-pod-data.js** - Seed data script
2. **test-pod-apis.sh** - Automated test script
3. **POD_API_TEST_GUIDE.md** - This guide

## Next Steps

1. Run seed script: `node seed-pod-data.js`
2. Wait for rate limit to reset (if needed)
3. Run test script: `./test-pod-apis.sh`
4. Or test manually using the commands above

