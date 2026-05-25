'use client';

import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Battery } from 'lucide-react';

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

export default function HistoryView({ token, watchId, darkMode }: HistoryViewProps) {
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
    <div className={`flex-1 overflow-y-auto pb-28 ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="px-6 pt-6 pb-8">
        <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-3xl font-bold flex items-center gap-3`}>
          <Calendar className="w-8 h-8" />
          History
        </h1>
      </div>

      {/* Time Range Selector */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedRange === range
                  ? darkMode
                    ? 'bg-white text-black'
                    : 'bg-gray-900 text-white'
                  : darkMode
                  ? 'bg-zinc-900 text-gray-300 hover:bg-zinc-800'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mb-6 space-y-3">
        <div
          className={`p-4 rounded-lg border ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-amber-500" />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Average Battery
              </span>
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {avgBattery}%
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {minBattery}%
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div className="text-right">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {maxBattery}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Timeline */}
      <div className="px-6 space-y-3">
        <h2 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Telemetry Data
        </h2>

        {loading ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading telemetry data...
          </p>
        ) : telemetry.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No telemetry data available
          </p>
        ) : (
          <div className="space-y-2">
            {telemetry.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${
                  darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatTime(log.timestamp)}
                    </p>
                    {log.location && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        📍 {log.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🔋 {log.batteryLevel}%
                    </div>
                    {log.signalStrength && (
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Signal: {log.signalStrength}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
