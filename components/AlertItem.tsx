'use client';

import { Alert } from '@/hooks/useAlerts';
import { AlertCircle, AlertTriangle, AlertOctagon, AlertSquare } from 'lucide-react';

interface AlertItemProps {
  alert: Alert;
  darkMode?: boolean;
  onResolve?: (alertId: string) => void;
  onNotify?: (alertId: string) => void;
}

export default function AlertItem({ alert, darkMode, onResolve, onNotify }: AlertItemProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-900';
      case 'medium':
        return darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-900';
      case 'high':
        return darkMode ? 'bg-orange-900 text-orange-100' : 'bg-orange-100 text-orange-900';
      case 'critical':
        return darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-900';
      default:
        return darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return AlertSquare;
      case 'medium':
        return AlertTriangle;
      case 'high':
        return AlertCircle;
      case 'critical':
        return AlertOctagon;
      default:
        return AlertCircle;
    }
  };

  const SeverityIcon = getSeverityIcon(alert.severity);
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`p-4 rounded-lg border ${
        darkMode
          ? 'bg-zinc-800 border-zinc-700'
          : 'bg-white border-gray-200'
      } ${!alert.isResolved && alert.severity === 'critical' ? 'border-2 border-red-500 animate-pulse' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
          <SeverityIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {alert.watch?.name || 'Unknown Device'}
            </h3>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {timeAgo(alert.createdAt)}
            </span>
          </div>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {alert.message}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)}`}>
              {alert.type.replace(/_/g, ' ').toUpperCase()}
            </span>
            {!alert.isResolved && (
              <>
                {onResolve && (
                  <button
                    onClick={() => onResolve(alert.id)}
                    className={`text-xs px-2 py-1 rounded font-semibold transition ${
                      darkMode
                        ? 'bg-green-900 text-green-100 hover:bg-green-800'
                        : 'bg-green-100 text-green-900 hover:bg-green-200'
                    }`}
                  >
                    Resolve
                  </button>
                )}
                {onNotify && (
                  <button
                    onClick={() => onNotify(alert.id)}
                    className={`text-xs px-2 py-1 rounded font-semibold transition ${
                      darkMode
                        ? 'bg-blue-900 text-blue-100 hover:bg-blue-800'
                        : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    }`}
                  >
                    Notify
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
