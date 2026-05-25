'use client';

interface LiveMapProps {
  latitude: number;
  longitude: number;
  isCritical?: boolean;
  systemStatus?: string;
}

export function LiveMap({ latitude, longitude, isCritical, systemStatus }: LiveMapProps) {
  const bgColor = isCritical ? '#1a1a1a' : '#0d0d0d';
  const borderColor = isCritical ? '#cccccc' : '#666666';

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Animated map background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke={borderColor} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill={`url(#grid)`} />
        </svg>
      </div>

      {/* Location marker */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full animate-pulse ${isCritical ? 'bg-white shadow-lg shadow-white/50' : 'bg-white shadow-lg shadow-white/40'}`}
        />
        <div className="text-center">
          <div className="text-xs font-mono text-white/70">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>
          {systemStatus && (
            <div className={`text-[10px] font-mono font-bold tracking-widest mt-1 ${isCritical ? 'text-white' : 'text-white/80'}`}>
              {systemStatus.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Outer ring animation */}
      <div
        className={`absolute w-16 h-16 rounded-full border-2 animate-pulse ${isCritical ? 'border-white/40' : 'border-white/20'}`}
      />
      <div
        className={`absolute w-24 h-24 rounded-full border animate-ping ${isCritical ? 'border-white/30' : 'border-white/15'}`}
      />
    </div>
  );
}
