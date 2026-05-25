'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim(), phone: phone.trim() }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setError(payload?.message || 'Something went wrong');
        return;
      }

      const token = payload?.data?.token ?? payload?.token;
      if (!token) {
        setError('Signup failed — missing token');
        return;
      }

      window.localStorage.setItem('guard_token', token);
      router.replace('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto' }}>
      <div className="nb-card" style={{ width: '100%', maxWidth: '430px', my: 'auto' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--nb-brand)', textTransform: 'uppercase', margin: 0, marginBottom: '1rem' }}>
            G.U.A.R.D.
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--nb-gray-dark)', margin: 0 }}>
            Sign Up
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="FULL NAME (OPTIONAL)"
            style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            required
            style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="PHONE (OPTIONAL)"
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
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="CONFIRM PASSWORD"
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: 'var(--nb-border)', paddingTop: '1rem' }}>
          <button
            onClick={() => router.push('/login')}
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
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}
