# Device Sync & Google Fit Integration Changes

**Date:** February 8, 2026  
**Branch:** Yash2  
**Purpose:** Fix device data ingestion to display real Google Fit data instead of mock data

---

## Summary

This document outlines all changes made to fix the device sync functionality, ensuring that step count, heart rate, sleep, and activity data are fetched from the real Google Fit API instead of using mock/placeholder data.

---

## Environment Variables

### Required Keys (`.env`)

```env
# ==============================================================
# DEVICE SYNC - Wearable Integration
# ==============================================================
# Patient Portal URL for OAuth redirects
PATIENT_PORTAL_URL=http://localhost:5174

# Fitbit API Credentials (leave empty for demo mode)
# Get credentials from https://dev.fitbit.com/apps
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=

# Google Fit API Credentials (leave empty for demo mode)
# Get credentials from https://console.cloud.google.com/apis/credentials
GOOGLE_FIT_CLIENT_ID=your_google_fit_client_id
GOOGLE_FIT_CLIENT_SECRET=your_google_fit_client_secret
```

### Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Enable the **Fitness API**
4. Add authorized redirect URIs: `http://localhost:5001/api/v1/patient/devices/callback/google_fit`

---

## Files Modified

### 1. `hospital-his-backend/services/providers/googleFit.provider.js`

#### Changes Made:
- **Added SLEEP data type constants** for both derived and generic data sources
- **Added debug logging** throughout all data fetching functions
- **Fixed data fetching order** - Now tries generic data types FIRST (more reliable), then falls back to derived sources
- **Implemented real sleep data fetching** using Google Fit Sessions API (activity type 72)
- **Token refresh awareness** - Better error handling for expired tokens

#### Key Functions Modified:

| Function | Change |
|----------|--------|
| `fetchActivityData` | Added debug logging, already uses real API |
| `fetchHeartRateData` | Changed to try generic type first, then derived |
| `fetchSleepData` | Completely rewritten to use Sessions API first, then aggregate API |
| `getValueFromResponse` | Swapped order to try generic type FIRST |
| `fetchAggregateData` | Added detailed request/response logging |

#### Data Sources Added:
```javascript
// Added to DATA_SOURCES
SLEEP: 'derived:com.google.sleep.segment:com.google.android.gms:merged'

// Added to DATA_TYPES  
SLEEP: 'com.google.sleep.segment'
```

---

### 2. `hospital-his-backend/services/deviceSync.service.js`

#### Changes Made:
- **Automatic token refresh** - Checks if OAuth token is expired and refreshes automatically
- **Fixed heart rate value selection** - Uses `current` instead of `restingHeartRate` to match phone display
- **Added comprehensive debug logging** for sync operations
- **Token expiry tracking** - Now includes `tokens.expiresAt` in database queries

#### Key Functions Modified:

| Function | Change |
|----------|--------|
| `syncDevice` | Added token refresh logic before fetching data |
| `convertToSignals` | Fixed heart rate to use `current` value first |
| `getLatestSyncedData` | Added debug logging to trace data retrieval |

#### Token Refresh Logic:
```javascript
// Checks if token is expired or about to expire (5 minute buffer)
const tokenExpired = !expiresAt || new Date(expiresAt) < new Date(now.getTime() + 5 * 60 * 1000);

if (tokenExpired && refreshToken && provider.refreshAccessToken) {
    const newTokens = await provider.refreshAccessToken(refreshToken);
    // Updates device with new tokens
}
```

---

### 3. `patient-portal/src/pages/DeviceSync.jsx`

#### Changes Made:
- **Removed Apple Watch and Garmin** from the supported devices list (UI only change)

---

### 4. `hospital-his-backend/scripts/seedPredictiveData.js`

#### Changes Made (for predictive data seeding):
- Fixed `gender` value to use proper capitalization (`'Male'` instead of `'male'`)
- Removed non-existent `source` field from vitals
- Fixed `symptom.duration` structure to match Signal schema
- Fixed `lifestyle` data structure (using `sleep: { duration, quality }`)
- Removed `triggers` field from mood data

---

## Bug Fixes

### Issue 1: Steps showing as `0` or `--`
**Root Cause:** OAuth access token expired; derived data sources not returning data  
**Fix:** 
- Added automatic token refresh before sync
- Changed to use generic data types first (more reliable)

### Issue 2: Heart rate showing `75` instead of `80` (phone shows 80)
**Root Cause:** Code was using `restingHeartRate` (HR - 5) instead of `current`  
**Fix:** Changed priority in `convertToSignals` to use `current` first

### Issue 3: Sleep showing mock data
**Root Cause:** Aggregate API doesn't reliably return sleep data  
**Fix:** 
- Implemented Sessions API call first (`activityType=72`)
- Falls back to aggregate API if sessions empty

### Issue 4: Token expiry not tracked
**Root Cause:** `expiresAt` field not included in database query  
**Fix:** Added `+tokens.expiresAt` to the select query

---

## Debug Logging Added

All debug logs use the prefix `[GoogleFit DEBUG]` or `[DeviceSync DEBUG]` for easy filtering:

```bash
# Filter Google Fit logs
grep "[GoogleFit DEBUG]" logs/combined.log

# Filter Device Sync logs  
grep "[DeviceSync DEBUG]" logs/combined.log
```

### Log Examples:
```
[GoogleFit DEBUG] fetchAllData called
[GoogleFit DEBUG] accessToken: ya29.a0AXooCgt...
[GoogleFit DEBUG] Fetching REAL heart rate data...
[GoogleFit DEBUG] Generic heart rate result: 80
[GoogleFit DEBUG] Returning REAL heart rate: 80
[DeviceSync DEBUG] Token expired/unknown: true
[DeviceSync DEBUG] Token refreshed successfully! New expiry: 2026-02-08T14:00:00.000Z
```

---

## Data Flow (After Fixes)

```
1. Patient clicks "Sync" on Device page
2. Backend checks if token is expired
3. If expired → Refresh token using refresh_token
4. Fetch data from Google Fit:
   - Activity: Steps, Calories, Active Minutes, Distance
   - Heart Rate: Current BPM
   - Sleep: Sessions API first, then Aggregate API
5. Convert to Signal records
6. Save to MongoDB
7. Return updated vitals to frontend
```

---

## Testing Checklist

- [ ] Steps display matches Google Fit app
- [ ] Heart rate display matches Google Fit app  
- [ ] Sleep data displays (if tracked in Google Fit)
- [ ] Activity minutes display correctly
- [ ] Token refresh works when token expires
- [ ] Sync button triggers data update
- [ ] No mock data when API credentials are configured

---

## OAuth Scopes Required

The following scopes are requested during Google Fit OAuth:

```javascript
scopes: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.location.read',
]
```

---

## Known Limitations

1. **Sleep data requires user to track sleep** - If user doesn't use a sleep tracking app/device, no data will be available
2. **Activity data is daily** - Historical data requires separate API calls
3. **Token refresh requires valid refresh_token** - If refresh fails, user must reconnect device

---

## Merge Instructions

1. Review all changes in this branch (`Yash2`)
2. Ensure `.env` has Google Fit credentials configured
3. Test device sync functionality
4. Merge to main branch
5. Remove debug logging if not needed in production (search for `[GoogleFit DEBUG]` and `[DeviceSync DEBUG]`)

---

## Related Files Quick Reference

| File | Purpose |
|------|---------|
| `services/providers/googleFit.provider.js` | Google Fit API integration |
| `services/deviceSync.service.js` | Device sync orchestration |
| `models/DeviceConnection.js` | Device connection schema |
| `models/Signal.js` | Health signal schema |
| `routes/patient/device.routes.js` | API routes for devices |
| `controllers/patient/device.controller.js` | API controllers |
| `patient-portal/src/pages/DeviceSync.jsx` | Frontend device page |

---

## 🚀 Deployment Guide - Google Cloud Console Changes

When deploying to production, you'll need to update the following in Google Cloud Console:

### 1. Redirect URIs

In [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials):

| Environment | Redirect URI |
|-------------|--------------|
| **Local (Current)** | `http://localhost:5001/api/v1/patient/devices/callback/google_fit` |
| **Production** | `https://your-domain.com/api/v1/patient/devices/callback/google_fit` |

**Steps:**
1. Go to your OAuth 2.0 Client ID
2. Click "Edit"
3. Under **Authorized redirect URIs**, add your production URL
4. Save

---

### 2. Authorized JavaScript Origins

| Environment | Origin |
|-------------|--------|
| **Local** | `http://localhost:5174` |
| **Production** | `https://your-domain.com` |

---

### 3. Test Users vs Production Mode

Currently, your app is likely in **"Testing"** mode, which limits access to only approved test users.

| Status | What to do |
|--------|------------|
| **Testing Mode** | Only test emails you added can use the app |
| **Production Mode** | Anyone can use the app (requires Google verification) |

**To add test users:**
1. Go to **OAuth consent screen**
2. Scroll to **Test users**
3. Add email addresses of people who need to test

**To publish (go live):**
1. Go to **OAuth consent screen**
2. Click **"Publish App"**
3. If using sensitive scopes (like fitness.sleep.read), you'll need Google verification

---

### 4. Production Environment Variables

Update your `.env` on the production server:

```env
# Production URLs
PATIENT_PORTAL_URL=https://your-patient-portal.com
BACKEND_URL=https://your-backend-api.com

# Same credentials (unless you create separate prod credentials)
GOOGLE_FIT_CLIENT_ID=your_client_id
GOOGLE_FIT_CLIENT_SECRET=your_client_secret
```

---

### 5. OAuth Scopes Verification Status

Some scopes require Google verification before production:

| Scope | Verification Required? |
|-------|----------------------|
| `fitness.activity.read` | ⚠️ Sensitive - needs verification |
| `fitness.heart_rate.read` | ⚠️ Sensitive - needs verification |
| `fitness.sleep.read` | ⚠️ Sensitive - needs verification |
| `fitness.body.read` | ⚠️ Sensitive - needs verification |
| `fitness.location.read` | ⚠️ Sensitive - needs verification |

**If verification is required:**
1. Submit your app for review in OAuth consent screen
2. Provide privacy policy URL
3. Explain why you need each scope
4. Wait for Google approval (can take 1-6 weeks)

---

### Deployment Checklist

- [ ] Add production redirect URI in Google Cloud Console
- [ ] Add production JavaScript origin (if needed)
- [ ] Add test users OR publish app for production
- [ ] Update `.env` with production URLs
- [ ] Submit for Google verification (if using sensitive scopes)
- [ ] Test OAuth flow on production environment
- [ ] Verify data sync works with production credentials

---

*Document created: February 8, 2026*
