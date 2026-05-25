'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  token: string | null;
  userId: string | null;
  name: string | null;
  ready: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    userId: null,
    name: null,
    ready: false,
  });

  useEffect(() => {
    const token = window.localStorage.getItem('guard_token');
    
    if (!token) {
      setAuth({ token: null, userId: null, name: null, ready: true });
      router.replace('/login');
      return;
    }

    try {
      // Decode JWT to extract userId and name
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId || null;
      const name = payload.name || null;

      setAuth({ token, userId, name, ready: true });
    } catch (error) {
      console.error('[v0] Failed to decode token:', error);
      setAuth({ token: null, userId: null, name: null, ready: true });
      router.replace('/login');
    }
  }, [router]);

  const logout = () => {
    window.localStorage.removeItem('guard_token');
    window.localStorage.removeItem('ward.devices');
    window.localStorage.removeItem('ward.selectedDeviceId');
    router.push('/login');
  };

  return {
    token: auth.token,
    userId: auth.userId,
    name: auth.name,
    ready: auth.ready,
    isAuthenticated: Boolean(auth.token && auth.userId),
    logout,
  };
}
