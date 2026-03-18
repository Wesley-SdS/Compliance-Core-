'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Erro no portal</h2>
        <p className="text-sm text-slate-500 mb-4">{error.message}</p>
        <button type="button" onClick={reset} className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600">Tentar novamente</button>
      </div>
    </div>
  );
}
