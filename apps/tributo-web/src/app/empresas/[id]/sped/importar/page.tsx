'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUploadSped } from '@/hooks';

const tiposSped = [
  { value: 'FISCAL', label: 'SPED Fiscal (EFD ICMS/IPI)' },
  { value: 'CONTABIL', label: 'SPED Contabil (ECD)' },
  { value: 'CONTRIBUICOES', label: 'SPED Contribuicoes (EFD PIS/COFINS)' },
];

export default function SpedImportarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [tipoSped, setTipoSped] = useState('FISCAL');
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const upload = useUploadSped();

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    upload.mutate(
      { file: selectedFile, empresaId: id, tipoSped, competencia },
      { onSuccess: () => router.push(`/empresas/${id}`) },
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href={`/empresas/${id}`} className="hover:text-emerald-600">Empresa</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Importar SPED</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Importar Arquivo SPED</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de SPED</label>
            <select
              value={tipoSped}
              onChange={(e) => setTipoSped(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {tiposSped.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Competencia</label>
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input ref={fileRef} type="file" accept=".txt,.sped" onChange={handleFileChange} className="hidden" />
            {selectedFile ? (
              <div>
                <svg className="w-10 h-10 text-emerald-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-600">Arraste o arquivo SPED aqui ou clique para selecionar</p>
                <p className="text-xs text-slate-400 mt-1">Formatos aceitos: .txt, .sped</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Link href={`/empresas/${id}`} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!selectedFile || upload.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {upload.isPending ? 'Enviando...' : 'Importar'}
            </button>
          </div>

          {upload.isError && (
            <p className="text-xs text-red-500">Erro ao enviar arquivo. Verifique o formato e tente novamente.</p>
          )}
        </form>
      </div>
    </div>
  );
}
