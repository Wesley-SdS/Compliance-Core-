'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message || 'Erro ao criar conta');
      } else {
        router.push('/');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">LaudoAI</h1>
          <p className="text-sm text-slate-500 mt-1">Compliance laboratorial</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Criar Conta</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Seu nome completo" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="seu@email.com" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Minimo 8 caracteres" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {loading ? 'Criando...' : 'Criar Conta'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Ja tem conta?{' '}
            <a href="/sign-in" className="text-purple-600 hover:text-purple-700 font-medium">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
