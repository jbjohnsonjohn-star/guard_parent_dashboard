import { useEffect, useState, useCallback } from 'react';

export interface Watch {
  id: string;
  watchId: string;
  name: string;
  status: 'online' | 'offline' | 'low_battery' | 'critical';
  batteryLevel: number;
  createdAt: string;
  updatedAt: string;
  recentAlerts?: Alert[];
}

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
}

export function useWatches(token: string | null) {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatches = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/watches', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setError(payload?.message || 'Failed to fetch watches');
        return;
      }
      setWatches(payload?.watches || []);
    } catch (err) {
      setError('Failed to fetch watches');
      console.error('[v0] useWatches error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addWatch = useCallback(async (watchId: string, name: string) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('/api/watches', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchId, name }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to add watch');
    }
    await fetchWatches();
    return payload?.watch;
  }, [token, fetchWatches]);

  const removeWatch = useCallback(async (watchId: string) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('/api/watches', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to remove watch');
    }
    await fetchWatches();
  }, [token, fetchWatches]);

  useEffect(() => {
    void fetchWatches();
  }, [fetchWatches]);

  return {
    watches,
    loading,
    error,
    fetchWatches,
    addWatch,
    removeWatch,
  };
}
