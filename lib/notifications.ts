/**
 * Browser Push Notification helper
 */
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.log('[v0] Browser notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
}

/**
 * Web Audio API alarm sound generator
 * Creates a beeping alarm sound that persists for the specified duration
 */
export function playAlarmSound(durationMs: number = 3000, frequency: number = 800): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    const endTime = now + durationMs / 1000;

    // Create oscillator for alarm sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Create pulsing effect
    gainNode.gain.setValueAtTime(0.3, now);
    let time = now;
    while (time < endTime) {
      const nextPulse = time + 0.1; // 100ms pulse
      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.setValueAtTime(0, nextPulse);
      time = nextPulse + 0.1; // 100ms silence
    }

    gainNode.gain.setValueAtTime(0, endTime);

    oscillator.start(now);
    oscillator.stop(endTime);

    console.log(`[v0] Alarm sound playing for ${durationMs}ms at ${frequency}Hz`);
  } catch (error) {
    console.error('[v0] Failed to play alarm sound:', error);
  }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[v0] Browser notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send critical alert notification with alarm
 */
export async function sendCriticalAlert(
  title: string,
  message: string,
  watchName?: string
): Promise<void> {
  // Show browser notification
  const notificationTitle = `🚨 ${title}`;
  const notificationBody = `${message}${watchName ? ` - ${watchName}` : ''}`;

  showBrowserNotification(notificationTitle, {
    body: notificationBody,
    icon: '/icon.png',
    tag: 'critical-alert',
    requireInteraction: true,
    badge: '/badge.png',
  });

  // Play alarm sound
  playAlarmSound(5000, 1000); // 5 seconds at 1kHz

  // Log for development
  console.log(`[v0] CRITICAL ALERT: ${notificationTitle} - ${notificationBody}`);
}

/**
 * Send warning notification (no sound)
 */
export async function sendWarningAlert(
  title: string,
  message: string,
  watchName?: string
): Promise<void> {
  const notificationTitle = `⚠️ ${title}`;
  const notificationBody = `${message}${watchName ? ` - ${watchName}` : ''}`;

  showBrowserNotification(notificationTitle, {
    body: notificationBody,
    icon: '/icon.png',
    tag: 'warning-alert',
    badge: '/badge.png',
  });

  console.log(`[v0] WARNING: ${notificationTitle} - ${notificationBody}`);
}
