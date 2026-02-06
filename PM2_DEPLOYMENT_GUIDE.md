# PM2 Deployment Guide for Production Server

## Problem

You're getting this error:
```
[PM2][ERROR] Interpreter bun is NOT AVAILABLE in PATH.
```

**Why?** PM2 is trying to run TypeScript files (`.ts`) directly, but `bun` is not installed. 

**Solution:** Build TypeScript to JavaScript first, then run the compiled JavaScript files.

---

## ✅ Correct Way to Deploy with PM2

### Step 1: Navigate to Backend Directory

```bash
cd /var/www/Sambhav/backend/sombhav_backend
```

### Step 2: Install Dependencies (if not done)

```bash
npm install
```

### Step 3: Build TypeScript to JavaScript

```bash
npm run build
```

This compiles all TypeScript files from `src/` to `dist/` folder.

### Step 4: Start with PM2

```bash
pm2 start dist/server.js --name Sombhav
```

**OR** use the npm script:

```bash
pm2 start npm --name Sombhav -- start
```

---

## 📋 Complete Deployment Steps

### First Time Setup:

```bash
# 1. Navigate to backend directory
cd /var/www/Sambhav/backend/sombhav_backend

# 2. Install dependencies
npm install --production

# 3. Install dev dependencies (needed for building)
npm install

# 4. Build TypeScript code
npm run build

# 5. Set up environment variables
nano .env
# (Edit your .env file - see ENV_CONFIGURATION_GUIDE.md)

# 6. Start with PM2
pm2 start dist/server.js --name Sombhav

# 7. Save PM2 process list (so it auto-starts on reboot)
pm2 save

# 8. Setup PM2 to start on server boot
pm2 startup
# (Follow the instructions it prints)
```

---

## 🔄 After Code Updates

When you push new code to the server:

```bash
# 1. Pull latest code (if using git)
cd /var/www/Sambhav/backend/sombhav_backend
git pull

# 2. Install any new dependencies
npm install

# 3. Rebuild TypeScript
npm run build

# 4. Restart PM2 process
pm2 restart Sombhav
```

---

## 🛠️ PM2 Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs Sombhav

# Stop the app
pm2 stop Sombhav

# Restart the app
pm2 restart Sombhav

# Delete the app from PM2
pm2 delete Sombhav

# Monitor (real-time)
pm2 monit

# Save current process list
pm2 save
```

---

## ⚠️ Common Issues

### Issue 1: "Interpreter bun is NOT AVAILABLE"

**Wrong:**
```bash
pm2 start server.ts --name Sombhav  # ❌ Don't do this
```

**Correct:**
```bash
npm run build
pm2 start dist/server.js --name Sombhav  # ✅ Do this
```

---

### Issue 2: Port Already in Use

If you get "Port 3000 is already in use":

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill

# Or use PM2 to stop
pm2 stop Sombhav
```

---

### Issue 3: Module Not Found After Build

Make sure you ran:
```bash
npm install
npm run build
```

---

### Issue 4: Environment Variables Not Working

1. Make sure `.env` file exists in `/var/www/Sambhav/backend/sombhav_backend/.env`
2. Check file permissions: `chmod 600 .env`
3. Restart PM2: `pm2 restart Sombhav`

---

## 🔍 Verify It's Working

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```
   Should show "Sombhav" as "online"

2. **Check logs:**
   ```bash
   pm2 logs Sombhav
   ```
   Should see: "Server is running on port 3000"

3. **Test API:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

---

## 📝 PM2 Ecosystem File (Advanced - Optional)

Create `ecosystem.config.js` for better PM2 management:

```javascript
module.exports = {
  apps: [{
    name: 'Sombhav',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Then use:
```bash
pm2 start ecosystem.config.js
```

---

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Start | `pm2 start dist/server.js --name Sombhav` |
| Restart | `pm2 restart Sombhav` |
| Stop | `pm2 stop Sombhav` |
| Logs | `pm2 logs Sombhav` |
| Status | `pm2 status` |
| Delete | `pm2 delete Sombhav` |

---

## ✅ Correct .env Configuration for Production

Make sure your `.env` file has:

```env
PORT=3000
NODE_ENV=production

# Use MongoDB Atlas (not local)
DATABASE_URL=mongodb+srv://abdicode22:abdicode22gotocode@cluster0.svxonae.mongodb.net/sombhav?retryWrites=true&w=majority

# Use strong JWT secrets (generate random strings)
JWT_SECRET=<your_secure_secret_here>
JWT_REFRESH_SECRET=<your_different_secure_secret_here>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

See `ENV_CONFIGURATION_GUIDE.md` for more details.

