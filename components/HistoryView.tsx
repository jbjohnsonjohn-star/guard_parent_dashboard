'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Battery } from 'lucide-react';

interface TelemetryLog {
  id: string;
  batteryLevel: number;
  location?: string;
  signalStrength?: number;
  timestamp: string;
}

interface HistoryViewProps {
  token: string | null;
  watchId?: string;
  darkMode?: boolean;
}

export default function HistoryView({ token, watchId }: HistoryViewProps) {
  const [telemetry, setTelemetry] = useState<TelemetryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    if (!token || !watchId) return;

    setLoading(true);
    fetch(`/api/telemetry?watchId=${watchId}&limit=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTelemetry(data.logs || []);
        }
      })
      .catch((error) => console.error('[v0] Failed to fetch telemetry:', error))
      .finally(() => setLoading(false));
  }, [token, watchId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const avgBattery =
    telemetry.length > 0
      ? Math.round(telemetry.reduce((sum, log) => sum + log.batteryLevel, 0) / telemetry.length)
      : 0;

  const minBattery = telemetry.length > 0 ? Math.min(...telemetry.map((log) => log.batteryLevel)) : 0;

  const maxBattery = telemetry.length > 0 ? Math.max(...telemetry.map((log) => log.batteryLevel)) : 0;

  return (
    <div style={{ flex: 1 }}>
      {/* Time Range Selector */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        {(['24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            style={{
              padding: '0.5rem 1rem',
              background: selectedRange === range ? '#1a1a1a' : 'var(--dashboard-card)',
              color: selectedRange === range ? '#fff' : 'var(--dashboard-text)',
              border: '1px solid var(--dashboard-border)',
              fontWeight: 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ 
          background: 'var(--dashboard-card)', 
          border: '1px solid var(--dashboard-border)',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Battery size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Avg Battery</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
            {avgBattery}%
          </p>
        </div>

        <div style={{ 
          background: 'var(--dashboard-card)', 
          border: '1px solid var(--dashboard-border)',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="#ef4444" />
            <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Min</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
            {minBattery}%
          </p>
        </div>

        <div style={{ 
          background: 'var(--dashboard-card)', 
          border: '1px solid var(--dashboard-border)',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="#22c55e" />
            <span style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)' }}>Max</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
            {maxBattery}%
          </p>
        </div>
      </div>

      {/* Telemetry Timeline */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dashboard-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Telemetry Data
        </p>

        {loading ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
            Loading telemetry data...
          </p>
        ) : telemetry.length === 0 ? (
          <div style={{ 
            background: 'var(--dashboard-card)', 
            border: '1px solid var(--dashboard-border)',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--dashboard-text-muted)', fontSize: '0.875rem' }}>
              No telemetry data available
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {telemetry.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'var(--dashboard-card)',
                  border: '1px solid var(--dashboard-border)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--dashboard-text)', margin: 0 }}>
                    {formatTime(log.timestamp)}
                  </p>
                  {log.location && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)', margin: '0.125rem 0 0 0' }}>
                      {log.location}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dashboard-text)', margin: 0 }}>
                    {log.batteryLevel}%
                  </p>
                  {log.signalStrength && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--dashboard-text-muted)', margin: '0.125rem 0 0 0' }}>
                      Signal: {log.signalStrength}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
