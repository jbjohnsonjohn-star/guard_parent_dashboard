// hooks/useWardWebSocket.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WardMessage {
  type: string;
  deviceId?: string;
  [key: string]: unknown;
}

type DeviceMessageHandler = (msg: WardMessage) => void;

interface DeviceSocket {
  ws: WebSocket;
  deviceId: string;
  identified: boolean;
}

/**
 * Manages one WebSocket connection per device.
 * The backend expects each WS to send a single IDENTIFY with its deviceId,
 * then streams TELEMETRY for that device only.
 *
 * @param url         WebSocket server URL
 * @param enabled     Whether to connect at all (false = no devices paired yet)
 * @param deviceIds   List of paired device IDs to open sockets for
 * @param onMessage   Called for every inbound message, with deviceId guaranteed
 */
export function useWardWebSocket(
  url: string,
  enabled: boolean,
  deviceIds: string[],
  onMessage: DeviceMessageHandler
) {
  const socketsRef = useRef<Map<string, DeviceSocket>>(new Map());
  const reconnectTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const openSocketForDevice = useCallback(
    (deviceId: string) => {
      // Don't open a duplicate
      const existing = socketsRef.current.get(deviceId);
      if (existing && (existing.ws.readyState === WebSocket.OPEN || existing.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const ws = new WebSocket(url);
      const entry: DeviceSocket = { ws, deviceId, identified: false };
      socketsRef.current.set(deviceId, entry);

      ws.onopen = () => {
        // Send IDENTIFY immediately — backend requires this as the first message
        ws.send(JSON.stringify({ type: 'IDENTIFY', deviceId }));
        entry.identified = true;
        setConnectedIds((prev) => new Set([...prev, deviceId]));
        console.log(`[WS] Opened + identified socket for ${deviceId}`);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WardMessage;
          if (parsed.type === 'ERROR') {
            console.warn(`[WS] Backend rejected ${deviceId}:`, parsed.message);
            const timer = reconnectTimersRef.current.get(deviceId);
            if (timer) {
              clearTimeout(timer);
              reconnectTimersRef.current.delete(deviceId);
            }
            socketsRef.current.delete(deviceId);
            ws.close();
            return;
          }
          // Always stamp the deviceId so consumers never need to guess
          onMessageRef.current({ ...parsed, deviceId });
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onclose = () => {
        setConnectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deviceId);
          return next;
        });
        console.log(`[WS] Socket closed for ${deviceId}. Reconnecting in 2s…`);

        // Reconnect only if the deviceId is still in our list
        const timer = setTimeout(() => {
          if (socketsRef.current.has(deviceId)) {
            openSocketForDevice(deviceId);
          }
        }, 2000);
        reconnectTimersRef.current.set(deviceId, timer);
      };

      ws.onerror = () => {
        ws.close(); // Let onclose handle reconnect
      };
    },
    [url]
  );

  const closeSocketForDevice = useCallback((deviceId: string) => {
    const timer = reconnectTimersRef.current.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      reconnectTimersRef.current.delete(deviceId);
    }
    const entry = socketsRef.current.get(deviceId);
    if (entry) {
      entry.ws.close();
      socketsRef.current.delete(deviceId);
    }
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deviceId);
      return next;
    });
  }, []);

  // Sync sockets with the current deviceIds list
  useEffect(() => {
    if (!enabled) {
      // Close everything
      socketsRef.current.forEach((_, id) => closeSocketForDevice(id));
      return;
    }

    const currentIds = new Set(deviceIds);

    // Open sockets for new devices
    deviceIds.forEach((id) => {
      if (id) openSocketForDevice(id);
    });

    // Close sockets for removed devices
    socketsRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) closeSocketForDevice(id);
    });
  }, [enabled, deviceIds, openSocketForDevice, closeSocketForDevice]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      reconnectTimersRef.current.forEach(clearTimeout);
      socketsRef.current.forEach((entry) => entry.ws.close());
    };
  }, []);

  // Expose a command sender per device
  const sendCommand = useCallback((deviceId: string, command: string) => {
    const entry = socketsRef.current.get(deviceId);
    if (entry?.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(JSON.stringify({ command }));
    }
  }, []);

  const isConnected = connectedIds.size > 0;

  return { isConnected, connectedIds, sendCommand };
}