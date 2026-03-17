'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message || 'Erro ao enviar email');
      } else {
        setSent(true);
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
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Esqueceu a senha?</h2>
          <p className="text-sm text-slate-500 mb-6">Digite seu email para receber o link de redefinicao.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-700 font-medium">Email enviado!</p>
              <p className="text-xs text-slate-500 mt-1">Verifique sua caixa de entrada para redefinir a senha.</p>
              <a href="/sign-in" className="mt-4 inline-block text-sm text-purple-600 hover:text-purple-700 font-medium">
                Voltar ao login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="seu@email.com" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Enviando...' : 'Enviar link de redefinicao'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-slate-500">
            <a href="/sign-in" className="text-purple-600 hover:text-purple-700 font-medium">Voltar ao login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
