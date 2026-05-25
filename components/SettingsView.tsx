'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PairedDevice } from '@/types/device';

interface SettingsViewProps {
  devices: PairedDevice[];
  onOpenAddDevice: () => void;
  onRemoveDevice: (id: string) => void;
  darkMode: boolean;
  onDarkModeChange: (mode: boolean) => void;
  selectedDeviceId: string | null;
  onLogout: () => void;
}

export default function SettingsView({
  devices,
  onOpenAddDevice,
  onRemoveDevice,
  darkMode,
  onDarkModeChange,
  selectedDeviceId,
  onLogout,
}: SettingsViewProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '7rem', background: 'var(--nb-navy)' }}>
      <div style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white', margin: 0 }}>
          Settings
        </h1>
      </div>

      <div style={{ padding: '1.5rem', display: 'grid', gap: '2rem', paddingBottom: '2rem' }}>
        {/* Device Management Section */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
            Device Management
          </p>

          {/* Add Device Button */}
          <div className="nb-card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#333333', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
              Add Another Device
            </h2>
            <button
              onClick={onOpenAddDevice}
              style={{
                width: '100%',
                backgroundColor: 'var(--nb-brand)',
                color: 'var(--nb-navy)',
                padding: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '2px solid var(--nb-brand)',
                boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
              }}
            >
              <Plus size={18} />
              Add Device
            </button>
          </div>

          {/* Connected Devices List */}
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
              Connected Devices ({devices.length})
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {devices.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#999999', margin: 0 }}>
                  No devices paired yet
                </p>
              ) : (
                devices.map(device => (
                  <div
                    key={device.id}
                    className="nb-card"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#333333', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {device.childName}
                        {selectedDeviceId === device.id && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', fontWeight: 900, color: 'var(--nb-secure)', textTransform: 'uppercase' }}>
                            ACTIVE
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontFamily: 'monospace', color: '#999999', margin: '0.25rem 0 0 0' }} className="nb-mono">
                        {device.pairingCode}
                      </p>
                    </div>
                    <button
                      onClick={() => setPendingRemoveId(device.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#ff6b6b';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#ef4444';
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
            About
          </p>

          <div className="nb-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666666' }}>
                App Version
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#333333', textTransform: 'uppercase' }}>
                1.0.0
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '2px solid #000000',
                paddingTop: '1rem',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: '#666666' }}>
                Total Devices
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#333333', textTransform: 'uppercase' }}>
                {devices.length}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              backgroundColor: 'var(--nb-critical-abduction)',
              color: 'white',
              padding: '0.875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '2px solid var(--nb-critical-abduction)',
              boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '10px 10px 0px 0px rgba(0, 0, 0, 1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Remove Device Modal */}
      {pendingRemoveId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="nb-card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#333333', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', margin: 0 }}>
              Remove Device?
            </h3>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#666666', margin: '0.5rem 0 0 0' }}>
              This will stop monitoring updates for it.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                onClick={() => setPendingRemoveId(null)}
                style={{
                  padding: '0.75rem',
                  background: 'white',
                  color: '#333333',
                  border: '2px solid #000000',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveDevice(pendingRemoveId);
                  setPendingRemoveId(null);
                }}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--nb-critical-abduction)',
                  color: 'white',
                  border: '2px solid var(--nb-critical-abduction)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#ff6b6b';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--nb-critical-abduction)';
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
