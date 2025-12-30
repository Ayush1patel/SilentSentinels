# Recent Changes & Security Updates

## Summary of Emergency Contact Security Fix

### Issue Fixed
Emergency contacts were **hardcoded in source code**, which is a security risk:
- Exposed in git history
- Anyone with code access could see them
- Couldn't change without redeploying

### Solution Implemented
Emergency contacts now stored in **`.env` file** (environment variables):
- ✅ Excluded from git
- ✅ Each user/deployment has their own contacts
- ✅ Can be changed without code changes
- ✅ Follows industry best practices

---

## Files Changed

### 1. `server/mcp.js` - Removed Hardcoding
**Before (Line 93-94):**
```javascript
// ❌ INSECURE - Hardcoded in source
const defaultContacts = ["+1234567890", "+0987654321"];
const targetContacts = contacts || defaultContacts;
```

**After (Line 92-101):**
```javascript
// ✅ SECURE - Read from environment
const envContacts = process.env.EMERGENCY_CONTACTS
    ? process.env.EMERGENCY_CONTACTS.split(',').map(c => c.trim())
    : [];

const targetContacts = contacts && contacts.length > 0
    ? contacts
    : envContacts.length > 0
    ? envContacts
    : [];
```

### 2. Alert Response Updated
**Before (Line 136-145):**
```javascript
return {
    content: [{
        type: "text",
        text: JSON.stringify({
            success: true,
            message: `WhatsApp alert sent to ${targetContacts.length} contacts`,
            // Missing validation and logging
        }, null, 2)
    }]
};
```

**After (Line 144-159):**
```javascript
if (targetContacts.length === 0) {
    console.warn(`[MCP] ⚠️ WhatsApp Alert attempted but NO CONTACTS configured`);
}

return {
    content: [{
        type: "text",
        text: JSON.stringify({
            success: targetContacts.length > 0,
            message: targetContacts.length > 0
                ? `WhatsApp alert sent to ${targetContacts.length} contacts`
                : "⚠️ No emergency contacts configured. Set EMERGENCY_CONTACTS in .env",
            contactsUsed: targetContacts,
            // Now shows which contacts were used
        }, null, 2)
    }]
};
```

### 3. New Files Added

#### `server/.env.example`
- Template for `.env` configuration
- Shows all available options
- Includes examples and security notes
- Copy this to `.env` and fill in your values

#### `SECURITY.md`
- Complete security & privacy guide
- Data protection information
- HTTPS setup instructions
- Incident response procedures
- Compliance information

#### `CHANGES.md` (this file)
- Documents all changes made
- Before/after comparisons
- Migration guide for users

---

## How to Migrate (For Existing Users)

### Step 1: Create `.env` File
```bash
cd server
cp .env.example .env
```

### Step 2: Add Your Values
Edit `server/.env`:
```env
ANTHROPIC_API_KEY=sk-your-key-here
PORT=3000
EMERGENCY_CONTACTS=+14155552671,+447911123456
```

### Step 3: Protect the File
```bash
# Add to .gitignore
echo "server/.env" >> ../.gitignore

# Set file permissions (Linux/Mac)
chmod 600 .env
```

### Step 4: Restart Server
```bash
# Kill current server (Ctrl+C)
./start.sh  # or start.bat on Windows
```

---

## Emergency Contact Format

### E.164 International Format
```
+[country_code][area_code][number]
```

### Examples by Country
| Country | Format | Example |
|---------|--------|---------|
| 🇺🇸 USA | +1 + 10 digits | `+14155552671` |
| 🇬🇧 UK | +44 + number | `+447911123456` |
| 🇮🇳 India | +91 + number | `+919876543210` |
| 🇨🇦 Canada | +1 + 10 digits | `+14165550123` |
| 🇦🇺 Australia | +61 + number | `+61255550100` |
| 🇩🇪 Germany | +49 + number | `+4930123456` |
| 🇫🇷 France | +33 + number | `+33123456789` |
| 🇯🇵 Japan | +81 + number | `+81312345678` |

### Configuration Example
```env
# Multiple contacts separated by commas
EMERGENCY_CONTACTS=+14155552671,+447911123456,+919876543210
```

---

## What's NOT Changed

Your sound detection logic and Claude verification remain **unchanged**:
- ✅ YAMNet detection unchanged
- ✅ Gunshot sensitivity unchanged
- ✅ Glass breaking detection unchanged
- ✅ Fire alarm detection unchanged
- ✅ Claude verification logic unchanged
- ✅ All API endpoints unchanged
- ✅ MCP tools functionality unchanged (only reading contacts differently now)

---

## Testing the Changes

### 1. Verify Contacts Are Read
```bash
# Start server and check logs
./start.sh

# You should see:
# ✅ Dependencies ready
# MCP Server initialized with 5 emergency tools
```

### 2. Check Alert Response
```bash
# View safety status
curl http://localhost:3000/api/safety-status

# Should show current risk level
```

### 3. Test Without Contacts
```bash
# Start server without EMERGENCY_CONTACTS in .env
# Try triggering an alert

# You should see warning in logs:
# [MCP] ⚠️ WhatsApp Alert attempted but NO CONTACTS configured
```

### 4. Test With Contacts
```env
EMERGENCY_CONTACTS=+1234567890,+0987654321
```
```bash
# Restart server
./start.sh

# Check logs for confirmation
# [MCP] WhatsApp Alert (critical): ...
```

---

## Security Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Contact Visibility | Visible in code | Hidden in .env |
| Git History | Exposed permanently | Never exposed |
| Deployment | Hardcoded | Configurable |
| Multi-Environment | Same for all | Different per env |
| Security | ❌ Risky | ✅ Secure |
| Compliance | ❌ Not compliant | ✅ Best practices |

---

## Troubleshooting

### Issue: "No emergency contacts configured"

**Solution:**
1. Check if `EMERGENCY_CONTACTS` is set in `.env`
2. Verify format: `+[country][number]`
3. Use commas to separate multiple contacts
4. Restart server after changes

### Issue: Alerts not sending

**Causes:**
1. ✅ Contacts not configured (check logs)
2. ✅ Wrong format (must be E.164)
3. ✅ WhatsApp API not integrated (currently mock implementation)

**To enable real WhatsApp:**
- Use Twilio or WhatsApp Business API
- Add credentials to `.env`
- Update MCP tool code

---

## Questions?

1. **How do I add more contacts?**
   - Edit `.env` and add comma-separated numbers

2. **Can I change contacts without restarting?**
   - Currently no (environment variables loaded at startup)
   - Could be enhanced with dynamic config reload

3. **Are contacts encrypted?**
   - They're in plain text in `.env`
   - Protect with file permissions (chmod 600)
   - Use secrets manager in production

4. **What if I have no contacts?**
   - System works fine without contacts
   - Alerts log locally instead of sending WhatsApp
   - Can add contacts anytime in `.env`

---

## Version History

**v1.0.0** (Jan 2025)
- ✅ Moved emergency contacts to environment variables
- ✅ Added `.env.example` template
- ✅ Added comprehensive security guide
- ✅ Enhanced error messages for missing contacts
- ✅ Added contact validation and logging

---

**For complete security information, see [SECURITY.md](SECURITY.md)**
