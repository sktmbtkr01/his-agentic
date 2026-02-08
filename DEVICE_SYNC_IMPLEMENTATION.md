# Phase 3: Device Sync Implementation Summary

## Overview

Phase 3 of the Wellness Agent implements wearable device synchronization, enabling patients to connect fitness trackers like Fitbit and Google Fit to automatically sync health data (heart rate, steps, sleep, activity) to their LifelineX patient portal.

## Features Implemented

### 3.1 Device Sync Service (Backend)

| Component | File | Description |
|-----------|------|-------------|
| **DeviceConnection Model** | `models/DeviceConnection.js` | MongoDB schema for storing device OAuth tokens, sync status, and configuration |
| **Fitbit Provider** | `services/providers/fitbit.provider.js` | Fitbit-specific OAuth and API integration with mock data fallback |
| **Google Fit Provider** | `services/providers/googleFit.provider.js` | Google Fit OAuth and API integration with mock data fallback |
| **Device Sync Service** | `services/deviceSync.service.js` | Core orchestration for device connections and data sync |
| **Scheduler Service** | `services/deviceSyncScheduler.service.js` | Background hourly sync using node-cron |
| **Device Controller** | `controllers/patient/device.controller.js` | API endpoint handlers |
| **Device Routes** | `routes/patient/device.routes.js` | REST API routes |

### 3.2 Fitbit Integration

**OAuth 2.0 Flow:**
- Authorization URL generation
- Token exchange and storage
- Token refresh handling

**Data Types Synced:**
- Heart rate (resting + current)
- Steps (daily count)
- Sleep (duration + quality + stages)
- Activity (active minutes, calories burned)

**Demo Mode:**
- Automatically enabled when `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET` are not set
- Generates realistic mock data for all vital types
- Allows full testing without real Fitbit API credentials

### 3.2.1 Google Fit Integration

**OAuth 2.0 Flow:**
- Google OAuth consent flow
- Token exchange and secure storage
- Token refresh handling

**Data Types Synced:**
- Steps (daily aggregate)
- Heart rate (average BPM)
- Calories burned
- Active minutes
- Distance

**Demo Mode:**
- Automatically enabled when `GOOGLE_FIT_CLIENT_ID` and `GOOGLE_FIT_CLIENT_SECRET` are not set
- Generates realistic mock data similar to Fitbit
- Allows full testing without real Google API credentials

### 3.3 Real-time Vitals Display (Frontend)

| Component | File | Description |
|-----------|------|-------------|
| **Device Service** | `services/deviceService.js` | API client for device management |
| **VitalsDisplay** | `components/device/VitalsDisplay.jsx` | Real-time vitals widget with elegant cards |
| **DeviceSyncPanel** | `components/device/DeviceSyncPanel.jsx` | Device management modal for connect/disconnect/sync |
| **DeviceSync Page** | `pages/DeviceSync.jsx` | Full device management page |
| **Dashboard Integration** | Updated `pages/Dashboard.jsx` | Real vitals data replaces mock cards |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/patient/devices` | Get connected devices |
| `GET` | `/api/v1/patient/devices/providers` | Get available providers |
| `GET` | `/api/v1/patient/devices/vitals` | Get latest synced vitals |
| `POST` | `/api/v1/patient/devices/connect` | Connect a new device |
| `POST` | `/api/v1/patient/devices/:deviceId/sync` | Trigger manual sync |
| `DELETE` | `/api/v1/patient/devices/:deviceId` | Disconnect a device |
| `GET` | `/api/v1/patient/devices/callback/:provider` | OAuth callback handler |

## Background Sync Schedule

- **Frequency:** Every hour (at minute 0)
- **Timezone:** Asia/Kolkata (IST)
- **Startup:** Initial sync check 10 seconds after server start
- **Scheduler:** Uses `node-cron` for reliable scheduling

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Fitbit API    │────▶│  Fitbit Provider │────▶│  Device Sync    │
│ (or Demo Mode)  │     │  (OAuth + Fetch) │     │    Service      │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Signal Model   │◀────│  Convert to      │◀────│  Sync Device    │
│ (source: sync)  │     │  Signal Schema   │     │   (hourly job)  │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Patient Portal Frontend                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Dashboard   │  │  DeviceSync   │  │VitalsDisplay  │        │
│  │  (vitals UI)  │  │    Page       │  │  Component    │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

Add to `.env`:

```env
# Device Sync - Wearable Integration
PATIENT_PORTAL_URL=http://localhost:5173

# Fitbit API Credentials (leave empty for demo mode)
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=

# Google Fit API Credentials (leave empty for demo mode)
GOOGLE_FIT_CLIENT_ID=
GOOGLE_FIT_CLIENT_SECRET=
```

## Testing

### Demo Mode Testing
1. Start backend server: `npm run dev`
2. Start patient portal: `npm run dev`
3. Login as a patient
4. Navigate to Dashboard - see "Connect a Wearable" prompt
5. Click to connect Demo Wearable
6. View synced vitals on Dashboard and `/devices` page
7. Manual sync available via refresh button

### With Real Fitbit API
1. Create Fitbit Developer App at https://dev.fitbit.com/apps
2. Set OAuth 2.0 Redirect URI to: `http://localhost:5001/api/v1/patient/devices/callback/fitbit`
3. Add credentials to `.env`
4. Restart backend
5. Connect Fitbit via patient portal
6. Real device data will sync automatically

### With Real Google Fit API
1. Create a project in Google Cloud Console: https://console.cloud.google.com/
2. Enable the Fitness API
3. Create OAuth 2.0 credentials (Web application)
4. Set Authorized redirect URI to: `http://localhost:5001/api/v1/patient/devices/callback/google_fit`
5. Add credentials to `.env`
6. Restart backend
7. Connect Google Fit via patient portal
8. Real device data will sync automatically

## Dependencies Added

- `node-cron` - For scheduling hourly background sync

## Next Steps (Phase 4)

The device sync data can now be used for:
- **4.1 Trend Analysis Service** - Analyze patterns in synced vitals over time
- **4.2 Anomaly Detection** - Detect unusual patterns in heart rate, sleep, activity
- **4.3 Proactive Alerts UI** - Notify patients of detected anomalies

---

*Implementation completed: Feb 7, 2026*
