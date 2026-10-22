'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClubShield from '@/components/ClubShield';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error de autenticación');
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in-up">
          <ClubShield size={64} className="mx-auto mb-4" />
          <h1 className="font-black text-xl">Panel de Administración</h1>
          <p className="text-gray-blue text-sm mt-1">Andes Talleres Futsal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div>
            <label htmlFor="login-email" className="input-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="input-label">Contraseña</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-shield/10 border border-red-shield/30 rounded-xl p-3 text-sm text-red-shield">
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
