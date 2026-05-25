import { useEffect, useState, useCallback } from 'react';

export interface Alert {
  id: string;
  userId: string;
  watchId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isResolved: boolean;
  resolvedAt?: string;
  notifiedAt: string;
  createdAt: string;
  watch?: {
    id: string;
    name: string;
  };
}

export function useAlerts(token: string | null) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alerts', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setError(payload?.message || 'Failed to fetch alerts');
        return;
      }
      setAlerts(payload?.alerts || []);
    } catch (err) {
      setError('Failed to fetch alerts');
      console.error('[v0] useAlerts error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createAlert = useCallback(async (watchId: string, type: string, severity: string, message: string) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchId, type, severity, message }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to create alert');
    }
    await fetchAlerts();
    return payload?.alert;
  }, [token, fetchAlerts]);

  const resolveAlert = useCallback(async (alertId: string) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alertId, isResolved: true }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to resolve alert');
    }
    await fetchAlerts();
  }, [token, fetchAlerts]);

  const notifyAlert = useCallback(async (alertId: string) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('/api/alerts/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alertId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to notify');
    }
    return payload;
  }, [token]);

  const logTelemetry = useCallback(async (watchId: string, batteryLevel: number, location?: string, signalStrength?: number) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('/api/telemetry', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchId, batteryLevel, location, signalStrength }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to log telemetry');
    }
    return payload?.telemetry;
  }, [token]);

  useEffect(() => {
    void fetchAlerts();
    const interval = setInterval(() => {
      void fetchAlerts();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    createAlert,
    resolveAlert,
    notifyAlert,
    logTelemetry,
  };
}
