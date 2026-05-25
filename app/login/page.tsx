'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setError('Invalid email or password');
        return;
      }

      const token = payload?.data?.token ?? payload?.token;
      if (!token) {
        setError('Invalid email or password');
        return;
      }

      window.localStorage.setItem('guard_token', token);
      router.replace('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="nb-card" style={{ width: '100%', maxWidth: '430px' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--nb-brand)', textTransform: 'uppercase', margin: 0, marginBottom: '1rem' }}>
            G.U.A.R.D.
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--nb-gray-dark)', margin: 0 }}>
            Login
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            required
            style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            required
            style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          {error && <p style={{ fontSize: '0.875rem', color: 'var(--nb-critical-abduction)', fontWeight: 700 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--nb-brand)',
              color: 'var(--nb-navy)',
              boxShadow: 'var(--nb-shadow)',
              padding: '0.875rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: 'var(--nb-border)', paddingTop: '1rem' }}>
          <button
            onClick={() => router.push('/signup')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--nb-gray-dark)',
              fontSize: '0.875rem',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
