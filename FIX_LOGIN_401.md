# Fix 401 Unauthorized Login Error

If you're getting a 401 error when trying to login, the admin user doesn't exist or the password is incorrect.

## Quick Fix: Create Admin User

**On your server, run:**

```bash
cd /var/www/Sambhav/backend/sombhav_backend

# Pull latest changes
git pull origin main

# Create admin user with default credentials
npm run create-admin-credentials
```

**Default credentials:**
- Email: `admin@sambhav.com`
- Password: `Admin@123`

## Or Use Custom Credentials

```bash
ADMIN_EMAIL=admin@sambhav.com \
ADMIN_PASSWORD=YourPassword123 \
npm run create-admin-credentials
```

## Verify Admin User Exists

After running the script, you should see:

```
🎉 ADMIN CREDENTIALS CREATED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    admin@sambhav.com
🔐 Password: Admin@123
```

## Test Login

```bash
# Test from server
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sambhav.com",
    "password": "Admin@123"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "email": "admin@sambhav.com",
      "role": "admin"
    },
    "token": "..."
  }
}
```

## Common Issues

### Issue 1: User doesn't exist
**Solution:** Run `npm run create-admin-credentials`

### Issue 2: Wrong password
**Solution:** 
- Check the password in `ADMIN_CREDENTIALS.json` file
- Or reset by running the script again with new password

### Issue 3: Email case sensitivity
**Solution:** Make sure email matches exactly (case-sensitive in some databases)

### Issue 4: Password requirements
The password must:
- Be at least 6 characters
- Contain at least one letter
- Contain at least one number

Example: `Admin@123` ✅

## Check Existing Admin Users

If you want to see what admin users exist:

```bash
# Connect to MongoDB and check
mongo
use sombhav
db.users.find({ role: "admin" })
```

Or use the script to update existing user:

```bash
# This will update existing user or create new one
npm run create-admin-credentials
```

