import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { DeviceAlert } from '@/types/device';

interface AlertsFeedProps {
  alerts: DeviceAlert[];
  darkMode: boolean;
}

export default function AlertsFeed({ alerts, darkMode }: AlertsFeedProps) {
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
        return <AlertCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-orange-500" />;
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      default:
        return <Info size={20} className="text-gray-500" />;
    }
  };

  const getAlertColors = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: darkMode ? 'bg-red-950/30' : 'bg-red-50',
          border: 'border-red-200',
          text: darkMode ? 'text-red-400' : 'text-red-700',
        };
      case 'warning':
        return {
          bg: darkMode ? 'bg-orange-950/30' : 'bg-orange-50',
          border: 'border-orange-200',
          text: darkMode ? 'text-orange-400' : 'text-orange-700',
        };
      case 'info':
        return {
          bg: darkMode ? 'bg-blue-950/30' : 'bg-blue-50',
          border: 'border-blue-200',
          text: darkMode ? 'text-blue-400' : 'text-blue-700',
        };
      default:
        return {
          bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
          border: 'border-gray-200',
          text: darkMode ? 'text-gray-400' : 'text-gray-700',
        };
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto pb-28 ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="px-6 pt-6 pb-8">
        <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-3xl font-bold`}>
          Alerts
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>
          {alerts.length} event{alerts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-6 space-y-3 pb-8">
        {alerts.length === 0 ? (
          <div className={`rounded-3xl p-12 text-center ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}>
            <Info className={`w-8 h-8 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              No alerts yet
            </p>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm mt-1`}>
              All systems operating normally
            </p>
          </div>
        ) : (
          alerts.map(alert => {
            const colors = getAlertColors(alert.level);

            return (
              <div
                key={alert.id}
                className={`rounded-2xl p-4 border-2 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-bold text-sm uppercase tracking-wide ${colors.text}`}>
                        {alert.level}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} flex-shrink-0`}>
                        {formatAlertTime(alert.timestamp)}
                      </p>
                    </div>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-900'} text-sm font-medium mt-1`}>
                      {alert.childName}
                    </p>
                    <p className={`${colors.text} text-sm mt-1`}>
                      {alert.message}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
