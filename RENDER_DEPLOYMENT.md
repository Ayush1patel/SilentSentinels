# Deploying Silent Sentinel to Render

This guide walks you through deploying your Silent Sentinel project on Render.

## Prerequisites

- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
- Emergency contact phone numbers in E.164 format (e.g., +1234567890)

---

## Step 1: Push to GitHub (Already Done)

Your repository is already on GitHub at:
```
https://github.com/Ayush1patel/SilentSentinels
```

If you make any changes, push them with:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## Step 2: Deploy on Render

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** button → Select **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if first time
   - Search for **"SilentSentinels"** repository
   - Click **"Connect"**

### 2.2 Configure Web Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `silent-sentinel` (or your choice) |
| **Region** | Choose closest to your users (e.g., Oregon, Ohio) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && node server.js` |
| **Plan** | `Free` (or paid for production) |

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Your actual API key from Anthropic (click lock icon to keep secret) |
| `PORT` | `10000` | Render assigns this automatically |
| `NODE_ENV` | `production` | Sets production mode |
| `EMERGENCY_CONTACTS` | `+1234567890,+0987654321` | Comma-separated phone numbers in E.164 format |

**Important:** Click the lock icon 🔒 next to `ANTHROPIC_API_KEY` to keep it secret.

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying your app
3. Wait 2-5 minutes for deployment to complete

---

## Step 3: Verify Deployment

### 3.1 Check Deployment Status

1. Watch the **Logs** tab in Render dashboard
2. Look for:
   ```
   🚀 Server running on port 10000
   👉 Open http://localhost:10000 to view the app
   ```

### 3.2 Get Your App URL

- Your app will be available at: `https://silent-sentinel-XXXX.onrender.com`
- Find it at the top of your Render service page

### 3.3 Test the Application

1. **Open the app URL** in your browser
2. **Allow microphone permissions** when prompted
3. **Test API endpoints:**

```bash
# Replace XXXX with your actual Render subdomain
YOUR_URL="https://silent-sentinel-XXXX.onrender.com"

# Check safety status
curl $YOUR_URL/api/safety-status

# View available tools
curl $YOUR_URL/api/tools

# View emergency logs
curl $YOUR_URL/api/emergency-logs
```

---

## Step 4: Configure Health Checks (Optional but Recommended)

Render uses the health check endpoint defined in `render.yaml`:

- **Health Check Path:** `/api/safety-status`
- **Expected Status:** `200 OK`

This ensures Render knows your app is running correctly.

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain

1. Go to your service → **Settings** tab
2. Scroll to **Custom Domain**
3. Click **"Add Custom Domain"**
4. Enter your domain: `sentinel.yourdomain.com`

### 5.2 Configure DNS

Add a CNAME record in your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | `sentinel` | `silent-sentinel-XXXX.onrender.com` |

Wait 10-60 minutes for DNS propagation.

---

## Free Tier Limitations

Render Free tier has some limitations:

| Feature | Free Tier | Notes |
|---------|-----------|-------|
| **Spin down** | After 15 min inactivity | First request after spin-down takes 30-60s |
| **Build minutes** | 500 min/month | Usually enough for small projects |
| **Bandwidth** | 100 GB/month | Sufficient for most use cases |
| **Custom domains** | Yes | Free SSL included |

**Recommendation:** For production use with 24/7 uptime, upgrade to a paid plan ($7/month).

---

## Monitoring & Maintenance

### View Logs
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Monitor real-time logs for errors or issues

### Update Environment Variables
1. Go to **"Environment"** tab
2. Edit variables
3. Service will auto-redeploy

### Manual Deploy
1. Go to **"Manual Deploy"** dropdown
2. Click **"Deploy latest commit"**
3. Or select a specific branch/commit

### Auto-Deploy
By default, Render auto-deploys when you push to `main` branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
Render will automatically rebuild and redeploy.

---

## Troubleshooting

### Build Fails

**Error:** `npm install` fails
- Check Node version in logs
- Ensure `package.json` has correct dependencies
- Try clearing build cache: Settings → "Clear build cache & deploy"

### App Crashes on Start

**Error:** Application logs show crash
- Check environment variables are set correctly
- Verify `ANTHROPIC_API_KEY` is valid
- Check logs for specific error messages

### 502 Bad Gateway

**Cause:** App not responding on PORT
- Ensure your server uses `process.env.PORT`
- Check server.js line 231 uses `process.env.PORT || 3000`

### Microphone Not Working

**Cause:** HTTPS required for microphone access
- Render provides automatic HTTPS
- Make sure you're using `https://` not `http://`

### Slow First Load

**Cause:** Free tier spins down after inactivity
- Wait 30-60 seconds for first load after inactivity
- Upgrade to paid tier for 24/7 uptime

---

## Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore`
   - Use Render environment variables

2. **Rotate API keys regularly**
   - Update in Render dashboard
   - Service will auto-restart

3. **Use secret environment variables**
   - Lock icon in Render for sensitive data
   - Prevents exposure in logs

4. **Monitor emergency logs**
   - Check `/api/emergency-logs` regularly
   - Review for suspicious activity

---

## Updating Your Deployment

### Option 1: Automatic (Recommended)
Push changes to GitHub:
```bash
git add .
git commit -m "Your update message"
git push origin main
```
Render will auto-deploy within 2-3 minutes.

### Option 2: Manual
1. Push to a different branch
2. In Render dashboard: Manual Deploy → Select branch
3. Click "Deploy"

---

## Cost Estimates

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/month | 750 hrs/month, spins down, 500 build min |
| **Starter** | $7/month | Always on, 500 build min, no spin down |
| **Standard** | $25/month | 1000 build min, priority support |

For Silent Sentinel, **Starter plan ($7/month)** is recommended for production use.

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com/
- **Community Forum:** https://community.render.com/
- **Your GitHub Repo:** https://github.com/Ayush1patel/SilentSentinels

---

## Quick Reference

**Your GitHub Repository:**
```
https://github.com/Ayush1patel/SilentSentinels
```

**Render Dashboard:**
```
https://dashboard.render.com/
```

**Key Endpoints (after deployment):**
- Main App: `https://your-app.onrender.com/`
- Safety Status: `https://your-app.onrender.com/api/safety-status`
- Emergency Logs: `https://your-app.onrender.com/api/emergency-logs`
- Tools List: `https://your-app.onrender.com/api/tools`

**Configuration Files:**
- `render.yaml` - Render deployment config
- `server/package.json` - Node.js configuration
- `.gitignore` - Ignored files

---

## Next Steps

After successful deployment:

1. ✅ Test all emergency sound detections
2. ✅ Verify WhatsApp alerts work (if configured)
3. ✅ Share app URL with users
4. ✅ Monitor logs for first 24 hours
5. ✅ Set up custom domain (optional)
6. ✅ Consider upgrading to paid plan for production

Happy deploying! 🚀
