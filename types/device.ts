export type DeviceStatus = 'online' | 'offline' | 'alert';
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface DeviceAlert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: Date;
  deviceId: string;
  childName: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Device {
  id: string;
  childName: string;
  name?: string;
  heartRate: number;
  status: DeviceStatus;
  lastSeen: Date;
  lastUpdate?: Date;
  currentStatus?: string;
  isOnline?: boolean;
  velocity?: number;
  alertMessage?: string;
  battery?: number | null;
  steps?: number | null;
  coordinates?: Coordinates;
  alerts?: DeviceAlert[];
}

export interface PairedDevice extends Device {
  pairingCode: string;
  pairedAt: string;
}
