'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Activity, 
  Map, 
  Bell, 
  Clock, 
  Settings, 
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  X,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [alertDropdownOpen, setAlertDropdownOpen] = useState(false);
  const alertCounterRef = useRef(0);
  const isHydratedRef = useRef(false);
  const alertDropdownRef = useRef<HTMLDivElement>(null);
  const deviceIds = useMemo(() => devices.map((device) => device.id), [devices]);

  // Close alert dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertDropdownRef.current && !alertDropdownRef.current.contains(event.target as Node)) {
        setAlertDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        // Ignore transient load issues
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
    { id: 'home' as const, icon: Activity, label: 'Overview' },
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'alerts' as const, icon: Bell, label: 'Alerts' },
    { id: 'history' as const, icon: Clock, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ], []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === expandedDeviceId) || null,
    [devices, expandedDeviceId]
  );

  const unresolvedAlerts = useMemo(
    () => allAlerts.filter(a => a.level === 'critical' || a.level === 'warning').slice(0, 3),
    [allAlerts]
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

  if (!ready || !isAuthenticated) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.25rem', borderBottom: 'var(--nb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sidebar-header-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, background: '#1a1a1a', border: 'var(--nb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>G</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dashboard-text)' }}>G.U.A.R.D.</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                  padding: '0.75rem 1rem',
                  justifyContent: 'flex-start',
                  background: isActive ? 'var(--nb-button)' : 'transparent',
                  color: isActive ? '#1a1a1a' : 'var(--dashboard-text-muted)',
                  border: isActive ? 'var(--nb-border)' : 'none',
                  boxShadow: isActive ? 'var(--nb-shadow-sm)' : 'none',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  textTransform: 'none',
                  letterSpacing: 0,
                  width: '100%',
                }}
              >
                <Icon size={20} />
                <span className="nav-label">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Add Device Button */}
        <div style={{ padding: '0.75rem', borderTop: 'var(--nb-border)' }}>
          <button
            onClick={() => setIsAddDeviceModalOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--nb-button)',
              color: '#1a1a1a',
              border: 'var(--nb-border)',
              boxShadow: 'var(--nb-shadow-sm)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            <Plus size={18} />
            <span className="nav-label">Add Device</span>
          </button>
        </div>

        {/* User Section */}
        <div style={{ padding: '1rem 0.75rem', borderTop: 'var(--nb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sidebar-footer-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--nb-button)', border: 'var(--nb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: '#1a1a1a' }}>
              {(name || 'U').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--dashboard-text)' }}>{name || 'User'}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'var(--dashboard-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Bar */}
        <header className="dashboard-topbar" style={{ borderBottom: 'var(--nb-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'var(--dashboard-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
            {isConnected && (
              <span style={{ fontSize: '0.75rem', color: 'var(--nb-secure)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 6, height: 6, background: 'var(--nb-secure)', borderRadius: '50%' }} />
                Live
              </span>
            )}
          </div>

          {/* Alert Bell with Dropdown */}
          <div style={{ position: 'relative' }} ref={alertDropdownRef}>
            <button
              onClick={() => setAlertDropdownOpen(!alertDropdownOpen)}
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'var(--dashboard-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} />
              {unresolvedAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  background: 'var(--nb-critical-abduction)',
                  borderRadius: '50%',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unresolvedAlerts.length}
                </span>
              )}
            </button>

            {/* Alert Dropdown */}
            {alertDropdownOpen && (
              <div className="alert-dropdown">
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--dashboard-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--dashboard-text)' }}>Recent Alerts</span>
                  <button
                    onClick={() => setAlertDropdownOpen(false)}
                    style={{ background: 'transparent', border: 'none', padding: '0.25rem', cursor: 'pointer', color: 'var(--dashboard-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                {unresolvedAlerts.length === 0 ? (
                  <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--dashboard-text-muted)', fontSize: '0.875rem' }}>
                    No recent alerts
                  </div>
                ) : (
                  <div>
                    {unresolvedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--dashboard-border)',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        <AlertTriangle
                          size={16}
                          color={alert.level === 'critical' ? 'var(--nb-critical-abduction)' : 'var(--nb-alert-off-route)'}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--dashboard-text)', margin: 0 }}>
                            {alert.childName}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)', margin: '0.125rem 0 0 0' }}>
                            {alert.message}
                          </p>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--nb-gray-muted)', margin: '0.25rem 0 0 0' }}>
                            {formatTimeAgo(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => { setAlertDropdownOpen(false); handleTabChange('alerts'); }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--dashboard-text)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      View All Alerts
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {activeTab === 'home' && (
            <div>
              {devices.length === 0 ? (
                <div style={{ 
                  background: 'var(--dashboard-card)', 
                  border: 'var(--nb-border)',
                  boxShadow: 'var(--nb-shadow)',
                  padding: '3rem',
                  textAlign: 'center',
                  maxWidth: 480,
                  margin: '0 auto',
                }}>
                  <Smartphone size={32} style={{ color: 'var(--dashboard-text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--dashboard-text)', marginBottom: '0.5rem' }}>
                    No devices connected
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)', marginBottom: '1.5rem' }}>
                    Add a device to start monitoring
                  </p>
                  <button
                    onClick={() => setIsAddDeviceModalOpen(true)}
                    style={{
                      background: 'var(--nb-button)',
                      color: '#1a1a1a',
                      padding: '0.75rem 1.5rem',
                      border: 'var(--nb-border)',
                      boxShadow: 'var(--nb-shadow-sm)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Add Device
                  </button>
                </div>
              ) : (
                <div className="device-grid" style={{ display: 'grid', gap: '1rem' }}>
                  {devices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      darkMode={darkMode}
                      formatTimeAgo={formatTimeAgo}
                      getChildStatus={getChildStatus}
                      onClick={() => handleDeviceSelect(device.id)}
                    />
                  ))}
                </div>
              )}
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
      </main>

      {/* Device Detail Panel */}
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

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ maxWidth: '430px', width: '100%', pointerEvents: 'auto' }}>
          <div style={{ margin: '1rem', border: '2px solid #1a1a1a', boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0.75rem 0.5rem' }}>
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
                      gap: '0.25rem',
                      padding: '0.5rem',
                      background: isActive ? '#1a1a1a' : 'transparent',
                      color: isActive ? '#fff' : '#1a1a1a',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      letterSpacing: 0,
                    }}
                  >
                    <Icon size={20} />
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
