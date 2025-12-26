# 🔧 Troubleshooting Login Issues

## Problem: Login fails with "connexion echoue" (connection failed)

### ✅ Admin User Status

The admin user **exists and is correctly configured** in the database:
- **Phone**: `0611`
- **PIN**: `1234`
- **Status**: Active ✅
- **PIN Verification**: ✅ MATCH

### 🔍 Common Causes

#### 1. API Server Not Running

The most common issue is that the API server is not running.

**Check if API is running:**
```bash
# Check if port 3001 is in use
lsof -i :3001

# Or check Docker containers
docker ps | grep pos_api
```

**Start the API server:**
```bash
cd src/system-pos/apps/api
npm run dev
```

The API should be accessible at: `http://localhost:3001`

#### 2. Wrong API URL in Mobile App

The mobile app is configured to use: `http://192.168.2.15:3001/api`

**Check your local IP address:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or
ipconfig getifaddr en0  # macOS
```

**Update the API URL** in `src/system-pos/apps/mobile/src/lib/api.ts`:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3001/api';
```

Or set environment variable:
```bash
export EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001/api
```

#### 3. Network Connectivity Issues

- Ensure your mobile device and computer are on the **same WiFi network**
- Check firewall settings (port 3001 should be accessible)
- Try accessing `http://YOUR_IP:3001/api/health` from your mobile browser

#### 4. Database Connection Issues

**Verify database is running:**
```bash
docker ps | grep pos_postgres
```

**Check database connection:**
```bash
cd src/system-pos/apps/api
npx tsx scripts/check-admin-login.ts
```

#### 5. Admin User Not Created

If admin user doesn't exist, create it:

```bash
cd src/system-pos/apps/api
npm run db:seed
```

Or manually check/fix:
```bash
npx tsx scripts/check-admin-login.ts
```

### 🧪 Testing Steps

1. **Test database directly:**
   ```bash
   cd src/system-pos/apps/api
   npx tsx scripts/check-admin-login.ts
   ```
   Should show: ✅ Can Login: YES

2. **Test API endpoint:**
   ```bash
   # Start API server first
   cd src/system-pos/apps/api
   npm run dev
   
   # In another terminal
   npx tsx scripts/test-admin-login-api.ts
   ```

3. **Test from mobile app:**
   - Open mobile app
   - Enter phone: `0611`
   - Enter PIN: `1234`
   - Check console logs for error messages

### 📋 Quick Fix Checklist

- [ ] API server is running (`npm run dev` in `apps/api`)
- [ ] Database is running (`docker ps` shows `pos_postgres`)
- [ ] API URL in mobile app matches your local IP
- [ ] Mobile device and computer are on same WiFi network
- [ ] Admin user exists (run `check-admin-login.ts`)
- [ ] Port 3001 is not blocked by firewall

### 🔧 Diagnostic Scripts

Located in `src/system-pos/apps/api/scripts/`:

- `check-admin-login.ts` - Verify admin user exists and PIN is correct
- `test-admin-login-api.ts` - Test login via HTTP API
- `test-simplified-login.ts` - Test login logic directly

### 📞 Still Having Issues?

1. Check API server logs for errors
2. Check mobile app console logs
3. Verify network connectivity
4. Try accessing API health endpoint from mobile browser

