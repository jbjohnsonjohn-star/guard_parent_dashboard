'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Heart, MapPin, AlertCircle, Settings, Watch, Clock } from 'lucide-react';
import { WardMessage, useWardWebSocket } from '@/hooks/useWardWebSocket';
import DeviceCard from '@/components/DeviceCard';
import AlertsFeed from '@/components/AlertsFeed';
import SettingsView from '@/components/SettingsView';
import HistoryView from '@/components/HistoryView';
import AddDeviceModal from '@/components/AddDeviceModal';
import { DeviceAlert, PairedDevice } from '@/types/device';
import { useAuth } from '@/hooks/useAuth';

const DeviceDetailView = dynamic(() => import('@/components/DeviceDetailView'), { ssr: false });
const GlobalMapView = dynamic(() => import('@/components/GlobalMapView'), { ssr: false });

type ActiveTab = 'home' | 'map' | 'alerts' | 'history' | 'settings';
const DEVICES_STORAGE_KEY = 'ward.devices';
const SELECTED_DEVICE_ID_STORAGE_KEY = 'ward.selectedDeviceId';

const hydrateDevices = (raw: string | null): PairedDevice[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PairedDevice[];
    return parsed.map((device) => ({
      ...device,
      lastSeen: new Date(device.lastSeen),
      lastUpdate: device.lastUpdate ? new Date(device.lastUpdate) : undefined,
      alerts: (device.alerts || []).map((alert) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
      })),
    }));
  } catch {
    return [];
  }
};

export default function Dashboard() {
  const { token, userId, name, ready, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [allAlerts, setAllAlerts] = useState<DeviceAlert[]>([]);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const alertCounterRef = useRef(0);
  const isHydratedRef = useRef(false);
  const deviceIds = useMemo(() => devices.map((device) => device.id), [devices]);

  useEffect(() => {
    if (!ready || !isAuthenticated || !token || !userId) return;
    const loadDevices = async () => {
      try {
        const response = await fetch('/api/devices', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false) return;
        const rows = payload?.data ?? payload?.devices ?? [];
        const mapped: PairedDevice[] = rows.map((device: any) => ({
          id: device.id ?? device.deviceId,
          childName: device.deviceName ?? device.childName ?? 'Unnamed Device',
          name: device.deviceName ?? device.childName ?? 'Unnamed Device',
          heartRate: device.heartRate ?? 0,
          status: device.currentStatus === 'OFFLINE' ? 'offline' : 'online',
          lastSeen: device.lastSeen ? new Date(device.lastSeen) : new Date(),
          lastUpdate: device.lastUpdate ? new Date(device.lastUpdate) : undefined,
          currentStatus: device.currentStatus ?? 'OFFLINE',
          isOnline: Boolean(device.isOnline),
          velocity: device.velocity ?? 0,
          battery: device.battery ?? null,
          steps: device.steps ?? null,
          coordinates: device.latitude != null && device.longitude != null
            ? { latitude: device.latitude, longitude: device.longitude }
            : undefined,
          pairingCode: device.pairingCode ?? '------',
          pairedAt: device.createdAt ?? new Date().toISOString(),
          alerts: [],
        }));
        setDevices(mapped);
        setSelectedDeviceId(mapped.length > 0 ? mapped[0].id : null);
      } catch {
        // Ignore transient load issues; local cache still exists.
      }
    };
    void loadDevices();
  }, [isAuthenticated, ready, token, userId]);

  useEffect(() => {
    const restoredDevices = hydrateDevices(window.localStorage.getItem(DEVICES_STORAGE_KEY));
    const restoredSelectedId = window.localStorage.getItem(SELECTED_DEVICE_ID_STORAGE_KEY);

    setDevices(restoredDevices);
    if (restoredSelectedId && restoredDevices.some((device) => device.id === restoredSelectedId)) {
      setSelectedDeviceId(restoredSelectedId);
    } else if (restoredDevices.length > 0) {
      setSelectedDeviceId(restoredDevices[0].id);
    } else {
      setSelectedDeviceId(null);
    }
    isHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    window.localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    if (selectedDeviceId) {
      window.localStorage.setItem(SELECTED_DEVICE_ID_STORAGE_KEY, selectedDeviceId);
    } else {
      window.localStorage.removeItem(SELECTED_DEVICE_ID_STORAGE_KEY);
    }
  }, [selectedDeviceId]);

  const toFrontendStatus = (backendStatus?: string): PairedDevice['status'] => {
    if (!backendStatus) return 'offline';
    if (backendStatus.startsWith('CRITICAL_') || backendStatus.startsWith('ALERT_')) return 'alert';
    if (backendStatus === 'OFFLINE' || backendStatus === 'DISCONNECTED') return 'offline';
    return 'online';
  };

  const getDeviceNameById = useCallback((deviceId: string) => {
    return devices.find((device) => device.id === deviceId)?.childName || 'Unknown Device';
  }, [devices]);

  const buildAlertFromStatus = useCallback((deviceId: string, systemStatus: string): DeviceAlert | null => {
    alertCounterRef.current += 1;
    const alertId = `alert-${Date.now()}-${deviceId}-${alertCounterRef.current}`;
    const deviceName = getDeviceNameById(deviceId);
    if (systemStatus === 'CRITICAL_ABDUCTION') {
      return {
        id: `${alertId}-abduction`,
        level: 'critical',
        message: 'Critical abduction risk detected',
        timestamp: new Date(),
        deviceId,
        childName: deviceName,
      };
    }
    if (systemStatus === 'CRITICAL_FREEZE') {
      return {
        id: `${alertId}-freeze`,
        level: 'critical',
        message: 'Critical freeze state detected',
        timestamp: new Date(),
        deviceId,
        childName: deviceName,
      };
    }
    if (systemStatus === 'ALERT_OFF_ROUTE') {
      return {
        id: `${alertId}-offroute`,
        level: 'warning',
        message: 'Child is off route',
        timestamp: new Date(),
        deviceId,
        childName: deviceName,
      };
    }
    return null;
  }, [getDeviceNameById]);

  const applyTelemetry = useCallback((payload: WardMessage) => {
    const telemetry = (payload.telemetry as { heartRate?: number; latitude?: number; longitude?: number; velocityKmh?: number } | undefined) || {};
    const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId : selectedDeviceId;
    if (!deviceId) return;
    const heartRate = telemetry.heartRate ?? (payload.heartRate as number | undefined) ?? 0;
    const latitude = telemetry.latitude ?? (payload.latitude as number | undefined);
    const longitude = telemetry.longitude ?? (payload.longitude as number | undefined);
    const velocityKmh = telemetry.velocityKmh ?? (payload.velocityKmh as number | undefined) ?? 0;
    const status = ((payload.analysis as { systemStatus?: string } | undefined)?.systemStatus ||
      (payload.systemStatus as string | undefined) ||
      'NORMAL');
    const eventTime = payload.timestamp ? new Date(payload.timestamp as string) : new Date();

    setDevices((prev) =>
      prev.map((device) =>
        device.id !== deviceId
          ? device
          : {
              ...device,
              heartRate,
              coordinates:
                latitude !== undefined && longitude !== undefined
                  ? { latitude, longitude }
                  : device.coordinates,
              velocity: velocityKmh,
              status: toFrontendStatus(status),
              currentStatus: status,
              lastUpdate: eventTime,
              lastSeen: eventTime,
              isOnline: true,
            }
      )
    );

    const mappedAlert = buildAlertFromStatus(deviceId, status);
    if (mappedAlert) {
      setAllAlerts((prev) => [mappedAlert, ...prev].slice(0, 200));
    }
  }, [buildAlertFromStatus, selectedDeviceId]);

  const applyDeviceStatus = useCallback((payload: WardMessage) => {
    const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId : selectedDeviceId;
    if (!deviceId) return;
    const nextStatus = (payload.currentStatus as string | undefined) || 'NORMAL';
    setDevices((prev) =>
      prev.map((device) => {
        if (device.id !== deviceId) return device;
        return {
          ...device,
          isOnline: (payload.isOnline as boolean | undefined) ?? device.isOnline ?? false,
          lastSeen: payload.lastSeen ? new Date(payload.lastSeen as string) : device.lastSeen,
          currentStatus: nextStatus,
          status: payload.isOnline === false ? 'offline' : toFrontendStatus(nextStatus),
        };
      })
    );
  }, [selectedDeviceId]);

  const handleWsMessage = useCallback((msg: WardMessage) => {
    if (msg.type === 'TELEMETRY') applyTelemetry(msg);
    if (msg.type === 'DEVICE_STATUS_UPDATE') applyDeviceStatus(msg);
  }, [applyTelemetry, applyDeviceStatus]);

  const { isConnected, connectedIds, sendCommand } = useWardWebSocket(
    'ws://localhost:8080',
    devices.length > 0,
    deviceIds,
    handleWsMessage
  );
  void connectedIds;
  void sendCommand;

  const formatTimeAgo = (date: Date | string): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getChildStatus = (device: PairedDevice): string => {
    if (device.isOnline === false || device.status === 'offline') return 'Offline';
    return device.currentStatus || 'Online';
  };

  const navItems = useMemo(() => [
    { id: 'home' as const, icon: Heart, label: 'Home' },
    { id: 'map' as const, icon: MapPin, label: 'Map' },
    { id: 'alerts' as const, icon: AlertCircle, label: 'Alerts' },
    { id: 'history' as const, icon: Clock, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ], []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === expandedDeviceId) || null,
    [devices, expandedDeviceId]
  );

  useEffect(() => {
    if (selectedDeviceId && devices.some((device) => device.id === selectedDeviceId)) return;
    setSelectedDeviceId(devices.length > 0 ? devices[0].id : null);
  }, [devices, selectedDeviceId]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setExpandedDeviceId(null);
    setActiveTab(tab);
  }, []);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    setExpandedDeviceId(deviceId);
    setSelectedDeviceId(deviceId);
  }, []);

  const handlePairDevice = useCallback(async (pairingCode: string, name: string) => {
    if (!token) throw new Error('Unable to connect to server');
    const normalizedName = name.trim() || 'Test Child';
    
    // Decode JWT to get userId
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch {
      throw new Error('Invalid token');
    }
    
    let response: Response;
    try {
      await fetch('http://localhost:8080/pair/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: pairingCode.trim().toUpperCase() }),
      }).catch(() => undefined);

      response = await fetch('http://localhost:8080/pair/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairingCode: pairingCode.trim().toUpperCase(),
          deviceName: normalizedName,
          parentId: userId,
        }),
      });
    } catch {
      throw new Error('Unable to connect to server');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      if (response.status === 404) {
        throw new Error('Unable to connect to server');
      }
      throw new Error(typeof data?.message === 'string' ? data.message : 'Invalid or already used pairing code');
    }

    const deviceId = typeof data?.deviceId === 'string' ? data.deviceId : typeof data?.id === 'string' ? data.id : '';
    if (!deviceId) throw new Error('Invalid or already used pairing code');

    const syncResponse = await fetch('/api/devices/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        deviceName: normalizedName,
      }),
    });

    const syncPayload = await syncResponse.json().catch(() => ({}));
    if (!syncResponse.ok || syncPayload?.success === false) {
      throw new Error(syncPayload?.message || 'Something went wrong');
    }

    const now = new Date();
    const newDevice: PairedDevice = {
      id: deviceId,
      childName: normalizedName,
      name: normalizedName,
      heartRate: 0,
      velocity: 0,
      status: 'offline',
      lastSeen: now,
      isOnline: false,
      currentStatus: 'OFFLINE',
      pairingCode: pairingCode.trim().toUpperCase(),
      pairedAt: now.toISOString(),
      battery: null,
      steps: null,
      coordinates: undefined,
      alerts: [],
    };

    setDevices((prev) => {
      if (prev.some((device) => device.id === deviceId)) return prev;
      const next = [newDevice, ...prev];
      window.localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSelectedDeviceId(deviceId);
    setExpandedDeviceId(null);
    setActiveTab('home');
    setIsAddDeviceModalOpen(false);
  }, [token]);

  const handleRemoveDevice = useCallback((deviceId: string) => {
    setDevices((prev) => {
      const next = prev.filter((device) => device.id !== deviceId);
      window.localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setAllAlerts((prev) => prev.filter((alert) => alert.deviceId !== deviceId));
    if (expandedDeviceId === deviceId) setExpandedDeviceId(null);
    setSelectedDeviceId((prevSelected) => {
      const next = prevSelected === deviceId ? null : prevSelected;
      if (next) window.localStorage.setItem(SELECTED_DEVICE_ID_STORAGE_KEY, next);
      else window.localStorage.removeItem(SELECTED_DEVICE_ID_STORAGE_KEY);
      return next;
    });
    void fetch(`/api/devices/${deviceId}`, {
      method: 'DELETE',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        : undefined,
    }).catch(() => undefined);
  }, [expandedDeviceId, token]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const homeView = (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '7rem', background: 'var(--nb-navy)' }}>
      <div style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--nb-brand)', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Welcome back{name ? ', ' + name : ''}
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white', margin: 0 }}>
          Devices
        </h1>
      </div>

      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', paddingBottom: '2rem' }}>
        {devices.length === 0 ? (
          <div className="nb-card-navy" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '2px solid white' }}>
            <Watch style={{ width: '2rem', height: '2rem', margin: '0 auto 1rem', color: 'white' }} />
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>
              No devices connected
            </p>
            <p style={{ fontSize: '0.875rem', color: '#cccccc', margin: '0 0 1.5rem 0' }}>
              Add a device to start monitoring
            </p>
            <button
              onClick={() => setIsAddDeviceModalOpen(true)}
              style={{
                backgroundColor: 'var(--nb-brand)',
                color: 'var(--nb-navy)',
                padding: '0.75rem 1.25rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '2px solid var(--nb-brand)',
                boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
              }}
            >
              Add Device
            </button>
          </div>
        ) : (
          devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              darkMode={darkMode}
              formatTimeAgo={formatTimeAgo}
              getChildStatus={getChildStatus}
              onClick={() => handleDeviceSelect(device.id)}
            />
          ))
        )}
      </div>
    </div>
  );

  if (!ready || !isAuthenticated) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--nb-navy)', color: 'white' }}>
      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="desktop-sidebar" style={{
        width: '260px',
        flexShrink: 0,
        flexDirection: 'column',
        background: '#050a15',
        borderRight: '2px solid black',
        padding: '1.5rem',
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nb-brand)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2rem 0' }}>
          G.U.A.R.D.
        </p>

        {/* Navigation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: isActive ? 'var(--nb-brand)' : 'transparent',
                  color: isActive ? 'var(--nb-navy)' : 'white',
                  border: isActive ? '2px solid var(--nb-brand)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '4px solid var(--nb-brand)' : '4px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(245, 197, 24, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* User Name at Bottom */}
        <div style={{ paddingTop: '1.5rem', borderTop: '2px solid black', marginTop: 'auto' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            {name || 'User'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        minWidth: 0,
      }}>
        {/* Desktop Top Bar - Hidden on Mobile */}
        <div className="desktop-topbar" style={{
          padding: '1.5rem',
          background: 'var(--nb-navy)',
          borderBottom: '2px solid black',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--nb-brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Welcome back{name ? ', ' + name : ''}
          </p>
          <Heart style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
        </div>

        {/* Mobile/Desktop Content Container */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flex: 1,
          overflowY: 'auto',
          width: '100%',
        }}>
          <div className="content-container" style={{
            width: '100%',
            maxWidth: '430px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Content */}
            {activeTab === 'home' && (
              <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '7rem', background: 'var(--nb-navy)' }}>
                <div className="mobile-header" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--nb-brand)', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Welcome back{name ? ', ' + name : ''}
                  </p>
                  <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white', margin: 0 }}>
                    Devices
                  </h1>
                </div>

                <div className="device-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', paddingBottom: '2rem' }}>
                  {devices.length === 0 ? (
                    <div className="nb-card-navy empty-state-span" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '2px solid white' }}>
                      <Watch style={{ width: '2rem', height: '2rem', margin: '0 auto 1rem', color: 'white' }} />
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>
                        No devices connected
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#cccccc', margin: '0 0 1.5rem 0' }}>
                        Add a device to start monitoring
                      </p>
                      <button
                        onClick={() => setIsAddDeviceModalOpen(true)}
                        style={{
                          backgroundColor: 'var(--nb-brand)',
                          color: 'var(--nb-navy)',
                          padding: '0.75rem 1.25rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: '2px solid var(--nb-brand)',
                          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                        }}
                      >
                        Add Device
                      </button>
                    </div>
                  ) : (
                    devices.map(device => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        darkMode={darkMode}
                        formatTimeAgo={formatTimeAgo}
                        getChildStatus={getChildStatus}
                        onClick={() => handleDeviceSelect(device.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'map' && (
              <GlobalMapView 
                devices={devices} 
                darkMode={darkMode}
                onDeviceSelect={handleDeviceSelect}
              />
            )}
            {activeTab === 'alerts' && <AlertsFeed alerts={allAlerts} darkMode={darkMode} />}
            {activeTab === 'history' && (
              <HistoryView token={token} watchId={selectedDeviceId || undefined} darkMode={darkMode} />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onOpenAddDevice={() => setIsAddDeviceModalOpen(true)}
                onRemoveDevice={handleRemoveDevice}
                darkMode={darkMode}
                onDarkModeChange={setDarkMode}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </div>

      {/* Device Detail Modal */}
      {selectedDevice !== null && (
        <DeviceDetailView
          device={selectedDevice}
          darkMode={darkMode}
          formatTimeAgo={formatTimeAgo}
          getChildStatus={getChildStatus}
          allAlerts={allAlerts}
          onClose={() => setExpandedDeviceId(null)}
        />
      )}

      {/* Bottom Navigation - Mobile Only (Hidden on Desktop) */}
      <div className="mobile-bottom-nav" style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ maxWidth: '430px', width: '100%', pointerEvents: 'auto' }}>
          <div
            style={{
              margin: '1.25rem',
              marginTop: '1rem',
              border: '2px solid white',
              boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
              background: 'var(--nb-navy)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 0.5rem' }}>
              {navItems.map(({ id, icon: Icon, label }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: isActive ? 'var(--nb-brand)' : 'transparent',
                      color: isActive ? 'var(--nb-navy)' : 'white',
                      border: isActive ? '2px solid var(--nb-brand)' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'all 0.15s ease',
                      borderLeft: isActive ? '3px solid var(--nb-brand)' : 'none',
                    }}
                  >
                    <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AddDeviceModal
        open={isAddDeviceModalOpen}
        onClose={() => setIsAddDeviceModalOpen(false)}
        onSubmit={handlePairDevice}
        darkMode={darkMode}
      />
    </div>
  );
}
