# G.U.A.R.D. Parent Dashboard - Features

## Overview
The G.U.A.R.D. (Geolocation, Ultra-Awareness, Reporting, Dedicated) parent dashboard is a comprehensive child monitoring system built with Next.js, featuring real-time device tracking, alert management, and instant notifications.

## Core Features

### 1. **Watch Management**
- Add multiple child watches to your account
- Real-time status monitoring (online, offline, low battery, critical)
- Battery level tracking with visual indicators
- Watch-specific device history and telemetry

**Status Indicators:**
- 🟢 **Online**: Watch is connected and responding normally
- ⚫ **Offline**: Watch is not connected to the network
- 🟡 **Low Battery**: Battery level below 30%
- 🔴 **Critical**: Battery level below 10% (pulsing border alert)

### 2. **Alert System**
Comprehensive alert management with multiple severity levels:

**Alert Types:**
- `sos` - SOS/emergency signal from child
- `low_battery` - Watch battery running low
- `offline` - Watch lost connection
- `geofence_breach` - Child left safe zone
- `unknown_contact` - Unauthorized contact attempt
- Custom alert messages

**Severity Levels:**
- **Low** - Informational alerts
- **Medium** - Standard alerts requiring attention
- **High** - Important alerts requiring quick response
- **Critical** - Urgent alerts with pulsing visual indicator

**Features:**
- Alert history with timestamps
- Mark alerts as resolved
- Trigger notifications for unresolved alerts
- Real-time alert feed with filtering
- Audio alarm generation for critical alerts

### 3. **Notification System**

#### Browser Notifications
- Push notifications for all alert types
- Non-intrusive warnings for low/medium severity
- Persistent notifications for critical alerts
- System sound integration

#### SMS/WhatsApp Notifications (Optional)
- Send alerts via Twilio SMS
- WhatsApp message support (requires Twilio setup)
- Fallback to console logging in development mode
- Phone number stored in user profile

#### Audio Alerts
- Web Audio API alarm generation
- Configurable frequency and duration
- Pulsing sound effect for critical alerts
- 5-second duration for critical warnings

### 4. **Telemetry & History**
Track device health and performance:

**Collected Metrics:**
- Battery level (real-time)
- GPS location (if available)
- Signal strength
- Timestamp of each reading

**History Features:**
- View 24h, 7d, or 30d history
- Battery trend statistics
  - Average battery level
  - Minimum and maximum readings
- Location history with timestamps
- Signal strength trending

### 5. **Dashboard Views**

#### Home Tab
- Device cards with status badges
- Current battery percentage
- Last seen timestamp
- Quick access to device details
- Add new device button

#### Map Tab (Coming Soon)
- Real-time geolocation
- Geofence boundaries
- Multi-device tracking
- Location history

#### Alerts Tab
- Comprehensive alert feed
- Filter by severity and status
- Resolve/dismiss alerts
- Send notifications
- Export alert history

#### Settings Tab
- Dark mode toggle
- Device management
- Manage multiple watches
- User profile settings
- App information
- Logout

#### History Tab (Per Device)
- Telemetry timeline
- Battery statistics
- Location history
- Signal strength tracking
- Export telemetry data

## Technical Implementation

### Database Models

#### User
```prisma
- id: String @id
- email: String @unique
- passwordHash: String
- name: String?
- phone: String? (for SMS notifications)
- createdAt: DateTime
- devices: Device[]
- watches: UserWatch[]
- alerts: Alert[]
- telemetry: TelemetryLog[]
```

#### Watch
```prisma
- id: String @id
- watchId: String @unique (device identifier)
- name: String
- status: String (online, offline, low_battery, critical)
- batteryLevel: Int
- createdAt: DateTime
- updatedAt: DateTime
- userWatches: UserWatch[]
- alerts: Alert[]
- telemetry: TelemetryLog[]
```

#### Alert
```prisma
- id: String @id
- userId: String
- watchId: String
- type: String (sos, low_battery, offline, geofence_breach, unknown_contact)
- severity: String (low, medium, high, critical)
- message: String
- isResolved: Boolean
- resolvedAt: DateTime?
- notifiedAt: DateTime
- createdAt: DateTime
```

#### TelemetryLog
```prisma
- id: String @id
- userId: String
- watchId: String
- batteryLevel: Int
- location: String?
- signalStrength: Int?
- timestamp: DateTime
```

### API Endpoints

#### Watches
- `GET /api/watches` - Get all user watches
- `POST /api/watches` - Add new watch
- `DELETE /api/watches` - Remove watch

#### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts` - Update alert status
- `POST /api/alerts/notify` - Send notification (SMS/push)

#### Telemetry
- `GET /api/telemetry` - Get telemetry logs
- `POST /api/telemetry` - Log telemetry data

#### Authentication
- `POST /api/auth/signup` - Register new user (with name, phone, email, password)
- `POST /api/auth/login` - Login user

### Hooks

#### useWatches
Hook for managing watch devices
```typescript
const { watches, loading, error, addWatch, removeWatch, fetchWatches } = useWatches(token);
```

#### useAlerts
Hook for managing alerts and notifications
```typescript
const { 
  alerts, 
  loading, 
  error, 
  createAlert, 
  resolveAlert, 
  notifyAlert,
  logTelemetry 
} = useAlerts(token);
```

### Components

#### WatchStatusBadge
Visual status indicator for watches with color coding and battery percentage.

#### AlertItem
Individual alert display with severity indicators, action buttons, and time formatting.

#### HistoryView
Telemetry data display with statistics and timeline view.

## Setup & Configuration

### Environment Variables
Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

**Required:**
- `DATABASE_URL` - SQLite database path
- `JWT_SECRET` - Secret for signing JWT tokens

**Optional (for SMS notifications):**
- `TWILIO_ACCOUNT_SID` - Twilio account ID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number

### Installation & Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run Prisma migrations:**
   ```bash
   pnpm prisma migrate dev
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Access dashboard:**
   - Open http://localhost:3000
   - Sign up or login
   - Add watches to start monitoring

### Deployment

1. **Build for production:**
   ```bash
   pnpm build
   ```

2. **Start production server:**
   ```bash
   pnpm start
   ```

3. **Environment variables:**
   - Set all required env vars in your hosting platform
   - Use production database URL
   - Set strong JWT_SECRET
   - Configure Twilio credentials for SMS

## Usage Flow

### Adding a Child's Watch
1. Navigate to Settings tab
2. Click "Add Device"
3. Enter the watch ID and child's name
4. Device status will show as "Offline" until watch connects

### Responding to Alerts
1. Receive browser notification
2. View alert in Alerts tab
3. Click "Notify" to send SMS/push notification
4. Click "Resolve" to mark as handled

### Monitoring Telemetry
1. Select device from Home tab
2. View current stats (battery, status)
3. Click History to see trends
4. Check battery predictions for recharge timing

## Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Token-based API authentication
- **Row Level Security**: Each user sees only their own data
- **Environment Isolation**: Sensitive credentials in env variables
- **HTTP-Only Cookies**: Secure session management (when deployed)

## Development Notes

### Console Logging
- All notifications log to console with `[v0]` prefix in development mode
- View browser console for alert details
- Check server logs for API errors

### Testing Alerts
Without Twilio configured:
1. Open browser console
2. Create alert
3. View `[v0] ALERT NOTIFICATION:` message
4. See sound generation log

### Future Enhancements
- Real-time WebSocket updates for instant notifications
- Advanced geofencing with custom boundaries
- Health metrics integration (heart rate, steps)
- Emergency contact shortcuts
- Video call capability
- SOS button with location snapshot
- AI-powered anomaly detection
