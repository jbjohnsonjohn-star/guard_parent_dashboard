'use client';

import { memo, useMemo } from 'react';
import { ArrowLeft, Heart, AlertCircle } from 'lucide-react';
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

function DeviceDetailView({
  device,
  darkMode,
  formatTimeAgo,
  getChildStatus,
  allAlerts,
  onClose,
}: DeviceDetailViewProps) {
  const deviceAlerts = useMemo(
    () => allAlerts.filter(alert => alert.deviceId === device.id),
    [allAlerts, device.id]
  );
  
  const statusColor = {
    online: 'bg-green-500',
    alert: 'bg-orange-500',
    offline: 'bg-red-500',
  }[device.status];

  const statusTextColor = {
    online: 'text-green-600 dark:text-green-400',
    alert: 'text-orange-600 dark:text-orange-400',
    offline: 'text-red-600 dark:text-red-400',
  }[device.status];

  return (
    <div className={`fixed inset-0 z-40 flex justify-center ${darkMode ? 'bg-black/80' : 'bg-black/50'}`}>
      <div
        className={`max-w-md w-full max-h-screen overflow-y-auto ${
          darkMode ? 'bg-black' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-50 px-6 pt-6 pb-6 border-b ${
          darkMode ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className={darkMode ? 'text-white' : 'text-gray-900'} size={24} />
            </button>
            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${statusColor}`} />
          </div>
          <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-3xl font-bold mb-1`}>
            {device.childName}
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            {getChildStatus(device)}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 pb-8">
          {/* Heart Rate - Large Display */}
          <div className={`rounded-2xl p-8 text-center border-2 ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-4`}>
              Heart Rate
            </p>
            <div className="flex items-center justify-center gap-2">
              <Heart size={32} className={device.status === 'online' ? 'text-red-500' : 'text-gray-400'} />
              <span className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {device.status === 'offline' ? '—' : device.heartRate}
              </span>
              <span className={`text-xl font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {device.status === 'offline' ? '' : 'BPM'}
              </span>
            </div>
          </div>

          {/* Steps Counter */}
          <div className={`rounded-2xl p-6 border-2 ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-3`}>
              Steps Today
            </p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {device.steps != null ? device.steps : '—'}
            </p>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>
              {device.status === 'offline' ? 'Device offline' : 'Live tracking'}
            </p>
          </div>

          {/* Battery Level */}
          <div className={`rounded-2xl p-6 border-2 ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-3`}>
              Battery Level
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full" style={{backgroundColor: darkMode ? '#3f3f46' : '#e5e7eb'}}>
                <div
                  className={`h-full rounded-full transition-all ${
                    (device.battery ?? 0) > 50
                      ? 'bg-green-500'
                      : (device.battery ?? 0) > 20
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{width: `${device.battery ?? 0}%`}}
                />
              </div>
              <span className={`text-xl font-bold w-14 text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {device.battery != null ? `${Math.round(device.battery)}%` : '—'}
              </span>
            </div>
          </div>

          {/* Last Seen */}
          <div className={`rounded-2xl p-6 border-2 ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-2`}>
              Last Seen
            </p>
            <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
              {formatTimeAgo(device.lastSeen)}
            </p>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>
              {new Date(device.lastSeen).toLocaleString()}
            </p>
          </div>

          {/* Location Map */}
          <div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-3`}>
              Current Location
            </p>
            <DeviceMiniMap device={device} darkMode={darkMode} />
            {device.coordinates && (
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-3 text-center`}>
                {device.coordinates.latitude.toFixed(4)}, {device.coordinates.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {/* Alert History */}
          {deviceAlerts.length > 0 && (
            <div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-3`}>
                Alert History ({deviceAlerts.length})
              </p>
              <div className="space-y-2">
                {deviceAlerts.slice(0, 5).map(alert => {
                  const alertColors = {
                    critical: darkMode ? 'bg-red-950/50 border-red-900/50' : 'bg-red-50 border-red-200',
                    warning: darkMode ? 'bg-orange-950/50 border-orange-900/50' : 'bg-orange-50 border-orange-200',
                    info: darkMode ? 'bg-blue-950/50 border-blue-900/50' : 'bg-blue-50 border-blue-200',
                  };

                  const alertIcon = {
                    critical: 'text-red-500',
                    warning: 'text-orange-500',
                    info: 'text-blue-500',
                  };

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-lg p-3 border-2 ${alertColors[alert.level]}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className={`flex-shrink-0 mt-0.5 ${alertIcon[alert.level]}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold uppercase ${
                            alert.level === 'critical' ? (darkMode ? 'text-red-400' : 'text-red-700') :
                            alert.level === 'warning' ? (darkMode ? 'text-orange-400' : 'text-orange-700') :
                            (darkMode ? 'text-blue-400' : 'text-blue-700')
                          }`}>
                            {alert.level}
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {alert.message}
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(DeviceDetailView);
