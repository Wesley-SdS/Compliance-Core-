'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '@/lib/auth-client';

const signUpSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
});

type SignUpData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(data: SignUpData) {
    setError('');
    try {
      const result = await signUp.email({ name: data.name, email: data.email, password: data.password });
      if (result.error) {
        setError(result.error.message || 'Erro ao criar conta');
      } else {
        router.push('/');
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
          <p className="text-sm text-slate-500 mt-1">Compliance tributario</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Criar Conta</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input id="name" type="text" {...register('name')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Seu nome completo" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input id="email" type="email" {...register('email')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="seu@email.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input id="password" type="password" {...register('password')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Minimo 8 caracteres" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Criando...' : 'Criar Conta'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Ja tem conta?{' '}
            <a href="/sign-in" className="text-green-600 hover:text-green-700 font-medium">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
