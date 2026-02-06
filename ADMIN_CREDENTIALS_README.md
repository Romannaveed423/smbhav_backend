# Admin Credentials Setup Guide

This guide explains how to create admin credentials for the Sambhav Dashboard.

## Quick Start

### Option 1: Use Default Credentials

```bash
cd /var/www/Sambhav/backend/sombhav_backend
npm run create-admin-credentials
```

**Default Credentials:**
- **Email:** `admin@sambhav.com`
- **Password:** `Admin@123`

### Option 2: Custom Credentials

```bash
cd /var/www/Sambhav/backend/sombhav_backend

# Set custom credentials via environment variables
ADMIN_EMAIL=admin@yourcompany.com \
ADMIN_PASSWORD=YourSecurePassword123 \
ADMIN_NAME="Your Admin Name" \
ADMIN_PHONE="+919876543210" \
npm run create-admin-credentials
```

## What the Script Does

1. ✅ Connects to MongoDB
2. ✅ Creates or updates an admin user
3. ✅ Sets role to `admin`
4. ✅ Verifies email and phone
5. ✅ Saves credentials to `ADMIN_CREDENTIALS.json`
6. ✅ Displays login instructions

## Output

After running the script, you'll see:

```
🎉 ADMIN CREDENTIALS CREATED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    admin@sambhav.com
🔐 Password: Admin@123
📱 Phone:    +919876543210
👤 Name:     Sambhav Admin
🔑 Role:     admin
🆔 User ID:  507f1f77bcf86cd799439011
🎫 Referral: ADMINXYZ123

💾 Credentials saved to: /path/to/ADMIN_CREDENTIALS.json
```

## Login

### Via Dashboard

1. Open: `http://72.61.244.223:3001/login`
2. Enter your email and password
3. Click "Login"

### Via API

```bash
curl -X POST http://72.61.244.223:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sambhav.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@sambhav.com",
      "name": "Sambhav Admin",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 3600
  }
}
```

## Credentials File

The script automatically saves credentials to `ADMIN_CREDENTIALS.json`:

```json
{
  "email": "admin@sambhav.com",
  "password": "Admin@123",
  "phone": "+919876543210",
  "name": "Sambhav Admin",
  "role": "admin",
  "userId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-12-29T15:00:00.000Z",
  "loginEndpoint": "http://72.61.244.223:3000/api/v1/auth/login",
  "dashboardUrl": "http://72.61.244.223:3001/login"
}
```

⚠️ **Important:** Keep this file secure! Don't commit it to git.

## Updating Existing Admin

If an admin user already exists with the same email, the script will:
- ✅ Update the user to admin role
- ✅ Update the password (if provided)
- ✅ Verify email and phone

## Troubleshooting

### Error: "User already exists"
- The email or phone is already in use
- Use a different email or phone number
- Or use `npm run set-admin <email>` to convert existing user

### Error: "Cannot connect to MongoDB"
- Check your `.env` file has correct `MONGODB_URI` or `DATABASE_URL`
- Ensure MongoDB is running
- Verify network connectivity

### Error: "Password too weak"
- Use a stronger password (min 8 characters, mix of letters, numbers, symbols)
- Example: `Admin@123` or `SecurePass2024!`

## Security Best Practices

1. ✅ Use strong passwords (min 12 characters recommended)
2. ✅ Change default password after first login
3. ✅ Don't share credentials publicly
4. ✅ Use environment variables for production
5. ✅ Keep `ADMIN_CREDENTIALS.json` out of git (already in `.gitignore`)

## Environment Variables

You can customize the admin creation via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | `admin@sambhav.com` | Admin email address |
| `ADMIN_PASSWORD` | `Admin@123` | Admin password |
| `ADMIN_NAME` | `Sambhav Admin` | Admin display name |
| `ADMIN_PHONE` | `+919876543210` | Admin phone number |
| `MONGODB_URI` | `mongodb://localhost:27017/sombhav` | MongoDB connection string |
| `DATABASE_URL` | Same as `MONGODB_URI` | Alternative DB URL variable |

## Related Scripts

- `npm run create-admin` - Creates admin with different defaults
- `npm run set-admin <email>` - Converts existing user to admin

---

**Need Help?** Check the logs or contact the development team.

