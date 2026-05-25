'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PairedDevice } from '@/types/device';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  devices: PairedDevice[];
  darkMode: boolean;
}

const createCustomIcon = (status: string) => {
  const color = status === 'online' ? '#22c55e' : status === 'alert' ? '#f97316' : '#ef4444';

  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export default function MapView({ devices, darkMode }: MapViewProps) {
  const center: [number, number] = [40.7128, -74.006];

  return (
    <div className={`flex-1 overflow-hidden pb-28 ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="px-6 pt-6 pb-4">
        <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-3xl font-bold`}>
          Live Map
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>
          {devices.length} device{devices.length !== 1 ? 's' : ''} being tracked
        </p>
      </div>

      <div className="px-6 pb-4 h-[calc(100%-140px)]">
        <div className="rounded-2xl overflow-hidden border-2" style={{borderColor: darkMode ? '#27272a' : '#e5e7eb', height: '100%'}}>
          <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url={
                darkMode
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
              attribution={darkMode ? '&copy; CartoDB &copy; OpenStreetMap contributors' : '&copy; OpenStreetMap contributors'}
            />

            {devices.map(device => {
              if (!device.coordinates) return null;

              return (
                <Marker
                  key={device.id}
                  position={[device.coordinates.latitude, device.coordinates.longitude]}
                  icon={createCustomIcon(device.status)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{device.childName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Status: <span className="font-semibold capitalize">{device.status}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        Heart Rate: <span className="font-semibold">{device.heartRate} BPM</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        Battery: <span className="font-semibold">{device.battery != null ? `${Math.round(device.battery)}%` : '—'}</span>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
