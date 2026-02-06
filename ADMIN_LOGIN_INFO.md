# Admin Login API

## Login Endpoint

**Admins use the same login endpoint as regular users:**

```
POST /api/v1/auth/login
```

**NOT** `/api/v1/admin/auth/login` (this endpoint doesn't exist)

## Request

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

## Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "693ee2bd5c9ef0d142233213",
      "name": "Admin User",
      "email": "admin@example.com",
      "phone": "9876543211",
      "profileImage": null,
      "walletBalance": 0,
      "totalEarnings": 0,
      "referralCode": "...",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "role": "admin"  // ✅ This indicates admin access
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 3600
  }
}
```

## Admin Credentials

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: `admin`

## Using the Token

After login, use the `token` from the response in the Authorization header for all admin APIs:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Use the token for admin APIs
curl -X GET "http://localhost:3000/api/v1/admin/earnings/click-logs" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend Implementation

1. **Login**: Use `POST /api/v1/auth/login`
2. **Check Role**: Check `data.user.role === 'admin'` in the response
3. **Store Token**: Save the token from `data.token`
4. **Admin APIs**: Include `Authorization: Bearer <token>` header in all admin API requests

## Important Notes

- ✅ Admin login works through the regular `/api/v1/auth/login` endpoint
- ✅ The response includes `role: "admin"` to identify admin users
- ✅ Admin routes are protected by `requireAdmin` middleware that checks the JWT token
- ✅ All admin routes start with `/api/v1/admin/`

