'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PairedDevice } from '@/types/device';
import 'leaflet/dist/leaflet.css';

interface GlobalMapViewProps {
  devices: PairedDevice[];
  darkMode: boolean;
  onDeviceSelect?: (deviceId: string) => void;
}

const markerIconCache = new Map<string, L.DivIcon>();

const createMarkerIcon = (status: string, childName: string) => {
  const cacheKey = `${status}-${childName.charAt(0).toUpperCase()}`;
  const cached = markerIconCache.get(cacheKey);
  if (cached) return cached;

  const color = status === 'online' ? '#22c55e' : status === 'alert' ? '#f97316' : '#ef4444';

  const icon = L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background-color: ${color};
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-weight: bold;
          color: white;
          font-size: 12px;
        ">
          ${childName.charAt(0).toUpperCase()}
        </div>
        ${
          status === 'online'
            ? `
          <div style="
            position: absolute;
            width: 64px;
            height: 64px;
            border: 2px solid ${color};
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.3;
            animation: pulse 2s infinite;
          "></div>
        `
            : ''
        }
      </div>
    `,
    className: 'custom-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });

  markerIconCache.set(cacheKey, icon);
  return icon;
};

const MapInitializer = ({
  bounds,
  fitKey,
}: {
  bounds: [number, number][] | null;
  fitKey: string;
}) => {
  const map = useMap();
  const lastFitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bounds || bounds.length === 0) return;
    if (lastFitKeyRef.current === fitKey) return;
    lastFitKeyRef.current = fitKey;
    map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
  }, [bounds, fitKey, map]);

  return null;
};

interface DeviceMarkerProps {
  device: PairedDevice;
  onDeviceSelect?: (deviceId: string) => void;
}

const DeviceMarker = memo(function DeviceMarker({ device, onDeviceSelect }: DeviceMarkerProps) {
  if (!device.coordinates) return null;

  return (
    <Marker
      key={device.id}
      position={[device.coordinates.latitude, device.coordinates.longitude]}
      icon={createMarkerIcon(device.status, device.childName)}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-bold mb-2">{device.childName}</div>
          <div className="space-y-1 text-xs">
            <div>
              <span className="font-semibold">Heart Rate:</span> {device.heartRate} BPM
            </div>
            <div>
              <span className="font-semibold">Steps:</span> {device.steps != null ? device.steps : '—'}
            </div>
            <div>
              <span className="font-semibold">Battery:</span> {device.battery != null ? `${Math.round(device.battery)}%` : '—'}
            </div>
            <div>
              <span className="font-semibold">Status:</span>{' '}
              <span className={
                device.status === 'online' ? 'text-green-600' :
                device.status === 'alert' ? 'text-orange-600' :
                'text-red-600'
              }>
                {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
              </span>
            </div>
          </div>
          {onDeviceSelect && (
            <button
              onClick={() => onDeviceSelect(device.id)}
              className="mt-3 w-full bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-700 transition"
            >
              View Details
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

function GlobalMapView({ devices, darkMode, onDeviceSelect }: GlobalMapViewProps) {
  const defaultCenter: [number, number] = [40.7128, -74.006];
  const initialViewRef = useRef<{ center: [number, number]; bounds: [number, number][] | null } | null>(null);

  if (!initialViewRef.current) {
    const coords = devices.filter(d => d.coordinates).map(d => [d.coordinates!.latitude, d.coordinates!.longitude] as [number, number]);
    initialViewRef.current = {
      center: coords[0] || defaultCenter,
      bounds: coords.length > 0 ? coords : null,
    };
  }

  const markerDevices = useMemo(
    () => devices.filter(device => Boolean(device.coordinates)),
    [devices]
  );
  const fitKey = useMemo(
    () => markerDevices.map((device) => device.id).sort().join('|'),
    [markerDevices]
  );
  const fitBounds = useMemo<[number, number][] | null>(
    () =>
      markerDevices.length > 0
        ? markerDevices.map((device) => [device.coordinates!.latitude, device.coordinates!.longitude] as [number, number])
        : null,
    [markerDevices]
  );

  return (
    <div className={`flex-1 overflow-hidden pb-28 flex flex-col ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="px-6 pt-6 pb-4">
        <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-3xl font-bold`}>
          All Devices
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
          {devices.length} device{devices.length !== 1 ? 's' : ''} on map
        </p>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={initialViewRef.current.center} zoom={12} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapInitializer bounds={fitBounds || initialViewRef.current.bounds} fitKey={fitKey || 'initial'} />

          {markerDevices.map(device => (
            <DeviceMarker key={device.id} device={device} onDeviceSelect={onDeviceSelect} />
          ))}
        </MapContainer>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(GlobalMapView);
