# .env Configuration Guide

## Current Configuration Analysis

Based on your `.env` file, here's what needs to be corrected:

---

## ✅ Correct Settings

- **PORT=3000** ✓ Correct
- **NODE_ENV=development** ✓ Correct for local development
- **JWT_EXPIRES_IN=1h** ✓ Correct
- **JWT_REFRESH_EXPIRES_IN=7d** ✓ Correct

---

## ⚠️ Issues to Fix

### 1. MongoDB Connection Priority Issue

**Problem:** Your code uses this priority:
```typescript
MONGODB_URI || DATABASE_URL || default
```

You have both set:
- `MONGODB_URI="mongodb://127.0.0.1:27017"` (Local MongoDB)
- `DATABASE_URL=mongodb+srv://...` (MongoDB Atlas)

**Result:** It will use `MONGODB_URI` (local MongoDB) and ignore `DATABASE_URL`.

**Solution:** Choose ONE:

**Option A: Use Local MongoDB (for development)**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/sombhav
# Comment out or remove DATABASE_URL
# DATABASE_URL=
```

**Option B: Use MongoDB Atlas (recommended for production)**
```env
# Comment out or remove MONGODB_URI
# MONGODB_URI=
DATABASE_URL=mongodb+srv://abdicode22:abdicode22gotocode@cluster0.svxonae.mongodb.net/sombhav?retryWrites=true&w=majority
```

**Note:** Make sure `DATABASE_URL` is complete and includes:
- Full cluster URL: `cluster0.svxonae.mongodb.net`
- Database name: `sombhav`
- Connection parameters: `?retryWrites=true&w=majority`

---

### 2. JWT Secrets Are Placeholders

**Problem:**
```env
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_change_in_production
```

**Solution:** Generate secure random secrets:

**For Development:**
```env
JWT_SECRET=dev_secret_key_12345_do_not_use_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_67890_do_not_use_in_production
```

**For Production:** Generate secure secrets:
```bash
# Generate random secret (run this in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then update:
```env
JWT_SECRET=<generated_secret_here>
JWT_REFRESH_SECRET=<different_generated_secret_here>
```

---

### 3. DATABASE_NAME Not Used

**Current:** `DATABASE_NAME=sombhav`

**Note:** The code doesn't use this variable. The database name is included in the connection URI:
- Local: `mongodb://127.0.0.1:27017/sombhav`
- Atlas: `mongodb+srv://...@cluster0.svxonae.mongodb.net/sombhav`

You can remove `DATABASE_NAME` or keep it for reference.

---

### 4. Social Login (Optional - Can be left as placeholders if not using)

If you're not using Google/Facebook login, you can leave these as placeholders:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

## Recommended .env Configuration

### For Local Development:
```env
# Server
PORT=3000
NODE_ENV=development

# Database - Use Local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/sombhav
# DATABASE_URL=  # Comment out or remove

# JWT (Use simple secrets for dev, change for production)
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=dev_refresh_token_secret_change_in_production
JWT_REFRESH_EXPIRES_IN=7d

# Social Login (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### For Production:
```env
# Server
PORT=3000
NODE_ENV=production

# Database - Use MongoDB Atlas
# MONGODB_URI=  # Comment out or remove
DATABASE_URL=mongodb+srv://abdicode22:abdicode22gotocode@cluster0.svxonae.mongodb.net/sombhav?retryWrites=true&w=majority

# JWT (Generate secure secrets!)
JWT_SECRET=<generate_secure_secret_here>
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=<generate_different_secure_secret_here>
JWT_REFRESH_EXPIRES_IN=7d

# Social Login (If using)
GOOGLE_CLIENT_ID=<your_actual_google_client_id>
GOOGLE_CLIENT_SECRET=<your_actual_google_client_secret>
FACEBOOK_APP_ID=<your_actual_facebook_app_id>
FACEBOOK_APP_SECRET=<your_actual_facebook_app_secret>
```

---

## Quick Fix Steps

1. **Choose your database connection:**
   - If using local MongoDB: Keep `MONGODB_URI`, remove/comment `DATABASE_URL`
   - If using MongoDB Atlas: Remove/comment `MONGODB_URI`, fix `DATABASE_URL` to be complete

2. **Fix DATABASE_URL format** (if using Atlas):
   ```
   mongodb+srv://abdicode22:abdicode22gotocode@cluster0.svxonae.mongodb.net/sombhav?retryWrites=true&w=majority
   ```

3. **Update JWT secrets** (at least for development, definitely for production)

4. **Remove DATABASE_NAME** (optional, not used by code)

---

## Verify Your Configuration

After updating `.env`, restart your server and check:

1. **MongoDB Connection:**
   ```bash
   npm run dev
   ```
   Should see: `MongoDB connected successfully`

2. **If connection fails:**
   - Check MongoDB is running (if using local): `mongod` or `brew services start mongodb-community`
   - Check MongoDB Atlas IP whitelist (if using Atlas)
   - Verify connection string is correct

---

## Security Notes

⚠️ **NEVER commit `.env` file to git** (already in `.gitignore` ✓)

⚠️ **For production:**
- Use strong, random JWT secrets
- Use MongoDB Atlas (not local)
- Set `NODE_ENV=production`
- Use environment variables on your hosting (Hostinger VPS)

