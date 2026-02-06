# Earnings Endpoints Testing Guide

## 💰 Earnings Health Check

**Endpoint:**
```
GET http://72.61.244.223:3000/api/v1/earn/health
```

**Test in Browser:**
```
http://72.61.244.223:3000/api/v1/earn/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "module": "earnings",
  "timestamp": "2025-12-27T08:27:43.214Z"
}
```

---

## 🧪 Quick Test Commands

### Health Check (No Authentication Required)

**Browser:**
```
http://72.61.244.223:3000/api/v1/earn/health
```

**cURL:**
```bash
curl http://72.61.244.223:3000/api/v1/earn/health
```

---

## 📋 All Earnings Endpoints

Base URL: `http://72.61.244.223:3000/api/v1/earn/`

### Health Check
- **GET** `/health` - Health check (No auth required)

### Dashboard
- **GET** `/dashboard` - Get earnings dashboard (Requires auth)
- **GET** `/products` - Get earnings products (Requires auth)
- **GET** `/offers` - Get available offers (Requires auth)

### Product Details
- **GET** `/products/:productId/offers` - Get product offers (Requires auth)
- **GET** `/products/:productId/detail` - Get product details (Requires auth)
- **POST** `/products/:productId/apply` - Apply for product (Requires auth)
- **POST** `/products/:productId/click` - Generate click tracking (Requires auth)

### Applications
- **POST** `/offer-applications` - Create offer application (Requires auth)
- **GET** `/applications/:applicationId/status` - Get application status (Requires auth)

### Click Tracking
- **GET** `/track/:clickId` - Track click (Public, no auth required)

### Earnings & Withdrawals
- **GET** `/earnings` - Get user earnings (Requires auth)
- **POST** `/withdraw` - Withdraw earnings (Requires auth)
- **GET** `/withdrawals` - Get withdrawal history (Requires auth)

### SIP Applications
- **POST** `/sip-applications` - Submit SIP application (Requires auth)
- **GET** `/sip-applications` - Get user SIP applications (Requires auth)
- **GET** `/sip-applications/:applicationId/status` - Get SIP application status (Requires auth)

### Mutual Fund Applications
- **POST** `/mutual-fund-applications` - Submit mutual fund application (Requires auth)
- **GET** `/mutual-fund-applications` - Get user mutual fund applications (Requires auth)
- **GET** `/mutual-fund-applications/:applicationId/status` - Get mutual fund application status (Requires auth)

### Insurance Applications
- **POST** `/insurance-applications` - Submit insurance application (Requires auth)
- **GET** `/insurance-applications` - Get user insurance applications (Requires auth)
- **GET** `/insurance-applications/:applicationId/status` - Get insurance application status (Requires auth)

### Loan Applications
- **POST** `/loan-applications` - Submit loan application (Requires auth)
- **GET** `/loan-applications` - Get user loan applications (Requires auth)
- **GET** `/loan-applications/:applicationId/status` - Get loan application status (Requires auth)

### Public Tasks
- **POST** `/public-tasks` - Create public task (Requires auth)
- **GET** `/public-tasks` - Get public tasks (Requires auth)
- **GET** `/my-public-tasks` - Get my public tasks (Requires auth)

### Postback
- **POST** `/postback` - Handle postback from networks (Public, no auth required)

---

## ✅ Test Health Endpoint Now

**Simply open this URL in your browser:**
```
http://72.61.244.223:3000/api/v1/earn/health
```

**Or use cURL:**
```bash
curl http://72.61.244.223:3000/api/v1/earn/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "module": "earnings",
  "timestamp": "2025-12-27T08:27:43.214Z"
}
```

---

## 🔐 Testing Protected Endpoints

For endpoints that require authentication, you'll need to:

1. **Login first** to get a token:
```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

2. **Use the token** in the Authorization header:
```bash
curl -X GET http://72.61.244.223:3000/api/v1/earn/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Example: Get Earnings Dashboard (Requires Auth)

```bash
curl -X GET http://72.61.244.223:3000/api/v1/earn/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚠️ Note

- `/health` endpoint does **NOT** require authentication
- Most other endpoints **DO** require authentication
- Use the token from login in the `Authorization: Bearer <token>` header

