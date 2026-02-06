# Bills & Recharges System Documentation

## Overview

The Bills & Recharges module provides a unified way for users to pay for:

- Mobile recharges
- DTH recharges
- Electricity bills
- Gas bills
- Water bills

The module consists of:

- **User APIs** under `/api/v1/bills` for browsing services, paying bills/recharges, and viewing transaction history.
- **Admin APIs** under `/api/v1/admin/bills` for configuring bill services, managing commissions, and reviewing/refunding transactions.
- **Data models**: `BillService` and `BillTransaction`.
- **Provider abstraction**: `BillProviderService` for integrating third-party bill/recharge providers.

This implementation matches the PRD requirement for a Bills & Recharges module with:

- Service catalog by bill/recharge type
- Transaction logs with filtering
- Commission calculation
- Admin-side refund tools

> Note: The current provider integration is a **mock provider** that always returns success. It is designed so you can plug in a real bill/recharge API later without changing the rest of the system.

---

## Data Models

### BillService Model

**File**: `src/models/BillService.ts`

Represents a bill/recharge service configuration (e.g., “Airtel Prepaid Recharge”, “Electricity – State Board X”).

```typescript
{
  name: string;               // Display name
  description?: string;       // Optional description
  type: 'mobile_recharge' |
        'dth_recharge' |
        'electricity_bill' |
        'gas_bill' |
        'water_bill';
  providerCode: string;       // Code used by external provider
  icon?: string;              // Icon URL
  minAmount: number;          // Min payable amount
  maxAmount: number;          // Max payable amount
  commissionType: 'flat' | 'percentage';
  commissionValue: number;    // Flat amount or percentage
  isActive: boolean;          // Service active/inactive
  metadata?: Record<string, any>; // Extra provider-specific config
  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

- `{ type: 1, isActive: 1 }`
- `{ providerCode: 1 }`

---

### BillTransaction Model

**File**: `src/models/BillTransaction.ts`

Represents a single bill/recharge attempt for a user.

```typescript
{
  userId: ObjectId;           // User who initiated transaction
  serviceId: ObjectId;        // Ref: BillService
  serviceType: 'mobile_recharge' | 'dth_recharge' | 'electricity_bill' | 'gas_bill' | 'water_bill';
  serviceName: string;        // Snapshot of service name
  providerCode: string;       // Snapshot of providerCode

  accountNumber: string;      // Consumer/account number, phone, etc.
  customerName?: string;      // Optional customer name
  phone?: string;             // Optional phone (10 digits)

  amount: number;             // Amount paid by user
  commissionAmount: number;   // Commission earned on this transaction

  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';

  providerTransactionId?: string; // Provider-side transaction ID
  providerResponse?: Record<string, any>; // Raw provider payload (mock in current impl)
  errorMessage?: string;      // Error message if failed

  refundReason?: string;      // Reason for admin refund
  refundedAt?: Date;          // When refund was marked

  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

- `{ userId: 1 }`
- `{ serviceId: 1 }`
- `{ serviceType: 1 }`
- `{ status: 1 }`
- `{ createdAt: -1 }`

---

## Provider Integration Layer

**File**: `src/services/billProvider.service.ts`

Wrapper around any actual third-party bill/recharge provider.

```typescript
export interface ProviderPaymentRequest {
  serviceType: string;
  providerCode: string;
  accountNumber: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface ProviderPaymentResponse {
  success: boolean;
  providerTransactionId?: string;
  message?: string;
  raw?: any;
}
```

Current implementation:

- Simulates a successful payment with a generated ObjectId as `providerTransactionId`.
- Returns `success: true` and echoes the request in `raw`.

To integrate a real provider:

1. Replace the body of `processPayment` with HTTP calls to the provider.
2. Map provider error codes to `success: false` and set `message`.
3. Store the full provider response in `raw`.

---

## User APIs (`/api/v1/bills`)

All Bills & Recharges user endpoints require **JWT authentication**:

```http
Authorization: Bearer <token>
```

### 1. Get Bill Services

**Endpoint**: `GET /api/v1/bills/services`

**Description**: List active bill/recharge services, optionally filtered by type.

**Query Parameters**:

- `type` (optional):
  - `mobile_recharge`
  - `dth_recharge`
  - `electricity_bill`
  - `gas_bill`
  - `water_bill`

**Validation**: `listBillServicesSchema` (`src/validations/bills.validation.ts`)

**Response**:

```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "SERVICE_ID",
        "name": "Airtel Prepaid Recharge",
        "description": "Prepaid mobile recharge",
        "type": "mobile_recharge",
        "providerCode": "AIRTEL_PREPAID",
        "icon": "https://example.com/icons/airtel.png",
        "minAmount": 10,
        "maxAmount": 10000,
        "commissionType": "percentage",
        "commissionValue": 2
      }
    ]
  }
}
```

---

### 2. Pay Bill / Recharge

**Endpoint**: `POST /api/v1/bills/pay`

**Description**: Initiate a bill payment or recharge against a configured `BillService`.

**Validation**: `payBillSchema`

**Request Body**:

```json
{
  "serviceId": "SERVICE_ID",
  "accountNumber": "9876543210",
  "amount": 199,
  "customerName": "John Doe",
  "phone": "9876543210",
  "metadata": {
    "circle": "DELHI",
    "operator": "Airtel"
  }
}
```

Rules:

- `serviceId` required, must refer to an **active** `BillService`.
- `amount`:
  - Must be a positive number.
  - Must be between `minAmount` and `maxAmount` of the `BillService`.
- `phone` (if provided) must be a 10‑digit number.

**Behavior**:

1. Load active `BillService` by `serviceId`.
2. Validate `amount` range.
3. Compute `commissionAmount`:

   - If `commissionType === 'percentage'`:  
     \( \text{commissionAmount} = \text{amount} \times \frac{\text{commissionValue}}{100} \)
   - If `commissionType === 'flat'`:  
     \( \text{commissionAmount} = \text{commissionValue} \)

4. Create `BillTransaction` with status `processing`.
5. Call `BillProviderService.processPayment`.
6. If provider fails:
   - Update `status` to `failed`, store `errorMessage` and `providerResponse`.
   - Return `400 PROVIDER_ERROR`.
7. If provider succeeds:
   - Update `status` to `success`, set `providerTransactionId` and `providerResponse`.

**Success Response (201)**:

```json
{
  "success": true,
  "message": "Bill payment processed successfully",
  "data": {
    "transaction": {
      "id": "TXN_ID",
      "serviceName": "Airtel Prepaid Recharge",
      "serviceType": "mobile_recharge",
      "providerCode": "AIRTEL_PREPAID",
      "accountNumber": "9876543210",
      "amount": 199,
      "commissionAmount": 3.98,
      "status": "success",
      "providerTransactionId": "PROVIDER_TXN_ID",
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  }
}
```

---

### 3. Get User Bill Transactions

**Endpoint**: `GET /api/v1/bills/transactions`

**Description**: Get paginated history of the authenticated user’s bill/recharge transactions.

**Validation**: `listUserBillTransactionsSchema`

**Query Parameters**:

- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional): `pending`, `processing`, `success`, `failed`, `refunded`
- `type` (optional): `mobile_recharge`, `dth_recharge`, `electricity_bill`, `gas_bill`, `water_bill`
- `startDate` (optional, ISO datetime)
- `endDate` (optional, ISO datetime)

**Response**:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "TXN_ID",
        "serviceName": "Airtel Prepaid Recharge",
        "serviceType": "mobile_recharge",
        "providerCode": "AIRTEL_PREPAID",
        "accountNumber": "9876543210",
        "amount": 199,
        "commissionAmount": 3.98,
        "status": "success",
        "providerTransactionId": "PROVIDER_TXN_ID",
        "errorMessage": null,
        "createdAt": "2025-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 4. Get Single User Transaction

**Endpoint**: `GET /api/v1/bills/transactions/:transactionId`

**Validation**: `getUserBillTransactionSchema`

**Response**:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "TXN_ID",
      "serviceName": "Airtel Prepaid Recharge",
      "serviceType": "mobile_recharge",
      "providerCode": "AIRTEL_PREPAID",
      "accountNumber": "9876543210",
      "amount": 199,
      "commissionAmount": 3.98,
      "status": "success",
      "providerTransactionId": "PROVIDER_TXN_ID",
      "errorMessage": null,
      "refundReason": null,
      "refundedAt": null,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:05.000Z"
    }
  }
}
```

---

## Admin APIs (`/api/v1/admin/bills`)

All admin endpoints require:

1. JWT authentication (`Authorization: Bearer <admin_token>`)
2. `requireAdmin` middleware (user must have `role: 'admin'`).

### 1. List Bill Services

**Endpoint**: `GET /api/v1/admin/bills/services`

**Validation**: `listAdminBillServicesSchema`

**Query Parameters**:

- `type` (optional): bill service type
- `status` (optional): `active` | `inactive`
- `search` (optional): search by name
- `page`, `limit` (optional): pagination

Returns paginated list of `BillService` configurations.

---

### 2. Create Bill Service

**Endpoint**: `POST /api/v1/admin/bills/services`

**Validation**: `createAdminBillServiceSchema`

**Body**:

```json
{
  "name": "Airtel Prepaid Recharge",
  "description": "Prepaid mobile recharge",
  "type": "mobile_recharge",
  "providerCode": "AIRTEL_PREPAID",
  "icon": "https://example.com/icons/airtel.png",
  "minAmount": 10,
  "maxAmount": 10000,
  "commissionType": "percentage",
  "commissionValue": 2,
  "isActive": true,
  "metadata": {
    "circle": "all"
  }
}
```

---

### 3. Update Bill Service

**Endpoint**: `PUT /api/v1/admin/bills/services/:serviceId`

**Validation**: `updateAdminBillServiceSchema`

All fields in body are optional; only provided fields are updated.

---

### 4. Toggle Bill Service Status

**Endpoint**: `PUT /api/v1/admin/bills/services/:serviceId/status`

**Validation**: `toggleAdminBillServiceStatusSchema`

**Body**:

```json
{
  "isActive": true
}
```

---

### 5. List Bill Transactions (Admin)

**Endpoint**: `GET /api/v1/admin/bills/transactions`

**Validation**: `listAdminBillTransactionsSchema`

**Query Parameters**:

- `page`, `limit`
- `status`: `pending`, `processing`, `success`, `failed`, `refunded`
- `type`: bill service type
- `userId`: filter by user
- `startDate`, `endDate`: ISO datetimes
- `search`: partial match on `accountNumber`, `serviceName`, or `providerTransactionId`

Returns paginated list of `BillTransaction` with userId and all key fields.

---

### 6. Get Single Bill Transaction (Admin)

**Endpoint**: `GET /api/v1/admin/bills/transactions/:transactionId`

**Validation**: `getAdminBillTransactionSchema`

Includes more detailed information (`providerResponse`, `refundReason`, etc.) compared to the user view.

---

### 7. Refund Bill Transaction (Admin)

**Endpoint**: `POST /api/v1/admin/bills/transactions/:transactionId/refund`

**Validation**: `refundAdminBillTransactionSchema`

**Body**:

```json
{
  "reason": "Provider reversed the transaction"
}
```

Rules:

- Only transactions with `status: 'success'` can be refunded.
- Sets:
  - `status` → `refunded`
  - `refundReason` → provided reason
  - `refundedAt` → current timestamp

> Note: This is a **logical refund only** in the backend. Real payment gateway reversal should be implemented in `BillProviderService` and called before marking refunded.

---

## Route Registration

**File**: `src/routes/index.ts`

```typescript
router.use('/bills', billsRoutes);          // User Bills & Recharges
router.use('/admin/bills', adminBillsRoutes); // Admin Bills & Recharges
```

Base URLs:

- User: `http://localhost:3000/api/v1/bills/...`
- Admin: `http://localhost:3000/api/v1/admin/bills/...`

---

## Error Handling & Validation

- All endpoints use the shared `createError` helper and global error middleware.
- Request validation is implemented via **Zod** in:
  - `src/validations/bills.validation.ts`
  - `src/validations/admin/bills.validation.ts`
- Common error codes:
  - `VALIDATION_ERROR` – invalid input (amount, phone, etc.)
  - `NOT_FOUND` – service or transaction not found
  - `UNAUTHORIZED` – missing/invalid token
  - `PROVIDER_ERROR` – provider rejected the transaction
  - `INVALID_STATE` – invalid refund state

Error response format follows the existing pattern:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Example Flows

### User Bill Payment Flow

1. **Fetch services**  
   `GET /api/v1/bills/services?type=mobile_recharge`
2. **User selects a service and enters details**.
3. **Pay bill**  
   `POST /api/v1/bills/pay`
4. **View history**  
   `GET /api/v1/bills/transactions`
5. **View specific transaction**  
   `GET /api/v1/bills/transactions/{transactionId}`

### Admin Monitoring & Refund Flow

1. **List transactions**  
   `GET /api/v1/admin/bills/transactions?status=failed`
2. **Inspect a transaction**  
   `GET /api/v1/admin/bills/transactions/{transactionId}`
3. **Mark as refunded (if necessary)**  
   `POST /api/v1/admin/bills/transactions/{transactionId}/refund`

---

## Next Steps for Real Provider Integration

To go from mock to production:

1. Implement actual provider HTTP calls in `BillProviderService`.
2. Add provider-specific config in `BillService.metadata`.
3. Optionally integrate with the existing **wallet** module to:
   - Deduct wallet balance for payments.
   - Credit commissions directly into admin or user wallets.
4. Extend admin UI (frontend) to manage `BillService` entries and view `BillTransaction` logs.

