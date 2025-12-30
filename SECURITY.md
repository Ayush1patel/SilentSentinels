# Security & Privacy Guide - Silent Sentinel

## Emergency Contact Security

### ✅ How Emergency Contacts Are Now Handled

**Before (INSECURE):**
```javascript
// ❌ Hardcoded in source code (server/mcp.js)
const defaultContacts = ["+1234567890", "+0987654321"];
```
- Exposed in git history
- Anyone with code access sees contacts
- Can't change without redeploying

**After (SECURE):**
```env
# ✅ Stored in .env (not committed to git)
EMERGENCY_CONTACTS=+1234567890,+0987654321
```

### Configuration

#### Step 1: Create `.env` file
```bash
cd server
cp .env.example .env
```

#### Step 2: Add Your Contacts
Edit `server/.env`:
```env
ANTHROPIC_API_KEY=sk-your-key-here
EMERGENCY_CONTACTS=+14155552671,+447911123456,+919876543210
```

#### Step 3: Protect the File
Add to `.gitignore`:
```
server/.env
server/.env.local
server/.env.*.local
```

### How MCP Uses Emergency Contacts

When `send_whatsapp_alert` tool is triggered:

```javascript
// 1. Read from .env
const envContacts = process.env.EMERGENCY_CONTACTS
    ? process.env.EMERGENCY_CONTACTS.split(',').map(c => c.trim())
    : [];

// 2. Use provided contacts or fall back to .env
const targetContacts = contacts && contacts.length > 0
    ? contacts
    : envContacts.length > 0
    ? envContacts
    : [];

// 3. If no contacts, log warning
if (targetContacts.length === 0) {
    console.warn("⚠️ No emergency contacts configured");
}
```

---

## API Key Security

### ✅ Best Practices

1. **Create API Key with Limited Scope**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create key for "Silent Sentinel" project only
   - Consider rate limits and budget

2. **Store Securely in .env**
   ```env
   ANTHROPIC_API_KEY=sk-your-key-here
   ```

3. **Never Commit to Git**
   ```bash
   echo "server/.env" >> .gitignore
   git add .gitignore
   ```

4. **Rotate Regularly**
   - Update key every 90 days
   - Revoke old keys in console
   - Update .env with new key

5. **Monitor Usage**
   - Check [Anthropic Console](https://console.anthropic.com/) for usage
   - Set budget alerts
   - Review API logs for suspicious activity

---

## Data Privacy

### 🎵 Audio Processing

**What happens to audio:**
- ✅ Processed entirely on user's device (YAMNet runs locally)
- ✅ Only sound **features** sent to Claude (not raw audio)
- ✅ Features are mathematical representations, not audio

**What is NOT sent:**
- ❌ Raw audio files
- ❌ Personal information
- ❌ Location data (unless explicitly provided by user)

### 📊 Event Logging

**What is logged locally:**
- ✅ Sound classifications (e.g., "Glass" @ 41.4%)
- ✅ Emergency decisions (e.g., "GLASS_BREAK")
- ✅ Timestamps and risk scores
- ✅ Stored in `server/emergency_logs.json`

**Security:**
- File stored locally on device
- Never uploaded unless user explicitly shares
- Can be deleted at any time
- Contains no personally identifiable information

---

## Network Security

### 🔒 HTTPS (Production)

**For Local Development:**
- HTTP on localhost (safe)
- No encryption needed

**For Production/Cloud:**
- Use HTTPS only
- Get SSL certificate (Let's Encrypt is free)
- Use reverse proxy (nginx, Caddy)

**Example with nginx:**
```nginx
server {
    listen 443 ssl;
    server_name sentinel.example.com;

    ssl_certificate /etc/letsencrypt/live/sentinel.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sentinel.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## Environment Variables - Reference

### Required
```env
ANTHROPIC_API_KEY=sk-...           # Anthropic API key
```

### Recommended
```env
EMERGENCY_CONTACTS=+1...,+44...   # Emergency numbers for WhatsApp
PORT=3000                          # Server port
```

### Optional
```env
DEBUG=false                        # Enable debug logging
NODE_ENV=production               # Set to "production" for cloud
```

---

## File Permissions

### Secure File Setup (Linux/Mac)

```bash
# Make .env readable only by owner
chmod 600 server/.env

# Make emergency logs readable only by owner
chmod 600 server/emergency_logs.json

# Verify permissions
ls -la server/.env
# Should show: -rw------- (600)
```

### For Docker/Containers

```dockerfile
# Run as non-root user
RUN useradd -m -u 1000 sentinel
USER sentinel

# Set proper permissions
RUN chmod 600 /app/server/.env
```

---

## Third-Party Integrations

### WhatsApp Alerts

**Current Implementation:**
- ⚠️ Placeholder/mock implementation
- Not actually sending WhatsApp messages

**To Enable Real WhatsApp:**
1. Get Twilio account (www.twilio.com)
2. Add Twilio credentials to `.env`:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+1...
   ```
3. Update `server/mcp.js` to use Twilio SDK
4. Test with real numbers

### Email Alerts (Optional)

To add email alerts:
```env
SENDGRID_API_KEY=SG...
ALERT_EMAIL=emergency@example.com
```

---

## Compliance & Standards

### 🔒 Data Protection

- **GDPR:** Minimal personal data collection
- **HIPAA:** Not certified, not for medical use
- **CCPA:** Compliant (no third-party sharing)

### 📋 Accessibility

- **WCAG 2.1 Level AA:** Designed for accessibility
- **ADA Compliant:** Visual + text alerts
- **Deaf-Friendly:** No audio-only alerts

---

## Security Checklist

Before deploying to production:

- [ ] Create API key in Anthropic console
- [ ] Add API key to `.env` (not in code)
- [ ] Configure emergency contacts in `.env`
- [ ] Add `.env` to `.gitignore`
- [ ] Set file permissions (chmod 600)
- [ ] Set up HTTPS with SSL certificate
- [ ] Enable CORS only for your domain
- [ ] Set strong rate limits on API endpoints
- [ ] Monitor API usage and budget
- [ ] Regular key rotation schedule
- [ ] Test with real emergency scenarios
- [ ] Document contact procedures
- [ ] Have backup communication plan

---

## Incident Response

### If API Key Compromised

1. **Immediately:**
   ```bash
   # Revoke old key in Anthropic Console
   # Generate new key
   # Update .env
   ANTHROPIC_API_KEY=sk-new-key-here
   ```

2. **Review:**
   - Check API usage logs
   - Look for unusual activity
   - Monitor billing

3. **Restart:**
   ```bash
   ./start.sh  # or start.bat
   ```

### If Emergency Contacts Leaked

1. **Notify Contacts:**
   - Inform all contacts of potential exposure
   - Update phone numbers if needed

2. **Update .env:**
   ```env
   EMERGENCY_CONTACTS=+1new...,+1new...
   ```

3. **Restart Service**

---

## Support & Reporting

### Report Security Issues

If you find a security vulnerability:

1. **DO NOT** post publicly
2. **Email** security team (if available)
3. **Include:** Details, steps to reproduce, impact
4. **Wait:** For acknowledgment before disclosing

---

## Resources

- [Anthropic API Security](https://docs.anthropic.com/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/nodejs-security/)
- [Let's Encrypt Free SSL](https://letsencrypt.org/)

---

**Last Updated:** January 2025
**Version:** 1.0.0
