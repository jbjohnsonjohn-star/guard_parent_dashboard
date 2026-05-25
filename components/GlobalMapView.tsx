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
        width: 40px;
        height: 40px;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background-color: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          font-weight: 600;
          color: white;
          font-size: 14px;
          font-family: 'Geist', sans-serif;
        ">
          ${childName.charAt(0).toUpperCase()}
        </div>
        ${
          status === 'online'
            ? `
          <div style="
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${color};
            top: -2px;
            right: -2px;
            border: 2px solid white;
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

  const statusColor = device.status === 'online' ? '#22c55e' : device.status === 'alert' ? '#f97316' : '#ef4444';

  return (
    <Marker
      key={device.id}
      position={[device.coordinates.latitude, device.coordinates.longitude]}
      icon={createMarkerIcon(device.status, device.childName)}
    >
      <Popup>
        <div style={{ fontFamily: 'Geist, sans-serif', minWidth: 160 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', color: '#1a1a1a' }}>
            {device.childName}
          </div>
          <div style={{ display: 'grid', gap: '0.375rem', fontSize: '0.8125rem', color: '#666' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Heart Rate</span>
              <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{device.heartRate} bpm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Steps</span>
              <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{device.steps != null ? device.steps.toLocaleString() : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Battery</span>
              <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{device.battery != null ? `${Math.round(device.battery)}%` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status</span>
              <span style={{ fontWeight: 500, color: statusColor, textTransform: 'capitalize' }}>
                {device.status}
              </span>
            </div>
          </div>
          {onDeviceSelect && (
            <button
              onClick={() => onDeviceSelect(device.id)}
              style={{
                marginTop: '0.75rem',
                width: '100%',
                background: '#1a1a1a',
                color: '#fff',
                padding: '0.5rem',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View Details
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

function GlobalMapView({ devices, onDeviceSelect }: GlobalMapViewProps) {
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
          {devices.length} device{devices.length !== 1 ? 's' : ''} on map
        </p>
      </div>

      <div style={{ 
        flex: 1, 
        minHeight: 400,
        background: 'var(--dashboard-card)',
        border: '1px solid var(--dashboard-border)',
        overflow: 'hidden',
      }}>
        <MapContainer center={initialViewRef.current.center} zoom={12} style={{ width: '100%', height: '100%' }}>
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
    </div>
  );
}

export default memo(GlobalMapView);
