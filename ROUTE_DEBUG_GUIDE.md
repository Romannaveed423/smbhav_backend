# Route Debugging Guide - Fixing 404 Errors

## Issue: 404 Error on `/api/v1/admin/earn/products`

### Problem Analysis

The route `/api/v1/admin/earn/products` **does NOT exist** in the current codebase.

### Current Route Structure

#### ✅ Registered Admin Routes
- `GET  /api/v1/admin/earnings/clicks`
- `GET  /api/v1/admin/earnings/conversions`
- `POST /api/v1/admin/earnings/conversions/:conversionId/approve`

#### ✅ Registered User Earnings Routes
- `GET  /api/v1/earn/products`
- `GET  /api/v1/earn/products/:productId/offers`
- `GET  /api/v1/earn/products/:productId/detail`
- `POST /api/v1/earn/products/:productId/apply`
- `POST /api/v1/earn/products/:productId/click`

### Quick Checks

#### 1. Verify Server is Running

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

#### 2. Test Existing Admin Route

```bash
curl -v http://localhost:3000/api/v1/admin/earnings/clicks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected:**
- If authenticated as admin: Should return 200 or 400 (validation error)
- If not authenticated: 401 Unauthorized
- If authenticated but not admin: 403 Forbidden
- If route doesn't exist: **404 Not Found**

#### 3. Test Existing User Route

```bash
curl -v http://localhost:3000/api/v1/earn/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Should return products list (not 404)

### Route Path Verification

The route structure in `src/routes/index.ts`:

```typescript
// Admin routes
router.use('/admin/earnings', adminEarningsRoutes);  // ✅ This exists

// User routes
router.use('/earn', earningsRoutes);  // ✅ This exists
```

**Full paths:**
- ✅ `/api/v1/admin/earnings/*` → Admin earnings routes
- ✅ `/api/v1/earn/*` → User earnings routes
- ❌ `/api/v1/admin/earn/*` → **Does NOT exist**

### Possible Solutions

#### Option 1: Use Existing User Route (If admin access isn't needed)

```bash
# Get products (requires user auth, not admin)
GET /api/v1/earn/products
```

#### Option 2: Create Admin Product Management Routes

If you need admin-specific product management, create a new route file:

1. Create `src/routes/admin/products.routes.ts`
2. Add routes for admin product management
3. Register in `src/routes/index.ts`:
   ```typescript
   router.use('/admin/earn', adminProductsRoutes);
   ```

#### Option 3: Add Route Logging Middleware

Add this to `src/server.ts` to see all incoming requests:

```typescript
// Add after body parsing middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Debugging Steps

#### Step 1: Check Server Status

```bash
# Check if server is running
lsof -ti:3000

# Check server logs
# Look for route registration messages
```

#### Step 2: Check Route Registration

In `src/routes/index.ts`, verify:
```typescript
router.use('/admin/earnings', adminEarningsRoutes);  // ✅ Registered
```

#### Step 3: Check Middleware Order

The middleware order in `src/server.ts`:
1. Security middleware (helmet, cors)
2. Body parsing
3. Logging (morgan)
4. Rate limiting
5. Routes
6. 404 handler
7. Error handler

**Important:** The 404 handler is after routes, so if a route isn't registered, it will return 404.

#### Step 4: Verify Authentication

If you get 401 or 403 instead of 404, the route exists but auth is failing:

```bash
# Test without auth (should get 401, not 404)
curl -v http://localhost:3000/api/v1/admin/earnings/clicks

# Test with invalid token (should get 401, not 404)
curl -v http://localhost:3000/api/v1/admin/earnings/clicks \
  -H "Authorization: Bearer invalid_token"

# Test with valid token but non-admin user (should get 403, not 404)
curl -v http://localhost:3000/api/v1/admin/earnings/clicks \
  -H "Authorization: Bearer user_token"
```

### Common Issues

#### Issue 1: Route Not Found (404)

**Symptoms:**
- Response: `{ "success": false, "message": "Route not found", "code": "NOT_FOUND" }`

**Causes:**
- Route not registered in `routes/index.ts`
- Route path mismatch (typo in URL)
- Route handler file not imported

**Fix:**
- Check `src/routes/index.ts` for route registration
- Verify the exact path you're calling matches the registered path

#### Issue 2: TypeScript Not Compiled

**Symptoms:**
- Routes defined in TypeScript but server can't find them

**Fix:**
```bash
npm run build
npm start  # Use compiled version
# OR
npm run dev  # Uses tsx to run TypeScript directly
```

#### Issue 3: Server Not Restarted

**Symptoms:**
- Routes added but still getting 404

**Fix:**
- Stop server (Ctrl+C)
- Restart: `npm run dev`
- Check console for startup errors

### Testing Existing Routes

#### Test Admin Earnings Routes

```bash
# 1. Get Click Logs
curl -X GET "http://localhost:3000/api/v1/admin/earnings/clicks?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Get Conversions
curl -X GET "http://localhost:3000/api/v1/admin/earnings/conversions?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 3. Approve Conversion
curl -X POST "http://localhost:3000/api/v1/admin/earnings/conversions/CONV_123/approve" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

#### Test User Earnings Routes

```bash
# 1. Get Products
curl -X GET "http://localhost:3000/api/v1/earn/products?page=1&limit=20" \
  -H "Authorization: Bearer USER_TOKEN"

# 2. Generate Click
curl -X POST "http://localhost:3000/api/v1/earn/products/PRODUCT_ID/click" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskUrl": "https://example.com/task"}'
```

### Summary

**The route `/api/v1/admin/earn/products` does not exist.**

**Available alternatives:**
- ✅ `/api/v1/earn/products` - Get products (user route)
- ✅ `/api/v1/admin/earnings/clicks` - Admin click logs
- ✅ `/api/v1/admin/earnings/conversions` - Admin conversions

**To create the missing route:**
1. Create `src/routes/admin/products.routes.ts`
2. Add product management routes
3. Register in `src/routes/index.ts` as `/admin/earn`

