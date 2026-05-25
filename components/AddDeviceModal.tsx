'use client';

import { useState } from 'react';

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pairingCode: string, deviceName: string) => Promise<void>;
  darkMode: boolean;
}

export default function AddDeviceModal({ open, onClose, onSubmit, darkMode }: AddDeviceModalProps) {
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
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-6">
      <div className={`w-full max-w-sm rounded-2xl border p-5 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add Device</h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Pair smartwatch using a 6-character code.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
            maxLength={6}
            placeholder="Pairing Code"
            className={`w-full rounded-lg border px-3 py-2 text-sm font-mono tracking-widest ${
              darkMode ? 'bg-black border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Device Name (optional)"
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              darkMode ? 'bg-black border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
              darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-gray-100 text-gray-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white disabled:opacity-70"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
