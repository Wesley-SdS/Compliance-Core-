'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/lib/auth-client';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirme a senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword'],
});

type ResetData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(data: ResetData) {
    setError('');
    if (!token) {
      setError('Token invalido ou expirado');
      return;
    }
    try {
      const result = await resetPassword({ newPassword: data.newPassword, token });
      if (result.error) {
        setError(result.error.message || 'Erro ao redefinir senha');
      } else {
        router.push('/sign-in');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Link invalido</h2>
          <p className="text-sm text-slate-500 mb-4">O link de redefinicao e invalido ou expirou.</p>
          <a href="/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
            Solicitar novo link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">TributoSim</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Nova senha</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
                <input id="newPassword" type="password" {...register('newPassword')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Minimo 8 caracteres" />
                {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha</label>
                <input id="confirmPassword" type="password" {...register('confirmPassword')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Repita a senha" />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
