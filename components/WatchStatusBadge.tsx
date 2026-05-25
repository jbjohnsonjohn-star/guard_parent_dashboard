'use client';

import { Watch } from '@/hooks/useWatches';

interface WatchStatusBadgeProps {
  watch: Watch;
  darkMode?: boolean;
}

export default function WatchStatusBadge({ watch, darkMode }: WatchStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-900';
      case 'offline':
        return darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-700';
      case 'low_battery':
        return darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-900';
      case 'critical':
        return darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-900';
      default:
        return darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢 Online';
      case 'offline':
        return '⚫ Offline';
      case 'low_battery':
        return '🟡 Low Battery';
      case 'critical':
        return '🔴 Critical';
      default:
        return 'Unknown';
    }
  };

  const isCritical = watch.status === 'critical';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
        watch.status
      )} ${isCritical ? 'animate-pulse border-2 border-current' : ''}`}
    >
      <span>{getStatusLabel(watch.status)}</span>
      <span className="text-xs">({watch.batteryLevel}%)</span>
    </div>
  );
}
