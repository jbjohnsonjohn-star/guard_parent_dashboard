'use client';

import { useState } from 'react';
import { Plus, Trash2, Watch, LogOut } from 'lucide-react';
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
  selectedDeviceId,
  onLogout,
}: SettingsViewProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  return (
    <div style={{ flex: 1, maxWidth: 640 }}>
      {/* Device Management Section */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dashboard-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Device Management
        </p>

        {/* Add Device Button */}
        <div style={{ 
          background: 'var(--dashboard-card)', 
          border: '1px solid var(--dashboard-border)',
          padding: '1.25rem',
          marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dashboard-text)', marginBottom: '0.75rem' }}>
            Add Another Device
          </p>
          <button
            onClick={onOpenAddDevice}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            <Plus size={18} />
            Add Device
          </button>
        </div>

        {/* Connected Devices List */}
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--dashboard-text-muted)', marginBottom: '0.75rem' }}>
            Connected Devices ({devices.length})
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {devices.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
                No devices paired yet
              </p>
            ) : (
              devices.map(device => (
                <div
                  key={device.id}
                  style={{
                    background: 'var(--dashboard-card)',
                    border: '1px solid var(--dashboard-border)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      background: 'var(--dashboard-bg)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Watch size={18} color="var(--dashboard-text)" />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dashboard-text)', margin: 0 }}>
                        {device.childName}
                        {selectedDeviceId === device.id && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase' }}>
                            Active
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--dashboard-text-muted)', margin: '0.125rem 0 0 0' }}>
                        {device.pairingCode}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingRemoveId(device.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dashboard-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          About
        </p>

        <div style={{ 
          background: 'var(--dashboard-card)', 
          border: '1px solid var(--dashboard-border)',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--dashboard-border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
              App Version
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dashboard-text)' }}>
              1.0.0
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)' }}>
              Total Devices
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dashboard-text)' }}>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.875rem',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Remove Device Modal */}
      {pendingRemoveId && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 50, 
          background: 'rgba(0, 0, 0, 0.4)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '1.5rem' 
        }}>
          <div style={{ 
            background: 'var(--dashboard-card)', 
            border: '1px solid var(--dashboard-border)',
            boxShadow: 'var(--nb-shadow)',
            padding: '1.5rem',
            width: '100%',
            maxWidth: 400,
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--dashboard-text)', marginBottom: '0.5rem' }}>
              Remove Device?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)', marginBottom: '1.5rem' }}>
              This will stop monitoring updates for it.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => setPendingRemoveId(null)}
                style={{
                  padding: '0.75rem',
                  background: 'var(--dashboard-card)',
                  color: 'var(--dashboard-text)',
                  border: '1px solid var(--dashboard-border)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textTransform: 'none',
                  letterSpacing: 0,
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
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textTransform: 'none',
                  letterSpacing: 0,
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
