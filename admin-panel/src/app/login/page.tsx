'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { recordLogin, setToken } from '../../lib/auth';
import { apiLogin } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiLogin(username, password);
      setToken(result.accessToken);
      recordLogin(username);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fade-in" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <section className="panel" style={{ width: 'min(520px, 92vw)', padding: '32px' }}>
        <h1 style={{ marginTop: 0 }}>Admin Control</h1>
        <p style={{ color: 'var(--muted)' }}>Secure sign-in for system operators.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
          <Field label="Username">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin@charjee"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
            />
          </Field>
          {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </section>
    </main>
  );
}
