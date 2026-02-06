# Health Check Endpoints - Quick Reference

## All Health Check URLs

| Module | Endpoint | Full URL |
|--------|----------|----------|
| **Server** | `/health` | `http://localhost:3000/health` |
| **Auth** | `/api/v1/auth/health` | `http://localhost:3000/api/v1/auth/health` |
| **User** | `/api/v1/user/health` | `http://localhost:3000/api/v1/user/health` |
| **Home** | `/api/v1/home/health` | `http://localhost:3000/api/v1/home/health` |
| **Earnings** | `/api/v1/earn/health` | `http://localhost:3000/api/v1/earn/health` |
| **Referral** | `/api/v1/referral/health` | `http://localhost:3000/api/v1/referral/health` |
| **CA Services** | `/api/v1/ca/health` | `http://localhost:3000/api/v1/ca/health` |
| **POD** | `/api/v1/pod/health` | `http://localhost:3000/api/v1/pod/health` |

## Quick Test Commands

### Using curl:
```bash
# Test all endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/auth/health
curl http://localhost:3000/api/v1/user/health
curl http://localhost:3000/api/v1/home/health
curl http://localhost:3000/api/v1/earn/health
curl http://localhost:3000/api/v1/referral/health
curl http://localhost:3000/api/v1/ca/health
curl http://localhost:3000/api/v1/pod/health
```

### Using the test script:
```bash
./test-health.sh
```

## Expected Response

```json
{
  "success": true,
  "module": "module-name",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

## Notes

- ✅ All endpoints are **public** (no authentication needed)
- ✅ All endpoints return **HTTP 200** when healthy
- ✅ Use for monitoring, load balancers, and quick status checks

