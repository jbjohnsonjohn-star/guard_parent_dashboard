import { AlertTriangle, Info, Bell } from 'lucide-react';
import { DeviceAlert } from '@/types/device';

interface AlertsFeedProps {
  alerts: DeviceAlert[];
  darkMode: boolean;
}

export default function AlertsFeed({ alerts }: AlertsFeedProps) {
  const formatAlertTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle size={16} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={16} color="#f97316" />;
      case 'info':
        return <Info size={16} color="#3b82f6" />;
      default:
        return <Info size={16} color="#888888" />;
    }
  };

  const getAlertBorderColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f97316';
      case 'info': return '#3b82f6';
      default: return '#888888';
    }
  };

  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
          {alerts.length} event{alerts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.length === 0 ? (
          <div style={{ 
            background: 'var(--dashboard-card)', 
            border: 'var(--nb-border)',
            boxShadow: 'var(--nb-shadow)',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <Bell size={32} style={{ color: 'var(--dashboard-text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--dashboard-text)', marginBottom: '0.25rem' }}>
              No alerts yet
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
              All systems operating normally
            </p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              style={{
                background: 'var(--dashboard-card)',
                border: 'var(--nb-border)',
                borderLeft: `4px solid ${getAlertBorderColor(alert.level)}`,
                boxShadow: 'var(--nb-shadow-sm)',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {getAlertIcon(alert.level)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.6875rem', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      color: getAlertBorderColor(alert.level),
                    }}>
                      {alert.level}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)', flexShrink: 0 }}>
                      {formatAlertTime(alert.timestamp)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--dashboard-text)', margin: '0.25rem 0 0 0' }}>
                    {alert.childName}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--dashboard-text-muted)', margin: '0.25rem 0 0 0' }}>
                    {alert.message}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--nb-gray-muted)', margin: '0.375rem 0 0 0' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
