import { memo } from 'react';
import { Activity, Footprints, Battery, Clock } from 'lucide-react';
import { PairedDevice } from '@/types/device';

interface DeviceCardProps {
  device: PairedDevice;
  darkMode: boolean;
  formatTimeAgo: (date: Date | string) => string;
  getChildStatus: (device: PairedDevice) => string;
  onClick?: () => void;
}

function DeviceCard({
  device,
  formatTimeAgo,
  getChildStatus,
  onClick,
}: DeviceCardProps) {
  const getStatusColor = () => {
    switch (device.status) {
      case 'online':
        return '#22c55e';
      case 'alert':
        return '#f97316';
      case 'offline':
        return '#ef4444';
      default:
        return '#888888';
    }
  };

  const statusColor = getStatusColor();

  return (
    <button
      onClick={onClick}
      className="dashboard-card"
      style={{
        width: '100%',
        padding: '1.25rem',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'block',
        background: 'var(--dashboard-card)',
        border: 'var(--nb-border)',
        boxShadow: 'var(--nb-shadow)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            background: 'var(--nb-button)', 
            border: 'var(--nb-border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#1a1a1a',
          }}>
            {device.childName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dashboard-text)', margin: 0 }}>
              {device.childName}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)', margin: '0.125rem 0 0 0' }}>
              {getChildStatus(device)}
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.375rem',
          padding: '0.25rem 0.5rem', 
          background: `${statusColor}15`,
          color: statusColor, 
          fontWeight: 600, 
          fontSize: '0.6875rem', 
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}>
          <span style={{ width: 6, height: 6, background: statusColor, borderRadius: '50%' }} />
          {device.status}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="var(--nb-critical-abduction)" />
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--dashboard-text-muted)', margin: 0 }}>Heart Rate</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
              {device.heartRate}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dashboard-text-muted)' }}> bpm</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Footprints size={16} color="var(--nb-secure)" />
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--dashboard-text-muted)', margin: 0 }}>Steps</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
              {device.steps != null ? device.steps.toLocaleString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        borderTop: '1px solid var(--dashboard-border)', 
        paddingTop: '0.75rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>
          <Clock size={12} />
          <span>{formatTimeAgo(device.lastSeen)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>
          <Battery size={12} />
          <span>{device.battery != null ? `${Math.round(device.battery)}%` : '—'}</span>
        </div>
      </div>
    </button>
  );
}

export default memo(DeviceCard);
