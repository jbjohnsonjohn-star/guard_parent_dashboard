'use client';

import { memo, useMemo, useState } from 'react';
import { X, Activity, Footprints, Battery, Gauge, MapPin, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { PairedDevice, DeviceAlert } from '@/types/device';

const DeviceMiniMap = dynamic(() => import('@/components/DeviceMiniMap'), { ssr: false });

interface DeviceDetailViewProps {
  device: PairedDevice;
  darkMode: boolean;
  formatTimeAgo: (date: Date | string) => string;
  getChildStatus: (device: PairedDevice) => string;
  allAlerts: DeviceAlert[];
  onClose: () => void;
}

// Simple HR chart component
function HeartRateChart({ currentHR }: { currentHR: number }) {
  // Generate mock historical data points around current HR
  const dataPoints = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < 24; i++) {
      const variance = Math.sin(i * 0.5) * 15 + (Math.random() - 0.5) * 10;
      points.push(Math.max(60, Math.min(120, currentHR + variance)));
    }
    return points;
  }, [currentHR]);

  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;

  // Create SVG path
  const width = 100;
  const height = 40;
  const pathD = dataPoints.map((value, index) => {
    const x = (index / (dataPoints.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', height: 80, position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height + 10}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="hrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={`${pathD} L ${width} ${height + 5} L 0 ${height + 5} Z`}
          fill="url(#hrGradient)"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current point */}
        <circle
          cx={width}
          cy={height - ((dataPoints[dataPoints.length - 1] - min) / range) * height}
          r="3"
          fill="#ef4444"
        />
      </svg>
      {/* Labels */}
      <div style={{ position: 'absolute', left: 0, top: 0, fontSize: '0.625rem', color: 'var(--dashboard-text-muted)' }}>
        {Math.round(max)} bpm
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, fontSize: '0.625rem', color: 'var(--dashboard-text-muted)' }}>
        {Math.round(min)} bpm
      </div>
    </div>
  );
}

function DeviceDetailView({
  device,
  formatTimeAgo,
  getChildStatus,
  allAlerts,
  onClose,
}: DeviceDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts'>('overview');
  
  const deviceAlerts = useMemo(
    () => allAlerts.filter(alert => alert.deviceId === device.id),
    [allAlerts, device.id]
  );

  const getStatusColor = () => {
    switch (device.status) {
      case 'online': return '#22c55e';
      case 'alert': return '#f97316';
      case 'offline': return '#ef4444';
      default: return '#888888';
    }
  };

  const statusColor = getStatusColor();

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0, 0, 0, 0.3)', 
          zIndex: 45 
        }} 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="device-detail-panel">
        {/* Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: 'var(--nb-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--dashboard-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              background: 'var(--nb-button)', 
              border: 'var(--nb-border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#1a1a1a',
            }}>
              {device.childName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
                {device.childName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: statusColor,
                  fontWeight: 500,
                }}>
                  <span style={{ width: 6, height: 6, background: statusColor, borderRadius: '50%' }} />
                  {getChildStatus(device)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'var(--dashboard-text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: 'var(--nb-border)',
          background: 'var(--dashboard-card)',
        }}>
          {(['overview', 'alerts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: activeTab === tab ? 'var(--nb-button)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #1a1a1a' : '2px solid transparent',
                color: activeTab === tab ? '#1a1a1a' : 'var(--dashboard-text-muted)',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                letterSpacing: 0,
              }}
            >
              {tab} {tab === 'alerts' && deviceAlerts.length > 0 && `(${deviceAlerts.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--dashboard-bg)' }}>
          {activeTab === 'overview' ? (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Live Map */}
              <div style={{ 
                background: 'var(--dashboard-card)', 
                border: 'var(--nb-border)',
                boxShadow: 'var(--nb-shadow-sm)',
                overflow: 'hidden',
              }}>
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderBottom: 'var(--nb-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <MapPin size={16} color="var(--dashboard-text-muted)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dashboard-text)' }}>
                    Live Location
                  </span>
                </div>
                <div style={{ height: 200 }}>
                  <DeviceMiniMap device={device} darkMode={false} />
                </div>
                {device.coordinates && (
                  <div style={{ 
                    padding: '0.5rem 1rem', 
                    borderTop: 'var(--nb-border)',
                    fontSize: '0.75rem',
                    color: 'var(--dashboard-text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {device.coordinates.latitude.toFixed(6)}, {device.coordinates.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Heart Rate Chart */}
              <div style={{ 
                background: 'var(--dashboard-card)', 
                border: 'var(--nb-border)',
                boxShadow: 'var(--nb-shadow-sm)',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={16} color="#ef4444" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dashboard-text)' }}>
                      Heart Rate
                    </span>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)' }}>
                    {device.status === 'offline' ? '—' : device.heartRate}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dashboard-text-muted)' }}> bpm</span>
                  </span>
                </div>
                {device.status !== 'offline' && <HeartRateChart currentHR={device.heartRate} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--dashboard-text-muted)' }}>
                  <span>Last 24 hours</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <TrendingUp size={10} />
                    Live
                  </span>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Steps */}
                <div style={{ 
                  background: 'var(--dashboard-card)', 
                  border: 'var(--nb-border)',
                  boxShadow: 'var(--nb-shadow-sm)',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Footprints size={16} color="#22c55e" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Steps Today</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
                    {device.steps != null ? device.steps.toLocaleString() : '—'}
                  </p>
                </div>

                {/* Battery */}
                <div style={{ 
                  background: 'var(--dashboard-card)', 
                  border: 'var(--nb-border)',
                  boxShadow: 'var(--nb-shadow-sm)',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Battery size={16} color={device.battery != null && device.battery > 20 ? '#22c55e' : '#ef4444'} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Battery</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
                    {device.battery != null ? `${Math.round(device.battery)}%` : '—'}
                  </p>
                  {device.battery != null && (
                    <div style={{ marginTop: '0.5rem', height: 4, background: 'var(--dashboard-border)', borderRadius: 2 }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${device.battery}%`, 
                        background: device.battery > 20 ? '#22c55e' : '#ef4444',
                        borderRadius: 2,
                      }} />
                    </div>
                  )}
                </div>

                {/* Velocity */}
                <div style={{ 
                  background: 'var(--dashboard-card)', 
                  border: 'var(--nb-border)',
                  boxShadow: 'var(--nb-shadow-sm)',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Gauge size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Speed</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
                    {device.velocity?.toFixed(1) || '0'}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dashboard-text-muted)' }}> km/h</span>
                  </p>
                </div>

                {/* Last Update */}
                <div style={{ 
                  background: 'var(--dashboard-card)', 
                  border: 'var(--nb-border)',
                  boxShadow: 'var(--nb-shadow-sm)',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock size={16} color="var(--dashboard-text-muted)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Last Seen</span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--dashboard-text)', margin: 0 }}>
                    {formatTimeAgo(device.lastSeen)}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--dashboard-text-muted)', margin: '0.25rem 0 0 0' }}>
                    {new Date(device.lastSeen).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Device Info */}
              <div style={{ 
                background: 'var(--dashboard-card)', 
                border: 'var(--nb-border)',
                boxShadow: 'var(--nb-shadow-sm)',
                padding: '1rem',
              }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dashboard-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Device Info
                </p>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-muted)' }}>Pairing Code</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--dashboard-text)' }}>{device.pairingCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-muted)' }}>Device ID</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--dashboard-text)', fontSize: '0.75rem' }}>{device.id.slice(0, 12)}...</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-muted)' }}>Paired</span>
                    <span style={{ color: 'var(--dashboard-text)' }}>{new Date(device.pairedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.25rem' }}>
              {deviceAlerts.length === 0 ? (
                <div style={{ 
                  background: 'var(--dashboard-card)', 
                  border: 'var(--nb-border)',
                  boxShadow: 'var(--nb-shadow-sm)',
                  padding: '2rem',
                  textAlign: 'center',
                }}>
                  <AlertTriangle size={32} style={{ color: 'var(--dashboard-text-muted)', marginBottom: '0.75rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--dashboard-text)', marginBottom: '0.25rem' }}>No alerts</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--dashboard-text-muted)' }}>
                    All systems operating normally
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {deviceAlerts.map(alert => (
                    <div
                      key={alert.id}
                      style={{
                        background: 'var(--dashboard-card)',
                        border: 'var(--nb-border)',
                        borderLeft: `4px solid ${alert.level === 'critical' ? '#ef4444' : alert.level === 'warning' ? '#f97316' : '#3b82f6'}`,
                        boxShadow: 'var(--nb-shadow-sm)',
                        padding: '0.75rem 1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <AlertTriangle 
                          size={16} 
                          color={alert.level === 'critical' ? '#ef4444' : alert.level === 'warning' ? '#f97316' : '#3b82f6'}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ 
                              fontSize: '0.6875rem', 
                              fontWeight: 600, 
                              textTransform: 'uppercase',
                              color: alert.level === 'critical' ? '#ef4444' : alert.level === 'warning' ? '#f97316' : '#3b82f6',
                            }}>
                              {alert.level}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--dashboard-text-muted)' }}>
                              {formatTimeAgo(alert.timestamp)}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--dashboard-text)', margin: '0.25rem 0 0 0' }}>
                            {alert.message}
                          </p>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--dashboard-text-muted)', margin: '0.25rem 0 0 0' }}>
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default memo(DeviceDetailView);
