'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
            <h2 className="text-lg font-semibold text-slate-800">Erro critico</h2>
            <p className="text-sm text-slate-500 mt-2">{error.message || 'Erro inesperado.'}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
