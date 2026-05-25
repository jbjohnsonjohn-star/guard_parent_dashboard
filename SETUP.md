# G.U.A.R.D. Parent Dashboard - Setup Guide

## Overview

The G.U.A.R.D. (Guardian, Universal, Alert, Response, Dashboard) parent dashboard is a comprehensive child safety monitoring system that enables parents to:

- Monitor multiple smartwatches in real-time
- Receive instant alerts for critical events (SOS, low battery, offline status)
- Track location and telemetry data
- Manage emergency contacts and settings
- Access alert history and device telemetry

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- (Optional) Twilio account for SMS/WhatsApp notifications

## Installation

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/mfx777562-ui/guard_parent_dashboard.git
cd guard_parent_dashboard
pnpm install
```

### 2. Database Setup

```bash
# Run Prisma migrations
pnpm prisma migrate dev

# (Optional) Seed sample data
pnpm prisma db seed
```

### 3. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/guard_dashboard

# Twilio (Optional - for SMS/WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key-here
```

See `.env.example` for all available options.

### 4. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Features

### Authentication
- User registration with name, email, and phone number
- Secure password hashing with bcrypt
- JWT-based session management
- Protected dashboard routes

### Watch Management
- Add and manage multiple child smartwatches
- Real-time status monitoring
- Battery level tracking
- Watch pairing and deletion

### Alert System
- **Alert Types**: SOS, Low Battery, Offline, Geofence Breach, Unknown Contact
- **Severity Levels**: Low, Medium, High, Critical
- **Visual Indicators**: 
  - Green status badge for online devices
  - Amber for low battery
  - Red for offline
  - Orange pulsing border for critical alerts
- **Notifications**:
  - Browser push notifications (Notification API)
  - Alarm sounds via Web Audio API
  - SMS/WhatsApp via Twilio (optional)
  - Fallback to console.log in development

### Telemetry & History
- Battery level history
- Location tracking
- Signal strength monitoring
- Historical alert log
- Detailed device statistics

### Settings Management
- Update profile (name, phone)
- Manage connected watches
- Configure notification preferences
- View device pairing codes

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Watches
- `GET /api/watches` - Get all user watches
- `POST /api/watches` - Add new watch
- `PATCH /api/watches/:id` - Update watch
- `DELETE /api/watches/:id` - Remove watch

### Alerts
- `GET /api/alerts` - Get alerts for user
- `POST /api/alerts` - Create new alert
- `PATCH /api/alerts/:id` - Update alert (resolve)
- `POST /api/alerts/notify` - Send notifications

### Telemetry
- `GET /api/telemetry` - Get telemetry logs
- `POST /api/telemetry` - Log telemetry data

## Database Schema

### User
```
- id (String, PK)
- email (String, unique)
- passwordHash (String)
- name (String, optional)
- phone (String, optional)
- createdAt (DateTime)
```

### Watch
```
- id (String, PK)
- watchId (String, unique)
- name (String)
- status (String) - online, offline, low_battery, critical
- batteryLevel (Int)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### UserWatch (Junction)
```
- id (String, PK)
- userId (String, FK)
- watchId (String, FK)
- createdAt (DateTime)
```

### Alert
```
- id (String, PK)
- userId (String, FK)
- watchId (String, FK)
- type (String) - sos, low_battery, offline, geofence_breach, unknown_contact
- severity (String) - low, medium, high, critical
- message (String)
- isResolved (Boolean)
- resolvedAt (DateTime, optional)
- notifiedAt (DateTime)
- createdAt (DateTime)
```

### TelemetryLog
```
- id (String, PK)
- userId (String, FK)
- watchId (String, FK)
- batteryLevel (Int)
- location (String, optional)
- signalStrength (Int, optional)
- timestamp (DateTime)
```

## Browser Compatibility

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Notification Support
- Notification API: All modern browsers
- Web Audio API: All modern browsers
- Twilio SMS: Requires server integration

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network connectivity

### Notifications Not Working
- Verify browser notification permission granted
- Check console for JavaScript errors
- Ensure Twilio env vars are set (for SMS)

### Watch Not Appearing
- Verify watch was properly paired
- Check database for watch record
- Clear browser cache and reload

## Development

### Project Structure
```
/vercel/share/v0-project/
├── app/
│   ├── api/              # API routes
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Dashboard
├── components/           # React components
├── hooks/                # Custom hooks
├── lib/                  # Utilities
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

### Adding New Features
1. Update Prisma schema if needed
2. Run migration: `pnpm prisma migrate dev`
3. Create API routes in `/app/api`
4. Create components in `/components`
5. Add hooks if needed in `/hooks`
6. Update dashboard to use new features

## Deployment

### To Vercel
```bash
# Connect repository
vercel link

# Deploy
vercel
```

### Environment Variables on Vercel
Set all `.env.local` variables in Vercel project settings:
1. Go to Settings → Environment Variables
2. Add each variable
3. Redeploy

## Support & Issues

For bugs or feature requests, open an issue on GitHub:
https://github.com/mfx777562-ui/guard_parent_dashboard/issues

## License

MIT
