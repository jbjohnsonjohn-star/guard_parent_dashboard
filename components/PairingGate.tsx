'use client';

import { FormEvent, useState } from 'react';

interface PairingGateProps {
  onConnect: (payload: { pairingCode: string; deviceName: string; deviceId: string }) => void;
}

export default function PairingGate({ onConnect }: PairingGateProps) {
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedCode = pairingCode.trim().toUpperCase();
    const normalizedName = deviceName.trim() || 'Test Child';

    if (normalizedCode.length !== 6) {
      setError('Pairing code must be exactly 6 characters.');
      return;
    }

    setError('');
    setIsConnecting(true);

    try {
      const response = await fetch('http://localhost:8080/pair/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairingCode: normalizedCode,
          parentId: 'TEST_PARENT',
          deviceName: normalizedName,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        const backendMessage =
          typeof data?.message === 'string' && data.message.length > 0
            ? data.message
            : 'Invalid or already used pairing code';
        setError(backendMessage);
        return;
      }

      const resolvedDeviceId =
        typeof data?.deviceId === 'string' && data.deviceId.length > 0
          ? data.deviceId
          : typeof data?.id === 'string' && data.id.length > 0
            ? data.id
            : '';

      if (!resolvedDeviceId) {
        setError('Invalid or already used pairing code');
        return;
      }

      onConnect({
        pairingCode: normalizedCode,
        deviceName: normalizedName,
        deviceId: resolvedDeviceId,
      });
    } catch {
      setError('Unable to connect to server');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 transition-all">
        <h1 className="text-3xl font-bold">Connect Your Device</h1>
        <p className="text-sm text-gray-500 mt-2">Pair before accessing the dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Pairing Code</label>
            <input
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center tracking-[0.2em] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Device/Child Name (Optional)</label>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Test Child"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isConnecting}
            className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold transition hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
