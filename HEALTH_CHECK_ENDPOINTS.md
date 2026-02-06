# Health Check Endpoints

All API modules have health check endpoints to verify they are working correctly.

## Base URL
```
http://localhost:3000/api/v1
```

## Health Check Endpoints

### 1. Authentication Module
**GET** `/api/v1/auth/health`

```bash
curl http://localhost:3000/api/v1/auth/health
```

**Response:**
```json
{
  "success": true,
  "module": "auth",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 2. User Module
**GET** `/api/v1/user/health`

```bash
curl http://localhost:3000/api/v1/user/health
```

**Response:**
```json
{
  "success": true,
  "module": "user",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 3. Home Module
**GET** `/api/v1/home/health`

```bash
curl http://localhost:3000/api/v1/home/health
```

**Response:**
```json
{
  "success": true,
  "module": "home",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 4. Earnings Module
**GET** `/api/v1/earn/health`

```bash
curl http://localhost:3000/api/v1/earn/health
```

**Response:**
```json
{
  "success": true,
  "module": "earnings",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 5. Referral Module
**GET** `/api/v1/referral/health`

```bash
curl http://localhost:3000/api/v1/referral/health
```

**Response:**
```json
{
  "success": true,
  "module": "referral",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 6. CA Services Module
**GET** `/api/v1/ca/health`

```bash
curl http://localhost:3000/api/v1/ca/health
```

**Response:**
```json
{
  "success": true,
  "module": "ca-services",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 7. POD (Print On Demand) Module
**GET** `/api/v1/pod/health`

```bash
curl http://localhost:3000/api/v1/pod/health
```

**Response:**
```json
{
  "success": true,
  "module": "pod",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 8. Server Health Check (Root)
**GET** `/health`

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Quick Test All Endpoints

Run this script to test all health check endpoints:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api/v1"

echo "Testing Health Check Endpoints..."
echo "=================================="
echo ""

# Server health
echo "1. Server Health:"
curl -s "${BASE_URL}/health" | jq .
echo ""
echo "---"
echo ""

# Auth
echo "2. Auth Module:"
curl -s "${API_BASE}/auth/health" | jq .
echo ""
echo "---"
echo ""

# User
echo "3. User Module:"
curl -s "${API_BASE}/user/health" | jq .
echo ""
echo "---"
echo ""

# Home
echo "4. Home Module:"
curl -s "${API_BASE}/home/health" | jq .
echo ""
echo "---"
echo ""

# Earnings
echo "5. Earnings Module:"
curl -s "${API_BASE}/earn/health" | jq .
echo ""
echo "---"
echo ""

# Referral
echo "6. Referral Module:"
curl -s "${API_BASE}/referral/health" | jq .
echo ""
echo "---"
echo ""

# CA Services
echo "7. CA Services Module:"
curl -s "${API_BASE}/ca/health" | jq .
echo ""
echo "---"
echo ""

# POD
echo "8. POD Module:"
curl -s "${API_BASE}/pod/health" | jq .
echo ""
echo "---"
echo ""

echo "All health checks completed!"
```

## Response Fields

- **success**: `true` if the module is healthy
- **module**: Name of the module
- **status**: Always `"healthy"` if the endpoint responds
- **timestamp**: Current server timestamp in ISO format
- **uptime**: Server uptime in seconds

## Notes

- All health check endpoints are **public** (no authentication required)
- These endpoints are lightweight and should respond quickly
- Use these endpoints for monitoring and load balancer health checks
- If a module is down, the endpoint will return a 404 or 500 error

