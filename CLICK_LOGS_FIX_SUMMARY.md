# Click Logs API Fix Summary

## Issues Fixed

### 1. Offer Field Not Populated
**Problem:** The `offer` field in click logs responses was showing `null` because:
- The populate was using `'name amount'` but Offer model uses `payoutCost`, not `amount`
- Response mapping was trying to access `amount` which doesn't exist

**Fix:**
- Changed populate to use `'name payoutCost payoutType'`
- Updated response mapping to use `payoutCost` instead of `amount`
- Added fallback values (`|| 'N/A'` for name, `|| 0` for amount)

### 2. Missing offerId Filter
**Problem:** Admin couldn't filter click logs by offerId

**Fix:**
- Added `offerId` query parameter to validation schema
- Added `offerId` filter to the query builder

### 3. Limited Search Functionality
**Problem:** Search only worked for `clickId` and `conversionId`, not for user names, offer names, or product names

**Fix:**
- Enhanced search to query User, Offer, and Product collections
- Search now matches user names/emails, offer names, and product names
- If search looks like an ObjectId, it also searches in userId, offerId, and productId fields

### 4. Missing Indexes
**Problem:** `offerId` field didn't have an index, causing slow queries

**Fix:**
- Added index to `offerId` field in ClickLog schema
- Added compound indexes: `{ offerId: 1, status: 1 }` and `{ offerId: 1, createdAt: -1 }`

## Files Modified

1. **`src/models/ClickLog.ts`**
   - Added `index: true` to `offerId` field
   - Added compound indexes for offerId queries

2. **`src/validations/admin/earnings.validation.ts`**
   - Added `offerId` to `getClickLogsSchema` query parameters

3. **`src/controllers/admin/earnings.controller.ts`**
   - Fixed `getClickLogs` function:
     - Added `offerId` filter
     - Fixed populate to use `payoutCost` instead of `amount`
     - Enhanced search functionality
     - Fixed response mapping
   - Fixed `getClickLogById` function:
     - Fixed populate and response mapping
   - Fixed `getClickLogByClickId` function:
     - Fixed populate and response mapping
   - Added imports for `Offer` and `Product` models

## API Response Format

The click logs endpoint now correctly returns offer data:

```json
{
  "success": true,
  "data": {
    "clickLogs": [
      {
        "id": "...",
        "clickId": "...",
        "user": {
          "id": "...",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        },
        "offer": {
          "id": "...",
          "name": "Mobile App Install",
          "amount": 50.00
        },
        "product": {
          "id": "...",
          "name": "Bank 811 Campaign",
          "category": "Banking"
        },
        // ... other fields
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## Query Parameters

The endpoint now supports:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status: "pending", "converted", "expired", "rejected"
- `userId` - Filter by user ID
- `productId` - Filter by product ID
- `offerId` - Filter by offer ID (NEW)
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)
- `search` - Search by clickId, conversionId, user name/email, offer name, or product name (ENHANCED)

## Testing

Test the endpoint:
```bash
curl -X GET "http://localhost:3000/api/v1/admin/earnings/click-logs?page=1&limit=20&offerId=OFFER_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

The offer field should now be populated with correct data instead of showing `null`.

