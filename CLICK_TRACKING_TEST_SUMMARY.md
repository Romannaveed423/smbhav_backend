# Click Tracking & Postback System - Testing Summary

## ✅ Implementation Status

All components have been successfully implemented and tested for compilation.

### ✅ Completed Components

1. **ClickLog Model** - Created with all required fields and indexes
2. **Earning Model** - Updated with click tracking fields
3. **User Model** - Added role field for admin access
4. **Admin Middleware** - Created for protecting admin routes
5. **Earnings Controller** - Added `generateClick` and `trackClick` endpoints
6. **Postback Handler** - Updated to use `click_id` instead of `trackingToken`
7. **Admin Earnings Controller** - Created with all admin endpoints
8. **Routes** - All routes properly registered
9. **Validations** - All validation schemas created
10. **Test Script** - Created comprehensive test script

## 📋 Testing Checklist

### Prerequisites

1. **Database**: MongoDB must be running and connected
2. **Test User**: User with email `test@example.com` and password `test123`
3. **Products**: At least one product must exist in the database
4. **Admin User**: Create an admin user in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

### Test Script

Run the automated test script:

```bash
./test-click-tracking.sh
```

This script tests:
- ✅ Generate Click endpoint
- ✅ Track Click endpoint (analytics)
- ✅ Postback with click_id
- ✅ Error handling

### Manual Testing

#### 1. Generate Click

```bash
POST /api/v1/earn/products/:productId/click
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskUrl": "https://example.com/task",
  "offerId": "optional_offer_id"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Click generated successfully",
  "data": {
    "clickId": "uuid-v4",
    "redirectUrl": "https://example.com/task?click_id=...&postback_url=...",
    "expiresAt": "2024-01-16T10:00:00.000Z",
    "trackingUrl": "http://localhost:3000/api/v1/earn/postback?click_id=..."
  }
}
```

#### 2. Track Click (Optional Analytics)

```bash
GET /api/v1/earn/track/:clickId
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Click tracked",
  "data": {
    "clickId": "uuid-v4",
    "status": "pending"
  }
}
```

#### 3. Postback with Click ID

```bash
POST /api/v1/earn/postback?click_id=<click_id>
Content-Type: application/json

{
  "amount": 500,
  "status": "completed",
  "transactionId": "TXN_123",
  "conversionId": "CONV_456",
  "offerId": "optional_offer_id"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Postback received and processed",
  "data": {
    "earningId": "...",
    "clickId": "...",
    "conversionId": "...",
    "status": "completed",
    "amount": 500
  }
}
```

#### 4. Admin: Get Click Logs

```bash
GET /api/v1/admin/earnings/clicks?page=1&limit=20&status=pending
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional: pending, converted, expired, rejected)
- `userId` (optional)
- `productId` (optional)
- `startDate` (optional, ISO datetime)
- `endDate` (optional, ISO datetime)

#### 5. Admin: Get Conversions

```bash
GET /api/v1/admin/earnings/conversions?page=1&limit=20&approvalStatus=pending
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional: pending, completed, cancelled)
- `approvalStatus` (optional: pending, auto_approved, manually_approved, rejected)
- `userId` (optional)
- `productId` (optional)

#### 6. Admin: Approve/Reject Conversion

```bash
POST /api/v1/admin/earnings/conversions/:conversionId/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "approve"  // or "reject"
  // "reason": "Required if action is reject"
}
```

**For Approval:**
```json
{
  "action": "approve"
}
```

**For Rejection:**
```json
{
  "action": "reject",
  "reason": "Fraudulent activity detected"
}
```

## 🔍 Verification Steps

### 1. Database Verification

Check ClickLog collection:
```javascript
db.clicklogs.find().pretty()
```

Check Earning collection for click-based earnings:
```javascript
db.earnings.find({ clickId: { $exists: true } }).pretty()
```

### 2. Verify Click Expiration

Clicks expire after 24 hours. Test expired click:
```bash
# Create a click, wait 24+ hours, then try postback
# Should return error: "Click has expired"
```

### 3. Verify Wallet Crediting

After postback with status="completed":
- User's wallet balance should increase
- Earning record should be created with status="completed"
- Click log status should change to "converted"

### 4. Verify Referral Commissions

If user was referred:
- Referrer should receive commission earning
- Referrer's wallet should be credited
- Referral stats should update

## 🐛 Common Issues & Solutions

### Issue 1: "Product not found"
**Solution**: Ensure product exists in database and productId is correct

### Issue 2: "Click has expired"
**Solution**: Generate a new click (clicks expire after 24 hours)

### Issue 3: "Admin access required"
**Solution**: Set user role to 'admin' in MongoDB:
```javascript
db.users.updateOne({email: "user@example.com"}, {$set: {role: "admin"}})
```

### Issue 4: "Click log not found"
**Solution**: Verify click_id is correct and click was generated

### Issue 5: Postback returns 200 but doesn't credit wallet
**Solution**: 
- Check postback status is "completed" or "approved"
- Verify click hasn't expired
- Check if earning already exists (prevents double crediting)

## 📊 Test Results Summary

### Compilation Status
- ✅ TypeScript compilation: **SUCCESS**
- ✅ Linter errors: **NONE** (in new code)
- ✅ All exports: **VERIFIED**

### Route Registration
- ✅ `/api/v1/earn/products/:productId/click` - **REGISTERED**
- ✅ `/api/v1/earn/track/:clickId` - **REGISTERED**
- ✅ `/api/v1/earn/postback?click_id=...` - **REGISTERED**
- ✅ `/api/v1/admin/earnings/clicks` - **REGISTERED**
- ✅ `/api/v1/admin/earnings/conversions` - **REGISTERED**
- ✅ `/api/v1/admin/earnings/conversions/:conversionId/approve` - **REGISTERED**

### Model Verification
- ✅ ClickLog model with all fields and indexes
- ✅ Earning model updated with click tracking fields
- ✅ User model with role field
- ✅ All indexes properly defined

## 🚀 Next Steps

1. **Start Server**: `npm run dev`
2. **Run Test Script**: `./test-click-tracking.sh`
3. **Create Admin User**: Set role in MongoDB
4. **Test Admin Endpoints**: Use admin token
5. **Monitor Logs**: Check for any runtime errors
6. **Database Inspection**: Verify data is being created correctly

## 📝 Notes

- The old `trackingToken` system is still supported for backward compatibility
- Click-based tracking is the new preferred method
- Admin endpoints require both authentication and admin role
- Clicks expire after 24 hours (configurable in code)
- Postback endpoint returns 200 OK even on errors to prevent retries

