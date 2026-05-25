'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pairingCode: string, deviceName: string) => Promise<void>;
  darkMode: boolean;
}

export default function AddDeviceModal({ open, onClose, onSubmit }: AddDeviceModalProps) {
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    const normalizedCode = pairingCode.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      setError('Pairing code must be exactly 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await onSubmit(normalizedCode, deviceName.trim());
      setPairingCode('');
      setDeviceName('');
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to connect to server';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 60, 
      background: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1.5rem' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: 400, 
        background: 'var(--dashboard-card)', 
        border: 'var(--nb-border)',
        boxShadow: 'var(--nb-shadow)',
        padding: '1.5rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--dashboard-text)', margin: 0 }}>
            Add Device
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.25rem',
              cursor: 'pointer',
              color: 'var(--dashboard-text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-text-muted)', marginBottom: '1.5rem' }}>
          Pair smartwatch using a 6-character code.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
            maxLength={6}
            placeholder="PAIRING CODE"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: 'var(--nb-border)',
              background: 'var(--dashboard-card)',
              fontSize: '1rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.15em',
              textAlign: 'center',
              color: 'var(--dashboard-text)',
            }}
          />
          <input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Device Name (optional)"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: 'var(--nb-border)',
              background: 'var(--dashboard-card)',
              fontSize: '0.875rem',
              color: 'var(--dashboard-text)',
            }}
          />
        </div>

        {error && (
          <p style={{ 
            fontSize: '0.8125rem', 
            color: '#ef4444', 
            marginBottom: '1rem',
            padding: '0.5rem 0.75rem',
            background: '#fef2f2',
            border: '1px solid #ef4444',
          }}>
            {error}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem',
              background: 'var(--dashboard-card)',
              color: 'var(--dashboard-text)',
              border: 'var(--nb-border)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              background: 'var(--nb-button)',
              color: '#1a1a1a',
              border: 'var(--nb-border)',
              boxShadow: 'var(--nb-shadow-sm)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
