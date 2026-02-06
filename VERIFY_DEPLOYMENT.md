# Verify Your Deployment is Working

## ✅ Your Backend is Running!

PM2 shows your server is **online**. Now let's verify it's working correctly.

---

## 1. Check Server Logs

```bash
pm2 logs Sombhav
```
**Look for:**
- ✅ `MongoDB connected successfully`
- ✅ `Server is running on port 3000 in production mode` (or similar)
- ❌ Any error messages

---

## 2. Test the Health Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T...",
  "uptime": ...
}
```

---

## 3. Test from Outside the Server

If your server has a public IP or domain:

```bash
curl http://YOUR_SERVER_IP:3000/api/v1/health
```

**Or from your browser:**
```
http://YOUR_SERVER_IP:3000/api/v1/health
```

---

## 4. Check MongoDB Connection

The logs should show:
```
MongoDB connected successfully
```

If you see connection errors:
- Check your `.env` file has correct `DATABASE_URL`
- Verify MongoDB Atlas IP whitelist includes your server IP
- Check MongoDB Atlas cluster is running

---

## 5. Monitor PM2 Status

```bash
# View current status
pm2 status

# Monitor in real-time
pm2 monit

# View detailed info
pm2 show Sombhav
```

---

## 6. Useful PM2 Commands

```bash
# Restart after code changes
pm2 restart Sombhav

# Stop the server
pm2 stop Sombhav

# Delete from PM2 (if needed)
pm2 delete Sombhav

# Save current process list
pm2 save

# Setup auto-start on server reboot
pm2 startup
# (Follow the instructions it prints)
```

---

## 🔍 Troubleshooting

### Issue: Server not responding

1. **Check logs:**
   ```bash
   pm2 logs Sombhav
   ```

2. **Check if port is in use:**
   ```bash
   lsof -i:3000
   ```

3. **Verify .env configuration:**
   ```bash
   cd /var/www/Sambhav/backend/sombhav_backend
   cat .env
   ```

### Issue: MongoDB connection failed

1. **Check DATABASE_URL in .env:**
   ```env
   DATABASE_URL=mongodb+srv://abdicode22:abdicode22gotocode@cluster0.svxonae.mongodb.net/sombhav?retryWrites=true&w=majority
   ```

2. **Make sure MongoDB Atlas IP whitelist includes:**
   - Your server's IP address
   - Or `0.0.0.0/0` (allow all - less secure)

3. **Restart PM2 after .env changes:**
   ```bash
   pm2 restart Sombhav
   ```

---

## ✅ Success Checklist

- [ ] PM2 shows "online" status
- [ ] Logs show "MongoDB connected successfully"
- [ ] Health endpoint returns 200 OK
- [ ] Server responds on port 3000
- [ ] PM2 saved and auto-start configured (optional)

---

## 🚀 Next Steps

1. **Configure your domain** (if you have one) to point to your server IP
2. **Set up Nginx reverse proxy** (recommended for production)
3. **Configure SSL/HTTPS** with Let's Encrypt
4. **Update your Flutter app** to use the production backend URL

---

## 📝 Example Nginx Configuration (Optional)

If you want to use a domain name instead of IP:port:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then you can access: `http://your-domain.com/api/v1/health`

