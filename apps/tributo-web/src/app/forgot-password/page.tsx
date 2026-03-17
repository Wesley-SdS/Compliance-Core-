'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestPasswordReset } from '@/lib/auth-client';

const forgotSchema = z.object({
  email: z.string().email('Email invalido'),
});

type ForgotData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotData) {
    setError('');
    try {
      const result = await requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message || 'Erro ao enviar email');
      } else {
        setSent(true);
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">TributoSim</h1>
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
              <a href="/sign-in" className="mt-4 inline-block text-sm text-green-600 hover:text-green-700 font-medium">
                Voltar ao login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input id="email" type="email" {...register('email')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="seu@email.com" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Enviando...' : 'Enviar link de redefinicao'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-slate-500">
            <a href="/sign-in" className="text-green-600 hover:text-green-700 font-medium">Voltar ao login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
