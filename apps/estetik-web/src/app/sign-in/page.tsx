'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'credentials' | 'magic-link'>('credentials');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || 'Erro ao fazer login');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.magicLink({ email, callbackURL: callbackUrl });
      if (result.error) {
        setError(result.error.message || 'Erro ao enviar link');
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: 'google' | 'github') {
    await signIn.social({ provider, callbackURL: callbackUrl });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">EstetikComply</h1>
          <p className="text-sm text-slate-500 mt-1">Compliance para clinicas de estetica</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Entrar</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {magicLinkSent ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-700 font-medium">Link enviado!</p>
              <p className="text-xs text-slate-500 mt-1">Verifique seu email {email} para acessar.</p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleSocial('google')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocial('github')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  GitHub
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">ou</span>
                </div>
              </div>

              <div className="flex mb-4 bg-slate-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('credentials')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    mode === 'credentials' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Email e Senha
                </button>
                <button
                  type="button"
                  onClick={() => setMode('magic-link')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    mode === 'magic-link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              <form onSubmit={mode === 'credentials' ? handleCredentials : handleMagicLink}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>

                  {mode === 'credentials' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                          Senha
                        </label>
                        <a href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                          Esqueceu a senha?
                        </a>
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="********"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Entrando...' : mode === 'credentials' ? 'Entrar' : 'Enviar Magic Link'}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500">
                Nao tem conta?{' '}
                <a href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                  Criar conta
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <SignInContent />
    </Suspense>
  );
}
