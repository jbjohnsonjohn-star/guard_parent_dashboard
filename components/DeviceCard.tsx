import { memo } from 'react';
import { Heart } from 'lucide-react';
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
  darkMode,
  formatTimeAgo,
  getChildStatus,
  onClick,
}: DeviceCardProps) {
  const getStatusBorderColor = () => {
    switch (device.status) {
      case 'online':
        return 'var(--nb-secure)';
      case 'alert':
        return 'var(--nb-alert-off-route)';
      case 'offline':
        return 'var(--nb-critical-abduction)';
      default:
        return '#000000';
    }
  };

  const statusBorderColor = getStatusBorderColor();

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'white',
        border: `2px solid ${statusBorderColor}`,
        boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        padding: '1.5rem',
        transition: 'all 0.15s ease',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '10px 10px 0px 0px rgba(0, 0, 0, 1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#333333', margin: 0 }}>
            {device.childName}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666666', margin: '0.25rem 0 0 0' }}>
            {getChildStatus(device)}
          </p>
        </div>
        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: statusBorderColor, color: 'white', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', border: `2px solid ${statusBorderColor}` }}>
          {device.status.toUpperCase()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>
            Heart Rate
          </p>
          <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#333333', margin: 0 }}>
            {device.heartRate}<span style={{ fontSize: '0.875rem', color: '#999999' }}>BPM</span>
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>
            Steps
          </p>
          <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#333333', margin: 0 }}>
            {device.steps != null ? device.steps : '—'}
          </p>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000000', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#999999', fontWeight: 600 }}>
        <p style={{ margin: 0 }}>
          Last: {formatTimeAgo(device.lastSeen)}
        </p>
        <p style={{ margin: 0 }}>
          {device.battery != null ? `${Math.round(device.battery)}%` : '—'}
        </p>
      </div>
    </button>
  );
}

export default memo(DeviceCard);
