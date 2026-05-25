'use client';

import { memo, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PairedDevice } from '@/types/device';
import 'leaflet/dist/leaflet.css';

interface DeviceMiniMapProps {
  device: PairedDevice;
  darkMode: boolean;
}

const miniMapIconCache = new Map<string, L.DivIcon>();

const createDeviceIcon = (status: string) => {
  const cached = miniMapIconCache.get(status);
  if (cached) return cached;

  const color = status === 'online' ? '#22c55e' : status === 'alert' ? '#f97316' : '#ef4444';

  const icon = L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background-color: ${color};
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
        ${
          status === 'online'
            ? `
          <div style="
            position: absolute;
            width: 56px;
            height: 56px;
            border: 2px solid ${color};
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.4;
            animation: pulse 2s infinite;
          "></div>
        `
            : ''
        }
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  miniMapIconCache.set(status, icon);
  return icon;
};

function DeviceMiniMap({ device, darkMode }: DeviceMiniMapProps) {
  if (!device.coordinates) {
    return (
      <div className={`rounded-2xl p-6 border-2 h-64 flex items-center justify-center ${
        darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
          No location data available
        </p>
      </div>
    );
  }

  const initialCenterRef = useRef<[number, number]>([device.coordinates.latitude, device.coordinates.longitude]);
  const markerPosition = useMemo<[number, number]>(() => {
    if (!device.coordinates) return initialCenterRef.current;
    return [device.coordinates.latitude, device.coordinates.longitude];
  }, [device.coordinates]);

  return (
    <div className={`rounded-2xl overflow-hidden border-2 h-64 ${
      darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'
    }`}>
      <MapContainer
        center={initialCenterRef.current}
        zoom={14}
        className="w-full h-full"
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={markerPosition} icon={createDeviceIcon(device.status)}>
          <Popup>
            <div className="text-sm font-medium">{device.childName}</div>
            <div className="text-xs text-gray-600">
              {device.coordinates.latitude.toFixed(4)}, {device.coordinates.longitude.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(DeviceMiniMap);
